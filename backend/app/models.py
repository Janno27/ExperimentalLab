from pydantic import BaseModel, Field, validator
from typing import Dict, List, Any, Optional, Union, Literal
from enum import Enum
import pandas as pd

class StatisticalMethod(str, Enum):
    FREQUENTIST = "frequentist"
    BAYESIAN = "bayesian"
    BOOTSTRAP = "bootstrap"

class MultipleTestingCorrection(str, Enum):
    NONE = "none"
    BONFERRONI = "bonferroni"
    FDR = "fdr"

class MetricType(str, Enum):
    CONVERSION = "conversion"
    REVENUE = "revenue"
    COUNT = "count"
    RATIO = "ratio"

class AnalysisStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class MetricConfig(BaseModel):
    """Configuration for a single metric"""
    name: str = Field(..., description="Name of the metric")
    column: str = Field(..., description="Column name in the data")
    type: MetricType = Field(..., description="Type of metric")
    description: Optional[str] = Field(None, description="Description of the metric")
    
    # For ratio metrics
    numerator_column: Optional[str] = Field(None, description="Numerator column for ratio metrics")
    denominator_column: Optional[str] = Field(None, description="Denominator column for ratio metrics")
    
    # Filters
    filters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Filters to apply to this metric")
    unit: Optional[str] = Field(None, description="Unit type: currency, percentage, count, etc.")
    currency: Optional[str] = Field(None, description="Currency symbol if unit is currency")
    decimals: Optional[int] = Field(None, description="Number of decimal places")
    
class AnalysisRequest(BaseModel):
    """Request model for analysis"""
    data: List[Dict[str, Any]] = Field(..., description="Raw data as list of dictionaries")
    metrics_config: List[MetricConfig] = Field(..., description="Configuration for metrics to analyze")
    variation_column: str = Field(..., description="Column name containing variation labels")
    user_column: Optional[str] = Field(None, description="Column name containing user identifiers")
    data_type: Optional[Literal["aggregated", "raw"]] = Field(
        default="aggregated", 
        description="Type of data: 'aggregated' for pre-aggregated data, 'raw' for individual records"
    )
    filters: Optional[Dict[str, List[str]]] = Field(
        default_factory=dict,
        description="Dimension filters to apply: column_name -> list of values to include"
    )
    
    # Statistical configuration
    confidence_level: float = Field(
        default=95.0, 
        ge=80.0, 
        le=99.9, 
        description="Confidence level for statistical tests"
    )
    statistical_method: StatisticalMethod = Field(
        default=StatisticalMethod.FREQUENTIST,
        description="Statistical method to use"
    )
    multiple_testing_correction: MultipleTestingCorrection = Field(
        default=MultipleTestingCorrection.NONE,
        description="Multiple testing correction method"
    )
    
    @validator('data')
    def validate_data_not_empty(cls, v):
        if not v:
            raise ValueError('Data cannot be empty')
        return v
    
    @validator('metrics_config')
    def validate_metrics_not_empty(cls, v):
        if not v:
            raise ValueError('At least one metric must be configured')
        return v

class VariationStats(BaseModel):
    """Statistics for a single variation"""
    variation: str = Field(..., description="Variation name")
    sample_size: int = Field(..., description="Number of observations")
    mean: float = Field(..., description="Mean value")
    std: float = Field(..., description="Standard deviation")
    median: Optional[float] = Field(None, description="Median value")
    min_value: Optional[float] = Field(None, description="Minimum value")
    max_value: Optional[float] = Field(None, description="Maximum value")
    
    # For conversion metrics
    conversions: Optional[int] = Field(None, description="Number of conversions")
    conversion_rate: Optional[float] = Field(None, description="Conversion rate")
    
    # For revenue metrics
    total_revenue: Optional[float] = Field(None, description="Total revenue")
    revenue_per_user: Optional[float] = Field(None, description="Revenue per user")

class StatisticalTest(BaseModel):
    """Results of statistical test"""
    test_type: str = Field(..., description="Type of statistical test performed")
    statistic: float = Field(..., description="Test statistic value")
    p_value: float = Field(..., description="P-value of the test")
    degrees_of_freedom: Optional[int] = Field(None, description="Degrees of freedom")
    effect_size: Optional[float] = Field(None, description="Effect size (Cohen's d, etc.)")

class ConfidenceInterval(BaseModel):
    """Confidence interval for a metric"""
    lower_bound: float = Field(..., description="Lower bound of confidence interval")
    upper_bound: float = Field(..., description="Upper bound of confidence interval")
    confidence_level: float = Field(..., description="Confidence level (e.g., 95.0)")

class PairwiseComparison(BaseModel):
    """Comparison between control and a specific variation"""
    variation_name: str = Field(..., description="Name of the variation being compared")
    control_stats: VariationStats = Field(..., description="Control group statistics")
    variation_stats: VariationStats = Field(..., description="Variation group statistics")
    
    # Comparison results
    absolute_uplift: float = Field(..., description="Absolute difference from control")
    relative_uplift: float = Field(..., description="Relative uplift as percentage from control")
    
    # Statistical test results
    statistical_test: StatisticalTest = Field(..., description="Statistical test results")
    confidence_interval: ConfidenceInterval = Field(..., description="Confidence interval for the difference")
    
    # Significance
    is_significant: bool = Field(..., description="Whether this variation is significantly different from control")
    p_value: float = Field(..., description="P-value for this comparison")
    effect_size: Optional[float] = Field(None, description="Effect size for this comparison")

