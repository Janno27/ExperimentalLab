import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import warnings
from datetime import datetime

class DataValidator:
    """Data validation and cleaning utilities"""
    
    def __init__(self):
        self.validation_warnings = []
        self.cleaning_actions = []
    
    def validate_and_clean(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Validate and clean raw data
        
        Args:
            data: Raw data as list of dictionaries
            
        Returns:
            Cleaned data
        """
        self.validation_warnings = []
        self.cleaning_actions = []
        
        if not data:
            raise ValueError("Data cannot be empty")
        
        # Convert to DataFrame for easier manipulation
        df = pd.DataFrame(data)
        
        # Validate structure
        self._validate_structure(df)
        
        # Clean data
        cleaned_df = self._clean_data(df)
        
        # Final validation
        self._final_validation(cleaned_df)
        
        # Convert back to list of dictionaries
        return cleaned_df.to_dict('records')
    
    def apply_filters(self, data: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Apply filters to data
        
        Args:
            data: Data to filter
            filters: Filter specifications
            
        Returns:
            Filtered data
        """
        df = pd.DataFrame(data)
        
        for column, filter_spec in filters.items():
            if column not in df.columns:
                self.validation_warnings.append(f"Filter column '{column}' not found in data")
                continue
            
            original_size = len(df)
            df = self._apply_single_filter(df, column, filter_spec)
            filtered_size = len(df)
            
            if filtered_size < original_size:
                self.cleaning_actions.append(
                    f"Applied filter on '{column}': {original_size} -> {filtered_size} rows"
                )
        
        return df.to_dict('records')
    
    def _validate_structure(self, df: pd.DataFrame):
        """Validate basic data structure"""
        
        # Check if DataFrame is empty
        if df.empty:
            raise ValueError("Data cannot be empty after conversion to DataFrame")
        
        # Check for completely empty columns
        empty_columns = df.columns[df.isnull().all()].tolist()
        if empty_columns:
            self.validation_warnings.append(f"Completely empty columns found: {empty_columns}")
        
        # Check for duplicate column names
        if df.columns.duplicated().any():
            duplicated_cols = df.columns[df.columns.duplicated()].tolist()
            raise ValueError(f"Duplicate column names found: {duplicated_cols}")
        
        # Check data types
        self._validate_data_types(df)
    
    def _validate_data_types(self, df: pd.DataFrame):
        """Validate and infer appropriate data types"""
        
        for column in df.columns:
            col_data = df[column].dropna()
            
            if col_data.empty:
                continue
            
            # Check for mixed types
            types = col_data.apply(type).unique()
            if len(types) > 2:  # Allow for some type mixing (e.g., int and float)
                self.validation_warnings.append(
                    f"Column '{column}' has mixed data types: {[t.__name__ for t in types]}"
                )
            
            # Try to convert numeric columns
            if col_data.dtype == 'object':
                numeric_converted = pd.to_numeric(col_data, errors='coerce')
                if not numeric_converted.isnull().all():
                    # Some values could be converted to numeric
                    non_numeric_count = numeric_converted.isnull().sum()
                    if non_numeric_count > 0:
                        self.validation_warnings.append(
                            f"Column '{column}' has {non_numeric_count} non-numeric values in apparently numeric data"
                        )
    
    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean the data"""
        
        cleaned_df = df.copy()
        
        # Remove completely empty rows
        initial_rows = len(cleaned_df)
        cleaned_df = cleaned_df.dropna(how='all')
        removed_empty_rows = initial_rows - len(cleaned_df)
        if removed_empty_rows > 0:
            self.cleaning_actions.append(f"Removed {removed_empty_rows} completely empty rows")
        
        # Handle numeric columns
        for column in cleaned_df.columns:
            cleaned_df = self._clean_column(cleaned_df, column)
        
        # Remove duplicate rows
        initial_rows = len(cleaned_df)
        cleaned_df = cleaned_df.drop_duplicates()
        removed_duplicates = initial_rows - len(cleaned_df)
        if removed_duplicates > 0:
            self.cleaning_actions.append(f"Removed {removed_duplicates} duplicate rows")
        
        return cleaned_df
    
    def _clean_column(self, df: pd.DataFrame, column: str) -> pd.DataFrame:
        """Clean a single column"""
        
        col_data = df[column]
        
        # Handle numeric columns
        if col_data.dtype in ['int64', 'float64'] or self._is_numeric_column(col_data):
            df = self._clean_numeric_column(df, column)
        
        # Handle string columns
        elif col_data.dtype == 'object':
            df = self._clean_string_column(df, column)
        
        return df
    
    def _is_numeric_column(self, col_data: pd.Series) -> bool:
        """Check if column should be treated as numeric"""
        non_null_data = col_data.dropna()
        if non_null_data.empty:
            return False
        
        # Try to convert to numeric
        numeric_converted = pd.to_numeric(non_null_data, errors='coerce')
        numeric_ratio = numeric_converted.notna().sum() / len(non_null_data)
        
        return numeric_ratio > 0.8  # 80% of values can be converted to numeric
    
    def _clean_numeric_column(self, df: pd.DataFrame, column: str) -> pd.DataFrame:
        """Clean numeric column"""
        
        col_data = df[column]
        
        # Convert to numeric if needed
        if col_data.dtype == 'object':
            original_nulls = col_data.isnull().sum()
            numeric_col = pd.to_numeric(col_data, errors='coerce')
            new_nulls = numeric_col.isnull().sum()
            
            if new_nulls > original_nulls:
                converted_to_null = new_nulls - original_nulls
                self.cleaning_actions.append(
                    f"Column '{column}': converted {converted_to_null} non-numeric values to NaN"
                )
            
            df[column] = numeric_col
            col_data = df[column]
        
        # Handle infinite values
        inf_count = np.isinf(col_data).sum()
        if inf_count > 0:
            df[column] = col_data.replace([np.inf, -np.inf], np.nan)
            self.cleaning_actions.append(f"Column '{column}': replaced {inf_count} infinite values with NaN")
        
        # Handle extreme outliers (beyond 5 standard deviations)
        non_null_data = col_data.dropna()
        if len(non_null_data) > 10:  # Only for columns with sufficient data
            mean_val = non_null_data.mean()
            std_val = non_null_data.std()
            
            if std_val > 0:
                outliers = np.abs(non_null_data - mean_val) > 5 * std_val
                outlier_count = outliers.sum()
                
                if outlier_count > 0 and outlier_count < len(non_null_data) * 0.01:  # Less than 1% outliers
                    outlier_indices = non_null_data[outliers].index
                    df.loc[outlier_indices, column] = np.nan
                    self.cleaning_actions.append(
                        f"Column '{column}': replaced {outlier_count} extreme outliers (>5σ) with NaN"
                    )
        
        return df
    
    def _clean_string_column(self, df: pd.DataFrame, column: str) -> pd.DataFrame:
        """Clean string column"""
        
        col_data = df[column]
        
        # Strip whitespace
        stripped = col_data.astype(str).str.strip()
        whitespace_changes = (stripped != col_data.astype(str)).sum()
        if whitespace_changes > 0:
            df[column] = stripped
            self.cleaning_actions.append(f"Column '{column}': stripped whitespace from {whitespace_changes} values")
        
        # Replace empty strings with NaN
        empty_strings = (df[column] == '').sum()
        if empty_strings > 0:
            df[column] = df[column].replace('', np.nan)
            self.cleaning_actions.append(f"Column '{column}': replaced {empty_strings} empty strings with NaN")
        
        # Standardize common null representations
        null_representations = ['null', 'NULL', 'None', 'NONE', 'n/a', 'N/A', 'na', 'NA', '#N/A']
        for null_rep in null_representations:
            null_count = (df[column] == null_rep).sum()
            if null_count > 0:
                df[column] = df[column].replace(null_rep, np.nan)
                self.cleaning_actions.append(f"Column '{column}': replaced {null_count} '{null_rep}' values with NaN")
        
        return df
    
    def _final_validation(self, df: pd.DataFrame):
        """Perform final validation checks"""
        
        # Check if we still have data
        if df.empty:
            raise ValueError("All data was removed during cleaning process")
        
        # Check missing data percentage
        missing_percentage = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
        if missing_percentage > 50:
            self.validation_warnings.append(
                f"High percentage of missing data: {missing_percentage:.1f}%"
            )
        
        # Check for columns with too much missing data
        for column in df.columns:
            col_missing_pct = (df[column].isnull().sum() / len(df)) * 100
            if col_missing_pct > 80:
                self.validation_warnings.append(
                    f"Column '{column}' has {col_missing_pct:.1f}% missing data"
                )
    
    def _apply_single_filter(self, df: pd.DataFrame, column: str, filter_spec: Any) -> pd.DataFrame:
        """Apply a single filter to a column"""
        
        if isinstance(filter_spec, dict):
            # Range filter: {"min": 0, "max": 100}
            if 'min' in filter_spec:
                df = df[df[column] >= filter_spec['min']]
            if 'max' in filter_spec:
                df = df[df[column] <= filter_spec['max']]
                
        elif isinstance(filter_spec, list):
            # List filter: include only these values
            df = df[df[column].isin(filter_spec)]
            
        elif isinstance(filter_spec, str) and filter_spec.startswith('!'):
            # Exclusion filter: "!value_to_exclude"
            exclude_value = filter_spec[1:]
            df = df[df[column] != exclude_value]
            
        else:
            # Exact match filter
            df = df[df[column] == filter_spec]
        
        return df
    
    def get_data_quality_report(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate a data quality report"""
        
        if isinstance(df, list):
            df = pd.DataFrame(df)
        
        total_cells = len(df) * len(df.columns)
        missing_cells = df.isnull().sum().sum()
        
        # Column-level statistics
        column_stats = {}
        for column in df.columns:
            col_data = df[column]
            column_stats[column] = {
                'dtype': str(col_data.dtype),
                'missing_count': int(col_data.isnull().sum()),
                'missing_percentage': round((col_data.isnull().sum() / len(df)) * 100, 2),
                'unique_values': int(col_data.nunique()),
                'most_common': col_data.value_counts().head(3).to_dict() if not col_data.empty else {}
            }
        
        return {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'total_cells': total_cells,
            'missing_cells': int(missing_cells),
            'missing_percentage': round((missing_cells / total_cells) * 100, 2),
            'data_quality_score': max(0.0, 1.0 - (missing_cells / total_cells)),
            'column_statistics': column_stats,
            'warnings': self.validation_warnings,
            'cleaning_actions': self.cleaning_actions,
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def suggest_data_improvements(self, df: pd.DataFrame) -> List[str]:
        """Suggest improvements for data quality"""
        
        suggestions = []
        
        if isinstance(df, list):
            df = pd.DataFrame(df)
        
        # Check for high missing data
        missing_pct = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
        if missing_pct > 20:
            suggestions.append(
                f"Consider investigating the source of missing data ({missing_pct:.1f}% missing)"
            )
        
        # Check for low sample size
        if len(df) < 1000:
            suggestions.append(
                f"Sample size is relatively small ({len(df)} rows). Consider collecting more data for more reliable results."
            )
        
        # Check for columns with very few unique values
        for column in df.columns:
            unique_ratio = df[column].nunique() / len(df)
            if unique_ratio < 0.01 and df[column].nunique() > 1:  # Less than 1% unique values
                suggestions.append(
                    f"Column '{column}' has very few unique values ({df[column].nunique()}). Consider if this column is useful for analysis."
                )
        
        # Check for potential ID columns that might not be useful
        for column in df.columns:
            if df[column].nunique() == len(df):  # All unique values
                suggestions.append(
                    f"Column '{column}' appears to be an identifier (all unique values). Consider excluding from statistical analysis."
                )
        
        return suggestions 