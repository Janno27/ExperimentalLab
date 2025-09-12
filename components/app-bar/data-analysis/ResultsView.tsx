'use client'

import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { TrendingUp, TrendingDown, Minus, Info, FlaskConical, Sparkles, Wrench, FileUp, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AnalysisFilterOverlay } from './AnalysisFilterOverlay'
import { TransactionUploadModal } from './TransactionUploadModal'
import { ResultsViewSkeleton } from './ResultsViewSkeleton'
import { analysisAPI } from '@/lib/api/analysis-api'
import type { 
  MetricResult, 
  MetricDisplayConfig, 
  FormatConfig 
} from '@/types/analysis'
import { ColumnType } from '@/types/analysis'

interface DimensionColumn {
  type: 'categorical'
  values: string[]
  count: number
  display_name: string
}

interface ResultsViewProps {
  onBackStep?: () => void
  analysisResults?: {
    overall_results?: {
      total_users?: number
    }
    metric_results?: MetricResult[]
    dimension_columns?: Record<string, DimensionColumn>
  }
  selectedTest?: {
    title?: string
    owner?: string
    country?: string
    testType?: string
  }
  originalData?: Record<string, unknown>[]
  metrics?: Array<{
    id: string
    name: string
    type: 'binary' | 'continuous'
    numerator?: string
    denominator?: string
    valueColumn?: string
    valueColumn2?: string
    description?: string
    isCustom: boolean
    unit?: string
    currency?: string
    decimals?: number
    isRevenue?: boolean
    filters?: Record<string, unknown>
  }>
  variationColumn?: string
  userColumn?: string
  dataType?: 'aggregated' | 'raw'
  confidenceLevel?: number
  statisticalMethod?: 'frequentist' | 'bayesian' | 'bootstrap'
  multipleTestingCorrection?: 'none' | 'bonferroni' | 'fdr'
  originalJobId?: string
}

// Les interfaces sont maintenant importées depuis types/analysis.ts

// Fonction pour afficher l'icône du type de test (cohérente avec KanbanCard)
function typeIcon(type?: string) {
  if (!type) return null
  if (type === 'A/B-Test') return <FlaskConical size={15} className="text-blue-500" />
  if (type === 'Personalization') return <Sparkles size={15} className="text-cyan-500" />
  if (type === 'Fix/Patch') return <Wrench size={15} className="text-teal-500" />
  return null
}

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

export interface ResultsViewRef {
  handleBackStep?: () => void
  handleFilterClick?: () => void
  getActiveFiltersCount?: () => number
}

