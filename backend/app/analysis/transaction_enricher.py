import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from scipy import stats
from scipy.stats import bootstrap
import logging
import hashlib

logger = logging.getLogger(__name__)

class TransactionEnricher:
    """
    Enriches existing analysis results with transaction-level data.
    Only updates revenue-related metrics while preserving other metrics.
    VERSION CORRIGÉE avec calculs statistiques fiables
    """
    
    def __init__(self, original_results: Dict[str, Any], transaction_data: List[Dict[str, Any]]):
        """
        Initialize the enricher with original results and transaction data.
        
        Args:
            original_results: Original analysis results from analyzer
            transaction_data: List of transaction records with required columns
        """
        self.original_results = original_results
        self.transaction_data = transaction_data
        self.transaction_df = None
        self.enriched_results = None
        
        # Extract statistical configuration from original results
        self.confidence_level = original_results.get('configuration', {}).get('confidence_level', 95.0)
        self.statistical_method = original_results.get('configuration', {}).get('statistical_method', 'frequentist')
        self.alpha = (100 - self.confidence_level) / 100
        
        logger.info(f"TransactionEnricher initialized with confidence_level={self.confidence_level}%, alpha={self.alpha}")
        
        # Store original variation breakdown for sample sizes
        self.original_variation_breakdown = {}
        if 'overall_results' in original_results and 'variation_breakdown' in original_results['overall_results']:
            for variation_info in original_results['overall_results']['variation_breakdown']:
                self.original_variation_breakdown[variation_info['variation_name']] = variation_info['user_count']
        
        logger.info(f"Original variation breakdown: {self.original_variation_breakdown}")
        
        # Les variation breakdown actuels à utiliser pour les calculs (peut être filtré)
        self.current_variation_breakdown = self.original_variation_breakdown.copy()
        
        # Create transaction data hash for caching
        self.transaction_hash = self._create_transaction_hash(transaction_data)
        
    def validate_transaction_data(self) -> bool:
        """
        Validate and clean transaction data.
        
        Returns:
            bool: True if validation passes, False otherwise
        """
        try:
            # Convert to DataFrame
            self.transaction_df = pd.DataFrame(self.transaction_data)
            
            # Check required columns
            required_columns = ['transaction_id', 'variation', 'revenue']
            missing_columns = [col for col in required_columns if col not in self.transaction_df.columns]
            
            if missing_columns:
                logger.error(f"Missing required columns: {missing_columns}")
                return False
            
            # Add quantity column if missing (default to 1)
            if 'quantity' not in self.transaction_df.columns:
                self.transaction_df['quantity'] = 1
                logger.info("Added default quantity column (value=1)")
            
            # Clean and validate data types
            self.transaction_df['revenue'] = pd.to_numeric(self.transaction_df['revenue'], errors='coerce')
            self.transaction_df['quantity'] = pd.to_numeric(self.transaction_df['quantity'], errors='coerce').fillna(1)
            
            # Remove rows with invalid revenue
            initial_count = len(self.transaction_df)
            self.transaction_df = self.transaction_df.dropna(subset=['revenue'])
            final_count = len(self.transaction_df)
            
            if initial_count != final_count:
                logger.warning(f"Removed {initial_count - final_count} rows with invalid revenue values")
            
            # Clean variation column (important pour la cohérence)
            if 'variation' in self.transaction_df.columns:
                self.transaction_df['variation'] = self.transaction_df['variation'].astype(str).str.strip()
            
            # Validate variations match original analysis
            original_variations = set()
            if 'metric_results' in self.original_results:
                for metric in self.original_results['metric_results']:
                    if 'variation_stats' in metric:
                        for var_stat in metric['variation_stats']:
                            original_variations.add(var_stat['variation'])
            
            transaction_variations = set(self.transaction_df['variation'].unique())
            missing_variations = original_variations - transaction_variations
            
            if missing_variations:
                logger.warning(f"Transaction data missing variations: {missing_variations}")
            
            logger.info(f"Transaction data validated: {len(self.transaction_df)} records, "
                       f"variations: {list(transaction_variations)}")
            
            return len(self.transaction_df) > 0
            
        except Exception as e:
            logger.error(f"Transaction data validation failed: {str(e)}")
            return False
    
    def _create_transaction_hash(self, transaction_data: List[Dict[str, Any]]) -> str:
        """
        Create a hash of transaction data for caching purposes.
        """
        try:
            # Create a stable string representation of the data
            data_str = str(sorted([
                (item.get('transaction_id', ''), item.get('variation', ''), 
                 item.get('revenue', 0), item.get('quantity', 1))
                for item in transaction_data
            ]))
            return hashlib.md5(data_str.encode()).hexdigest()
        except Exception as e:
            logger.warning(f"Failed to create transaction hash: {str(e)}")
            return "unknown"
    
    def validate_data_consistency(self) -> Dict[str, Any]:
        """
        Vérifie la cohérence entre les données originales et transaction.
        VERSION AMÉLIORÉE avec meilleure validation
        """
        issues = []
        warnings = []
        
        try:
            # Vérifier que toutes les variations existent
            original_variations = set(self.original_variation_breakdown.keys())
            transaction_variations = set(self.transaction_df['variation'].unique())
            
            missing_in_transaction = original_variations - transaction_variations
            if missing_in_transaction:
                issues.append(f"Variations missing in transaction data: {missing_in_transaction}")
            
            extra_in_transaction = transaction_variations - original_variations
            if extra_in_transaction:
                warnings.append(f"Extra variations in transaction data (will be ignored): {extra_in_transaction}")
            
            # Vérifier les ordres de grandeur
            for variation in original_variations & transaction_variations:
                original_users = self.original_variation_breakdown[variation]
                
                # Compter les utilisateurs uniques dans les données transaction
                user_column = None
                if 'user_id' in self.transaction_df.columns:
                    user_column = 'user_id'
                elif 'customer_id' in self.transaction_df.columns:
                    user_column = 'customer_id'
                elif 'users' in self.transaction_df.columns:
                    user_column = 'users'
                
                if user_column:
                    variation_df = self.transaction_df[self.transaction_df['variation'] == variation]
                    transaction_users = len(variation_df[user_column].unique())
                    
                    # Ratio de conversion attendu : entre 0.1% et 30% typiquement
                    conversion_rate = transaction_users / original_users if original_users > 0 else 0
                    
                    if conversion_rate > 0.5:  # Plus de 50% de conversion semble suspect
                        warnings.append(f"Variation {variation}: unusually high conversion rate ({conversion_rate:.1%})")
                    elif conversion_rate < 0.001 and transaction_users > 0:  # Moins de 0.1% semble faible
                        warnings.append(f"Variation {variation}: very low conversion rate ({conversion_rate:.3%})")
                
                # Vérifier la distribution des transactions
                variation_transactions = len(self.transaction_df[self.transaction_df['variation'] == variation])
                if variation_transactions < 10:
                    warnings.append(f"Variation {variation}: very few transactions ({variation_transactions}), statistical power may be limited")
            
            return {
                'is_valid': len(issues) == 0,
                'issues': issues,
                'warnings': warnings if warnings else ['Data consistency check passed'],
                'transaction_hash': self.transaction_hash
            }
            
        except Exception as e:
            logger.error(f"Data consistency validation failed: {str(e)}")
            return {
                'is_valid': False,
                'issues': [f"Consistency check failed: {str(e)}"],
                'warnings': [],
                'transaction_hash': self.transaction_hash
            }
    
    def update_variation_breakdown(self, filtered_results: Dict[str, Any]):
        """
        Met à jour les variation breakdowns avec les résultats de l'analyse filtrée.
        CRITIQUE pour corriger les calculs RPU avec des filtres.
        """
        try:
            if 'overall_results' in filtered_results and 'variation_breakdown' in filtered_results['overall_results']:
                updated_breakdown = {}
                for variation_info in filtered_results['overall_results']['variation_breakdown']:
                    updated_breakdown[variation_info['variation_name']] = variation_info['user_count']
                
                self.current_variation_breakdown = updated_breakdown
                logger.info(f"Updated current variation breakdown: {self.current_variation_breakdown}")
            else:
                logger.warning("No variation breakdown found in filtered results, using original")
                
        except Exception as e:
            logger.error(f"Failed to update variation breakdown: {str(e)}")
            # Keep original breakdown as fallback
    
    def aggregate_by_user(self) -> pd.DataFrame:
        """
        Aggregate transaction data by user/customer.
        VERSION CORRIGÉE avec meilleure identification des utilisateurs
        
        Returns:
            pd.DataFrame: Aggregated data by user
        """
        try:
            # Déterminer la colonne utilisateur
            user_column = None
            for col in ['user_id', 'customer_id', 'visitor_id', 'session_id']:
                if col in self.transaction_df.columns:
                    user_column = col
                    break
            
            # Si pas de colonne user, utiliser transaction_id comme proxy
            if user_column is None:
                user_column = 'transaction_id'
                logger.warning("No user column found, using transaction_id as proxy")
            
            # Aggregate by user and variation
            user_aggregated = self.transaction_df.groupby([user_column, 'variation']).agg({
                'revenue': ['sum', 'count', 'mean'],
                'quantity': 'sum',
                'transaction_id': 'count'  # Compter les transactions par utilisateur
            }).reset_index()
            
            # Flatten column names
            user_aggregated.columns = [
                user_column, 'variation', 'total_revenue', 'purchase_count', 
                'avg_order_value', 'total_quantity', 'transaction_count'
            ]
            
            # Calculate revenue per user (same as total_revenue in this aggregation)
            user_aggregated['revenue_per_user'] = user_aggregated['total_revenue']
            
            logger.info(f"Aggregated to {len(user_aggregated)} user-variation combinations")
            
            return user_aggregated
            
        except Exception as e:
            logger.error(f"User aggregation failed: {str(e)}")
            raise
    
    def recalculate_statistics(self, metric_name: str, user_data: pd.DataFrame) -> Dict[str, Any]:
        """
        Recalculate statistical tests for a specific metric using transaction data.
        VERSION CORRIGÉE avec calculs statistiques précis
        
        Args:
            metric_name: Name of the metric to recalculate
            user_data: User-aggregated data
            
        Returns:
            Dict containing updated metric results
        """
        try:
            # Determine metric type
            metric_type = self._get_metric_type(metric_name)
            logger.info(f"Metric '{metric_name}' classified as type: {metric_type}")
            
            # Get control and treatment groups
            variations = self.transaction_df['variation'].unique()
            control_variation = self._identify_control_variation(variations)
            
            # Calculate variation statistics
            variation_stats = []
            pairwise_comparisons = []
            
            # Process each variation
            for variation in variations:
                # Calculer les stats selon le type de métrique
                if metric_type == 'revenue_total':
                    stats = self._calculate_revenue_total_stats_v2(variation)
                elif metric_type == 'average_order_value':
                    stats = self._calculate_aov_stats_v2(variation)
                else:  # revenue_per_user and others
                    stats = self._calculate_rpu_stats_v2(variation, user_data)
                
                variation_stats.append(stats)
            
            # Identifier le control dans les stats
            control_stats = next(s for s in variation_stats if s['variation'] == control_variation)
            
            # Calculer les comparaisons pairwise
            overall_significant = False
            for stats in variation_stats:
                if stats['variation'] == control_variation:
                    continue
                
                # Perform statistical test avec les bonnes données
                comparison = self._perform_statistical_test_v2(
                    control_stats, stats, control_variation, 
                    stats['variation'], metric_type
                )
                
                pairwise_comparisons.append(comparison)
                
                if comparison['is_significant']:
                    overall_significant = True
            
            # Build metric result
            metric_result = {
                'metric_name': metric_name,
                'metric_type': self._get_metric_data_type(metric_name),
                'metric_unit': self._get_metric_unit(metric_name),
                'metric_currency': self._get_metric_currency(metric_name),
                'is_significant': overall_significant,
                'variation_stats': variation_stats,
                'pairwise_comparisons': pairwise_comparisons,
                'enriched_with_transaction_data': True
            }
            
            logger.info(f"Recalculated statistics for {metric_name}: "
                       f"significant={overall_significant}, variations={len(variations)}")
            
            return metric_result
            
        except Exception as e:
            logger.error(f"Statistics recalculation failed for {metric_name}: {str(e)}")
            raise
    
    def _calculate_revenue_total_stats_v2(self, variation: str) -> Dict[str, Any]:
        """
        VERSION CORRIGÉE: Calculate stats for revenue total metrics
        Pour les totaux de revenue, on reporte le total comme métrique principale
        """
        variation_data = self.transaction_df[self.transaction_df['variation'] == variation]
        
        if len(variation_data) == 0:
            return {
                'variation': variation,
                'sample_size': 0,
                'mean': 0,
                'std': 0,
                'total_revenue': 0,
                'transaction_count': 0
            }
        
        total_revenue = float(variation_data['revenue'].sum())
        transaction_count = len(variation_data)
        
        # Pour les totaux, la moyenne n'est pas la métrique principale
        # mais on la calcule pour référence
        mean_per_transaction = variation_data['revenue'].mean()
        std_per_transaction = variation_data['revenue'].std()
        
        return {
            'variation': variation,
            'sample_size': transaction_count,
            'mean': total_revenue,  # Pour revenue total, mean = total
            'std': std_per_transaction,
            'total_revenue': total_revenue,
            'transaction_count': transaction_count,
            'mean_per_transaction': mean_per_transaction
        }
    
    def _calculate_aov_stats_v2(self, variation: str) -> Dict[str, Any]:
        """
        VERSION CORRIGÉE: Calculate AOV (Average Order Value) stats
        AOV = Total Revenue / Number of Orders
        """
        variation_data = self.transaction_df[self.transaction_df['variation'] == variation]
        
        if len(variation_data) == 0:
            return {
                'variation': variation,
                'sample_size': 0,
                'mean': 0,
                'std': 0,
                'total_revenue': 0,
                'transaction_count': 0
            }
        
        total_revenue = float(variation_data['revenue'].sum())
        transaction_count = len(variation_data)
        
        # AOV = Total Revenue / Number of Transactions
        aov = total_revenue / transaction_count if transaction_count > 0 else 0
        
        # Standard deviation des valeurs de transaction
        std = float(variation_data['revenue'].std()) if len(variation_data) > 1 else 0
        
        logger.info(f"AOV for {variation}: €{aov:.2f} ({transaction_count} transactions)")
        
        return {
            'variation': variation,
            'sample_size': transaction_count,
            'mean': aov,  # AOV est la métrique principale
            'std': std,
            'total_revenue': total_revenue,
            'transaction_count': transaction_count
        }
    
    def _calculate_rpu_stats_v2(self, variation: str, user_data: pd.DataFrame) -> Dict[str, Any]:
        """
        VERSION CORRIGÉE: Calculate RPU (Revenue Per User) stats
        RPU = Total Revenue / Total Users (incluant les non-acheteurs)
        """
        variation_data = self.transaction_df[self.transaction_df['variation'] == variation]
        user_variation_data = user_data[user_data['variation'] == variation]
        
        # Total users from CURRENT analysis (peut être filtré)
        total_users = self.current_variation_breakdown.get(variation, 0)
        
        logger.info(f"RPU calculation for {variation}: using {total_users} users (current breakdown)")
        
        if total_users == 0:
            return {
                'variation': variation,
                'sample_size': 0,
                'mean': 0,
                'std': 0,
                'total_revenue': 0,
                'revenue_per_user': 0,
                'transaction_count': 0
            }
        
        total_revenue = float(variation_data['revenue'].sum())
        transaction_count = len(variation_data)
        users_with_purchases = len(user_variation_data)
        
        # RPU = Total Revenue / Total Users
        rpu = total_revenue / total_users
        
        # Pour le calcul de l'écart-type, on doit considérer tous les utilisateurs
        # y compris ceux avec 0€ de revenue
        if users_with_purchases > 0:
            # Revenue values for purchasers
            purchaser_revenues = user_variation_data['total_revenue'].values
            
            # Create full distribution including zeros for non-purchasers
            zeros = np.zeros(total_users - users_with_purchases)
            all_user_revenues = np.concatenate([purchaser_revenues, zeros])
            
            std = float(np.std(all_user_revenues))
        else:
            std = 0
        
        logger.info(f"RPU for {variation}: €{rpu:.2f} "
                   f"({users_with_purchases}/{total_users} purchasers)")
        
        return {
            'variation': variation,
            'sample_size': total_users,
            'mean': rpu,  # RPU est la métrique principale
            'std': std,
            'total_revenue': total_revenue,
            'revenue_per_user': rpu,
            'transaction_count': transaction_count,
            'users_with_purchases': users_with_purchases,
            'conversion_rate': users_with_purchases / total_users if total_users > 0 else 0
        }
    
    def _perform_statistical_test_v2(
        self, 
        control_stats: Dict[str, Any], 
        treatment_stats: Dict[str, Any],
        control_variation: str,
        treatment_variation: str,
        metric_type: str
    ) -> Dict[str, Any]:
        """
        VERSION CORRIGÉE: Perform proper statistical tests based on metric type
        """
        try:
            # Calculate uplifts
            control_mean = control_stats['mean']
            treatment_mean = treatment_stats['mean']
            
            absolute_uplift = treatment_mean - control_mean
            relative_uplift = (absolute_uplift / abs(control_mean) * 100) if control_mean != 0 else 0
            
            logger.info(f"Testing {treatment_variation} vs {control_variation} ({metric_type}): "
                       f"Uplift={relative_uplift:.2f}%")
            
            # Sélectionner le test approprié selon le type de métrique
            if metric_type == 'revenue_total':
                # Pour les totaux, utiliser bootstrap sur les transactions individuelles
                test_result = self._bootstrap_test_for_totals(
                    control_variation, treatment_variation
                )
            elif metric_type == 'average_order_value':
                # Pour AOV, utiliser t-test sur les valeurs de transaction
                test_result = self._ttest_for_aov(
                    control_variation, treatment_variation
                )
            else:  # revenue_per_user
                # Pour RPU, utiliser t-test sur la distribution complète (avec zeros)
                test_result = self._ttest_for_rpu(
                    control_stats, treatment_stats
                )
            
            # Construire le résultat
            return {
                'variation_name': treatment_variation,
                'relative_uplift': float(relative_uplift),
                'absolute_uplift': float(absolute_uplift),
                'is_significant': bool(test_result['p_value'] < self.alpha),
                'p_value': test_result['p_value'],
                'confidence_interval': test_result['confidence_interval'],
                'statistical_test': test_result['statistical_test'],
                'effect_size': test_result.get('effect_size', 0)
            }
            
        except Exception as e:
            logger.error(f"Statistical test failed: {str(e)}")
            return {
                'variation_name': treatment_variation,
                'relative_uplift': float(relative_uplift if 'relative_uplift' in locals() else 0),
                'absolute_uplift': float(absolute_uplift if 'absolute_uplift' in locals() else 0),
                'is_significant': False,
                'p_value': 1.0,
                'confidence_interval': {
                    'lower_bound': 0,
                    'upper_bound': 0,
                    'confidence_level': self.confidence_level
                },
                'statistical_test': {
                    'test_type': 'Error',
                    'statistic': 0,
                    'p_value': 1.0
                },
                'effect_size': 0
            }
    
    def _bootstrap_test_for_totals(self, control_variation: str, treatment_variation: str) -> Dict[str, Any]:
        """
        Bootstrap test for revenue totals comparison
        """
        control_data = self.transaction_df[
            self.transaction_df['variation'] == control_variation
        ]['revenue'].values
        
        treatment_data = self.transaction_df[
            self.transaction_df['variation'] == treatment_variation
        ]['revenue'].values
        
        if len(control_data) < 2 or len(treatment_data) < 2:
            return {
                'p_value': 1.0,
                'confidence_interval': {
                    'lower_bound': 0, 
                    'upper_bound': 0,
                    'confidence_level': self.confidence_level
                },
                'statistical_test': {
                    'test_type': 'Insufficient data',
                    'statistic': 0,
                    'p_value': 1.0
                }
            }
        
        # Bootstrap pour la différence des moyennes
        n_bootstrap = 10000
        np.random.seed(42)
        
        bootstrap_diffs = []
        for _ in range(n_bootstrap):
            control_sample = np.random.choice(control_data, size=len(control_data), replace=True)
            treatment_sample = np.random.choice(treatment_data, size=len(treatment_data), replace=True)
            bootstrap_diffs.append(treatment_sample.sum() - control_sample.sum())
        
        bootstrap_diffs = np.array(bootstrap_diffs)
        observed_diff = treatment_data.sum() - control_data.sum()
        
        # P-value (two-tailed)
        p_value = 2 * min(
            np.mean(bootstrap_diffs >= observed_diff),
            np.mean(bootstrap_diffs <= observed_diff)
        )
        
        # Confidence interval
        ci_lower = np.percentile(bootstrap_diffs, (self.alpha/2) * 100)
        ci_upper = np.percentile(bootstrap_diffs, (1 - self.alpha/2) * 100)
        
        # Convert to relative terms
        control_total = control_data.sum()
        if control_total != 0:
            ci_lower_rel = (ci_lower / abs(control_total)) * 100
            ci_upper_rel = (ci_upper / abs(control_total)) * 100
        else:
            ci_lower_rel = ci_upper_rel = 0
        
        return {
            'p_value': float(min(p_value, 1.0)),
            'confidence_interval': {
                'lower_bound': float(ci_lower_rel),
                'upper_bound': float(ci_upper_rel),
                'confidence_level': self.confidence_level
            },
            'statistical_test': {
                'test_type': 'Bootstrap test',
                'statistic': float(observed_diff),
                'p_value': float(min(p_value, 1.0))
            }
        }
    
    def _ttest_for_aov(self, control_variation: str, treatment_variation: str) -> Dict[str, Any]:
        """
        T-test for AOV comparison
        """
        control_revenues = self.transaction_df[
            self.transaction_df['variation'] == control_variation
        ]['revenue'].values
        
        treatment_revenues = self.transaction_df[
            self.transaction_df['variation'] == treatment_variation
        ]['revenue'].values
        
        if len(control_revenues) < 2 or len(treatment_revenues) < 2:
            return {
                'p_value': 1.0,
                'confidence_interval': {
                    'lower_bound': 0,
                    'upper_bound': 0,
                    'confidence_level': self.confidence_level
                },
                'statistical_test': {
                    'test_type': 'Insufficient data',
                    'statistic': 0,
                    'p_value': 1.0
                },
                'effect_size': 0
            }
        
        # Welch's t-test (ne présume pas des variances égales)
        t_stat, p_value = stats.ttest_ind(treatment_revenues, control_revenues, equal_var=False)
        
        # Effect size (Cohen's d)
        pooled_std = np.sqrt(
            ((len(control_revenues) - 1) * control_revenues.var() + 
             (len(treatment_revenues) - 1) * treatment_revenues.var()) / 
            (len(control_revenues) + len(treatment_revenues) - 2)
        )
        
        cohens_d = (treatment_revenues.mean() - control_revenues.mean()) / pooled_std if pooled_std > 0 else 0
        
        # Confidence interval for difference
        se_diff = np.sqrt(
            control_revenues.var()/len(control_revenues) + 
            treatment_revenues.var()/len(treatment_revenues)
        )
        
        dof = len(control_revenues) + len(treatment_revenues) - 2
        t_critical = stats.t.ppf(1 - self.alpha/2, dof)
        
        diff = treatment_revenues.mean() - control_revenues.mean()
        ci_lower = diff - t_critical * se_diff
        ci_upper = diff + t_critical * se_diff
        
        # Convert to relative terms
        control_mean = control_revenues.mean()
        if control_mean != 0:
            ci_lower_rel = (ci_lower / abs(control_mean)) * 100
            ci_upper_rel = (ci_upper / abs(control_mean)) * 100
        else:
            ci_lower_rel = ci_upper_rel = 0
        
        return {
            'p_value': float(p_value),
            'confidence_interval': {
                'lower_bound': float(ci_lower_rel),
                'upper_bound': float(ci_upper_rel),
                'confidence_level': self.confidence_level
            },
            'statistical_test': {
                'test_type': "Welch's t-test",
                'statistic': float(t_stat),
                'p_value': float(p_value)
            },
            'effect_size': float(cohens_d)
        }
    
    def _ttest_for_rpu(self, control_stats: Dict[str, Any], treatment_stats: Dict[str, Any]) -> Dict[str, Any]:
        """
        T-test for RPU comparison (includes zeros for non-purchasers)
        """
        # Recréer les distributions complètes avec les zéros
        control_n = control_stats['sample_size']
        treatment_n = treatment_stats['sample_size']
        
        # Pour le control
        control_purchasers = control_stats.get('users_with_purchases', 0)
        control_revenue_per_purchaser = (
            control_stats['total_revenue'] / control_purchasers 
            if control_purchasers > 0 else 0
        )
        
        # Distribution: valeurs de revenue pour les acheteurs + zéros pour les non-acheteurs
        control_values = np.concatenate([
            np.full(control_purchasers, control_revenue_per_purchaser),
            np.zeros(control_n - control_purchasers)
        ])
        
        # Pour le treatment
        treatment_purchasers = treatment_stats.get('users_with_purchases', 0)
        treatment_revenue_per_purchaser = (
            treatment_stats['total_revenue'] / treatment_purchasers 
            if treatment_purchasers > 0 else 0
        )
        
        treatment_values = np.concatenate([
            np.full(treatment_purchasers, treatment_revenue_per_purchaser),
            np.zeros(treatment_n - treatment_purchasers)
        ])
        
        if len(control_values) < 2 or len(treatment_values) < 2:
            return {
                'p_value': 1.0,
                'confidence_interval': {
                    'lower_bound': 0,
                    'upper_bound': 0,
                    'confidence_level': self.confidence_level
                },
                'statistical_test': {
                    'test_type': 'Insufficient data',
                    'statistic': 0,
                    'p_value': 1.0
                },
                'effect_size': 0
            }
        
        # Welch's t-test
        t_stat, p_value = stats.ttest_ind(treatment_values, control_values, equal_var=False)
        
        # Effect size
        pooled_std = np.sqrt(
            ((len(control_values) - 1) * control_values.var() + 
             (len(treatment_values) - 1) * treatment_values.var()) / 
            (len(control_values) + len(treatment_values) - 2)
        )
        
        cohens_d = (treatment_values.mean() - control_values.mean()) / pooled_std if pooled_std > 0 else 0
        
        # Confidence interval
        se_diff = np.sqrt(
            control_values.var()/len(control_values) + 
            treatment_values.var()/len(treatment_values)
        )
        
        dof = len(control_values) + len(treatment_values) - 2
        t_critical = stats.t.ppf(1 - self.alpha/2, dof)
        
        diff = treatment_values.mean() - control_values.mean()
        ci_lower = diff - t_critical * se_diff
        ci_upper = diff + t_critical * se_diff
        
        # Convert to relative terms
        control_mean = control_values.mean()
        if control_mean != 0:
            ci_lower_rel = (ci_lower / abs(control_mean)) * 100
            ci_upper_rel = (ci_upper / abs(control_mean)) * 100
        else:
            ci_lower_rel = ci_upper_rel = 0
        
        return {
            'p_value': float(p_value),
            'confidence_interval': {
                'lower_bound': float(ci_lower_rel),
                'upper_bound': float(ci_upper_rel),
                'confidence_level': self.confidence_level
            },
            'statistical_test': {
                'test_type': "Welch's t-test (with zeros)",
                'statistic': float(t_stat),
                'p_value': float(p_value)
            },
            'effect_size': float(cohens_d)
        }
    
    # Les autres méthodes restent inchangées...
    def _get_metric_type(self, metric_name: str) -> str:
        """Determine the type of metric for statistical calculation purposes."""
        metric_lower = metric_name.lower()
        
        # Check AOV first (most specific)
        if ('average' in metric_lower and 'order' in metric_lower and 'value' in metric_lower) or \
           ('aov' in metric_lower):
            return 'average_order_value'
        # Check RPU (second most specific)
        elif ('per' in metric_lower and 'user' in metric_lower) or \
             ('revenue' in metric_lower and 'per' in metric_lower) or \
             ('rpu' in metric_lower):
            return 'revenue_per_user'
        # Check revenue total (least specific, after excluding AOV and RPU)
        elif any(revenue_term in metric_lower for revenue_term in ['revenue', 'gross margin', 'margin']) and \
             'average' not in metric_lower and 'per' not in metric_lower:
            return 'revenue_total'
        else:
            return 'other'
    
    def _identify_control_variation(self, variations: np.ndarray) -> str:
        """Identify control variation from available variations."""
        for variation in variations:
            if any(keyword in str(variation).lower() for keyword in ['control', 'original', '[0]']):
                return variation
        return variations[0]  # Default to first variation
    
    def _get_metric_data_type(self, metric_name: str) -> str:
        """Determine metric data type based on name."""
        metric_lower = metric_name.lower()
        if any(keyword in metric_lower for keyword in ['revenue', 'aov', 'order value', 'rpu']):
            return 'continuous'
        return 'continuous'  # Default for transaction-enriched metrics
    
    def _get_metric_unit(self, metric_name: str) -> str:
        """Determine metric unit based on name."""
        metric_lower = metric_name.lower()
        if any(keyword in metric_lower for keyword in ['revenue', 'aov', 'order value', 'rpu', 'margin']):
            return 'currency'
        elif 'quantity' in metric_lower:
            return 'count'
        return 'currency'  # Default
    
    def _get_metric_currency(self, metric_name: str) -> str:
        """Get currency symbol for metric."""
        # Try to get from original results configuration
        if 'configuration' in self.original_results:
            return self.original_results['configuration'].get('currency', '€')
        return '€'  # Default currency
    
    def _is_revenue_metric(self, metric_name: str) -> bool:
        """Check if a metric is revenue-related."""
        metric_lower = metric_name.lower()
        revenue_keywords = [
            'revenue', 'rpu', 'aov', 'order value', 'purchase value',
            'transaction value', 'total revenue', 'revenue per user',
            'gross margin', 'margin', 'average order'
        ]
        
        return any(keyword in metric_lower for keyword in revenue_keywords)
    
    def _identify_revenue_metrics(self) -> List[str]:
        """Identify revenue-related metrics in original results."""
        revenue_metrics = []
        
        for metric in self.original_results.get('metric_results', []):
            metric_name = metric.get('metric_name', '')
            if self._is_revenue_metric(metric_name):
                revenue_metrics.append(metric_name)
        
        return revenue_metrics
    
    def enrich_results(self) -> Dict[str, Any]:
        """
        Enrich original results with transaction-level data.
        Only updates revenue-related metrics, preserves all others.
        
        Returns:
            Dict: Enriched analysis results
        """
        try:
            if not self.validate_transaction_data():
                raise ValueError("Transaction data validation failed")
            
            # Validate data consistency
            consistency_check = self.validate_data_consistency()
            if not consistency_check['is_valid']:
                logger.warning(f"Data consistency issues: {consistency_check['issues']}")
                # Continue with warnings, don't fail completely
            
            logger.info(f"Data consistency warnings: {consistency_check['warnings']}")
            
            # Aggregate transaction data by user
            user_data = self.aggregate_by_user()
            
            # Start with original results
            self.enriched_results = self.original_results.copy()
            
            # Store configuration for later use
            if 'configuration' not in self.enriched_results:
                self.enriched_results['configuration'] = {}
            self.enriched_results['configuration']['confidence_level'] = self.confidence_level
            
            # Identify revenue metrics to enrich
            revenue_metrics = self._identify_revenue_metrics()
            
            if not revenue_metrics:
                logger.warning("No revenue metrics found to enrich")
                return self.enriched_results
            
            # Update metric results
            updated_metrics = []
            
            for metric in self.enriched_results.get('metric_results', []):
                metric_name = metric.get('metric_name', '')
                
                if self._is_revenue_metric(metric_name):
                    # Recalculate with transaction data
                    logger.info(f"Enriching metric: {metric_name}")
                    enriched_metric = self.recalculate_statistics(metric_name, user_data)
                    updated_metrics.append(enriched_metric)
                else:
                    # Keep original metric unchanged
                    updated_metrics.append(metric)
            
            self.enriched_results['metric_results'] = updated_metrics
            
            # Update overall results
            if 'overall_results' not in self.enriched_results:
                self.enriched_results['overall_results'] = {}
            
            # Keep the original user count from the main analysis
            original_total_users = self.enriched_results['overall_results'].get('total_users', len(user_data))
            self.enriched_results['overall_results']['total_users'] = original_total_users
            self.enriched_results['overall_results']['enriched_with_transaction_data'] = True
            self.enriched_results['overall_results']['transaction_records_processed'] = len(self.transaction_df)
            self.enriched_results['overall_results']['transaction_users'] = len(user_data)
            self.enriched_results['overall_results']['transaction_hash'] = self.transaction_hash
            self.enriched_results['overall_results']['data_consistency'] = consistency_check
            
            logger.info(f"Successfully enriched {len(revenue_metrics)} revenue metrics with transaction data")
            
            return self.enriched_results
            
        except Exception as e:
            logger.error(f"Results enrichment failed: {str(e)}")
            raise