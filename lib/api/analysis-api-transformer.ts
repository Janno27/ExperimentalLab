import { AnalysisConfig, MetricConfig } from './analysis-api'
import type { AnalysisMetric } from '@/types/analysis'

type CustomMetric = AnalysisMetric

export class AnalysisAPITransformer {
  /**
   * Normaliser les noms de colonnes
   */
  static normalizeColumnName(column: string): string {
    if (!column) return ''
    return column
      .trim()
      .toLowerCase()
      .replace(/[\s\-\.]+/g, '_')  // Espaces, tirets, points → underscore
      .replace(/[^\w]/g, '')        // Supprimer caractères spéciaux
  }

  /**
   * Normaliser toutes les colonnes dans les données
   */
  static normalizeDataColumns(data: Record<string, unknown>[]): Record<string, unknown>[] {
    if (!data || data.length === 0) return data

    return data.map(row => {
      const normalizedRow: Record<string, unknown> = {}
      Object.entries(row).forEach(([key, value]) => {
        const normalizedKey = this.normalizeColumnName(key)
        normalizedRow[normalizedKey] = value
      })
      return normalizedRow
    })
  }

  /**
   * Transformer les métriques frontend vers le format backend
   */
  static transformMetrics(metrics: CustomMetric[]): MetricConfig[] {
    return metrics.map(metric => {
      let metricType: 'conversion' | 'revenue' | 'count' | 'ratio'
      let mainColumn: string = ''
      let numerator: string | undefined
      let denominator: string | undefined

      // Déterminer le type backend basé sur le type frontend et les propriétés
      if (metric.type === 'binary') {
        metricType = 'conversion'
        mainColumn = metric.numerator || metric.valueColumn || ''
        numerator = metric.numerator ? this.normalizeColumnName(metric.numerator) : undefined
        denominator = metric.denominator ? this.normalizeColumnName(metric.denominator) : undefined
      } else {
        // Type continuous
        if (metric.isRevenue || metric.unit === 'currency') {
          metricType = 'revenue'
        } else if (metric.valueColumn2 || (metric.numerator && metric.denominator)) {
          metricType = 'ratio'
        } else {
          metricType = 'count'
        }

        // Gérer les colonnes
        if (metric.valueColumn2) {
          // Ratio avec deux colonnes values
          mainColumn = metric.valueColumn || ''
          numerator = metric.valueColumn ? this.normalizeColumnName(metric.valueColumn) : undefined
          denominator = metric.valueColumn2 ? this.normalizeColumnName(metric.valueColumn2) : undefined
        } else if (metric.numerator && metric.denominator) {
          // Ratio explicite
          mainColumn = metric.numerator
          numerator = metric.numerator ? this.normalizeColumnName(metric.numerator) : undefined
          denominator = metric.denominator ? this.normalizeColumnName(metric.denominator) : undefined
        } else {
          // Métrique simple
          mainColumn = metric.valueColumn || metric.numerator || ''
        }
      }

      // Normaliser la colonne principale
      mainColumn = mainColumn ? this.normalizeColumnName(mainColumn) : ''

      return {
        name: metric.name,
        column: mainColumn,
        type: metricType,
        description: metric.description || `${metric.name} metric`,
        numerator_column: numerator,
        denominator_column: denominator,
        // Ajouter les métadonnées pour l'affichage
        unit: metric.unit,
        currency: metric.currency || (metric.isRevenue ? '€' : undefined),
        decimals: metric.decimals ?? (
          metric.unit === 'percentage' ? 2 :
          metric.unit === 'currency' ? 2 :
          metric.unit === 'count' ? 0 : 2
        )
      } as MetricConfig & { unit?: string; currency?: string; decimals?: number }
    })
  }