export const ResultsView = forwardRef<ResultsViewRef, ResultsViewProps>(({ 
  onBackStep, 
  analysisResults, 
  selectedTest,
  originalData,
  metrics,
  variationColumn,
  userColumn,
  dataType = 'aggregated',
  confidenceLevel = 95,
  statisticalMethod = 'frequentist',
  multipleTestingCorrection = 'none',
  originalJobId
}, ref) => {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [filteredResults, setFilteredResults] = useState(analysisResults)
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [isFilterOverlayOpen, setIsFilterOverlayOpen] = useState(false)
  
  // Transaction upload states
  const [showTransactionUpload, setShowTransactionUpload] = useState(false)
  const [selectedMetricForUpload, setSelectedMetricForUpload] = useState<string>('')
  const [transactionDataLinked, setTransactionDataLinked] = useState<Record<string, boolean>>({})
  const [enrichedJobId, setEnrichedJobId] = useState<string | null>(null)
  const [transactionData, setTransactionData] = useState<Record<string, unknown>[] | null>(null)

  const handleBackStep = () => {
    if (onBackStep) {
      onBackStep()
    }
  }

  const handleFilterClick = () => {
    setIsFilterOverlayOpen(true)
  }

  const handleTransactionUploadClick = (metricName: string) => {
    setSelectedMetricForUpload(metricName)
    setShowTransactionUpload(true)
  }

  const handleTransactionUploadComplete = async (success: boolean, enrichedJobId?: string, uploadedTransactionData?: Record<string, unknown>[]) => {
    if (success && selectedMetricForUpload) {
      setTransactionDataLinked(prev => ({
        ...prev,
        [selectedMetricForUpload]: true
      }))
      
      // Store the enriched job ID and transaction data for future filtering
      if (enrichedJobId) {
        setEnrichedJobId(enrichedJobId)
        if (uploadedTransactionData) {
          setTransactionData(uploadedTransactionData)
        }
        
        try {
          setIsFilterLoading(true)
          const updatedResults = await analysisAPI.getResults(enrichedJobId)
          setFilteredResults(updatedResults.results)
        } catch {
          // Silently handle error
        } finally {
          setIsFilterLoading(false)
        }
      }
    }
    setShowTransactionUpload(false)
    setSelectedMetricForUpload('')
  }


  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleBackStep,
    handleFilterClick,
    getActiveFiltersCount
  }))

  const handleFiltersChange = useCallback(async (newFilters: Record<string, string[]>) => {
    
    setActiveFilters(newFilters)
    setIsFilterLoading(true)

    try {
      // If no filters are applied, show original results (enriched if available)
      if (Object.keys(newFilters).length === 0) {
        // If we have enriched results, show those, otherwise show original
        if (enrichedJobId) {
          const enrichedResults = await analysisAPI.getResults(enrichedJobId)
          setFilteredResults(enrichedResults.results)
        } else {
          setFilteredResults(analysisResults)
        }
        return
      }

      // Check if current results are enriched with transaction data
      const hasEnrichedData = enrichedJobId && transactionData && transactionData.length > 0
      
      if (hasEnrichedData) {
        
        // Transform metrics config for API
        const metricsConfig = metrics?.map(metric => ({
          name: metric.name,
          column: metric.valueColumn || metric.numerator || '',
          type: metric.type === 'binary' ? 'conversion' : 'count' as 'conversion' | 'revenue' | 'count' | 'ratio',
          numerator_column: metric.numerator,
          denominator_column: metric.denominator,
          unit: metric.unit,
          currency: metric.currency,
          decimals: metric.decimals,
          filters: metric.filters
        })) || []

        // First, run filtered analysis on original data
        const response = await analysisAPI.startAnalysis({
          data: originalData || [],
          metrics_config: metricsConfig,
          variation_column: variationColumn || '',
          user_column: userColumn,
          confidence_level: confidenceLevel,
          statistical_method: statisticalMethod,
          multiple_testing_correction: multipleTestingCorrection,
          data_type: dataType,
          filters: newFilters
        })

        // Wait for filtered analysis to complete
        const filteredResults = await analysisAPI.getResults(response.job_id)

        // Apply the same filters to transaction data
        const filteredTransactionData = applyFiltersToTransactionData(transactionData, newFilters)

        // Check if we have any transaction data left after filtering
        if (filteredTransactionData.length === 0) {
          setFilteredResults(filteredResults.results)
          return
        }

        // Now enrich the filtered results with filtered transaction data using the new endpoint
        // CRITIQUE: Utiliser l'originalJobId (celui qui a été enrichi) pour trouver le cache
        // response.job_id = analyse filtrée, originalJobId = analyse originale enrichie
        const cacheJobId = enrichedJobId || originalJobId // Fallback to original prop if no enriched
        
        const enrichmentResponse = await analysisAPI.enrichWithFilteredTransactionData(
          cacheJobId!, // Job ID de l'enrichissement original (celui qui a le cache)
          filteredTransactionData,
          response.job_id // Job ID de l'analyse filtrée (pour référence)
        )

        // Get the final enriched filtered results
        const finalResults = await analysisAPI.getResults(enrichmentResponse.job_id)
        setFilteredResults(finalResults.results)
        
      } else if (originalData && metrics && variationColumn) {
        
        // Transform metrics config for API
        const metricsConfig = metrics.map(metric => ({
          name: metric.name,
          column: metric.valueColumn || metric.numerator || '',
          type: metric.type === 'binary' ? 'conversion' : 'count' as 'conversion' | 'revenue' | 'count' | 'ratio',
          numerator_column: metric.numerator,
          denominator_column: metric.denominator,
          unit: metric.unit,
          currency: metric.currency,
          decimals: metric.decimals,
          filters: metric.filters
        }))

        // Call API with filters
        const response = await analysisAPI.startAnalysis({
          data: originalData,
          metrics_config: metricsConfig,
          variation_column: variationColumn,
          user_column: userColumn,
          confidence_level: confidenceLevel,
          statistical_method: statisticalMethod,
          multiple_testing_correction: multipleTestingCorrection,
          data_type: dataType,
          filters: newFilters
        })

        // Poll for results
        const results = await analysisAPI.getResults(response.job_id)
        setFilteredResults(results.results)
      } else {
      }
    } catch {
      // Keep showing original results on error
      setFilteredResults(analysisResults)
    } finally {
      setIsFilterLoading(false)
    }
  }, [originalData, metrics, variationColumn, userColumn, dataType, confidenceLevel, statisticalMethod, multipleTestingCorrection, analysisResults, enrichedJobId, transactionData, originalJobId])

  // Helper function to apply filters to transaction data
  const applyFiltersToTransactionData = (transactionData: Record<string, unknown>[], filters: Record<string, string[]>): Record<string, unknown>[] => {
    if (!filters || Object.keys(filters).length === 0) {
      return transactionData
    }


    const filteredData = transactionData.filter(transaction => {
      const matchesAllFilters = Object.entries(filters).every(([dimension, allowedValues]) => {
        const transactionValue = transaction[dimension]
        
        // If the dimension doesn't exist in transaction data, skip this filter
        if (transactionValue === null || transactionValue === undefined) {
          return true // Don't filter out records for missing dimensions
        }
        
        return allowedValues.includes(String(transactionValue))
      })
      
      return matchesAllFilters
    })


    return filteredData
  }

  // Use filtered results if available, otherwise use original
  const currentResults = filteredResults || analysisResults

  // Count active filters
  const getActiveFiltersCount = () => {
    return Object.keys(activeFilters).length
  }


  // Check if metric needs transaction-level data for statistical analysis
  const needsTransactionData = (metric: MetricResult) => {
    // Don't show CTA if metric is already enriched
    if ((metric as unknown as { enriched_with_transaction_data?: boolean }).enriched_with_transaction_data) {
      return false
    }
    
    // Revenue metrics with aggregated data don't have statistical tests
    return (metric.metric_unit === 'currency' && dataType === 'aggregated') ||
           (metric.metric_unit === 'count' && dataType === 'aggregated') ||
           (metric.metric_name.toLowerCase().includes('order') && metric.metric_name.toLowerCase().includes('value') && dataType === 'aggregated') ||
           (metric.metric_name.toLowerCase().includes('per ') && metric.metric_name.toLowerCase().includes('revenue') && dataType === 'aggregated')
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

  const getUpliftIcon = (uplift: number, isSignificant: boolean = true) => {
    if (!isSignificant) return null // No icon for non-significant results
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
      const isEnriched = (metric as unknown as { enriched_with_transaction_data?: boolean }).enriched_with_transaction_data
      
      // Déterminer le type de métrique revenue
      if (metricName.includes('per ') && metricName.includes('revenue')) {
        // RPU - Métrique liée aux Users
        if (isEnriched) {
          return {
            columns: [ColumnType.VARIATION, ColumnType.USERS, ColumnType.TOTAL_REVENUE, ColumnType.REVENUE_PER_USER, ColumnType.UPLIFT, ColumnType.SIGNIFICANCE, ColumnType.CI],
            headerLabels: {
              [ColumnType.VARIATION]: 'Variation',
              [ColumnType.USERS]: 'Users',
              [ColumnType.TOTAL_REVENUE]: 'Total Revenue',
              [ColumnType.REVENUE_PER_USER]: 'RPU',
              [ColumnType.UPLIFT]: 'Uplift',
              [ColumnType.SIGNIFICANCE]: 'Confidence & p-value',
              [ColumnType.CI]: 'Confidence Interval'
            },
            format: {
              unit: 'currency',
              currency: currency,
              decimals: 2
            },
            aggregationType: 'ratio'
          }
        } else {
          return {
            columns: [ColumnType.VARIATION, ColumnType.USERS, ColumnType.TOTAL_REVENUE, ColumnType.REVENUE_PER_USER, ColumnType.UPLIFT],
            disabledColumns: [ColumnType.SIGNIFICANCE, ColumnType.CI],
            headerLabels: {
              [ColumnType.VARIATION]: 'Variation',
              [ColumnType.USERS]: 'Users',
              [ColumnType.TOTAL_REVENUE]: 'Total Revenue',
              [ColumnType.REVENUE_PER_USER]: 'RPU',
              [ColumnType.UPLIFT]: 'Uplift'
            },
            format: {
              unit: 'currency',
              currency: currency,
              decimals: 2
            },
            aggregationType: 'ratio',
            note: "Statistical tests not available for aggregated RPU data"
          }
        }
      } else if (metricName.includes('order') && metricName.includes('value')) {
        // AOV - Métrique liée aux Transactions
        if (isEnriched) {
          return {
            columns: [ColumnType.VARIATION, ColumnType.TRANSACTIONS, ColumnType.TOTAL_REVENUE, ColumnType.VALUE, ColumnType.UPLIFT, ColumnType.SIGNIFICANCE, ColumnType.CI],
            headerLabels: {
              [ColumnType.VARIATION]: 'Variation',
              [ColumnType.TRANSACTIONS]: 'Transactions',
              [ColumnType.TOTAL_REVENUE]: 'Total Revenue',
              [ColumnType.VALUE]: 'AOV',
              [ColumnType.UPLIFT]: 'Uplift',
              [ColumnType.SIGNIFICANCE]: 'Confidence & p-value',
              [ColumnType.CI]: 'Confidence Interval'
            },
            format: {
              unit: 'currency',
              currency: currency,
              decimals: 2
            },
            aggregationType: 'average'
          }
        } else {
          return {
            columns: [ColumnType.VARIATION, ColumnType.TRANSACTIONS, ColumnType.TOTAL_REVENUE, ColumnType.VALUE, ColumnType.UPLIFT],
            disabledColumns: [ColumnType.SIGNIFICANCE, ColumnType.CI],
            headerLabels: {
              [ColumnType.VARIATION]: 'Variation',
              [ColumnType.TRANSACTIONS]: 'Transactions',
              [ColumnType.TOTAL_REVENUE]: 'Total Revenue',
              [ColumnType.VALUE]: 'AOV',
              [ColumnType.UPLIFT]: 'Uplift'
            },
            format: {
              unit: 'currency',
              currency: currency,
              decimals: 2
            },
            aggregationType: 'average',
            note: "Statistical tests not available for aggregated AOV data"
          }
        }
      } else {
        // Revenue seul (Revenue, Gross Revenue, Net Revenue, Gross Margin)
        if (isEnriched) {
          return {
            columns: [ColumnType.VARIATION, ColumnType.TOTAL_REVENUE, ColumnType.UPLIFT, ColumnType.SIGNIFICANCE, ColumnType.CI],
            headerLabels: {
              [ColumnType.VARIATION]: 'Variation',
              [ColumnType.TOTAL_REVENUE]: `Total ${metric.metric_name}`,
              [ColumnType.UPLIFT]: 'Uplift',
              [ColumnType.SIGNIFICANCE]: 'Confidence & p-value',
              [ColumnType.CI]: 'Confidence Interval'
            },
            format: {
              unit: 'currency',
              currency: currency,
              decimals: 2
            },
            aggregationType: 'sum'
          }
        } else {
          return {
            columns: [ColumnType.VARIATION, ColumnType.TOTAL_REVENUE, ColumnType.UPLIFT],
            disabledColumns: [ColumnType.SIGNIFICANCE, ColumnType.CI],
            headerLabels: {
              [ColumnType.VARIATION]: 'Variation',
              [ColumnType.TOTAL_REVENUE]: `Total ${metric.metric_name}`,
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
      const isEnriched = (metric as unknown as { enriched_with_transaction_data?: boolean }).enriched_with_transaction_data
      const showStatistics = dataType !== 'aggregated' || isEnriched
      
      return {
        columns: showStatistics 
          ? [ColumnType.VARIATION, ColumnType.USERS, ColumnType.TOTAL_VALUE, ColumnType.VALUE_PER_USER, ColumnType.UPLIFT, ColumnType.SIGNIFICANCE, ColumnType.CI]
          : [ColumnType.VARIATION, ColumnType.USERS, ColumnType.TOTAL_VALUE, ColumnType.VALUE_PER_USER, ColumnType.UPLIFT],
        disabledColumns: showStatistics ? undefined : [ColumnType.SIGNIFICANCE, ColumnType.CI],
        headerLabels: {
          [ColumnType.VARIATION]: 'Variation',
          [ColumnType.USERS]: 'Users',
          [ColumnType.TOTAL_VALUE]: metricName.includes('purchase') ? 'Total Purchases' :
                                   metricName.includes('quantity') ? 'Total Quantity' :
                                   metricName.includes('order') ? 'Total Orders' : 'Total Count',
          [ColumnType.VALUE_PER_USER]: metricName.includes('purchase') ? 'Purchases per User' :
                                      metricName.includes('quantity') ? 'Quantity per User' :
                                      metricName.includes('order') ? 'Orders per User' : 'Count per User',
          [ColumnType.UPLIFT]: 'Uplift',
          [ColumnType.SIGNIFICANCE]: 'Confidence & p-value',
          [ColumnType.CI]: 'Confidence Interval'
        },
        format: {
          unit: 'count',
          decimals: 0
        },
        note: showStatistics ? undefined : "Statistical tests not available for aggregated count data"
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
      case ColumnType.TRANSACTIONS:
        // Pour les transactions, on utilise total_quantity ou sample_size selon le contexte
        return formatNumber((stats as unknown as { transaction_count?: number }).transaction_count || stats.sample_size, 0)
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
            {getUpliftIcon(comparison.relative_uplift, comparison.is_significant)}
            <span className={cn(
              "text-sm font-medium",
              !comparison.is_significant ? "text-gray-400" :
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
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-gray-900">{metric.metric_name}</h3>
            
            {/* Transaction data linked indicator */}
            {(transactionDataLinked[metric.metric_name] || (metric as unknown as { enriched_with_transaction_data?: boolean }).enriched_with_transaction_data) && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      <CheckCircle size={12} />
                      <span>Transaction data</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">This metric has been enriched with transaction-level data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* Upload transaction data CTA */}
            {needsTransactionData(metric) && !transactionDataLinked[metric.metric_name] && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleTransactionUploadClick(metric.metric_name)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors border border-blue-200 hover:border-blue-300"
                    >
                      <FileUp size={12} />
                      <span>Upload Transaction Data</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Upload transaction-level data to get complete statistical tests</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
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

  if (!currentResults) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No analysis results available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full relative">
      {/* Contenu principal - full width */}
      <div className="flex-1 flex flex-col">

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto py-6 px-4">
            <div className="space-y-6 relative">
              {/* Active filters display at top of content */}
              {Object.keys(activeFilters).length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-blue-900">Active Filters:</span>
                      <div className="flex items-center gap-2">
                        {Object.entries(activeFilters).map(([dimension, values]) => (
                          <div key={dimension} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            <span className="font-medium">
                              {analysisResults?.dimension_columns?.[dimension]?.display_name || dimension}:
                            </span>
                            <span>{values.length === 1 ? values[0] : `${values.length} selected`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleFiltersChange({})}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                      title="Clear all filters"
                    >
                      Clear all filters
                    </button>
                  </div>
                </div>
              )}
              {/* Loading overlay with skeleton */}
              {isFilterLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-90 z-10 rounded-lg">
                  <ResultsViewSkeleton />
                </div>
              )}
              {/* Header with Test Information */}
              {selectedTest && (
                <div className="text-center pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedTest.title}</h3>
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    {selectedTest.owner && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Owner:</span>
                        <span className="bg-violet-100 text-violet-700 rounded px-2 py-1 text-sm">
                          {selectedTest.owner}
                        </span>
                      </div>
                    )}
                    {selectedTest.country && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Market:</span>
                        <span className="bg-blue-100 text-blue-700 rounded px-2 py-1 text-sm">
                          {selectedTest.country}
                        </span>
                      </div>
                    )}
                    {selectedTest.testType && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Type:</span>
                        <div className="flex items-center gap-1 bg-gray-100 text-gray-700 rounded px-2 py-1">
                          {typeIcon(selectedTest.testType)}
                          <span className="text-sm">{selectedTest.testType}</span>
                        </div>
                      </div>
                    )}
                    {currentResults.overall_results?.total_users && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Users:</span>
                        <span className="bg-green-100 text-green-700 rounded px-2 py-1 text-sm font-medium">
                          {currentResults.overall_results.total_users.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metrics Results */}
              <div className="space-y-6">
                {currentResults.metric_results?.map((metric: MetricResult) => renderMetricTable(metric, 'aggregated'))}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Analysis Filter Overlay */}
      {analysisResults?.dimension_columns && (
        <AnalysisFilterOverlay
          isOpen={isFilterOverlayOpen}
          onClose={() => setIsFilterOverlayOpen(false)}
          dimensionColumns={analysisResults.dimension_columns}
          activeFilters={activeFilters}
          onFiltersChange={handleFiltersChange}
          isLoading={isFilterLoading}
        />
      )}

      {/* Transaction Upload Modal */}
      <TransactionUploadModal
        isOpen={showTransactionUpload}
        onClose={() => setShowTransactionUpload(false)}
        metricName={selectedMetricForUpload}
        originalJobId={originalJobId}
        onUploadComplete={handleTransactionUploadComplete}
      />
    </div>
  )
})

ResultsView.displayName = 'ResultsView' 