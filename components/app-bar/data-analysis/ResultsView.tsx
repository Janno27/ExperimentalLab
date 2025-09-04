'use client'

import React from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { 
  MetricResult, 
  MetricDisplayConfig, 
  FormatConfig 
} from '@/types/analysis'
import { ColumnType } from '@/types/analysis'

interface ResultsViewProps {
  onBackStep?: () => void
  analysisResults?: {
    overall_results?: {
      total_users?: number
    }
    metric_results?: MetricResult[]
  }
  selectedTest?: {
    title?: string
    owner?: string
    country?: string
    testType?: string
  }
}

// Les interfaces sont maintenant importées depuis types/analysis.ts

// Composant Tooltip pour les informations statistiques
function StatisticTooltip({ 
  title, 
  children, 
  content 
}: { 
  title: string
  children: React.ReactNode
  content: React.ReactNode 
}) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 cursor-help">
            {children}
            <Info size={12} className="text-gray-400 hover:text-gray-600 transition-colors" />
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="center" 
          className="p-0 border-0 shadow-lg bg-transparent [&>svg]:fill-white [&>svg]:stroke-white"
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm relative">
            <h4 className="text-xs font-semibold text-gray-900 mb-2">{title}</h4>
            <div className="space-y-1.5 text-xs">
              {content}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function ResultsView({ onBackStep, analysisResults, selectedTest }: ResultsViewProps) {
  const handleBackStep = () => {
    if (onBackStep) {
      onBackStep()
    }
  }

  const formatNumber = (value: number | null | undefined, decimals: number = 2): string => {
    if (value === null || value === undefined) return '-'
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })
  }

  const formatPercentage = (value: number | null | undefined, decimals: number = 2): string => {
    if (value === null || value === undefined) return '-'
    return `${value.toFixed(decimals)}%`
  }

  // Advanced formatting function based on metric unit and currency
  const formatValue = (
    value: number | null | undefined, 
    unit?: string, 
    currency?: string, 
    decimals: number = 2
  ): string => {
    if (value === null || value === undefined) return '-'
    
    const formatted = value.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })
    
    // Format based on unit type
    if (unit === 'currency' && currency) {
      return `${currency}${formatted}`
    } else if (unit === 'percentage') {
      return `${formatted}%`
    } else if (unit === 'count') {
      return decimals === 0 ? Math.round(value).toLocaleString() : formatted
    }
    
    return formatted
  }

  const getUpliftIcon = (uplift: number) => {
    if (uplift > 0) return <TrendingUp size={12} className="text-green-600" />
    if (uplift < 0) return <TrendingDown size={12} className="text-red-600" />
    return <Minus size={12} className="text-gray-600" />
  }

  const getSignificanceColor = (isSignificant: boolean, pValue: number) => {
    if (isSignificant) return 'text-green-600 bg-green-50'
    if (pValue < 0.1) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  // Improved function to get display configuration based on metric type
  const getMetricDisplayConfig = (
    metric: MetricResult, 
    dataType: 'aggregated' | 'raw'
  ): MetricDisplayConfig => {
    const currency = (metric.metric_currency || '€') as '€' | '$' | '£'
    const metricName = metric.metric_name.toLowerCase()
    
    // Pour revenue avec données agrégées
    if (metric.metric_unit === 'currency' && dataType === 'aggregated') {
      return {
        columns: [ColumnType.VARIATION, ColumnType.USERS, ColumnType.TOTAL_REVENUE, ColumnType.REVENUE_PER_USER, ColumnType.UPLIFT],
        disabledColumns: [ColumnType.SIGNIFICANCE, ColumnType.CI],
        headerLabels: {
          [ColumnType.VARIATION]: 'Variation',
          [ColumnType.USERS]: 'Users', 
          [ColumnType.TOTAL_REVENUE]: 'Total Revenue',
          [ColumnType.REVENUE_PER_USER]: 'Revenue/User',
          [ColumnType.UPLIFT]: 'Uplift'
        },
        format: {
          unit: 'currency',
          currency: currency,
          decimals: 2
        },
        aggregationType: 'sum',
        note: "Statistical tests not available for aggregated revenue data"
      }
    }
    
    // Pour conversion metrics
    if (metric.metric_type === 'conversion') {
      const isFunnel = metricName.includes('to ') && metricName.includes('rate')
      
      if (isFunnel) {
        return {
          columns: [ColumnType.VARIATION, ColumnType.BASE_USERS, ColumnType.CONVERSIONS, ColumnType.CONVERSION_RATE, ColumnType.UPLIFT, ColumnType.SIGNIFICANCE, ColumnType.CI],
          headerLabels: {
            [ColumnType.VARIATION]: 'Variation',
            [ColumnType.BASE_USERS]: 'Base Users',
            [ColumnType.CONVERSIONS]: metricName.includes('cart') ? 'Purchases' : 
                                     metricName.includes('checkout') ? 'Purchases' : 
                                     metricName.includes('pdp') ? 'Add to Cart' : 'Conversions',
            [ColumnType.CONVERSION_RATE]: metricName.includes('cart') ? 'Cart to Purchase Rate (%)' :
                                         metricName.includes('checkout') ? 'Checkout to Purchase Rate (%)' :
                                         metricName.includes('pdp') ? 'PDP to Cart Rate (%)' : 'Conversion Rate (%)',
            [ColumnType.UPLIFT]: 'Uplift',
            [ColumnType.SIGNIFICANCE]: 'Confidence & p-value',
            [ColumnType.CI]: 'Confidence Interval'
          },
          format: {
            unit: 'percentage',
            decimals: 2,
            suffix: '%'
          }
        }
      } else {
        return {
          columns: [ColumnType.VARIATION, ColumnType.USERS, ColumnType.CONVERSIONS, ColumnType.CONVERSION_RATE, ColumnType.UPLIFT, ColumnType.SIGNIFICANCE, ColumnType.CI],
          headerLabels: {
            [ColumnType.VARIATION]: 'Variation',
            [ColumnType.USERS]: 'Users',
            [ColumnType.CONVERSIONS]: metricName.includes('purchase') ? 'Purchases' :
                                     metricName.includes('cart') ? 'Add to Cart' :
                                     metricName.includes('checkout') ? 'Checkouts' :
                                     metricName.includes('pdp') || metricName.includes('view') ? 'Views' : 'Conversions',
            [ColumnType.CONVERSION_RATE]: metricName.includes('purchase') ? 'Purchase Rate (%)' :
                                         metricName.includes('cart') ? 'Cart Rate (%)' :
                                         metricName.includes('checkout') ? 'Checkout Rate (%)' :
                                         metricName.includes('pdp') || metricName.includes('view') ? 'View Rate (%)' : 'Conversion Rate (%)',
            [ColumnType.UPLIFT]: 'Uplift',
            [ColumnType.SIGNIFICANCE]: 'Confidence & p-value',
            [ColumnType.CI]: 'Confidence Interval'
          },
          format: {
            unit: 'percentage',
            decimals: 2,
            suffix: '%'
          }
        }
      }
    }
    
    // Pour count metrics
    if (metric.metric_unit === 'count') {
      return {
        columns: [ColumnType.VARIATION, ColumnType.USERS, ColumnType.TOTAL_VALUE, ColumnType.VALUE_PER_USER, ColumnType.UPLIFT],
        disabledColumns: dataType === 'aggregated' ? [ColumnType.SIGNIFICANCE, ColumnType.CI] : undefined,
        headerLabels: {
          [ColumnType.VARIATION]: 'Variation',
          [ColumnType.USERS]: 'Users',
          [ColumnType.TOTAL_VALUE]: metricName.includes('purchase') ? 'Total Purchases' :
                                   metricName.includes('quantity') ? 'Total Quantity' :
                                   metricName.includes('order') ? 'Total Orders' : 'Total Count',
          [ColumnType.VALUE_PER_USER]: metricName.includes('purchase') ? 'Purchases per User' :
                                      metricName.includes('quantity') ? 'Quantity per User' :
                                      metricName.includes('order') ? 'Orders per User' : 'Count per User',
          [ColumnType.UPLIFT]: 'Uplift'
        },
        format: {
          unit: 'count',
          decimals: 0
        },
        note: dataType === 'aggregated' ? "Statistical tests not available for aggregated count data" : undefined
      }
    }
    
    // Pour AOV/RPU metrics
    if (metricName.includes('order') && metricName.includes('value')) {
      return {
        columns: [ColumnType.VARIATION, ColumnType.USERS, ColumnType.VALUE, ColumnType.UPLIFT],
        disabledColumns: dataType === 'aggregated' ? [ColumnType.SIGNIFICANCE, ColumnType.CI] : undefined,
        headerLabels: {
          [ColumnType.VARIATION]: 'Variation',
          [ColumnType.USERS]: 'Users',
          [ColumnType.VALUE]: `AOV (${currency})`,
          [ColumnType.UPLIFT]: 'Uplift'
        },
        format: {
          unit: 'currency',
          currency: currency,
          decimals: 2
        },
        aggregationType: 'average',
        note: dataType === 'aggregated' ? "Statistical tests not available for aggregated AOV data" : undefined
      }
    }
    
    if (metricName.includes('per ') && metricName.includes('revenue')) {
      return {
        columns: [ColumnType.VARIATION, ColumnType.USERS, ColumnType.VALUE, ColumnType.UPLIFT],
        disabledColumns: dataType === 'aggregated' ? [ColumnType.SIGNIFICANCE, ColumnType.CI] : undefined,
        headerLabels: {
          [ColumnType.VARIATION]: 'Variation',
          [ColumnType.USERS]: 'Users',
          [ColumnType.VALUE]: `Revenue per User (${currency})`,
          [ColumnType.UPLIFT]: 'Uplift'
        },
        format: {
          unit: 'currency',
          currency: currency,
          decimals: 2
        },
        aggregationType: 'ratio',
        note: dataType === 'aggregated' ? "Statistical tests not available for aggregated RPU data" : undefined
      }
    }
    
    // Default configuration
    return {
      columns: [ColumnType.VARIATION, ColumnType.USERS, ColumnType.VALUE, ColumnType.UPLIFT, ColumnType.SIGNIFICANCE, ColumnType.CI],
      disabledColumns: dataType === 'aggregated' ? [ColumnType.SIGNIFICANCE, ColumnType.CI] : undefined,
      headerLabels: {
        [ColumnType.VARIATION]: 'Variation',
        [ColumnType.USERS]: 'Users',
        [ColumnType.VALUE]: 'Value',
        [ColumnType.UPLIFT]: 'Uplift',
        [ColumnType.SIGNIFICANCE]: 'Confidence & p-value',
        [ColumnType.CI]: 'Confidence Interval'
      },
      format: {
        unit: 'none',
        decimals: 2
      },
      note: dataType === 'aggregated' ? "Statistical tests not available for aggregated data" : undefined
    }
  }

  // Helper function to render cell content based on column type
  const renderCellContent = (
    columnType: ColumnType,
    stats: {
      variation: string
      sample_size: number
      mean: number
      conversions?: number
      conversion_rate?: number
      total_revenue?: number
      revenue_per_user?: number
    },
    comparison?: {
      relative_uplift: number
      is_significant: boolean
      p_value: number
      confidence_interval: {
        lower_bound: number
        upper_bound: number
        confidence_level: number
      }
      statistical_test: {
        test_type: string
        statistic: number
        p_value: number
      }
    },
    formatConfig: FormatConfig = { unit: 'none', decimals: 2 },
    isDisabled: boolean = false
  ) => {
    if (isDisabled) {
      return <span className="text-gray-400 opacity-50">-</span>
    }

    switch (columnType) {
      case ColumnType.VARIATION:
        return stats.variation
      case ColumnType.USERS:
      case ColumnType.BASE_USERS:
        return formatNumber(stats.sample_size, 0)
      case ColumnType.CONVERSIONS:
        return formatValue(stats.conversions, 'count', undefined, 0)
      case ColumnType.CONVERSION_RATE:
        return formatPercentage(stats.conversion_rate, formatConfig.decimals)
      case ColumnType.TOTAL_VALUE:
      case ColumnType.TOTAL_REVENUE:
        return formatValue(
          stats.total_revenue || (stats.mean * stats.sample_size), 
          formatConfig.unit, 
          formatConfig.currency, 
          formatConfig.unit === 'currency' ? 0 : formatConfig.decimals
        )
      case ColumnType.VALUE_PER_USER:
      case ColumnType.REVENUE_PER_USER:
        return formatValue(
          stats.revenue_per_user || stats.mean, 
          formatConfig.unit, 
          formatConfig.currency, 
          formatConfig.decimals
        )
      case ColumnType.VALUE:
        return formatValue(stats.mean, formatConfig.unit, formatConfig.currency, formatConfig.decimals)
      case ColumnType.UPLIFT:
        return comparison ? (
          <div className="flex items-center gap-1">
            {getUpliftIcon(comparison.relative_uplift)}
            <span className={cn(
              "text-sm font-medium",
              comparison.relative_uplift > 0 ? "text-green-600" : 
              comparison.relative_uplift < 0 ? "text-red-600" : "text-gray-600"
            )}>
              {formatPercentage(comparison.relative_uplift)}
            </span>
          </div>
        ) : '-'
      case ColumnType.SIGNIFICANCE:
        return comparison ? (
          <StatisticTooltip 
            title="Statistical Test Details"
            content={
              <>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 w-20 flex-shrink-0">Test Type:</span>
                  <span className="text-gray-900 font-medium">{comparison.statistical_test.test_type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 w-20 flex-shrink-0">P-Value:</span>
                  <span className="text-gray-900 font-medium">{comparison.statistical_test.p_value.toFixed(6)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 w-20 flex-shrink-0">Statistic:</span>
                  <span className="text-gray-900 font-medium">{comparison.statistical_test.statistic.toFixed(4)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 w-20 flex-shrink-0">Significance:</span>
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    comparison.is_significant ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  )}>
                    {comparison.is_significant ? 'Significant' : 'Not Significant'}
                  </span>
                </div>
              </>
            }
          >
            <div className={cn(
              "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
              getSignificanceColor(comparison.is_significant, comparison.p_value)
            )}>
              {comparison.confidence_interval.confidence_level}% | p={comparison.p_value.toFixed(3)}
            </div>
          </StatisticTooltip>
        ) : '-'
      case ColumnType.CI:
        return comparison ? (
          <StatisticTooltip 
            title="Confidence Interval Details"
            content={
              <>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 w-24 flex-shrink-0">Lower Bound:</span>
                  <span className="text-gray-900 font-medium">{formatNumber(comparison.confidence_interval.lower_bound, 4)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 w-24 flex-shrink-0">Upper Bound:</span>
                  <span className="text-gray-900 font-medium">{formatNumber(comparison.confidence_interval.upper_bound, 4)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 w-24 flex-shrink-0">Confidence Level:</span>
                  <span className="text-gray-900 font-medium">{comparison.confidence_interval.confidence_level}%</span>
                </div>
              </>
            }
          >
            <span className="cursor-help">
              [{formatNumber(comparison.confidence_interval.lower_bound)}, {formatNumber(comparison.confidence_interval.upper_bound)}]
            </span>
          </StatisticTooltip>
        ) : '-'
      default:
        return '-'
    }
  }

  const renderMetricTable = (metric: MetricResult, dataType: 'aggregated' | 'raw' = 'aggregated') => {
    // Find control variation (usually the first one or one marked as control)
    const controlStats = metric.variation_stats.find(stat => 
      stat.variation.toLowerCase().includes('control') || 
      stat.variation.toLowerCase().includes('original') ||
      stat.variation.toLowerCase().includes('[0]')
    ) || metric.variation_stats[0]

    const treatmentStats = metric.variation_stats.filter(stat => stat !== controlStats)
    
    // Get display configuration
    const displayConfig = getMetricDisplayConfig(metric, dataType)

    // Determine if statistical tests are available
    const hasStatisticalTests = !displayConfig.note
    
    return (
      <div key={metric.metric_name} className="space-y-2">
        {/* Metric name and significance badge - COMPLETELY OUTSIDE table */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">{metric.metric_name}</h3>
          <div className="flex items-center gap-2">
            {hasStatisticalTests && (
              <div className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                metric.is_significant ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              )}>
                {metric.is_significant ? 'Significant' : 'Not Significant'}
              </div>
            )}
            {displayConfig.note && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-amber-600 cursor-help">
                      <Info size={12} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{displayConfig.note}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Clean table structure without header section */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {displayConfig.columns.map((columnType) => (
                    <th 
                      key={columnType}
                      className={cn(
                        "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider",
                        displayConfig.disabledColumns?.includes(columnType) 
                          ? "text-gray-400 opacity-50" 
                          : "text-gray-500"
                      )}
                    >
                      {displayConfig.headerLabels[columnType] || columnType}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Control Row */}
                <tr className="bg-purple-50">
                  {displayConfig.columns.map((columnType) => (
                    <td key={`control-${columnType}`} className="px-6 py-4 whitespace-nowrap text-sm">
                      {columnType === 'variation' ? (
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{controlStats.variation}</div>
                          <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">Control</span>
                        </div>
                      ) : (
                        <div className={cn(
                          displayConfig.disabledColumns?.includes(columnType) && "opacity-50"
                        )}>
                          {renderCellContent(
                            columnType,
                            controlStats,
                            undefined,
                            displayConfig.format,
                            displayConfig.disabledColumns?.includes(columnType) || false
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
                
                {/* Treatment Rows */}
                {treatmentStats.map((treatmentStat) => {
                  const comparison = metric.pairwise_comparisons.find(comp => 
                    comp.variation_name === treatmentStat.variation
                  )
                  
                  return (
                    <tr 
                      key={treatmentStat.variation}
                      className={cn(
                        "transition-colors hover:bg-gray-50",
                        // Only highlight significant results if statistical tests are available
                        hasStatisticalTests && comparison?.is_significant && "bg-green-50"
                      )}
                    >
                      {displayConfig.columns.map((columnType) => (
                        <td key={`${treatmentStat.variation}-${columnType}`} className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className={cn(
                            displayConfig.disabledColumns?.includes(columnType) && "opacity-50"
                          )}>
                            {renderCellContent(
                              columnType,
                              treatmentStat,
                              comparison,
                              displayConfig.format,
                              displayConfig.disabledColumns?.includes(columnType) || false
                            )}
                          </div>
                        </td>
                      ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    )
  }

  if (!analysisResults) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No analysis results available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full">
      {/* Contenu principal - full width sans sidebar */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto py-6 px-4">
            <div className="space-y-6">
              {/* Header with Test Information */}
              {selectedTest && (
                <div className="text-center border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedTest.title}</h3>
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                    {selectedTest.owner && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Owner:</span>
                        <span>{selectedTest.owner}</span>
                      </div>
                    )}
                    {selectedTest.country && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Market:</span>
                        <span>{selectedTest.country}</span>
                      </div>
                    )}
                    {selectedTest.testType && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Type:</span>
                        <span>{selectedTest.testType}</span>
                      </div>
                    )}
                    {analysisResults.overall_results?.total_users && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Users:</span>
                        <span>{analysisResults.overall_results.total_users.toLocaleString()}</span>
              </div>
                    )}
              </div>
                </div>
              )}

              {/* Metrics Results */}
              <div className="space-y-6">
                {analysisResults.metric_results?.map((metric: MetricResult) => renderMetricTable(metric, 'aggregated'))}
              </div>

              {/* Navigation Button */}
              <div className="flex justify-start pt-4">
                <button 
                  onClick={handleBackStep}
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Back to analysis configuration</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 