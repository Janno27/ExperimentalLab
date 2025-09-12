import os
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
from typing import Dict, Any, Optional
import asyncio
from datetime import datetime
import hashlib

from .models import AnalysisRequest, AnalysisStatus, AnalysisResult, FilterRequest, TransactionEnrichmentRequest
from .analysis.analyzer import ABTestAnalyzer
from .utils.data_validator import DataValidator
from .utils.json_encoder import clean_json_nan

# Détection de l'environnement
ENV = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENV == "production"
PORT = os.getenv("PORT", "8000")

app = FastAPI(
    title="A/B Test Analysis API",
    description="FastAPI backend optimized for post-test analysis",
    version="1.0.0",
    docs_url="/docs" if not IS_PRODUCTION else "/api-docs",  # Garder docs mais sur une route différente
    redoc_url="/redoc" if not IS_PRODUCTION else None,
)

# Configuration CORS dynamique pour Render
def get_cors_origins():
    """Get CORS origins from environment variable"""
    cors_env = os.getenv("CORS_ORIGINS", "")
    
    if cors_env:
        origins = [origin.strip() for origin in cors_env.split(",")]
    else:
        # Defaults pour développement
        origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    
    return origins

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

# In-memory storage (production devrait utiliser Redis)
analysis_jobs: Dict[str, Dict[str, Any]] = {}

# Cache pour les données de transaction originales (avec colonnes de segmentation)
transaction_data_cache: Dict[str, Dict[str, Any]] = {}



# Health check endpoint pour Render
@app.get("/health")
async def health_check():
    """Health check endpoint - utilisé par Render pour vérifier que le service est actif"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": ENV,
        "version": "1.0.0",
        "service": "ab-test-analysis-api",
        "port": PORT
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint avec informations de l'API"""
    return {
        "message": "A/B Test Analysis API",
        "version": "1.0.0",
        "status": "online",
        "environment": ENV,
        "endpoints": {
            "health": "/health",
            "analyze": "/api/analyze",
            "enrich_transaction": "/api/analyze/enrich-transaction",
            "filter": "/api/analyze/filter",
            "status": "/api/status/{job_id}",
            "results": "/api/results/{job_id}",
            "documentation": "/api-docs" if IS_PRODUCTION else "/docs"
        },
        "deployment": {
            "platform": "Render",
            "region": os.getenv("RENDER_REGION", "unknown"),
            "instance": os.getenv("RENDER_INSTANCE_ID", "unknown")
        }
    }

async def run_analysis(job_id: str, request: AnalysisRequest):
    """Background task to run the analysis"""
    try:
        # Update job status
        analysis_jobs[job_id]["status"] = "processing"
        analysis_jobs[job_id]["started_at"] = datetime.utcnow().isoformat()
        
        # Log pour monitoring
        print(f"[{datetime.utcnow().isoformat()}] Starting analysis job: {job_id}")
        
        # Validate data
        validator = DataValidator()
        validated_data = validator.validate_and_clean(request.data)
        
        # Initialize analyzer
        analyzer = ABTestAnalyzer(
            confidence_level=request.confidence_level,
            statistical_method=request.statistical_method,
            multiple_testing_correction=request.multiple_testing_correction
        )
        
        # Run analysis with filters
        if request.filters:
            results = analyzer.analyze_with_filters(
                data=validated_data,
                metrics_config=request.metrics_config,
                variation_column=request.variation_column,
                filters=request.filters,
                user_column=request.user_column,
                data_type=request.data_type
            )
        else:
            results = analyzer.analyze(
                data=validated_data,
                metrics_config=request.metrics_config,
                variation_column=request.variation_column,
                user_column=request.user_column,
                data_type=request.data_type
            )
        
        # Update job with results
        analysis_jobs[job_id]["status"] = "completed"
        analysis_jobs[job_id]["results"] = results
        analysis_jobs[job_id]["completed_at"] = datetime.utcnow().isoformat()
        
        print(f"[{datetime.utcnow().isoformat()}] Completed analysis job: {job_id}")
        
    except Exception as e:
        # Update job with error
        analysis_jobs[job_id]["status"] = "failed"
        analysis_jobs[job_id]["error"] = str(e)
        analysis_jobs[job_id]["failed_at"] = datetime.utcnow().isoformat()
        
        print(f"[{datetime.utcnow().isoformat()}] Failed analysis job {job_id}: {str(e)}")

