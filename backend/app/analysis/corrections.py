import numpy as np
from typing import List, Dict, Any, Tuple
from scipy.stats import false_discovery_control

from ..models import MultipleTestingCorrection

class MultipleTestingCorrector:
    """Handler for multiple testing corrections"""
    
    def apply_correction(
        self,
        metric_results: List[Dict[str, Any]],
        correction_method: MultipleTestingCorrection,
        original_alpha: float
    ) -> Tuple[List[Dict[str, Any]], float]:
        """
        Apply multiple testing correction to metric results
        
        Args:
            metric_results: List of metric results with p-values
            correction_method: Type of correction to apply
            original_alpha: Original significance level
            
        Returns:
            Tuple of (corrected_results, adjusted_alpha)
        """
        
        if not metric_results:
            return metric_results, original_alpha
        
        # Extract p-values
        p_values = [result['statistical_test']['p_value'] for result in metric_results]
        
        if correction_method == MultipleTestingCorrection.BONFERRONI:
            return self._apply_bonferroni(metric_results, p_values, original_alpha)
        elif correction_method == MultipleTestingCorrection.FDR:
            return self._apply_fdr(metric_results, p_values, original_alpha)
        else:
            return metric_results, original_alpha
    
    def _apply_bonferroni(
        self,
        metric_results: List[Dict[str, Any]],
        p_values: List[float],
        original_alpha: float
    ) -> Tuple[List[Dict[str, Any]], float]:
        """Apply Bonferroni correction"""
        
        n_tests = len(p_values)
        adjusted_alpha = original_alpha / n_tests
        
        # Update each result
        corrected_results = []
        for i, result in enumerate(metric_results):
            corrected_result = result.copy()
            
            # Adjust p-value (multiply by number of tests, cap at 1.0)
            adjusted_p = min(1.0, p_values[i] * n_tests)
            corrected_result['statistical_test']['p_value'] = round(adjusted_p, 6)
            
            # Update significance based on adjusted alpha
            corrected_result['is_significant'] = adjusted_p < original_alpha
            corrected_result['significance_level'] = adjusted_alpha
            
            corrected_results.append(corrected_result)
        
        return corrected_results, adjusted_alpha
    
    def _apply_fdr(
        self,
        metric_results: List[Dict[str, Any]],
        p_values: List[float],
        original_alpha: float
    ) -> Tuple[List[Dict[str, Any]], float]:
        """Apply False Discovery Rate (Benjamini-Hochberg) correction"""
        
        try:
            # Use scipy's FDR control
            rejected, adjusted_p_values = false_discovery_control(
                p_values, 
                alpha=original_alpha, 
                method='bh'
            )
            
            # Update each result
            corrected_results = []
            for i, result in enumerate(metric_results):
                corrected_result = result.copy()
                
                # Update with FDR-adjusted p-value
                corrected_result['statistical_test']['p_value'] = round(adjusted_p_values[i], 6)
                
                # Update significance based on FDR
                corrected_result['is_significant'] = rejected[i]
                corrected_result['significance_level'] = original_alpha
                
                corrected_results.append(corrected_result)
            
            # Calculate effective adjusted alpha (not straightforward for FDR)
            # Return original alpha as FDR controls the expected proportion of false discoveries
            return corrected_results, original_alpha
            
        except Exception as e:
            # Fallback to manual FDR implementation
            return self._manual_fdr(metric_results, p_values, original_alpha)
    
    def _manual_fdr(
        self,
        metric_results: List[Dict[str, Any]],
        p_values: List[float],
        original_alpha: float
    ) -> Tuple[List[Dict[str, Any]], float]:
        """Manual implementation of Benjamini-Hochberg FDR correction"""
        
        n_tests = len(p_values)
        
        # Create list of (p_value, original_index) and sort by p_value
        indexed_p_values = [(p_val, i) for i, p_val in enumerate(p_values)]
        indexed_p_values.sort(key=lambda x: x[0])
        
        # Apply Benjamini-Hochberg procedure
        rejected = [False] * n_tests
        adjusted_p_values = [0.0] * n_tests
        
        # Work backwards through sorted p-values
        for rank, (p_val, original_idx) in enumerate(reversed(indexed_p_values)):
            i = n_tests - rank  # BH rank (1-indexed)
            
            # BH critical value
            bh_critical = (i / n_tests) * original_alpha
            
            if p_val <= bh_critical:
                # This and all smaller p-values are significant
                for j in range(n_tests - rank):
                    _, orig_idx = indexed_p_values[j]
                    rejected[orig_idx] = True
                break
        
        # Calculate adjusted p-values (step-up method)
        for rank, (p_val, original_idx) in enumerate(indexed_p_values):
            i = rank + 1  # 1-indexed rank
            
            # Adjusted p-value is min of 1 and (n_tests * p_val / i)
            adjusted_p = min(1.0, (n_tests * p_val) / i)
            
            # Ensure monotonicity (adjusted p-values should be non-decreasing)
            if rank > 0:
                prev_adjusted = adjusted_p_values[indexed_p_values[rank-1][1]]
                adjusted_p = max(adjusted_p, prev_adjusted)
            
            adjusted_p_values[original_idx] = adjusted_p
        
        # Update results
        corrected_results = []
        for i, result in enumerate(metric_results):
            corrected_result = result.copy()
            
            corrected_result['statistical_test']['p_value'] = round(adjusted_p_values[i], 6)
            corrected_result['is_significant'] = rejected[i]
            corrected_result['significance_level'] = original_alpha
            
            corrected_results.append(corrected_result)
        
        return corrected_results, original_alpha
    
    def get_correction_info(
        self,
        correction_method: MultipleTestingCorrection,
        n_tests: int,
        original_alpha: float
    ) -> Dict[str, Any]:
        """Get information about the correction method applied"""
        
        if correction_method == MultipleTestingCorrection.BONFERRONI:
            return {
                "method": "Bonferroni",
                "description": "Controls family-wise error rate by dividing alpha by number of tests",
                "adjusted_alpha": original_alpha / n_tests,
                "conservative": True,
                "recommendation": "Very conservative, use when false positives must be minimized"
            }
        
        elif correction_method == MultipleTestingCorrection.FDR:
            return {
                "method": "False Discovery Rate (Benjamini-Hochberg)",
                "description": "Controls the expected proportion of false discoveries among rejected hypotheses",
                "adjusted_alpha": original_alpha,  # FDR doesn't adjust alpha directly
                "conservative": False,
                "recommendation": "Less conservative than Bonferroni, good balance of power and control"
            }
        
        else:
            return {
                "method": "None",
                "description": "No multiple testing correction applied",
                "adjusted_alpha": original_alpha,
                "conservative": False,
                "recommendation": "Use correction when testing multiple hypotheses to control false positive rate"
            } 