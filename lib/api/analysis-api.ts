const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface AnalysisConfig {
  data: Record<string, unknown>[]
  metrics_config: MetricConfig[]
  variation_column: string
  user_column?: string
  data_type?: 'aggregated' | 'raw'
  confidence_level: number
  statistical_method: 'frequentist' | 'bayesian' | 'bootstrap'
  multiple_testing_correction: 'none' | 'bonferroni' | 'fdr'
  filters?: Record<string, string[]>
}

export interface MetricConfig {
  name: string
  column: string
  type: 'conversion' | 'revenue' | 'count' | 'ratio'
  description?: string
  numerator_column?: string
  denominator_column?: string
  filters?: Record<string, unknown>
  unit?: string
  currency?: string
  decimals?: number
}

export interface JobStatus {
  job_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  created_at: string
  started_at?: string
  completed_at?: string
  failed_at?: string
  error?: string
}

export interface VariationStats {
  variation: string
  sample_size: number
  mean: number
  std: number
  median?: number
  min_value?: number
  max_value?: number
  conversions?: number
  conversion_rate?: number
  total_revenue?: number
  revenue_per_user?: number
}

export interface StatisticalTest {
  test_type: string
  statistic: number
  p_value: number
  degrees_of_freedom?: number
  effect_size?: number
}

export interface ConfidenceInterval {
  lower_bound: number
  upper_bound: number
  confidence_level: number
}

export interface PairwiseComparison {
  variation_name: string
  control_stats: VariationStats
  variation_stats: VariationStats
  absolute_uplift: number
  relative_uplift: number
  statistical_test: StatisticalTest
  confidence_interval: ConfidenceInterval
  is_significant: boolean
  p_value: number
  effect_size?: number
}

export interface MetricResult {
  metric_name: string
  metric_type: 'conversion' | 'revenue' | 'count' | 'ratio'
  metric_unit?: string
  metric_currency?: string
  metric_decimals?: number
  variation_stats: VariationStats[]
  control_stats: VariationStats
  pairwise_comparisons: PairwiseComparison[]
  is_significant: boolean
  significance_level: number
  minimum_detectable_effect?: number
  statistical_power?: number
}

export interface VariationBreakdown {
  variation_name: string
  user_count: number
  percentage: number
  is_control: boolean
}

export interface OverallResults {
  total_users: number
  variation_breakdown: VariationBreakdown[]
  data_quality_score: number
  missing_data_percentage: number
  correction_applied: 'none' | 'bonferroni' | 'fdr'
  adjusted_alpha?: number
  significant_metrics: number
  total_metrics: number
  total_variations: number
}

export interface AnalysisResults {
  overall_results: OverallResults
  metric_results: MetricResult[]
  analysis_duration_seconds?: number
  warnings: string[]
  recommendations: string[]
}

export interface GetResultsResponse {
  job_id: string
  status: string
  results: AnalysisResults
  completed_at: string
}

