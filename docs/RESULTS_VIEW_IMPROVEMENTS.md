# ResultsView.tsx - Dynamic Column Display Implementation

## Overview

The `ResultsView.tsx` component has been completely overhauled to provide dynamic column display based on metric types, improved revenue display, and better visual organization for A/B test results.

## Key Features Implemented

### 1. **Dynamic Column Configuration**

#### `getDisplayConfig()` Function
```typescript
const getDisplayConfig = (metric: MetricResult, dataType: 'aggregated' | 'raw' = 'aggregated') => {
  // Returns configuration object with:
  // - columns: Array of column types to display
  // - headers: Dynamic header labels
  // - disabledColumns: Columns to gray out
  // - note: Tooltip text for disabled columns
}
```

#### Column Types Supported
- `variation`: Variation name
- `users`: Total users
- `base_users`: Base users for funnel metrics
- `conversions`: Number of conversions
- `conversion_rate`: Conversion percentage
- `total_value`: Total revenue/count
- `value_per_user`: Average per user
- `value`: Single value (AOV, RPU, etc.)
- `uplift`: Relative improvement
- `significance`: Statistical significance
- `ci`: Confidence interval

### 2. **Metric-Specific Display Configurations**

#### **Conversion Metrics (Binary)**
```typescript
// Standard conversion: Variation | Users | Conversions | Conversion Rate | Uplift | Significance | CI
{
  name: "Purchase Conversion Rate",
  columns: ["variation", "users", "conversions", "conversion_rate", "uplift", "significance", "ci"]
}

// Funnel conversion: Variation | Base Users | Conversions | Rate | Uplift | Significance | CI
{
  name: "Cart to Purchase Rate", 
  columns: ["variation", "base_users", "conversions", "conversion_rate", "uplift", "significance", "ci"]
}
```

#### **Revenue Metrics**
```typescript
// Total revenue: Variation | Total Revenue | Revenue/User | Uplift
{
  name: "Revenue",
  columns: ["variation", "total_value", "value_per_user", "uplift"],
  disabledColumns: ["significance", "ci"] // For aggregated data
}

// AOV/RPU: Variation | Users | Value | Uplift  
{
  name: "Average Order Value",
  columns: ["variation", "users", "value", "uplift"]
}
```

#### **Count Metrics**
```typescript
// Volume metrics: Variation | Users | Total Count | Count per User | Uplift
{
  name: "Total Purchases",
  columns: ["variation", "users", "total_value", "value_per_user", "uplift"]
}
```

### 3. **Revenue Display Fixes**

#### **Total Revenue Calculation**
- **Before**: Showed average revenue per user
- **After**: Shows TOTAL revenue (sum of all revenue for variation)

```typescript
// Total revenue calculation
case 'total_value':
  return formatValue(stats.total_revenue || (stats.mean * stats.sample_size), 'currency', currency, 0)

// Revenue per user calculation  
case 'value_per_user':
  return formatValue(stats.revenue_per_user || stats.mean, 'currency', currency, decimals)
```

#### **Currency Formatting**
- Automatic currency symbol display (€, $, £, etc.)
- Proper decimal places based on metric type
- Thousand separators for large values

### 4. **Visual Improvements**

#### **Disabled Columns**
```typescript
// Gray out statistical columns for aggregated data
config.disabledColumns = dataType === 'aggregated' ? ['significance', 'ci'] : []

// Apply opacity styling
<div className={cn(
  displayConfig.disabledColumns.includes(columnType) && "opacity-50"
)}>
```

#### **Significance Highlighting**
```typescript
// Green background for significant results
<tr className={cn(
  "transition-colors",
  comparison?.is_significant && "bg-green-50"
)}>
```

#### **Tooltips for Disabled Columns**
```typescript
{displayConfig.note && (
  <Tooltip>
    <TooltipContent>
      <p className="text-xs">{displayConfig.note}</p>
    </TooltipContent>
  </Tooltip>
)}
```

### 5. **Enhanced Header Labels**

#### **Dynamic Headers by Metric Type**

| Metric Type | Column 1 | Column 2 | Column 3 |
|-------------|----------|----------|----------|
| **Purchase Rate** | Variation | Users | Purchases | Purchase Rate (%) |
| **Revenue** | Variation | Total Revenue (€) | Revenue per User (€) | Uplift |
| **AOV** | Variation | Users | AOV (€) | Uplift |
| **Cart Rate** | Variation | Users | Add to Cart | Cart Rate (%) |
| **Total Purchases** | Variation | Users | Total Purchases | Purchases per User |

