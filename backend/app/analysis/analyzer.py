try:
    from scipy import stats
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    print("Warning: scipy not available, using fallback statistical methods")

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum
import uuid
import time
from datetime import datetime
import json
from .metrics import MetricType, StatisticalMethod
from .corrections import MultipleTestingCorrection
from ..utils.json_encoder import clean_json_nan

from ..models import (
    AnalysisRequest, AnalysisResult, MetricResult, OverallResults,
    StatisticalMethod, MultipleTestingCorrection, MetricType,
    VariationStats, StatisticalTest, ConfidenceInterval
)
from .metrics import MetricCalculator
from .corrections import MultipleTestingCorrector

class ABTestAnalyzer:
    """Main orchestrator for A/B test analysis"""
    
    def __init__(
        self,
        confidence_level: float = 95.0,
        statistical_method: StatisticalMethod = StatisticalMethod.FREQUENTIST,
        multiple_testing_correction: MultipleTestingCorrection = MultipleTestingCorrection.NONE
    ):
        """
        Initialize the analyzer with configuration parameters
        
        Args:
            confidence_level: Confidence level in percentage (e.g., 95.0 for 95%)
            statistical_method: Statistical method to use
            multiple_testing_correction: Multiple testing correction method
        """
        self.confidence_level = confidence_level
        self.statistical_method = statistical_method
        self.multiple_testing_correction = multiple_testing_correction
        
        # Convert confidence level to alpha (significance level)
        # e.g., 95% confidence = 5% alpha
        self.alpha = (100 - confidence_level) / 100
        self.alpha = max(0.001, min(0.5, self.alpha))  # Ensure alpha is between 0.1% and 50%
        
        # Initialize components
        self.metric_calculator = MetricCalculator(
            confidence_level=confidence_level,
            statistical_method=statistical_method
        )
        self.correction_handler = MultipleTestingCorrector()
    
    def analyze(
        self,
        data: List[Dict[str, Any]],
        metrics_config: List[Dict[str, Any]],
        variation_column: str,
        user_column: Optional[str] = None,
        data_type: str = "aggregated"
    ) -> Dict[str, Any]:
        """
        Main analysis method
        
        Args:
            data: Raw data as list of dictionaries
            metrics_config: Configuration for metrics to analyze
            variation_column: Column containing variation labels
            user_column: Column containing user identifiers
            
        Returns:
            Complete analysis results
        """
        start_time = time.time()
        
        try:
            # Convert data to DataFrame
            df = pd.DataFrame(data)
            
            # Clean variation column: strip whitespace and quotes
            if variation_column in df.columns and df[variation_column].dtype == 'object':
                df[variation_column] = df[variation_column].str.strip().str.replace('"', '', regex=False).str.replace("'", '', regex=False)
            
            # Validate data structure
            self._validate_data(df, variation_column, user_column)
            
            # Get unique variations
            variations = df[variation_column].unique()
            if len(variations) < 2:
                raise ValueError(f"Expected at least 2 variations, found {len(variations)}: {variations}")
            
            # Identify control and treatment variations
            control_variation = self._identify_control(variations)
            treatment_variations = [v for v in variations if v != control_variation]
            
            print(f"Found {len(variations)} variations: control={control_variation}, treatments={treatment_variations}")
            
            # Identify dimension columns for filtering
            dimension_columns = self._identify_dimension_columns(df, variation_column, user_column)
            
            # Calculate metrics for each configured metric
            metric_results = []
            warnings = []
            recommendations = []
            
            for metric_config in metrics_config:
                try:
                    result = self._analyze_metric(
                        df, metric_config, variation_column, 
                        control_variation, treatment_variations, user_column,
                        data_type
                    )
                    metric_results.append(result)
                except Exception as e:
                    import traceback
                    print(f"--- ERROR analyzing metric: {getattr(metric_config, 'name', 'Unknown')} ---")
                    traceback.print_exc()
                    warnings.append(f"Failed to analyze metric '{getattr(metric_config, 'name', 'Unknown')}': {str(e)}")
                    continue
            
            if not metric_results:
                raise ValueError("No metrics could be analyzed successfully")
            
            # Apply multiple testing correction
            if self.multiple_testing_correction != MultipleTestingCorrection.NONE:
                metric_results, adjusted_alpha = self.correction_handler.apply_correction(
                    metric_results, self.multiple_testing_correction, self.alpha
                )
            else:
                adjusted_alpha = None
            
            # Calculate overall results
            overall_results = self._calculate_overall_results(
                df, variation_column, control_variation, treatment_variations,
                metric_results, adjusted_alpha, data_type
            )
            
            # Generate recommendations
            recommendations.extend(self._generate_recommendations(df, metric_results, overall_results))
            
            analysis_duration = time.time() - start_time
            
            return {
                "overall_results": overall_results,
                "metric_results": metric_results,
                "dimension_columns": dimension_columns,
                "analysis_duration_seconds": analysis_duration,
                "warnings": warnings,
                "recommendations": recommendations
            }
            
        except Exception as e:
            raise RuntimeError(f"Analysis failed: {str(e)}")
    
    def _validate_data(self, df: pd.DataFrame, variation_column: str, user_column: Optional[str]):
        """Validate data structure and required columns"""
        if df.empty:
            raise ValueError("Data cannot be empty")
        
        if variation_column not in df.columns:
            raise ValueError(f"Variation column '{variation_column}' not found in data")
        
        if user_column and user_column not in df.columns:
            raise ValueError(f"User column '{user_column}' not found in data")
        
        # Check for missing values in critical columns
        if df[variation_column].isnull().any():
            raise ValueError(f"Variation column '{variation_column}' contains null values")
    
    def _identify_control(self, variations: np.ndarray) -> str:
        """Identify control variation (assumes control is 'control', 'A', 'original', or first alphabetically)"""
        variations_lower = [str(v).lower() for v in variations]
        
        # Check for common control names
        if 'control' in variations_lower:
            return variations[variations_lower.index('control')]
        if 'a' in variations_lower:
            return variations[variations_lower.index('a')]
        if 'original' in variations_lower:
            return variations[variations_lower.index('original')]
        if '[0] original' in variations_lower:
            return variations[variations_lower.index('[0] original')]
        
        # Default to first alphabetically
        return sorted(variations)[0]
    
    def _identify_dimension_columns(self, df: pd.DataFrame, variation_column: str, user_column: Optional[str] = None) -> Dict[str, Any]:
        """Identify dimension columns that can be used for filtering"""
        
        # Columns to exclude from dimensions (system columns and metrics)
        excluded_columns = {variation_column}
        if user_column:
            excluded_columns.add(user_column)
        
        # Get variation values to exclude them from dimension values
        variation_values = set(df[variation_column].dropna().astype(str).unique()) if variation_column in df.columns else set()
        
        # Common metric column patterns to exclude
        metric_patterns = [
            'users', 'user_', 'conversions', 'conversion_', 'revenue', 'purchases', 
            'purchase_', 'quantity', 'views', 'clicks', 'sessions', 'orders',
            'add_to_cart', 'checkout', 'pdp_', 'cart_', 'begin_', 'gross_'
        ]
        
        # Common test-related columns to exclude  
        test_patterns = [
            'test_', 'campaign', 'experiment', 'variant', 'variation'
        ]
        
        dimension_columns = {}
        
        for column in df.columns:
            # Skip excluded columns
            if column in excluded_columns:
                continue
                
            # Skip if column name matches metric patterns
            if any(pattern in column.lower() for pattern in metric_patterns + test_patterns):
                continue
            
            # Skip numeric columns that are likely metrics
            if df[column].dtype in ['int64', 'float64']:
                continue
            
            # Check if it's a categorical dimension
            if df[column].dtype == 'object' or df[column].dtype.name == 'category':
                unique_values = df[column].dropna().astype(str).unique()
                
                # Filter out variation values that might appear in this column
                dimension_values = [v for v in unique_values if str(v) not in variation_values]
                
                # Only include if it has reasonable number of unique values (2-50) after filtering
                if 2 <= len(dimension_values) <= 50:
                    # Additional check: ensure it's actually a dimension column
                    # by checking if values are consistent across variations
                    is_dimension = self._validate_dimension_column(df, column, variation_column)
                    
                    if is_dimension:
                        dimension_columns[column] = {
                            'type': 'categorical',
                            'values': sorted(dimension_values),
                            'count': len(dimension_values),
                            'display_name': self._format_dimension_name(column)
                        }
        
        return dimension_columns
    
    def _validate_dimension_column(self, df: pd.DataFrame, column: str, variation_column: str) -> bool:
        """Validate that a column is actually a dimension and not variation-related"""
        try:
            # Check if the column has values that appear across different variations
            cross_tab = pd.crosstab(df[variation_column], df[column], dropna=False)
            
            # If any dimension value appears in multiple variations, it's likely a real dimension
            dimension_appears_in_multiple_variations = (cross_tab > 0).sum(axis=0).max() > 1
            
            # Also check that it's not just a copy of the variation column
            is_not_variation_copy = len(df[column].unique()) != len(df[variation_column].unique())
            
            return dimension_appears_in_multiple_variations and is_not_variation_copy
            
        except Exception:
            # If validation fails, be conservative and exclude
            return False
    
    def _format_dimension_name(self, column_name: str) -> str:
        """Format dimension column name for display"""
        # Convert snake_case to Title Case
        formatted = column_name.replace('_', ' ').title()
        
        # Handle specific cases
        replacements = {
            'Device Category': 'Device Category',
            'Item Category': 'Item Category', 
            'Detailed Item Category': 'Detailed Item Category',
            'Item Name': 'Item Name',
            'Item Bundle Or Name': 'Item Bundle or Name'
        }
        
        return replacements.get(formatted, formatted)
    
    def analyze_with_filters(
        self,
        data: List[Dict[str, Any]],
        metrics_config: List[Dict[str, Any]],
        variation_column: str,
        filters: Dict[str, List[str]] = None,
        user_column: Optional[str] = None,
        data_type: str = "aggregated"
    ) -> Dict[str, Any]:
        """
        Perform analysis with applied filters
        
        Args:
            data: Raw data as list of dictionaries
            metrics_config: Configuration for metrics to analyze
            variation_column: Column containing variation labels
            filters: Dictionary of column -> list of values to filter by
            user_column: Column containing user identifiers
            data_type: Type of data (aggregated or raw)
            
        Returns:
            Complete analysis results for filtered data
        """
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Apply filters if provided
        if filters:
            df = self._apply_dimension_filters(df, filters)
        
        # Convert back to list of dicts and run regular analysis
        filtered_data = df.to_dict('records')
        
        return self.analyze(
            filtered_data,
            metrics_config,
            variation_column,
            user_column,
            data_type
        )
    
    def _apply_dimension_filters(self, df: pd.DataFrame, filters: Dict[str, List[str]]) -> pd.DataFrame:
        """Apply dimension filters to dataframe"""
        filtered_df = df.copy()
        
        for column, values in filters.items():
            if column in df.columns and values:
                # Filter to include only specified values
                filtered_df = filtered_df[filtered_df[column].isin(values)]
        
        return filtered_df
    
    def _analyze_metric(
        self,
        df: pd.DataFrame,
        metric_config: Any,
        variation_column: str,
        control_variation: str,
        treatment_variations: List[str],
        user_column: Optional[str],
        data_type: str = "aggregated"
    ) -> Dict[str, Any]:
        """Analyze a single metric for multiple variations"""
        
        metric_name = getattr(metric_config, 'name', 'Unknown')
        metric_type = MetricType(getattr(metric_config, 'type', 'count'))
        column_name = getattr(metric_config, 'column', '')
        metric_unit = getattr(metric_config, 'unit', None)
        metric_currency = getattr(metric_config, 'currency', None)
        metric_decimals = getattr(metric_config, 'decimals', 2)
        
        # Support for custom numerator/denominator columns
        numerator_column = getattr(metric_config, 'numerator_column', None)
        denominator_column = getattr(metric_config, 'denominator_column', None)
        
        # Validate required columns exist
        required_columns = [column_name] if column_name else []
        if numerator_column:
            required_columns.append(numerator_column)
        if denominator_column:
            required_columns.append(denominator_column)
        
        for col in required_columns:
            if col and col not in df.columns:
                raise ValueError(f"Required column '{col}' not found in data for metric '{metric_name}'")
        
        # Apply metric-specific filters if any
        filtered_df = df.copy()
        filters = getattr(metric_config, 'filters', None)
        if filters:
            filtered_df = self._apply_filters(filtered_df, filters)
        
        # Calculate metric for all variations
        all_variation_stats = []
        pairwise_comparisons = []
        
        # Get control stats
        control_data = filtered_df[filtered_df[variation_column] == control_variation]
        control_stats = self._calculate_variation_stats(
            control_data, column_name, metric_type, user_column, data_type,
            numerator_column, denominator_column
        )
        control_stats['variation'] = control_variation
        all_variation_stats.append(control_stats)
        
        # Calculate stats for each treatment variation and compare with control
        for treatment_variation in treatment_variations:
            treatment_data = filtered_df[filtered_df[variation_column] == treatment_variation]
            treatment_stats = self._calculate_variation_stats(
                treatment_data, column_name, metric_type, user_column, data_type,
                numerator_column, denominator_column
            )
            treatment_stats['variation'] = treatment_variation
            all_variation_stats.append(treatment_stats)
            
            # Perform pairwise comparison with control
            comparison = self._perform_pairwise_comparison(
                control_stats, treatment_stats, treatment_variation, metric_type
            )
            pairwise_comparisons.append(comparison)
        
        # Determine overall significance (any variation shows significant improvement)
        is_significant = any(comp['is_significant'] for comp in pairwise_comparisons)
        
        return {
            "metric_name": metric_name,
            "metric_type": metric_type,
            "variation_stats": all_variation_stats,
            "control_stats": control_stats,
            "pairwise_comparisons": pairwise_comparisons,
            "is_significant": is_significant,
            "significance_level": self.alpha,
            "metric_unit": metric_unit,
            "metric_currency": metric_currency,
            "metric_decimals": metric_decimals,

        }
    
    def _apply_filters(self, df: pd.DataFrame, filters: Dict[str, Any]) -> pd.DataFrame:
        """Apply filters to dataframe"""
        filtered_df = df.copy()
        
        for column, filter_value in filters.items():
            if column not in df.columns:
                continue
                
            if isinstance(filter_value, dict):
                # Range filter: {"min": 0, "max": 100}
                if 'min' in filter_value:
                    filtered_df = filtered_df[filtered_df[column] >= filter_value['min']]
                if 'max' in filter_value:
                    filtered_df = filtered_df[filtered_df[column] <= filter_value['max']]
            elif isinstance(filter_value, list):
                # List filter: include only these values
                filtered_df = filtered_df[filtered_df[column].isin(filter_value)]
            else:
                # Exact match filter
                filtered_df = filtered_df[filtered_df[column] == filter_value]
        
        return filtered_df
    
    def _calculate_overall_results(
        self,
        df: pd.DataFrame,
        variation_column: str,
        control_variation: str,
        treatment_variations: List[str],
        metric_results: List[Dict[str, Any]],
        adjusted_alpha: Optional[float],
        data_type: str = "aggregated"
    ) -> Dict[str, Any]:
        """Calculate overall analysis results for multiple variations"""
        
        # Count users by variation based on data type
        # For overall results, we should use the standard user counting logic
        # regardless of custom metrics, as this represents the experiment population
        if data_type == "aggregated" and 'users' in df.columns:
            # Sum users by variation (aggregated data format)
            user_counts = df.groupby(variation_column)['users'].sum()
            total_users = df['users'].sum()
        else:
            # Fallback to counting rows (individual user data format)
            user_counts = df[variation_column].value_counts()
            total_users = len(df)
        
        # Create variation breakdown
        variation_breakdown = []
        all_variations = [control_variation] + treatment_variations
        
        for variation in all_variations:
            user_count = user_counts.get(variation, 0)
            percentage = (user_count / total_users) * 100 if total_users > 0 else 0
            is_control = variation == control_variation
            
            variation_breakdown.append({
                "variation_name": variation,
                "user_count": int(user_count),
                "percentage": round(percentage, 2),
                "is_control": is_control
            })
        
        # Calculate data quality metrics
        total_cells = len(df) * len(df.columns)
        missing_cells = df.isnull().sum().sum()
        missing_percentage = (missing_cells / total_cells) * 100
        data_quality_score = max(0.0, 1.0 - (missing_percentage / 100))
        
        # Count significant metrics
        significant_metrics = sum(1 for result in metric_results if result.get('is_significant', False))
        
        return {
            "total_users": int(total_users),
            "variation_breakdown": variation_breakdown,
            "data_quality_score": round(data_quality_score, 3),
            "missing_data_percentage": round(missing_percentage, 2),
            "correction_applied": self.multiple_testing_correction,
            "adjusted_alpha": adjusted_alpha,
            "significant_metrics": significant_metrics,
            "total_metrics": len(metric_results),
            "total_variations": len(all_variations)
        }
    
    def _generate_recommendations(
        self,
        df: pd.DataFrame,
        metric_results: List[Dict[str, Any]],
        overall_results: Dict[str, Any]
    ) -> List[str]:
        """Generate recommendations based on analysis results"""
        recommendations = []
        
        # Sample size recommendations
        if overall_results['total_users'] < 1000:
            recommendations.append(
                "Consider collecting more data. Sample size is relatively small, which may limit statistical power."
            )
        
        # Sample ratio recommendations
        variation_breakdown = overall_results.get('variation_breakdown', [])
        if variation_breakdown:
            control_variation = next((v for v in variation_breakdown if v['is_control']), None)
            if control_variation:
                control_ratio = control_variation['percentage'] / 100
                if control_ratio < 0.3 or control_ratio > 0.7:
                    recommendations.append(
                        f"Sample ratio imbalance detected. Control: {control_ratio:.1%}. "
                        f"Consider investigating traffic allocation for better statistical power."
                    )
        
        # Data quality recommendations
        if overall_results['data_quality_score'] < 0.9:
            recommendations.append(
                f"Data quality score is {overall_results['data_quality_score']:.1%}. "
                "Consider investigating and cleaning missing or invalid data."
            )
        
        # Multiple testing recommendations
        if len(metric_results) > 1 and self.multiple_testing_correction == MultipleTestingCorrection.NONE:
            recommendations.append(
                f"You're testing {len(metric_results)} metrics without multiple testing correction. "
                "Consider applying Bonferroni or FDR correction to control false positive rate."
            )
        
        # Significance recommendations
        significant_count = overall_results['significant_metrics']
        if significant_count == 0:
            recommendations.append(
                "No statistically significant results found. Consider increasing sample size or "
                "reviewing test design and metric selection."
            )
        elif significant_count == len(metric_results):
            recommendations.append(
                "All metrics show statistical significance. Verify results and consider practical significance."
            )
        
        return recommendations
    
    def _calculate_variation_stats(
        self,
        data: pd.DataFrame,
        column_name: str,
        metric_type: MetricType,
        user_column: Optional[str],
        data_type: str = "aggregated",
        numerator_column: Optional[str] = None,
        denominator_column: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculate statistics for a single variation"""
        
        if data.empty:
            return {
                "sample_size": 0,
                "mean": 0.0,
                "std": 0.0,
                "median": 0.0,
                "min_value": 0.0,
                "max_value": 0.0,
                "conversions": 0,
                "conversion_rate": 0.0,
                "total_revenue": 0.0,
                "revenue_per_user": 0.0
            }
        
        # Determine if this is a custom metric
        is_custom_metric = bool(numerator_column and denominator_column)
        
        if is_custom_metric:
            # Custom metric with explicit numerator/denominator
            print(f"Processing custom metric: {numerator_column} / {denominator_column}")
            
            # Get the actual values
            numerator_values = pd.to_numeric(data[numerator_column], errors='coerce').fillna(0)
            denominator_values = pd.to_numeric(data[denominator_column], errors='coerce').fillna(0)
            
            # Calculate totals
            total_numerator = float(numerator_values.sum())
            total_denominator = float(denominator_values.sum())
            
            print(f"Custom metric totals: numerator={total_numerator}, denominator={total_denominator}")
            
            # Sample size for custom metrics is the denominator total
            # This represents the total population for the metric
            sample_size = int(total_denominator) if total_denominator > 0 else len(data)
            
            # Calculate the overall metric rate/ratio
            if total_denominator > 0:
                overall_rate = total_numerator / total_denominator
            else:
                overall_rate = 0.0
            
            # For individual statistics, calculate row-by-row ratios where possible
            individual_ratios = []
            for i in range(len(data)):
                num_val = numerator_values.iloc[i]
                den_val = denominator_values.iloc[i]
                if den_val > 0:
                    individual_ratios.append(num_val / den_val)
            
            # Statistical measures
            if individual_ratios:
                ratios_series = pd.Series(individual_ratios)
                mean = float(ratios_series.mean())
                std = float(ratios_series.std()) if len(ratios_series) > 1 else 0.0
                median = float(ratios_series.median())
                min_value = float(ratios_series.min())
                max_value = float(ratios_series.max())
            else:
                # Fallback to overall rate
                mean = overall_rate
                std = 0.0
                median = overall_rate
                min_value = overall_rate
                max_value = overall_rate
            
            # Prepare return values
            conversions = None
            conversion_rate = None
            total_revenue = None
            revenue_per_user = None
            
            if metric_type == MetricType.CONVERSION:
                conversions = int(total_numerator)
                conversion_rate = float(overall_rate * 100)  # Convert to percentage
                
            elif metric_type == MetricType.REVENUE:
                total_revenue = float(total_numerator)
                revenue_per_user = float(overall_rate)
                
        else:
            # Standard metric calculation (existing logic)
            print(f"Processing standard metric: {column_name}")
            
            if data_type == "aggregated" and 'users' in data.columns:
                # Aggregated data: each row represents a group of users
                sample_size = int(data['users'].sum())
                values = pd.to_numeric(data[column_name], errors='coerce').dropna()
            else:
                # Raw data: each row is one user/transaction
                sample_size = len(data)
                values = pd.to_numeric(data[column_name], errors='coerce').dropna()
            
            if values.empty or sample_size == 0:
                return {
                    "sample_size": sample_size,
                    "mean": 0.0,
                    "std": 0.0,
                    "median": 0.0,
                    "min_value": 0.0,
                    "max_value": 0.0,
                    "conversions": 0,
                    "conversion_rate": 0.0,
                    "total_revenue": 0.0,
                    "revenue_per_user": 0.0
                }
            
            # Calculate metrics based on data type
            if data_type == "aggregated" and 'users' in data.columns:
                # Values are totals for groups - calculate per-user averages
                total_metric_value = float(values.sum())
                mean = total_metric_value / sample_size if sample_size > 0 else 0.0
                
                # For aggregated data, we can't calculate std/median/min/max meaningfully
                std = None  # Will be handled by clean_json_nan
                median = mean  # Best approximation for aggregated data
                min_value = mean  # Best approximation for aggregated data
                max_value = mean  # Best approximation for aggregated data
            else:
                # Individual data - standard calculations
                mean = float(values.mean())
                std = float(values.std()) if len(values) > 1 else 0.0
                median = float(values.median())
                min_value = float(values.min())
                max_value = float(values.max())
                total_metric_value = float(values.sum())
            
            # Metric-specific statistics for standard metrics
            conversions = None
            conversion_rate = None
            total_revenue = None
            revenue_per_user = None
            
            if metric_type == MetricType.CONVERSION:
                conversions = int(total_metric_value)
                conversion_rate = float((total_metric_value / sample_size) * 100) if sample_size > 0 else 0.0
            
            elif metric_type == MetricType.REVENUE:
                total_revenue = float(total_metric_value)
                revenue_per_user = float(total_revenue / sample_size) if sample_size > 0 else 0.0
        
        result = {
            "sample_size": sample_size,
            "mean": mean,
            "std": std,
            "median": median,
            "min_value": min_value,
            "max_value": max_value,
            "conversions": conversions,
            "conversion_rate": conversion_rate,
            "total_revenue": total_revenue,
            "revenue_per_user": revenue_per_user
        }
        
        print(f"Variation stats result: {result}")
        return result
    
    def _perform_pairwise_comparison(
        self,
        control_stats: Dict[str, Any],
        treatment_stats: Dict[str, Any],
        treatment_name: str,
        metric_type: MetricType
    ) -> Dict[str, Any]:
        """Perform statistical comparison between control and treatment"""
        
        # Get sample sizes
        control_n = control_stats['sample_size']
        treatment_n = treatment_stats['sample_size']
        
        print(f"Pairwise comparison: control_n={control_n}, treatment_n={treatment_n}")
        
        # Initialize default values
        p_value = 1.0
        is_significant = False
        test_type = "insufficient_data"
        z_stat = 0.0
        t_stat = 0.0
        
        if control_n < 10 or treatment_n < 10:
            # Not enough data for reliable statistics
            print("Insufficient data for statistical testing")
            confidence_interval = {
                "lower_bound": 0.0,
                "upper_bound": 0.0,
                "confidence_level": float(self.confidence_level)
            }
            return {
                "variation_name": treatment_name,
                "absolute_uplift": 0.0,
                "relative_uplift": 0.0,
                "statistical_test": {
                    "test_type": test_type,
                    "statistic": 0.0,
                    "p_value": 1.0
                },
                "confidence_interval": confidence_interval,
                "is_significant": False,
                "p_value": 1.0,
                "effect_size": 0.0
            }
        
        if metric_type == MetricType.CONVERSION:
            # For conversion metrics, work with counts and totals
            control_conversions = control_stats.get('conversions', 0)
            treatment_conversions = treatment_stats.get('conversions', 0)
            
            print(f"Conversion comparison: control={control_conversions}/{control_n}, treatment={treatment_conversions}/{treatment_n}")
            
            # Calculate rates
            control_rate = control_conversions / control_n if control_n > 0 else 0
            treatment_rate = treatment_conversions / treatment_n if treatment_n > 0 else 0
            
            # Calculate absolute and relative uplift
            absolute_uplift = treatment_rate - control_rate  # This is in decimal (e.g., 0.0017)
            absolute_uplift_pct = absolute_uplift * 100  # Convert to percentage points
            
            if control_rate > 0:
                relative_uplift = (absolute_uplift / control_rate) * 100  # Percentage change
            else:
                relative_uplift = 0.0 if treatment_rate == 0 else 100.0
            
            # Two-proportion z-test
            pooled_p = (control_conversions + treatment_conversions) / (control_n + treatment_n)
            
            if pooled_p > 0 and pooled_p < 1 and (control_n + treatment_n) > 0:
                # Standard error for difference in proportions
                se = np.sqrt(pooled_p * (1 - pooled_p) * (1/control_n + 1/treatment_n))
                
                if se > 0:
                    z_stat = (treatment_rate - control_rate) / se
                    
                    # Calculate p-value
                    if SCIPY_AVAILABLE:
                        p_value = 2 * (1 - stats.norm.cdf(abs(z_stat)))
                    else:
                        # Approximation for normal distribution
                        p_value = 2 * (1 / (1 + np.exp(1.7 * abs(z_stat))))
                    
                    # Calculate confidence interval for the difference
                    if SCIPY_AVAILABLE:
                        z_critical = stats.norm.ppf((1 + self.confidence_level / 100) / 2)
                    else:
                        # Common z-values
                        z_critical = {80: 1.28, 85: 1.44, 90: 1.64, 95: 1.96, 99: 2.58}.get(int(self.confidence_level), 1.96)
                    
                    margin_of_error = z_critical * se
                    
                    # Confidence interval in PERCENTAGE POINTS (not decimal)
                    ci_lower = (absolute_uplift - margin_of_error) * 100
                    ci_upper = (absolute_uplift + margin_of_error) * 100
                else:
                    p_value = 1.0
                    ci_lower = 0.0
                    ci_upper = 0.0
            else:
                p_value = 1.0 if control_rate == treatment_rate else 0.001
                ci_lower = absolute_uplift_pct
                ci_upper = absolute_uplift_pct
            
            test_type = "two_proportion_z_test"
            final_absolute_uplift = absolute_uplift_pct
            
        else:  # Continuous metrics (revenue, count, etc.)
            control_mean = control_stats['mean']
            treatment_mean = treatment_stats['mean']
            control_std = control_stats.get('std', 0)
            treatment_std = treatment_stats.get('std', 0)
            
            print(f"Continuous comparison: control_mean={control_mean}, treatment_mean={treatment_mean}")
            
            # Calculate uplifts
            absolute_uplift = treatment_mean - control_mean
            if control_mean != 0:
                relative_uplift = (absolute_uplift / abs(control_mean)) * 100
            else:
                relative_uplift = 0.0 if treatment_mean == 0 else 100.0
            
            # Handle missing standard deviations
            if control_std is None or np.isnan(control_std) or control_std == 0:
                # Estimate std from mean for aggregated data
                control_std = np.sqrt(abs(control_mean)) if control_mean != 0 else 1.0
                
            if treatment_std is None or np.isnan(treatment_std) or treatment_std == 0:
                # Estimate std from mean for aggregated data  
                treatment_std = np.sqrt(abs(treatment_mean)) if treatment_mean != 0 else 1.0
            
            # Pooled standard deviation
            if control_n > 1 and treatment_n > 1:
                pooled_variance = ((control_n - 1) * control_std**2 + (treatment_n - 1) * treatment_std**2) / (control_n + treatment_n - 2)
                pooled_std = np.sqrt(pooled_variance) if pooled_variance > 0 else 1.0
            else:
                pooled_std = np.sqrt((control_std**2 + treatment_std**2) / 2)
            
            if pooled_std > 0:
                se = pooled_std * np.sqrt(1/control_n + 1/treatment_n)
                t_stat = absolute_uplift / se if se > 0 else 0
                df = max(1, control_n + treatment_n - 2)
                
                # Calculate p-value
                if SCIPY_AVAILABLE:
                    p_value = 2 * (1 - stats.t.cdf(abs(t_stat), df))
                    t_critical = stats.t.ppf((1 + self.confidence_level / 100) / 2, df)
                else:
                    # Approximation
                    p_value = 2 * (1 / (1 + np.exp(1.5 * abs(t_stat))))
                    t_critical = {80: 1.29, 85: 1.44, 90: 1.66, 95: 2.0, 99: 2.66}.get(int(self.confidence_level), 2.0)
                
                margin_of_error = t_critical * se
                ci_lower = absolute_uplift - margin_of_error
                ci_upper = absolute_uplift + margin_of_error
            else:
                p_value = 1.0
                ci_lower = absolute_uplift
                ci_upper = absolute_uplift
            
            test_type = "two_sample_t_test"
            final_absolute_uplift = absolute_uplift
        
        # Ensure p_value is within bounds
        p_value = max(0.0001, min(0.9999, p_value))
        
        # Determine significance based on alpha level
        is_significant = bool(p_value < self.alpha)
        
        print(f"Test results: p_value={p_value}, is_significant={is_significant}, alpha={self.alpha}")
        
        confidence_interval = {
            "lower_bound": float(round(ci_lower, 4)),
            "upper_bound": float(round(ci_upper, 4)),
            "confidence_level": float(self.confidence_level)
        }
        
        return {
            "variation_name": treatment_name,
            "absolute_uplift": float(round(final_absolute_uplift, 4)),
            "relative_uplift": float(round(relative_uplift, 2)),
            "statistical_test": {
                "test_type": test_type,
                "statistic": float(round(z_stat if metric_type == MetricType.CONVERSION else t_stat, 4)),
                "p_value": float(round(p_value, 6))
            },
            "confidence_interval": confidence_interval,
            "is_significant": is_significant,
            "p_value": float(round(p_value, 6)),
            "effect_size": float(round(abs(z_stat) if metric_type == MetricType.CONVERSION else abs(t_stat), 4))
        } 