async def run_transaction_enrichment(job_id: str, request: TransactionEnrichmentRequest):
    """Background task to run transaction data enrichment"""
    try:
        # Update job status
        analysis_jobs[job_id]["status"] = "processing"
        analysis_jobs[job_id]["started_at"] = datetime.utcnow().isoformat()
        
        # Get original job results
        original_job = analysis_jobs[request.job_id]
        if original_job["status"] != "completed":
            raise ValueError("Original job must be completed")
        
        original_results = original_job["results"]
        
        # Import the enricher
        from .analysis.transaction_enricher import TransactionEnricher
        
        # Initialize enricher with original results (will be updated with filtered data)
        enricher = TransactionEnricher(
            original_results=original_results,
            transaction_data=request.transaction_data
        )
        
        # CRITIQUE: Si l'analyse originale était filtrée, on doit utiliser ses variation breakdowns
        # pour calculer correctement les RPU
        enricher.update_variation_breakdown(original_results)
        
        # Validate transaction data
        if not enricher.validate_transaction_data():
            raise ValueError("Transaction data validation failed")
        
        # Check data consistency
        consistency_check = enricher.validate_data_consistency()
        
        # Enrich results
        enriched_results = enricher.enrich_results()
        
        # Update job with enriched results
        analysis_jobs[job_id]["status"] = "completed"
        analysis_jobs[job_id]["results"] = enriched_results
        analysis_jobs[job_id]["completed_at"] = datetime.utcnow().isoformat()
        analysis_jobs[job_id]["data_consistency"] = consistency_check
        
    except Exception as e:
        # Update job with error
        analysis_jobs[job_id]["status"] = "failed"
        analysis_jobs[job_id]["error"] = str(e)
        analysis_jobs[job_id]["failed_at"] = datetime.utcnow().isoformat()

@app.post("/api/analyze")
async def analyze(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """Launch analysis and return job_id"""
    try:
        # Generate unique job ID
        job_id = str(uuid.uuid4())
        
        # Initialize job
        analysis_jobs[job_id] = {
            "status": "queued",
            "created_at": datetime.utcnow().isoformat(),
            "request": request.dict(),
            "results": None,
            "error": None
        }
        
        # Start background analysis
        background_tasks.add_task(run_analysis, job_id, request)
        
        return {
            "job_id": job_id,
            "status": "queued",
            "message": "Analysis started successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start analysis: {str(e)}")

@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    """Get status of analysis job"""
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = analysis_jobs[job_id]
    return {
        "job_id": job_id,
        "status": job["status"],
        "created_at": job["created_at"],
        "started_at": job.get("started_at"),
        "completed_at": job.get("completed_at"),
        "failed_at": job.get("failed_at"),
        "error": job.get("error")
    }

@app.get("/api/results/{job_id}")
async def get_results(job_id: str):
    """Get complete analysis results"""
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = analysis_jobs[job_id]
    
    if job["status"] == "failed":
        raise HTTPException(status_code=500, detail=job["error"])
    
    if job["status"] != "completed":
        raise HTTPException(status_code=202, detail=f"Analysis is {job['status']}")
    
    # Clean results before returning
    cleaned_results = clean_json_nan(job["results"])
    
    return {
        "job_id": job_id,
        "status": job["status"],
        "results": cleaned_results,
        "completed_at": job["completed_at"]
    }

@app.post("/api/analyze/filter")
async def analyze_with_filters(request: FilterRequest, background_tasks: BackgroundTasks):
    """Re-calculate analysis with filters applied"""
    if request.job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Original job not found")
    
    original_job = analysis_jobs[request.job_id]
    if original_job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Original job must be completed")
    
    try:
        # Create new job ID for filtered analysis
        new_job_id = str(uuid.uuid4())
        
        # Get original request and apply filters
        original_request = AnalysisRequest(**original_job["request"])
        
        # Apply filters to data
        validator = DataValidator()
        filtered_data = validator.apply_filters(original_request.data, request.filters)
        
        # Create new request with filtered data
        filtered_request = AnalysisRequest(
            data=filtered_data,
            metrics_config=original_request.metrics_config,
            variation_column=original_request.variation_column,
            user_column=original_request.user_column,
            confidence_level=original_request.confidence_level,
            statistical_method=original_request.statistical_method,
            multiple_testing_correction=original_request.multiple_testing_correction,
            data_type=original_request.data_type
        )
        
        # Initialize new job
        analysis_jobs[new_job_id] = {
            "status": "queued",
            "created_at": datetime.utcnow().isoformat(),
            "request": filtered_request.dict(),
            "results": None,
            "error": None,
            "parent_job_id": request.job_id,
            "filters_applied": request.filters
        }
        
        # Start background analysis
        background_tasks.add_task(run_analysis, new_job_id, filtered_request)
        
        return {
            "job_id": new_job_id,
            "parent_job_id": request.job_id,
            "status": "queued",
            "filters_applied": request.filters,
            "message": "Filtered analysis started successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start filtered analysis: {str(e)}")

@app.post("/api/analyze/enrich-transaction")
async def enrich_with_transaction_data(request: TransactionEnrichmentRequest, background_tasks: BackgroundTasks):
    """Enrich existing analysis results with transaction-level data"""
    try:
        # Validate original job exists and is completed
        if request.job_id not in analysis_jobs:
            raise HTTPException(status_code=404, detail="Original job not found")
        
        original_job = analysis_jobs[request.job_id]
        if original_job["status"] != "completed":
            raise HTTPException(status_code=400, detail="Original job must be completed before enrichment")
        
        # Validate transaction data
        if not request.transaction_data or len(request.transaction_data) == 0:
            raise HTTPException(status_code=400, detail="Transaction data cannot be empty")
        
        # Check required columns in first transaction record
        required_columns = ['transaction_id', 'variation', 'revenue']
        if request.transaction_data:
            first_record = request.transaction_data[0]
            missing_columns = [col for col in required_columns if col not in first_record]
            if missing_columns:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Missing required columns in transaction data: {missing_columns}"
                )
        
        # Generate new job ID for enrichment
        enrichment_job_id = str(uuid.uuid4())
        
        # CRITIQUE: Cacher les données de transaction originales pour le filtrage futur
        # Utiliser l'enrichment_job_id comme clé car c'est ce qui sera utilisé pour la recherche
        cache_key = f"transaction_data_{enrichment_job_id}"
        transaction_data_cache[cache_key] = {
            "data": request.transaction_data,
            "created_at": datetime.utcnow().isoformat(),
            "enrichment_job_id": enrichment_job_id,
            "original_job_id": request.job_id  # Garder une référence au job original
        }
        
        
        # Initialize enrichment job
        analysis_jobs[enrichment_job_id] = {
            "status": "queued",
            "created_at": datetime.utcnow().isoformat(),
            "request": request.dict(),
            "results": None,
            "error": None,
            "parent_job_id": request.job_id,
            "enrichment_type": "transaction_data",
            "transaction_cache_key": cache_key
        }
        
        # Start background enrichment
        background_tasks.add_task(run_transaction_enrichment, enrichment_job_id, request)
        
        return {
            "job_id": enrichment_job_id,
            "parent_job_id": request.job_id,
            "status": "queued",
            "transaction_records": len(request.transaction_data),
            "message": "Transaction enrichment started successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start transaction enrichment: {str(e)}")