export class AnalysisAPI {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`API request failed: ${error.message}`)
      }
      throw new Error('API request failed: Unknown error')
    }
  }

  async startAnalysis(config: AnalysisConfig): Promise<{ job_id: string }> {
    return this.makeRequest<{ job_id: string }>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(config),
    })
  }

  async checkStatus(jobId: string): Promise<JobStatus> {
    return this.makeRequest<JobStatus>(`/api/status/${jobId}`)
  }

  async getResults(jobId: string): Promise<GetResultsResponse> {
    return this.makeRequest(`/api/results/${jobId}`)
  }

  async analyzeWithFilters(
    jobId: string, 
    filters: Record<string, unknown>
  ): Promise<{ job_id: string; parent_job_id: string }> {
    return this.makeRequest<{ job_id: string; parent_job_id: string }>(
      '/api/analyze/filter',
      {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId, filters }),
      }
    )
  }

  // Utility method to transform frontend config to API format
  transformConfig(
    data: Record<string, unknown>[],
    metrics: Array<{
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
    }>,
    variationColumn: string,
    userColumn?: string,
    confidenceLevel: number = 95,
    statisticalMethod: 'frequentist' | 'bayesian' | 'bootstrap' = 'frequentist',
    multipleTestingCorrection: 'none' | 'bonferroni' | 'fdr' = 'none',
    dataType: 'aggregated' | 'raw' = 'aggregated'
  ): AnalysisConfig {
    // Auto-detect user column if not provided
    let detectedUserColumn = userColumn
    if (!detectedUserColumn && data.length > 0) {
      const sampleRow = data[0]
      const possibleUserColumns = ['user_id', 'userid', 'user', 'visitor_id', 'visitorid', 'visitor', 'id', 'session_id']
      
      for (const col of possibleUserColumns) {
        if (col in sampleRow) {
          detectedUserColumn = col
          break
        }
      }
    }

    // Transform metrics to API format
    const transformedMetrics: MetricConfig[] = metrics.map(metric => {
      const sampleRow = data[0] || {}
      const availableColumns = Object.keys(sampleRow)

      // Determine the source column based on metric type, as per user instruction
      let sourceColumnName: string | undefined
      if (metric.type === 'binary') {
        sourceColumnName = metric.numerator
      } else if (metric.type === 'continuous') {
        sourceColumnName = metric.valueColumn
      } else {
        // Fallback for other types or misconfigurations
        sourceColumnName = metric.valueColumn || metric.name
      }

      // Find the actual column names in data (case-insensitive)
      const actualColumn = availableColumns.find(col => 
        sourceColumnName && col.toLowerCase() === sourceColumnName.toLowerCase()
      )
      const numeratorActualColumn = availableColumns.find(col =>
        metric.numerator && col.toLowerCase() === metric.numerator.toLowerCase()
      )
      const denominatorActualColumn = availableColumns.find(col =>
        metric.denominator && col.toLowerCase() === metric.denominator.toLowerCase()
      )
      
      // For continuous metrics with ratio calculation (valueColumn2)
      const valueColumn2ActualColumn = availableColumns.find(col =>
        metric.valueColumn2 && col.toLowerCase() === metric.valueColumn2.toLowerCase()
      )

      // Determine numerator and denominator for different metric configurations
      let finalNumeratorColumn = numeratorActualColumn || metric.numerator
      let finalDenominatorColumn = denominatorActualColumn || metric.denominator
      
      // For continuous metrics with valueColumn2, use valueColumn as numerator and valueColumn2 as denominator
      if (metric.type === 'continuous' && metric.valueColumn2) {
        finalNumeratorColumn = actualColumn || metric.valueColumn
        finalDenominatorColumn = valueColumn2ActualColumn || metric.valueColumn2
      }

      return {
        name: metric.name,
        column: actualColumn || sourceColumnName || metric.name, // Use the case-corrected column name, with fallback
        type: this.mapMetricType(metric.type),
        description: metric.description,
        numerator_column: finalNumeratorColumn,
        denominator_column: finalDenominatorColumn,
        filters: metric.filters || {},
        unit: metric.unit,
        currency: metric.currency,
        decimals: metric.decimals,
      }
    })

    return {
      data,
      metrics_config: transformedMetrics,
      variation_column: variationColumn,
      user_column: detectedUserColumn,
      data_type: dataType,
      confidence_level: confidenceLevel,
      statistical_method: statisticalMethod,
      multiple_testing_correction: multipleTestingCorrection,
    }
  }

  private mapMetricType(frontendType: string): 'conversion' | 'revenue' | 'count' | 'ratio' {
    const typeMapping: Record<string, 'conversion' | 'revenue' | 'count' | 'ratio'> = {
      'conversion': 'conversion',
      'conversion_rate': 'conversion',
      'ctr': 'conversion',
      'binary': 'conversion',      // Binary metrics are typically conversion metrics
      'revenue': 'revenue',
      'aov': 'revenue',
      'ltv': 'revenue',
      'count': 'count',
      'clicks': 'count',
      'views': 'count',
      'continuous': 'count',       // Continuous metrics are typically count metrics
      'ratio': 'ratio',
      'rate': 'ratio',
    }

    return typeMapping[frontendType] || 'count'
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest<{ status: string; timestamp: string }>('/health')
  }
}

// Export singleton instance
export const analysisAPI = new AnalysisAPI() 