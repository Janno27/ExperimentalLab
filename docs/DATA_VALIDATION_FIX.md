# Fix: Data Validation for Aggregated vs Raw Data

## Problem

The system was incorrectly validating aggregated data with the same minimum row requirements as raw data (10 rows minimum). This caused failures when analyzing A/B tests with aggregated data containing only 2 rows (one per variation).

## Root Cause

In `lib/api/analysis-api-transformer.ts`, the `validateData` method had a hardcoded minimum of 10 rows regardless of data type:

```typescript
// OLD CODE - PROBLEMATIC
if (data.length < 10) {
  errors.push('Sample size too small (minimum 10 rows required)')
}
```

## Solution

Modified the validation logic to differentiate between data types:

### 1. Updated `validateData` Method

```typescript
static validateData(
  data: Record<string, unknown>[], 
  dataType: 'aggregated' | 'raw' = 'aggregated'
): { isValid: boolean; errors: string[] } {
  // ... existing validation ...
  
  // Vérifier la taille minimale selon le type de données
  if (dataType === 'aggregated') {
    // Pour les données agrégées, minimum 2 lignes (une par variation)
    if (data.length < 2) {
      errors.push('Sample size too small for aggregated data (minimum 2 rows required - one per variation)')
    }
  } else {
    // Pour les données raw, minimum 10 lignes pour des statistiques fiables
    if (data.length < 10) {
      errors.push('Sample size too small for raw data (minimum 10 rows required)')
    }
  }
  
  // ... rest of validation ...
}
```

### 2. Updated `prepareAnalysisConfig` Function

```typescript
export function prepareAnalysisConfig(
  data: Record<string, unknown>[],
  metrics: CustomMetric[],
  variationColumn: string,
  userColumn?: string,
  confidenceLevel: number = 95,
  statisticalMethod: 'frequentist' | 'bayesian' | 'bootstrap' = 'frequentist',
  multipleTestingCorrection: 'none' | 'bonferroni' | 'fdr' = 'none',
  dataType: 'aggregated' | 'raw' = 'aggregated'
): AnalysisConfig {
  // Valider les données avec le type approprié
  const validation = AnalysisAPITransformer.validateData(data, dataType)
  if (!validation.isValid) {
    console.error('Data validation errors:', validation.errors)
    throw new Error(`Data validation failed: ${validation.errors.join(', ')}`)
  }
  
  // ... rest of function ...
}
```

## Data Type Requirements

### Aggregated Data
- **Minimum rows**: 2 (one per variation)
- **Use case**: Pre-aggregated A/B test results
- **Example**: 
  ```json
  [
    { "variation": "Control", "users": 10000, "conversions": 500 },
    { "variation": "Treatment", "users": 10200, "conversions": 550 }
  ]
  ```

### Raw Data
- **Minimum rows**: 10 (for statistical reliability)
- **Use case**: Individual user/event records
- **Example**:
  ```json
  [
    { "user_id": "user1", "variation": "Control", "converted": 1 },
    { "user_id": "user2", "variation": "Control", "converted": 0 },
    // ... 8+ more rows
  ]
  ```

## Impact

✅ **Fixed**: Aggregated data with 2+ rows now validates successfully
✅ **Preserved**: Raw data still requires 10+ rows for statistical reliability
✅ **Backward Compatible**: No breaking changes to existing functionality

## Testing

The fix has been validated with:
- Aggregated data (2 rows) → ✅ Passes validation
- Raw data (<10 rows) → ❌ Correctly fails validation  
- Raw data (10+ rows) → ✅ Passes validation

## Error Messages

### Before Fix
```
Error: Data validation failed: Sample size too small (minimum 10 rows required)
```

### After Fix
```
// Aggregated data with 1 row
Error: Data validation failed: Sample size too small for aggregated data (minimum 2 rows required - one per variation)

// Raw data with <10 rows  
Error: Data validation failed: Sample size too small for raw data (minimum 10 rows required)
```

This fix resolves the issue where users couldn't analyze A/B tests with properly formatted aggregated data.