class MetricResult(BaseModel):
    """Results for a single metric"""
    metric_name: str = Field(..., description="Name of the metric")
    metric_type: MetricType = Field(..., description="Type of metric")
    
    # Formatting options
    metric_unit: Optional[str] = Field(None, description="Unit type: currency, percentage, count, etc.")
    metric_currency: Optional[str] = Field(None, description="Currency symbol if unit is currency")
    metric_decimals: Optional[int] = Field(None, description="Number of decimal places")
    
    # All variation statistics
    variation_stats: List[VariationStats] = Field(..., description="Statistics for all variations")
    
    # Control group (first variation is always control)
    control_stats: VariationStats = Field(..., description="Control group statistics")
    
    # Pairwise comparisons (control vs each variation)
    pairwise_comparisons: List[PairwiseComparison] = Field(..., description="Pairwise comparisons with control")
    
    # Overall significance
    is_significant: bool = Field(..., description="Whether any variation shows significant improvement")
    significance_level: float = Field(..., description="Significance level used (e.g., 0.05)")
    
    # Additional insights
    minimum_detectable_effect: Optional[float] = Field(None, description="Minimum detectable effect")
    statistical_power: Optional[float] = Field(None, description="Statistical power of the test")
    sample_ratio_mismatch: Optional[bool] = Field(None, description="Whether there's a sample ratio mismatch")

class VariationBreakdown(BaseModel):
    """Breakdown of users for a specific variation"""
    variation_name: str = Field(..., description="Name of the variation")
    user_count: int = Field(..., description="Number of users in this variation")
    percentage: float = Field(..., description="Percentage of total users")
    is_control: bool = Field(..., description="Whether this is the control variation")

class OverallResults(BaseModel):
    """Overall analysis results"""
    total_users: int = Field(..., description="Total number of users analyzed")
    variation_breakdown: List[VariationBreakdown] = Field(..., description="Breakdown of users by variation")
    
    # Data quality
    data_quality_score: float = Field(..., ge=0.0, le=1.0, description="Overall data quality score")
    missing_data_percentage: float = Field(..., ge=0.0, le=100.0, description="Percentage of missing data")
    
    # Multiple testing correction
    correction_applied: MultipleTestingCorrection = Field(..., description="Correction method applied")
    adjusted_alpha: Optional[float] = Field(None, description="Adjusted alpha level after correction")
    
    # Summary
    significant_metrics: int = Field(..., description="Number of statistically significant metrics")
    total_metrics: int = Field(..., description="Total number of metrics analyzed")
    total_variations: int = Field(..., description="Total number of variations (including control)")

class AnalysisResult(BaseModel):
    """Complete analysis results"""
    job_id: str = Field(..., description="Unique job identifier")
    status: AnalysisStatus = Field(..., description="Analysis status")
    
    # Configuration used
    configuration: AnalysisRequest = Field(..., description="Original analysis configuration")
    
    # Results
    overall_results: OverallResults = Field(..., description="Overall analysis summary")
    metric_results: List[MetricResult] = Field(..., description="Results for each metric")
    
    # Metadata
    analysis_duration_seconds: Optional[float] = Field(None, description="Time taken for analysis")
    created_at: str = Field(..., description="ISO timestamp when analysis was created")
    completed_at: Optional[str] = Field(None, description="ISO timestamp when analysis was completed")
    
    # Warnings and recommendations
    warnings: List[str] = Field(default_factory=list, description="Analysis warnings")
    recommendations: List[str] = Field(default_factory=list, description="Recommendations for improvement")

class JobStatus(BaseModel):
    """Status of an analysis job"""
    job_id: str = Field(..., description="Unique job identifier")
    status: AnalysisStatus = Field(..., description="Current status")
    created_at: str = Field(..., description="ISO timestamp when job was created")
    started_at: Optional[str] = Field(None, description="ISO timestamp when processing started")
    completed_at: Optional[str] = Field(None, description="ISO timestamp when job completed")
    failed_at: Optional[str] = Field(None, description="ISO timestamp when job failed")
    error: Optional[str] = Field(None, description="Error message if job failed")
    progress_percentage: Optional[float] = Field(None, ge=0.0, le=100.0, description="Progress percentage")

class FilterRequest(BaseModel):
    """Request to apply filters to existing analysis"""
    job_id: str = Field(..., description="Original job ID to filter")
    filters: Dict[str, Any] = Field(..., description="Filters to apply to the data")
    
    @validator('filters')
    def validate_filters_not_empty(cls, v):
        if not v:
            raise ValueError('Filters cannot be empty')
        return v

class TransactionEnrichmentRequest(BaseModel):
    """Request to enrich analysis with transaction-level data"""
    job_id: str = Field(..., description="Job ID to enrich (can be filtered analysis)")
    transaction_data: List[Dict[str, Any]] = Field(..., description="Transaction-level data")
    original_job_id: Optional[str] = Field(None, description="Original job ID for cache lookup")
    
    @validator('transaction_data')
    def validate_transaction_data_not_empty(cls, v):
        if not v:
            raise ValueError('Transaction data cannot be empty')
        
        # Validate required columns in first record
        if v:
            first_record = v[0]
            required_columns = ['transaction_id', 'variation', 'revenue']
            missing_columns = [col for col in required_columns if col not in first_record]
            if missing_columns:
                raise ValueError(f'Missing required columns: {missing_columns}')
        
        return v 