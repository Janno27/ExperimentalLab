# Custom Metrics Implementation

## Overview

The A/B testing analysis system now supports custom metrics with user-defined numerators and denominators, allowing for more flexible metric calculations beyond the standard user-based sampling.

## Problem Solved

Previously, all metrics were forced to use the `user_column` as the denominator for sample size calculations. This meant that custom metrics like `user_purchase/user_begin_checkout` would incorrectly be calculated as `user_purchase/users`, losing the intended metric definition.

## Implementation Details

### Frontend Changes

#### 1. MetricModal.tsx
- Supports creating binary metrics with custom numerator/denominator columns
- Supports creating continuous metrics with single values or ratios (valueColumn/valueColumn2)
- Provides real-time preview of metric calculations

#### 2. analysis-api.ts
- Enhanced `transformConfig` method to properly handle custom metric columns
- Maps `valueColumn2` to `denominator_column` for continuous ratio metrics
- Preserves both `numerator_column` and `denominator_column` in API calls

### Backend Changes

#### 1. analyzer.py
- Modified `_analyze_metric` to extract and validate custom numerator/denominator columns
- Refactored `_calculate_variation_stats` to support custom metric calculations
- Added logic to handle both standard and custom metric types

#### 2. Key Algorithm Changes

**For Custom Metrics with Numerator/Denominator:**
```python
# Calculate individual ratios and overall ratio
for num_val, den_val in zip(numerator_values, denominator_values):
    total_numerator += num_val
    total_denominator += den_val
    if den_val > 0:
        ratios.append(num_val / den_val)

# Overall metric = total_numerator / total_denominator
overall_ratio = total_numerator / total_denominator
```

**For Standard Metrics:**
- Uses existing logic with user_column for sample size
- Maintains backward compatibility

## Metric Types Supported

### 1. Binary Metrics (Conversion)
- **Custom**: `numerator_column / denominator_column`
- **Example**: Purchase Rate = `user_purchase / user_begin_checkout`
- **Sample Size**: Number of observations (rows)
- **Result**: Conversion rate as percentage

### 2. Continuous Metrics (Revenue/Count)
- **Custom Ratio**: `numerator_column / denominator_column`
- **Example**: AOV = `revenue / transactions`
- **Sample Size**: Number of observations (rows)
- **Result**: Average value per denominator unit

### 3. Standard Metrics
- **Logic**: Uses `metric_column` with `user_column` for sampling
- **Backward Compatible**: All existing metrics continue to work

## Usage Examples

### Creating a Custom Purchase Conversion Rate
```typescript
{
  name: "Purchase Conversion Rate",
  type: "binary",
  numerator: "user_purchase",
  denominator: "user_begin_checkout",
  description: "Rate of purchases per checkout initiation"
}
```

### Creating a Custom AOV Metric
```typescript
{
  name: "Average Order Value",
  type: "continuous",
  valueColumn: "revenue",
  valueColumn2: "transactions", // Maps to denominator
  description: "Average revenue per transaction"
}
```

## Statistical Calculations

### Sample Size
- **Custom Metrics**: Number of data rows (observations)
- **Standard Metrics**: Sum of user_column values (for aggregated) or row count (for raw)

### Confidence Intervals
- **Conversion Metrics**: Two-proportion z-test with pooled variance
- **Continuous Metrics**: Two-sample t-test with pooled standard deviation
- **Custom Logic**: Handles both individual ratios and aggregate totals

### Significance Testing
- Uses the same statistical tests as standard metrics
- P-values calculated based on appropriate test statistics
- Multiple testing correction applied when configured

## Backward Compatibility

✅ **All existing functionality preserved:**
- Standard metrics continue to work exactly as before
- User column sampling still used for standard metrics
- API interface remains the same
- No breaking changes to existing analyses

## Testing

The implementation has been tested with:
- Custom binary metrics (conversion rates)
- Custom continuous metrics (ratios like AOV)
- Standard metrics (counts, revenues)
- Mixed metric configurations
- Edge cases (zero denominators, missing data)

## Benefits

1. **Flexibility**: Create any ratio-based metric
2. **Accuracy**: Metrics calculated exactly as intended
3. **Performance**: Efficient calculation of both individual and aggregate statistics
4. **Compatibility**: Works alongside existing standard metrics
5. **User Experience**: Clear preview and validation in the UI

## Future Enhancements

- Support for more complex metric formulas
- Metric templates for common use cases
- Advanced filtering options per metric
- Metric performance benchmarking 