#### **Smart Header Detection**
```typescript
// Automatically detects metric characteristics
const isRevenue = unit === 'currency' || metricName.includes('revenue')
const isConversion = metric.metric_type === 'conversion' || unit === 'percentage'
const isFunnel = metricName.includes('to ') && metricName.includes('rate')

// Generates appropriate headers
if (metricName.includes('purchase')) {
  config.headers.conversions = 'Purchases'
  config.headers.conversion_rate = 'Purchase Rate (%)'
}
```

### 6. **Improved Data Handling**

#### **Cell Content Rendering**
```typescript
const renderCellContent = (
  columnType: string,
  stats: any,
  comparison?: any,
  currency: string = '€',
  decimals: number = 2,
  isDisabled: boolean = false
) => {
  // Handles all cell types with proper formatting
  // Supports disabled state with gray styling
  // Includes tooltips for statistical details
}
```

#### **Statistical Information**
- Detailed tooltips for p-values, confidence intervals
- Test type information (z-test, t-test)
- Significance level indicators
- Margin of error calculations

## Updated Metric Detection

### **Enhanced `metric-detector.ts`**

#### **Specific Pattern Recognition**
```typescript
const conversionPatterns = [
  { pattern: /user_pdp_view/i, name: 'PDP View Rate' },
  { pattern: /user_add_to_cart/i, name: 'Add to Cart Rate' },
  { pattern: /user_begin_checkout/i, name: 'Begin Checkout Rate' },
  { pattern: /user_purchase/i, name: 'Purchase Conversion Rate' }
]

const revenuePatterns = [
  { pattern: /^revenue$/i, name: 'Revenue', aggregationType: 'total' },
  { pattern: /gross_revenue/i, name: 'Gross Revenue' },
  { pattern: /net_revenue/i, name: 'Net Revenue' }
]
```

#### **Funnel Metrics Detection**
```typescript
const funnelMetrics = [
  {
    name: 'Cart to Purchase Rate',
    numerator: 'user_purchases',
    denominator: 'user_add_to_cart'
  },
  {
    name: 'Checkout to Purchase Rate', 
    numerator: 'user_purchases',
    denominator: 'user_begin_checkout'
  }
]
```

#### **Composite Metrics (AOV, RPU)**
```typescript
// Automatically detects when revenue and purchase columns exist
if (revenueCol && purchasesCol) {
  result.suggestedMetrics.push({
    name: 'Average Order Value (AOV)',
    type: 'continuous',
    numerator: revenueCol,
    denominator: purchasesCol,
    valueColumn: revenueCol,
    valueColumn2: purchasesCol
  })
}
```

## Benefits

### **1. Contextual Clarity**
- Headers clearly indicate what values represent
- Currency symbols automatically displayed
- Metric-specific terminology used

### **2. Professional Presentation**
- Clean, organized layout
- Proper statistical information
- Visual hierarchy with colors and spacing

### **3. Data Type Awareness**
- Different handling for aggregated vs raw data
- Appropriate statistical tests shown/hidden
- Clear messaging about limitations

### **4. Scalability**
- Easy to add new metric types
- Consistent configuration system
- Extensible column types

## Usage Examples

### **E-commerce Funnel Analysis**
```
| Variation | Base Users | Purchases | Cart to Purchase Rate (%) | Uplift | Significance |
|-----------|------------|-----------|---------------------------|---------|--------------|
| Control   | 1,200      | 180       | 15.0%                    | -       | -            |
| Treatment | 1,250      | 212       | 17.0%                    | +13.3%  | 95% \| p=0.023 |
```

### **Revenue Analysis**
```
| Variation | Total Revenue (€) | Revenue per User (€) | Uplift |
|-----------|-------------------|---------------------|---------|
| Control   | €50,000          | €50.00              | -       |
| Treatment | €57,750          | €55.00              | +10.0%  |
```

### **AOV Analysis**
```
| Variation | Users | AOV (€) | Uplift |
|-----------|-------|---------|---------|
| Control   | 1,000 | €75.00  | -       |
| Treatment | 1,050 | €80.00  | +6.7%   |
```

This implementation provides a much more professional, contextual, and user-friendly A/B test results interface that adapts to different types of metrics and data structures.
