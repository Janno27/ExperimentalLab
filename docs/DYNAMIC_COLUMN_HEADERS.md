# Dynamic Column Headers in Results View

## Overview

The `ResultsView.tsx` component now features dynamic column headers that automatically adapt based on the metric type, unit, and characteristics. This provides more contextual and descriptive column names for different types of A/B test metrics.

## Implementation

### Core Function: `getColumnHeaders`

```typescript
const getColumnHeaders = (metric: MetricResult) => {
  const currency = metric.metric_currency || '€'
  const unit = metric.metric_unit || (metric.metric_type === 'conversion' ? 'percentage' : 'none')
  const metricName = metric.metric_name.toLowerCase()
  
  // Logic to determine appropriate headers...
  
  return {
    absolute: absoluteHeader,
    rate: rateHeader
  }
}
```

### Dynamic Header Examples

| Metric Type | Metric Name | Headers Generated |
|-------------|-------------|-------------------|
| **Revenue Metrics** | | |
| Revenue per User | `currency` unit | `Total Revenue (€)` \| `Revenue per User (€)` |
| Total Revenue | `currency` unit | `Revenue (€)` \| `Average (€)` |
| Average Order Value | `currency` unit | `Total Revenue (€)` \| `AOV (€)` |
| **Conversion Metrics** | | |
| Purchase Conversion Rate | `conversion` type | `Purchases` \| `Purchase Rate (%)` |
| Click Through Rate | `conversion` type | `Clicks` \| `Click Rate (%)` |
| Cart Conversion Rate | `conversion` type | `Add to Cart` \| `Cart Rate (%)` |
| **Count Metrics** | | |
| Items per Cart | `count` unit | `Total Items` \| `Items per User` |
| Session Count | `count` unit | `Total Sessions` \| `Sessions per User` |
| **Duration Metrics** | | |
| Session Duration | `duration` unit | `Total Duration` \| `Average Duration` |

## Logic Flow

### 1. Metric Analysis
The function analyzes:
- `metric_unit`: currency, percentage, count, duration, none
- `metric_type`: conversion, revenue, count, ratio
- `metric_name`: Contains keywords like "per user", "average", "revenue", etc.
- `metric_currency`: €, $, £, etc.

### 2. Header Generation Rules

#### Revenue-Based Metrics (`unit === 'currency'`)
```typescript
if (metricName.includes('order') && metricName.includes('value')) {
  // AOV case
  absoluteHeader = `Total Revenue (${currency})`
  rateHeader = `AOV (${currency})`
} else if (isPerUserMetric) {
  // Per-user revenue
  absoluteHeader = `Total Revenue (${currency})`
  rateHeader = `Revenue per User (${currency})`
} else {
  // General revenue
  absoluteHeader = `Revenue (${currency})`
  rateHeader = `Average (${currency})`
}
```

#### Conversion/Rate Metrics (`isRateMetric`)
```typescript
if (metricName.includes('purchase')) {
  absoluteHeader = 'Purchases'
  rateHeader = 'Purchase Rate (%)'
} else if (metricName.includes('click')) {
  absoluteHeader = 'Clicks'
  rateHeader = 'Click Rate (%)'
} else {
  absoluteHeader = 'Conversions'
  rateHeader = 'Conversion Rate (%)'
}
```

#### Count-Based Metrics (`unit === 'count'`)
```typescript
if (metricName.includes('items') || metricName.includes('quantity')) {
  absoluteHeader = 'Total Items'
  rateHeader = 'Items per User'
} else if (metricName.includes('session')) {
  absoluteHeader = 'Total Sessions'
  rateHeader = 'Sessions per User'
} else {
  absoluteHeader = 'Total Count'
  rateHeader = isPerUserMetric ? 'Count per User' : 'Average Count'
}
```

### 3. Detection Helpers

#### Per-User Metric Detection
```typescript
const isPerUserMetric = metricName.includes('per user') || 
                       metricName.includes('per visitor') || 
                       metricName.includes('per customer') ||
                       metricName.includes('average')
```

#### Rate Metric Detection
```typescript
const isRateMetric = metric.metric_type === 'conversion' || 
                    metricName.includes('rate') || 
                    metricName.includes('conversion') ||
                    metricName.includes('ctr') ||
                    unit === 'percentage'
```

## Usage in Table

The headers are applied dynamically in the table structure:

```tsx
<thead className="bg-gray-50">
  <tr>
    <th>Variation</th>
    <th>Users</th>
    <th>{headers.absolute}</th>  {/* Dynamic header */}
    <th>{headers.rate}</th>      {/* Dynamic header */}
    <th>Uplift</th>
    <th>Confidence & p-value</th>
    <th>Confidence Interval</th>
  </tr>
</thead>
```

## Benefits

### 1. **Contextual Clarity**
- Headers clearly indicate what the values represent
- Currency symbols are displayed where appropriate
- Metric-specific terminology is used

### 2. **User Experience**
- Reduces cognitive load for users
- Makes results more intuitive to interpret
- Provides immediate context about metric nature

### 3. **Scalability**
- Easily extensible for new metric types
- Consistent logic across all metrics
- Maintains backward compatibility

## Examples in Action

### Revenue Analysis
```
| Variation | Users | Total Revenue (€) | Revenue per User (€) | Uplift |
|-----------|-------|-------------------|---------------------|---------|
| Control   | 1000  | €50,000          | €50.00              | -       |
| Treatment | 1050  | €57,750          | €55.00              | +10.0%  |
```

### Conversion Analysis
```
| Variation | Users | Purchases | Purchase Rate (%) | Uplift |
|-----------|-------|-----------|------------------|---------|
| Control   | 1000  | 150       | 15.0%           | -       |
| Treatment | 1050  | 178       | 17.0%           | +13.3%  |
```

### AOV Analysis
```
| Variation | Users | Total Revenue (€) | AOV (€) | Uplift |
|-----------|-------|-------------------|---------|---------|
| Control   | 1000  | €75,000          | €75.00  | -       |
| Treatment | 1050  | €84,000          | €80.00  | +6.7%   |
```

## Future Enhancements

### Potential Additions
- Support for more currencies
- Localized header text
- Custom header templates per organization
- Dynamic units based on value magnitude (K, M, B)

### Configuration Options
```typescript
interface HeaderConfig {
  showCurrency: boolean
  showUnits: boolean
  customLabels?: Record<string, string>
  locale?: string
}
```

This dynamic header system makes A/B test results more intuitive and professional, providing users with immediate context about what each column represents.