@app.post("/api/analyze/enrich-transaction-filtered")
async def enrich_with_filtered_transaction_data(
    request: TransactionEnrichmentRequest, 
    background_tasks: BackgroundTasks
):
    """
    Enrichit les résultats d'analyse avec les données de transaction FILTRÉES.
    Utilise le cache pour récupérer les données originales et appliquer les filtres.
    """
    try:
        # Le job_id est maintenant l'enrichment_job_id (celui qui a le cache)
        # L'original_job_id est l'analyse filtrée à enrichir
        job_to_enrich = request.original_job_id or request.job_id
        
        # Vérifier que le job à enrichir existe
        if job_to_enrich not in analysis_jobs:
            raise HTTPException(status_code=404, detail=f"Job to enrich {job_to_enrich} not found")
        
        job_to_enrich_data = analysis_jobs[job_to_enrich]
        if job_to_enrich_data["status"] != "completed":
            raise HTTPException(status_code=400, detail="Job to enrich must be completed before enrichment")
        
        # Récupérer les données de transaction depuis le cache
        # Le job_id passé est maintenant l'enrichment_job_id (celui qui a été utilisé comme clé)
        cache_key = f"transaction_data_{request.job_id}"
        
        
        if cache_key not in transaction_data_cache:
            raise HTTPException(status_code=404, detail="Transaction data not found in cache. Please re-upload.")
        
        cached_data = transaction_data_cache[cache_key]
        original_transaction_data = cached_data["data"]
        
        # Appliquer les filtres aux données de transaction originales
        # Les filtres sont déjà appliqués côté frontend dans request.transaction_data
        # Mais ici on utilise les données du cache pour garder les colonnes de segmentation
        
        # Generate new job ID for filtered enrichment
        enrichment_job_id = str(uuid.uuid4())
        
        # Initialize enrichment job
        analysis_jobs[enrichment_job_id] = {
            "status": "queued", 
            "created_at": datetime.utcnow().isoformat(),
            "request": request.dict(),
            "results": None,
            "error": None,
            "parent_job_id": request.job_id,
            "enrichment_type": "filtered_transaction_data",
            "transaction_cache_key": cache_key
        }
        
        # Créer une nouvelle requête avec les données filtrées mais depuis le cache
        filtered_request = TransactionEnrichmentRequest(
            job_id=job_to_enrich,  # Le job à enrichir (analyse filtrée)
            transaction_data=request.transaction_data  # Données déjà filtrées côté frontend
        )
        
        # Start background enrichment
        background_tasks.add_task(run_transaction_enrichment, enrichment_job_id, filtered_request)
        
        return {
            "job_id": enrichment_job_id,
            "parent_job_id": request.job_id,
            "status": "queued",
            "transaction_records": len(request.transaction_data),
            "cached_records": len(original_transaction_data),
            "message": "Filtered transaction enrichment started successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start filtered transaction enrichment: {str(e)}")

# Startup event pour logs
@app.on_event("startup")
async def startup_event():
    """Log startup information"""
    print(f"A/B Test Analysis API Starting - Environment: {ENV} - Port: {PORT}")