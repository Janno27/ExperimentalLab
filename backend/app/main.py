from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
from typing import Dict, Any, Optional
import asyncio
from datetime import datetime

from .models import AnalysisRequest, AnalysisStatus, AnalysisResult
from .analysis.analyzer import ABTestAnalyzer
from .utils.data_validator import DataValidator
from .utils.json_encoder import clean_json_nan

app = FastAPI(
    title="A/B Test Analysis API",
    description="FastAPI backend optimized for post-test analysis",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for jobs (in production, use Redis or database)
analysis_jobs: Dict[str, Dict[str, Any]] = {}

class FilterRequest(BaseModel):
    job_id: str
    filters: Dict[str, Any]

async def run_analysis(job_id: str, request: AnalysisRequest):
    """Background task to run the analysis"""
    try:
        # Update job status
        analysis_jobs[job_id]["status"] = "processing"
        analysis_jobs[job_id]["started_at"] = datetime.utcnow().isoformat()
        
        # Validate data
        validator = DataValidator()
        validated_data = validator.validate_and_clean(request.data)
        
        # Initialize analyzer with user-defined configuration
        analyzer = ABTestAnalyzer(
            confidence_level=request.confidence_level,
            statistical_method=request.statistical_method,
            multiple_testing_correction=request.multiple_testing_correction
        )
        
        # Run analysis
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
        
    except Exception as e:
        # Update job with error
        analysis_jobs[job_id]["status"] = "failed"
        analysis_jobs[job_id]["error"] = str(e)
        analysis_jobs[job_id]["failed_at"] = datetime.utcnow().isoformat()

@app.get("/")
async def root():
    return {
        "message": "A/B Test Analysis API",
        "version": "1.0.0",
        "endpoints": [
            "/api/analyze",
            "/api/status/{job_id}",
            "/api/results/{job_id}",
            "/api/analyze/filter"
        ]
    }

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
    
    # Clean results before returning to avoid JSON serialization errors
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
        
        # Apply filters to data (this would need implementation in DataValidator)
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
            multiple_testing_correction=original_request.multiple_testing_correction
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

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()} 