  /**
   * Préparer la configuration complète pour l'API
   */
  static prepareConfig(
    data: Record<string, unknown>[],
    metrics: CustomMetric[],
    variationColumn: string,
    userColumn?: string,
    confidenceLevel: number = 95,
    statisticalMethod: 'frequentist' | 'bayesian' | 'bootstrap' = 'frequentist',
    multipleTestingCorrection: 'none' | 'bonferroni' | 'fdr' = 'none',
    dataType: 'aggregated' | 'raw' = 'aggregated'
  ): AnalysisConfig {
    // Normaliser les données
    const normalizedData = this.normalizeDataColumns(data)
    
    // Normaliser les colonnes de référence
    const normalizedVariationColumn = this.normalizeColumnName(variationColumn)
    const normalizedUserColumn = userColumn ? this.normalizeColumnName(userColumn) : undefined

    // Transformer les métriques
    const transformedMetrics = this.transformMetrics(metrics)

    return {
      data: normalizedData,
      metrics_config: transformedMetrics,
      variation_column: normalizedVariationColumn,
      user_column: normalizedUserColumn,
      data_type: dataType,
      confidence_level: confidenceLevel,
      statistical_method: statisticalMethod,
      multiple_testing_correction: multipleTestingCorrection
    }
  }

  /**
   * Enrichir les résultats avec les métadonnées des métriques
   */
  static enrichResults(results: Record<string, unknown>, originalMetrics: CustomMetric[]): Record<string, unknown> {
    if (!results || !results.metric_results) return results

    // Créer une map pour retrouver rapidement les métriques originales
    const metricMap = new Map<string, CustomMetric>()
    originalMetrics.forEach(metric => {
      metricMap.set(metric.name, metric)
    })

    // Enrichir chaque résultat de métrique
    const enrichedResults = {
      ...results,
      metric_results: (results.metric_results as Array<Record<string, unknown>>).map((metricResult: Record<string, unknown>) => {
        const originalMetric = metricMap.get(metricResult.metric_name as string)
        
        if (originalMetric) {
          return {
            ...metricResult,
            // Ajouter les métadonnées d'affichage
            metric_unit: originalMetric.unit,
            metric_currency: originalMetric.currency,
            metric_decimals: originalMetric.decimals,
            metric_is_revenue: originalMetric.isRevenue
          }
        }
        
        return metricResult
      })
    }

    return enrichedResults
  }

  /**
   * Valider les données avant envoi
   */
  static validateData(
    data: Record<string, unknown>[], 
    dataType: 'aggregated' | 'raw' = 'aggregated'
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data || data.length === 0) {
      errors.push('Data is empty')
      return { isValid: false, errors }
    }

    // Vérifier la cohérence des colonnes
    const firstRowKeys = Object.keys(data[0])
    let inconsistentRows = 0
    
    data.forEach((row) => {
      const rowKeys = Object.keys(row)
      if (rowKeys.length !== firstRowKeys.length) {
        inconsistentRows++
      }
    })

    if (inconsistentRows > 0) {
      errors.push(`${inconsistentRows} rows have inconsistent column count`)
    }

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

    // Vérifier les valeurs manquantes excessives
    let totalCells = 0
    let emptyCells = 0
    
    data.forEach(row => {
      Object.values(row).forEach(value => {
        totalCells++
        if (value === null || value === undefined || value === '') {
          emptyCells++
        }
      })
    })

    const emptyPercentage = (emptyCells / totalCells) * 100
    if (emptyPercentage > 50) {
      errors.push(`Too many empty values (${emptyPercentage.toFixed(1)}%)`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Détecter automatiquement la colonne utilisateur
   */
  static detectUserColumn(data: Record<string, unknown>[]): string | undefined {
    if (!data || data.length === 0) return undefined
    
    const columns = Object.keys(data[0])
    const userPatterns = [
      'user_id', 'userid', 'user', 
      'visitor_id', 'visitorid', 'visitor',
      'customer_id', 'customerid', 'customer',
      'session_id', 'sessionid', 'session',
      'users' // Pour les données agrégées
    ]
    
    for (const pattern of userPatterns) {
      const found = columns.find(col => 
        col.toLowerCase().replace(/[\s\-_]/g, '') === pattern.replace('_', '')
      )
      if (found) return found
    }
    
    return undefined
  }
}

// Export de fonctions utilitaires directes
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

  // Détecter automatiquement la colonne utilisateur si non fournie
  const detectedUserColumn = userColumn || AnalysisAPITransformer.detectUserColumn(data)

  return AnalysisAPITransformer.prepareConfig(
    data,
    metrics,
    variationColumn,
    detectedUserColumn,
    confidenceLevel,
    statisticalMethod,
    multipleTestingCorrection,
    dataType
  )
}

export function enrichAnalysisResults(results: Record<string, unknown>, originalMetrics: CustomMetric[]): Record<string, unknown> {
  return AnalysisAPITransformer.enrichResults(results, originalMetrics)
}