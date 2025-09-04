import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
from scipy import stats
from scipy.stats import bootstrap
import warnings

from ..models import MetricType, StatisticalMethod

class MetricCalculator:
    """Calculator for different types of metrics"""
    
    def __init__(
        self,
        confidence_level: float = 95.0,
        statistical_method: StatisticalMethod = StatisticalMethod.FREQUENTIST
    ):
        self.confidence_level = confidence_level
        self.statistical_method = statistical_method
        self.alpha = (100 - confidence_level) / 100
        self.z_score = stats.norm.ppf(1 - self.alpha / 2)
    
    def calculate_metric(
        self,
        data: pd.DataFrame,
        metric_config: Dict[str, Any],
        variation_column: str,
        control_variation: str,
        treatment_variation: str,
        user_column: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculate metric based on its type"""
        
        metric_type = MetricType(metric_config['type'])
        
        if metric_type == MetricType.CONVERSION:
            return self._calculate_conversion_metric(
                data, metric_config, variation_column, 
                control_variation, treatment_variation, user_column
            )
        elif metric_type == MetricType.REVENUE:
            return self._calculate_revenue_metric(
                data, metric_config, variation_column,
                control_variation, treatment_variation, user_column
            )
        elif metric_type == MetricType.COUNT:
            return self._calculate_count_metric(
                data, metric_config, variation_column,
                control_variation, treatment_variation, user_column
            )
        elif metric_type == MetricType.RATIO:
            return self._calculate_ratio_metric(
                data, metric_config, variation_column,
                control_variation, treatment_variation, user_column
            )
        else:
            raise ValueError(f"Unsupported metric type: {metric_type}")
    
    def _calculate_conversion_metric(
        self,
        data: pd.DataFrame,
        metric_config: Dict[str, Any],
        variation_column: str,
        control_variation: str,
        treatment_variation: str,
        user_column: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculate conversion rate metric"""
        
        column_name = metric_config['column']
        metric_name = metric_config['name']
        
        # Group by variation
        if user_column:
            # User-level conversion (each user can convert once)
            user_conversions = data.groupby([variation_column, user_column])[column_name].max().reset_index()
            grouped = user_conversions.groupby(variation_column)
        else:
            # Event-level conversion
            grouped = data.groupby(variation_column)
        
        # Calculate conversion stats for each variation
        control_data = grouped.get_group(control_variation)[column_name] if control_variation in grouped.groups else pd.Series(dtype=float)
        treatment_data = grouped.get_group(treatment_variation)[column_name] if treatment_variation in grouped.groups else pd.Series(dtype=float)
        
        # Convert to binary (0/1) for conversion
        control_conversions = (control_data > 0).astype(int)
        treatment_conversions = (treatment_data > 0).astype(int)
        
        # Calculate stats
        control_stats = self._calculate_conversion_stats(control_conversions, control_variation)
        treatment_stats = self._calculate_conversion_stats(treatment_conversions, treatment_variation)
        
        # Statistical test
        statistical_test = self._perform_conversion_test(control_conversions, treatment_conversions)
        
        # Calculate uplift
        control_rate = control_stats['conversion_rate']
        treatment_rate = treatment_stats['conversion_rate']
        
        absolute_uplift = treatment_rate - control_rate
        relative_uplift = (absolute_uplift / control_rate * 100) if control_rate > 0 else 0
        
        # Confidence interval for difference
        ci = self._calculate_conversion_ci(control_conversions, treatment_conversions)
        
        return {
            "metric_name": metric_name,
            "metric_type": MetricType.CONVERSION,
            "control_stats": control_stats,
            "variation_stats": treatment_stats,
            "absolute_uplift": round(absolute_uplift, 6),
            "relative_uplift": round(relative_uplift, 2),
            "statistical_test": statistical_test,
            "confidence_interval": ci,
            "is_significant": statistical_test['p_value'] < self.alpha,
            "significance_level": self.alpha,
            "minimum_detectable_effect": self._calculate_mde_conversion(control_conversions, treatment_conversions),
            "statistical_power": self._calculate_power_conversion(control_conversions, treatment_conversions, absolute_uplift)
        }
    
    def _calculate_revenue_metric(
        self,
        data: pd.DataFrame,
        metric_config: Dict[str, Any],
        variation_column: str,
        control_variation: str,
        treatment_variation: str,
        user_column: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculate revenue metric"""
        
        column_name = metric_config['column']
        metric_name = metric_config['name']
        
        # Group by variation
        if user_column:
            # User-level revenue (sum per user)
            user_revenue = data.groupby([variation_column, user_column])[column_name].sum().reset_index()
            grouped = user_revenue.groupby(variation_column)
        else:
            # Event-level revenue
            grouped = data.groupby(variation_column)
        
        # Get data for each variation
        control_data = grouped.get_group(control_variation)[column_name] if control_variation in grouped.groups else pd.Series(dtype=float)
        treatment_data = grouped.get_group(treatment_variation)[column_name] if treatment_variation in grouped.groups else pd.Series(dtype=float)
        
        # Remove negative values if any
        control_data = control_data[control_data >= 0]
        treatment_data = treatment_data[treatment_data >= 0]
        
        # Calculate stats
        control_stats = self._calculate_revenue_stats(control_data, control_variation)
        treatment_stats = self._calculate_revenue_stats(treatment_data, treatment_variation)
        
        # Statistical test
        statistical_test = self._perform_continuous_test(control_data, treatment_data)
        
        # Calculate uplift
        control_mean = control_stats['mean']
        treatment_mean = treatment_stats['mean']
        
        absolute_uplift = treatment_mean - control_mean
        relative_uplift = (absolute_uplift / control_mean * 100) if control_mean > 0 else 0
        
        # Confidence interval for difference
        ci = self._calculate_continuous_ci(control_data, treatment_data)
        
        return {
            "metric_name": metric_name,
            "metric_type": MetricType.REVENUE,
            "control_stats": control_stats,
            "variation_stats": treatment_stats,
            "absolute_uplift": round(absolute_uplift, 2),
            "relative_uplift": round(relative_uplift, 2),
            "statistical_test": statistical_test,
            "confidence_interval": ci,
            "is_significant": statistical_test['p_value'] < self.alpha,
            "significance_level": self.alpha,
            "minimum_detectable_effect": self._calculate_mde_continuous(control_data, treatment_data),
            "statistical_power": self._calculate_power_continuous(control_data, treatment_data, absolute_uplift)
        }
    
    def _calculate_count_metric(
        self,
        data: pd.DataFrame,
        metric_config: Dict[str, Any],
        variation_column: str,
        control_variation: str,
        treatment_variation: str,
        user_column: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculate count metric (similar to revenue but for counts)"""
        
        column_name = metric_config['column']
        metric_name = metric_config['name']
        
        # Group by variation
        if user_column:
            # User-level counts (sum per user)
            user_counts = data.groupby([variation_column, user_column])[column_name].sum().reset_index()
            grouped = user_counts.groupby(variation_column)
        else:
            # Event-level counts
            grouped = data.groupby(variation_column)
        
        # Get data for each variation
        control_data = grouped.get_group(control_variation)[column_name] if control_variation in grouped.groups else pd.Series(dtype=float)
        treatment_data = grouped.get_group(treatment_variation)[column_name] if treatment_variation in grouped.groups else pd.Series(dtype=float)
        
        # Calculate stats
        control_stats = self._calculate_count_stats(control_data, control_variation)
        treatment_stats = self._calculate_count_stats(treatment_data, treatment_variation)
        
        # Statistical test
        statistical_test = self._perform_continuous_test(control_data, treatment_data)
        
        # Calculate uplift
        control_mean = control_stats['mean']
        treatment_mean = treatment_stats['mean']
        
        absolute_uplift = treatment_mean - control_mean
        relative_uplift = (absolute_uplift / control_mean * 100) if control_mean > 0 else 0
        
        # Confidence interval for difference
        ci = self._calculate_continuous_ci(control_data, treatment_data)
        
        return {
            "metric_name": metric_name,
            "metric_type": MetricType.COUNT,
            "control_stats": control_stats,
            "variation_stats": treatment_stats,
            "absolute_uplift": round(absolute_uplift, 2),
            "relative_uplift": round(relative_uplift, 2),
            "statistical_test": statistical_test,
            "confidence_interval": ci,
            "is_significant": statistical_test['p_value'] < self.alpha,
            "significance_level": self.alpha,
            "minimum_detectable_effect": self._calculate_mde_continuous(control_data, treatment_data),
            "statistical_power": self._calculate_power_continuous(control_data, treatment_data, absolute_uplift)
        }
    
    def _calculate_ratio_metric(
        self,
        data: pd.DataFrame,
        metric_config: Dict[str, Any],
        variation_column: str,
        control_variation: str,
        treatment_variation: str,
        user_column: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculate ratio metric (numerator/denominator)"""
        
        numerator_col = metric_config['numerator_column']
        denominator_col = metric_config['denominator_column']
        metric_name = metric_config['name']
        
        # Group by variation
        if user_column:
            # User-level ratios
            user_data = data.groupby([variation_column, user_column]).agg({
                numerator_col: 'sum',
                denominator_col: 'sum'
            }).reset_index()
            grouped = user_data.groupby(variation_column)
        else:
            # Event-level ratios
            grouped = data.groupby(variation_column)
        
        # Calculate ratios for each variation
        control_group = grouped.get_group(control_variation) if control_variation in grouped.groups else pd.DataFrame()
        treatment_group = grouped.get_group(treatment_variation) if treatment_variation in grouped.groups else pd.DataFrame()
        
        # Calculate ratio values (avoiding division by zero)
        control_ratios = self._safe_divide(control_group[numerator_col], control_group[denominator_col])
        treatment_ratios = self._safe_divide(treatment_group[numerator_col], treatment_group[denominator_col])
        
        # Calculate stats
        control_stats = self._calculate_ratio_stats(control_ratios, control_variation, control_group, numerator_col, denominator_col)
        treatment_stats = self._calculate_ratio_stats(treatment_ratios, treatment_variation, treatment_group, numerator_col, denominator_col)
        
        # Statistical test
        statistical_test = self._perform_continuous_test(control_ratios, treatment_ratios)
        
        # Calculate uplift
        control_mean = control_stats['mean']
        treatment_mean = treatment_stats['mean']
        
        absolute_uplift = treatment_mean - control_mean
        relative_uplift = (absolute_uplift / control_mean * 100) if control_mean > 0 else 0
        
        # Confidence interval for difference
        ci = self._calculate_continuous_ci(control_ratios, treatment_ratios)
        
        return {
            "metric_name": metric_name,
            "metric_type": MetricType.RATIO,
            "control_stats": control_stats,
            "variation_stats": treatment_stats,
            "absolute_uplift": round(absolute_uplift, 6),
            "relative_uplift": round(relative_uplift, 2),
            "statistical_test": statistical_test,
            "confidence_interval": ci,
            "is_significant": statistical_test['p_value'] < self.alpha,
            "significance_level": self.alpha,
            "minimum_detectable_effect": self._calculate_mde_continuous(control_ratios, treatment_ratios),
            "statistical_power": self._calculate_power_continuous(control_ratios, treatment_ratios, absolute_uplift)
        }
    
    def _calculate_conversion_stats(self, data: pd.Series, variation: str) -> Dict[str, Any]:
        """Calculate statistics for conversion data"""
        sample_size = len(data)
        conversions = data.sum()
        conversion_rate = conversions / sample_size if sample_size > 0 else 0
        
        return {
            "variation": variation,
            "sample_size": int(sample_size),
            "mean": round(conversion_rate, 6),
            "std": round(np.sqrt(conversion_rate * (1 - conversion_rate)), 6),
            "conversions": int(conversions),
            "conversion_rate": round(conversion_rate, 6)
        }
    
    def _calculate_revenue_stats(self, data: pd.Series, variation: str) -> Dict[str, Any]:
        """Calculate statistics for revenue data"""
        sample_size = len(data)
        total_revenue = data.sum()
        mean_revenue = data.mean() if sample_size > 0 else 0
        std_revenue = data.std() if sample_size > 1 else 0
        
        return {
            "variation": variation,
            "sample_size": int(sample_size),
            "mean": round(mean_revenue, 2),
            "std": round(std_revenue, 2),
            "median": round(data.median(), 2) if sample_size > 0 else 0,
            "min_value": round(data.min(), 2) if sample_size > 0 else 0,
            "max_value": round(data.max(), 2) if sample_size > 0 else 0,
            "total_revenue": round(total_revenue, 2),
            "revenue_per_user": round(mean_revenue, 2)
        }
    
    def _calculate_count_stats(self, data: pd.Series, variation: str) -> Dict[str, Any]:
        """Calculate statistics for count data"""
        sample_size = len(data)
        mean_count = data.mean() if sample_size > 0 else 0
        std_count = data.std() if sample_size > 1 else 0
        
        return {
            "variation": variation,
            "sample_size": int(sample_size),
            "mean": round(mean_count, 2),
            "std": round(std_count, 2),
            "median": round(data.median(), 2) if sample_size > 0 else 0,
            "min_value": int(data.min()) if sample_size > 0 else 0,
            "max_value": int(data.max()) if sample_size > 0 else 0
        }
    
    def _calculate_ratio_stats(self, ratios: pd.Series, variation: str, group_data: pd.DataFrame, num_col: str, den_col: str) -> Dict[str, Any]:
        """Calculate statistics for ratio data"""
        sample_size = len(ratios)
        mean_ratio = ratios.mean() if sample_size > 0 else 0
        std_ratio = ratios.std() if sample_size > 1 else 0
        
        return {
            "variation": variation,
            "sample_size": int(sample_size),
            "mean": round(mean_ratio, 6),
            "std": round(std_ratio, 6),
            "median": round(ratios.median(), 6) if sample_size > 0 else 0,
            "min_value": round(ratios.min(), 6) if sample_size > 0 else 0,
            "max_value": round(ratios.max(), 6) if sample_size > 0 else 0
        }
    
    def _perform_conversion_test(self, control: pd.Series, treatment: pd.Series) -> Dict[str, Any]:
        """Perform statistical test for conversion data"""
        if self.statistical_method == StatisticalMethod.FREQUENTIST:
            return self._chi_square_test(control, treatment)
        elif self.statistical_method == StatisticalMethod.BAYESIAN:
            return self._bayesian_conversion_test(control, treatment)
        else:  # Bootstrap
            return self._bootstrap_conversion_test(control, treatment)
    
    def _perform_continuous_test(self, control: pd.Series, treatment: pd.Series) -> Dict[str, Any]:
        """Perform statistical test for continuous data"""
        if self.statistical_method == StatisticalMethod.FREQUENTIST:
            return self._t_test(control, treatment)
        elif self.statistical_method == StatisticalMethod.BAYESIAN:
            return self._bayesian_continuous_test(control, treatment)
        else:  # Bootstrap
            return self._bootstrap_continuous_test(control, treatment)
    
    def _chi_square_test(self, control: pd.Series, treatment: pd.Series) -> Dict[str, Any]:
        """Chi-square test for conversion rates"""
        control_conv = control.sum()
        control_total = len(control)
        treatment_conv = treatment.sum()
        treatment_total = len(treatment)
        
        # Create contingency table
        observed = np.array([
            [control_conv, control_total - control_conv],
            [treatment_conv, treatment_total - treatment_conv]
        ])
        
        chi2, p_value, dof, expected = stats.chi2_contingency(observed)
        
        return {
            "test_type": "Chi-square test",
            "statistic": round(chi2, 6),
            "p_value": round(p_value, 6),
            "degrees_of_freedom": int(dof)
        }
    
    def _t_test(self, control: pd.Series, treatment: pd.Series) -> Dict[str, Any]:
        """T-test for continuous data"""
        # Check for equal variances
        _, p_levene = stats.levene(control, treatment)
        equal_var = p_levene > 0.05
        
        t_stat, p_value = stats.ttest_ind(treatment, control, equal_var=equal_var)
        
        # Calculate degrees of freedom
        if equal_var:
            dof = len(control) + len(treatment) - 2
        else:
            # Welch's t-test degrees of freedom
            s1, s2 = control.var(), treatment.var()
            n1, n2 = len(control), len(treatment)
            dof = (s1/n1 + s2/n2)**2 / ((s1/n1)**2/(n1-1) + (s2/n2)**2/(n2-1))
        
        # Calculate Cohen's d (effect size)
        pooled_std = np.sqrt(((len(control) - 1) * control.var() + (len(treatment) - 1) * treatment.var()) / (len(control) + len(treatment) - 2))
        cohens_d = (treatment.mean() - control.mean()) / pooled_std if pooled_std > 0 else 0
        
        return {
            "test_type": "Welch's t-test" if not equal_var else "Student's t-test",
            "statistic": round(t_stat, 6),
            "p_value": round(p_value, 6),
            "degrees_of_freedom": round(dof, 1),
            "effect_size": round(cohens_d, 6)
        }
    
    def _bayesian_conversion_test(self, control: pd.Series, treatment: pd.Series) -> Dict[str, Any]:
        """Bayesian test for conversion rates (simplified)"""
        # Using Beta-Binomial conjugate prior
        alpha_prior, beta_prior = 1, 1  # Uniform prior
        
        control_conv = control.sum()
        control_total = len(control)
        treatment_conv = treatment.sum()
        treatment_total = len(treatment)
        
        # Posterior parameters
        alpha_control = alpha_prior + control_conv
        beta_control = beta_prior + control_total - control_conv
        alpha_treatment = alpha_prior + treatment_conv
        beta_treatment = beta_prior + treatment_total - treatment_conv
        
        # Monte Carlo simulation to calculate probability
        n_simulations = 10000
        control_samples = np.random.beta(alpha_control, beta_control, n_simulations)
        treatment_samples = np.random.beta(alpha_treatment, beta_treatment, n_simulations)
        
        prob_treatment_better = np.mean(treatment_samples > control_samples)
        
        return {
            "test_type": "Bayesian Beta-Binomial",
            "statistic": round(prob_treatment_better, 6),
            "p_value": round(1 - prob_treatment_better, 6),  # Approximate p-value
        }
    
    def _bayesian_continuous_test(self, control: pd.Series, treatment: pd.Series) -> Dict[str, Any]:
        """Bayesian test for continuous data (simplified)"""
        # This is a simplified implementation
        # In practice, you'd use more sophisticated Bayesian methods
        
        # Use t-test as approximation for now
        return self._t_test(control, treatment)
    
    def _bootstrap_conversion_test(self, control: pd.Series, treatment: pd.Series) -> Dict[str, Any]:
        """Bootstrap test for conversion rates"""
        def conversion_rate_diff(x, y):
            return y.mean() - x.mean()
        
        # Bootstrap confidence interval for difference
        rng = np.random.RandomState(42)
        
        # Combine data and create null distribution
        combined = np.concatenate([control, treatment])
        n_control = len(control)
        
        bootstrap_diffs = []
        for _ in range(1000):
            shuffled = rng.permutation(combined)
            boot_control = shuffled[:n_control]
            boot_treatment = shuffled[n_control:]
            bootstrap_diffs.append(boot_treatment.mean() - boot_control.mean())
        
        observed_diff = treatment.mean() - control.mean()
        p_value = 2 * min(
            np.mean(np.array(bootstrap_diffs) >= observed_diff),
            np.mean(np.array(bootstrap_diffs) <= observed_diff)
        )
        
        return {
            "test_type": "Bootstrap permutation test",
            "statistic": round(observed_diff, 6),
            "p_value": round(p_value, 6)
        }
    
    def _bootstrap_continuous_test(self, control: pd.Series, treatment: pd.Series) -> Dict[str, Any]:
        """Bootstrap test for continuous data"""
        # Similar to bootstrap conversion test but for continuous data
        return self._bootstrap_conversion_test(control, treatment)
    
    def _calculate_conversion_ci(self, control: pd.Series, treatment: pd.Series) -> Dict[str, Any]:
        """Calculate confidence interval for conversion rate difference"""
        control_rate = control.mean()
        treatment_rate = treatment.mean()
        
        n1, n2 = len(control), len(treatment)
        
        # Standard error for difference in proportions
        se_diff = np.sqrt(
            (control_rate * (1 - control_rate) / n1) +
            (treatment_rate * (1 - treatment_rate) / n2)
        )
        
        diff = treatment_rate - control_rate
        margin_error = self.z_score * se_diff
        
        return {
            "lower_bound": round(diff - margin_error, 6),
            "upper_bound": round(diff + margin_error, 6),
            "confidence_level": self.confidence_level
        }
    
    def _calculate_continuous_ci(self, control: pd.Series, treatment: pd.Series) -> Dict[str, Any]:
        """Calculate confidence interval for continuous data difference"""
        diff = treatment.mean() - control.mean()
        
        # Standard error for difference in means
        se_diff = np.sqrt(control.var() / len(control) + treatment.var() / len(treatment))
        
        # Use t-distribution for small samples
        dof = len(control) + len(treatment) - 2
        t_critical = stats.t.ppf(1 - self.alpha / 2, dof)
        
        margin_error = t_critical * se_diff
        
        return {
            "lower_bound": round(diff - margin_error, 6),
            "upper_bound": round(diff + margin_error, 6),
            "confidence_level": self.confidence_level
        }
    
    def _calculate_mde_conversion(self, control: pd.Series, treatment: pd.Series) -> Optional[float]:
        """Calculate minimum detectable effect for conversion"""
        try:
            control_rate = control.mean()
            n_control = len(control)
            n_treatment = len(treatment)
            
            # Simplified MDE calculation
            pooled_rate = (control.sum() + treatment.sum()) / (n_control + n_treatment)
            se = np.sqrt(pooled_rate * (1 - pooled_rate) * (1/n_control + 1/n_treatment))
            
            mde = self.z_score * se * 2  # Two-sided test
            return round(mde, 6)
        except:
            return None
    
    def _calculate_mde_continuous(self, control: pd.Series, treatment: pd.Series) -> Optional[float]:
        """Calculate minimum detectable effect for continuous data"""
        try:
            pooled_std = np.sqrt(((len(control) - 1) * control.var() + (len(treatment) - 1) * treatment.var()) / (len(control) + len(treatment) - 2))
            se = pooled_std * np.sqrt(1/len(control) + 1/len(treatment))
            
            mde = self.z_score * se * 2  # Two-sided test
            return round(mde, 6)
        except:
            return None
    
    def _calculate_power_conversion(self, control: pd.Series, treatment: pd.Series, effect: float) -> Optional[float]:
        """Calculate statistical power for conversion test"""
        # Simplified power calculation
        try:
            if abs(effect) < 1e-10:
                return 0.0
            
            control_rate = control.mean()
            n_control = len(control)
            n_treatment = len(treatment)
            
            # Power calculation for two-proportion z-test
            se_null = np.sqrt(control_rate * (1 - control_rate) * (1/n_control + 1/n_treatment))
            se_alt = np.sqrt(control_rate * (1 - control_rate) / n_control + 
                           (control_rate + effect) * (1 - control_rate - effect) / n_treatment)
            
            z_beta = (abs(effect) - self.z_score * se_null) / se_alt
            power = stats.norm.cdf(z_beta)
            
            return round(max(0.0, min(1.0, power)), 3)
        except:
            return None
    
    def _calculate_power_continuous(self, control: pd.Series, treatment: pd.Series, effect: float) -> Optional[float]:
        """Calculate statistical power for continuous test"""
        # Simplified power calculation
        try:
            if abs(effect) < 1e-10:
                return 0.0
            
            pooled_std = np.sqrt(((len(control) - 1) * control.var() + (len(treatment) - 1) * treatment.var()) / (len(control) + len(treatment) - 2))
            se = pooled_std * np.sqrt(1/len(control) + 1/len(treatment))
            
            z_beta = (abs(effect) - self.z_score * se) / se
            power = stats.norm.cdf(z_beta)
            
            return round(max(0.0, min(1.0, power)), 3)
        except:
            return None
    
    def _safe_divide(self, numerator: pd.Series, denominator: pd.Series) -> pd.Series:
        """Safely divide two series, handling division by zero"""
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            result = numerator / denominator
            result = result.replace([np.inf, -np.inf], np.nan)
            return result.dropna() 