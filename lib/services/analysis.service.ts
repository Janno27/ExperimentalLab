import { analysisAPI } from '@/lib/api/analysis-api'
import { prepareAnalysisConfig } from '@/lib/api/analysis-api-transformer'
import type { 
  AnalysisConfig, 
  AnalysisResults, 
  AnalysisMetric 
} from '@/types/analysis'

// Interface pour les options de polling
interface PollingOptions {
  maxAttempts: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
}

// Interface pour les callbacks de progression
interface ProgressCallbacks {
  onProgress?: (progress: number, status: string, elapsedTime: number) => void
  onStatusChange?: (status: string) => void
}

// Validation d'analyse
interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class AnalysisService {
  private static instance: AnalysisService
  private readonly defaultPollingOptions: PollingOptions = {
    maxAttempts: 120, // 10 minutes max (120 * 5s)
    initialDelay: 1000, // 1 seconde
    maxDelay: 5000, // 5 secondes max
    backoffMultiplier: 1.2
  }

  static getInstance(): AnalysisService {
    if (!this.instance) {
      this.instance = new AnalysisService()
    }
    return this.instance
  }

  /**
   * Lance une analyse complète avec polling des résultats
   */
  async runAnalysis(
    config: AnalysisConfig,
    callbacks?: ProgressCallbacks,
    pollingOptions?: Partial<PollingOptions>
  ): Promise<AnalysisResults> {
    const startTime = Date.now()
    
    // Validation de la configuration
    callbacks?.onStatusChange?.('Validating configuration...')
    const validation = this.validateConfig(config)
    if (!validation.isValid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`)
    }

    // Log des warnings si présents
    if (validation.warnings.length > 0) {
      console.warn('Analysis warnings:', validation.warnings)
    }

    // Transformation des données pour l'API
    callbacks?.onStatusChange?.('Preparing data for analysis...')
    callbacks?.onProgress?.(10, 'Preparing data...', Date.now() - startTime)
    
    let apiConfig
    try {
      apiConfig = prepareAnalysisConfig(
        config.data,
        config.metrics,
        config.testConfig.variationColumn,
        config.testConfig.userColumn,
        config.statisticConfig.confidenceLevel,
        config.statisticConfig.statisticalMethod,
        config.statisticConfig.multipleTestingCorrection,
        config.testConfig.dataType
      )
    } catch (error) {
      throw new Error(`Data preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Démarrage de l'analyse
    callbacks?.onStatusChange?.('Starting analysis...')
    callbacks?.onProgress?.(20, 'Starting analysis...', Date.now() - startTime)
    
    let jobId: string
    try {
      const response = await analysisAPI.startAnalysis(apiConfig)
      jobId = response.job_id
    } catch (error) {
      throw new Error(`Failed to start analysis: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Polling des résultats
    const options = { ...this.defaultPollingOptions, ...pollingOptions }
    return this.pollForResults(jobId, config.metrics, startTime, callbacks, options)
  }

  /**
   * Valide la configuration d'analyse
   */
  private validateConfig(config: AnalysisConfig): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validation des données
    if (!config.data || config.data.length === 0) {
      errors.push('No data provided for analysis')
    } else {
      // Validation de la taille des données selon le type
      if (config.testConfig.dataType === 'aggregated' && config.data.length < 2) {
        errors.push('Aggregated data requires at least 2 rows (one per variation)')
      } else if (config.testConfig.dataType === 'raw' && config.data.length < 10) {
        errors.push('Raw data requires at least 10 rows for statistical significance')
      }

      // Vérification des colonnes requises
      const firstRow = config.data[0]
      if (!firstRow[config.testConfig.variationColumn]) {
        errors.push(`Variation column '${config.testConfig.variationColumn}' not found in data`)
      }
      if (!firstRow[config.testConfig.userColumn]) {
        errors.push(`User column '${config.testConfig.userColumn}' not found in data`)
      }
    }

    // Validation des métriques
    if (!config.metrics || config.metrics.length === 0) {
      errors.push('No metrics selected for analysis')
    } else {
      // Vérification de chaque métrique
      config.metrics.forEach((metric, index) => {
        if (!metric.name) {
          errors.push(`Metric ${index + 1} is missing a name`)
        }
        
        if (metric.type === 'binary') {
          if (!metric.numerator) {
            errors.push(`Binary metric '${metric.name}' is missing numerator column`)
          }
          if (!metric.denominator) {
            warnings.push(`Binary metric '${metric.name}' is missing denominator column, will use user column`)
          }
        } else if (metric.type === 'continuous') {
          if (!metric.valueColumn && !metric.numerator) {
            errors.push(`Continuous metric '${metric.name}' is missing value column or numerator`)
          }
        }
      })
    }

    // Validation de la configuration de test
    if (!config.testConfig.variationColumn) {
      errors.push('Variation column is required')
    }
    if (!config.testConfig.userColumn) {
      errors.push('User column is required')
    }

    // Validation de la configuration statistique
    if (config.statisticConfig.confidenceLevel < 50 || config.statisticConfig.confidenceLevel > 99) {
      warnings.push('Confidence level should be between 50% and 99%')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Polling des résultats avec exponential backoff
   */
  private async pollForResults(
    jobId: string,
    metrics: AnalysisMetric[],
    startTime: number,
    callbacks?: ProgressCallbacks,
    options: PollingOptions = this.defaultPollingOptions
  ): Promise<AnalysisResults> {
    let attempt = 0
    let delay = options.initialDelay

    while (attempt < options.maxAttempts) {
      try {
        const elapsedTime = Date.now() - startTime
        const progress = Math.min(30 + (attempt / options.maxAttempts) * 60, 90) // 30-90%
        
        callbacks?.onProgress?.(progress, 'Processing analysis...', elapsedTime)
        callbacks?.onStatusChange?.(`Processing analysis... (${Math.round(elapsedTime / 1000)}s)`)

        // Vérification du statut
        const status = await analysisAPI.checkStatus(jobId)
        
        if (status.status === 'completed') {
          callbacks?.onProgress?.(95, 'Retrieving results...', elapsedTime)
          callbacks?.onStatusChange?.('Retrieving results...')
          
          // Récupération des résultats
          const results = await analysisAPI.getResults(jobId)
          
          callbacks?.onProgress?.(100, 'Analysis completed!', elapsedTime)
          callbacks?.onStatusChange?.('Analysis completed!')
          
          return results.results
        } else if (status.status === 'failed') {
          throw new Error(`Analysis failed: ${status.error || 'Unknown error'}`)
        } else if (status.status === 'processing') {
          // Continuer le polling
          await this.sleep(delay)
          delay = Math.min(delay * options.backoffMultiplier, options.maxDelay)
          attempt++
        } else {
          // Statut inconnu, continuer le polling
          await this.sleep(delay)
          attempt++
        }
      } catch (error) {
        if (attempt === options.maxAttempts - 1) {
          // Dernière tentative, propager l'erreur
          throw new Error(`Analysis polling failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
        
        // Attendre avant de réessayer
        await this.sleep(delay)
        delay = Math.min(delay * options.backoffMultiplier, options.maxDelay)
        attempt++
      }
    }

    throw new Error('Analysis timeout: Maximum polling attempts reached')
  }

  /**
   * Annule une analyse en cours
   */
  async cancelAnalysis(jobId: string): Promise<void> {
    try {
      // await analysisAPI.cancelAnalysis(jobId)
      console.log('Cancel analysis requested for job:', jobId)
    } catch (error) {
      console.warn('Failed to cancel analysis:', error)
      // Ne pas propager l'erreur car l'analyse peut déjà être terminée
    }
  }

  /**
   * Valide les données avant l'analyse
   */
  async validateData(
    data: Record<string, unknown>[],
    dataType: 'aggregated' | 'raw'
  ): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    if (!data || data.length === 0) {
      errors.push('No data provided')
      return { isValid: false, errors, warnings }
    }

    // Validation basée sur le type de données
    if (dataType === 'aggregated') {
      if (data.length < 2) {
        errors.push('Aggregated data requires at least 2 rows (one per variation)')
      }
    } else {
      if (data.length < 10) {
        errors.push('Raw data requires at least 10 rows for statistical analysis')
      }
    }

    // Validation de la structure des données
    const firstRow = data[0]
    const columns = Object.keys(firstRow)
    
    if (columns.length === 0) {
      errors.push('Data has no columns')
    }

    // Vérification des valeurs manquantes
    // const missingValueColumns: string[] = []
    columns.forEach(column => {
      const missingCount = data.filter(row => row[column] === null || row[column] === undefined || row[column] === '').length
      const missingPercentage = (missingCount / data.length) * 100
      
      if (missingPercentage > 50) {
        warnings.push(`Column '${column}' has ${missingPercentage.toFixed(1)}% missing values`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Utilitaire pour attendre
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Formate la durée en format lisible
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }
}
