import type { Project } from '@/hooks/useExperimentation'

// Enum pour les étapes d'analyse
export enum AnalysisStep {
  SELECT_TEST = 'select_test',
  IMPORT_DATA = 'import_data',
  SELECT_COLUMNS = 'select_columns',
  CONFIGURE_TEST = 'configure_test',
  SELECT_METRICS = 'select_metrics',
  CONFIGURE_STATS = 'configure_stats',
  RUN_ANALYSIS = 'run_analysis',
  VIEW_RESULTS = 'view_results'
}

// Enum pour les types de colonnes
export enum ColumnType {
  VARIATION = 'variation',
  USERS = 'users',
  BASE_USERS = 'base_users',
  CONVERSIONS = 'conversions',
  CONVERSION_RATE = 'conversion_rate',
  VALUE = 'value',
  RATE = 'rate',
  TOTAL_VALUE = 'total_value',
  VALUE_PER_USER = 'value_per_user',
  TOTAL_REVENUE = 'total_revenue',
  REVENUE_PER_USER = 'revenue_per_user',
  UPLIFT = 'uplift',
  SIGNIFICANCE = 'significance',
  CI = 'ci'
}

// Configuration de formatage
export interface FormatConfig {
  unit: 'currency' | 'percentage' | 'count' | 'none'
  currency?: '€' | '$' | '£'
  decimals: number
  prefix?: string
  suffix?: string
}

// Configuration d'affichage des métriques
export interface MetricDisplayConfig {
  columns: ColumnType[]
  disabledColumns?: ColumnType[]
  headerLabels: Record<string, string>
  format: FormatConfig
  aggregationType?: 'sum' | 'average' | 'ratio'
  note?: string
}

// Configuration des colonnes de dimension pour les filtres
export interface DimensionColumn {
  type: 'categorical'
  values: string[]
  count: number
  display_name: string
}

// Interface pour les métriques d'analyse
export interface AnalysisMetric {
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
}

// Configuration de test
export interface TestConfig {
  variationColumn: string
  userColumn: string
  dataType: 'aggregated' | 'raw'
}

// Configuration statistique
export interface StatisticConfig {
  confidenceLevel: number
  statisticalMethod: 'frequentist' | 'bayesian'
  multipleTestingCorrection: 'none' | 'bonferroni' | 'fdr'
}

// Interface pour les tests prêts pour analyse
export interface ReadyForAnalysisTest {
  id: string
  name: string
  type: string
  owner: string
  startDate: string
  endDate: string
  mainKPI: string
  status: string
  description?: string
  hypothesis?: string
  context?: string
  successCriteria?: string[]
  control?: Record<string, unknown>
  variation?: Record<string, unknown>
  audience?: string
  conversion?: string
  mde?: string
  existingRate?: string
  trafficAllocation?: string
  scope?: string
  estimatedTime?: string
  role?: string
  market?: string
  page?: string
  product?: string
  devices?: string
  conclusive?: string
  winLoss?: string
  results?: string
  notes?: string
  fields?: Record<string, string | number | boolean>
}

// État de l'analyse
export interface AnalysisState {
  activeTab: 'existing' | 'scratch'
  currentStep: AnalysisStep
  data: {
    importedFile: Record<string, unknown>[]
    selectedColumns: string[]
    selectedMetrics: AnalysisMetric[]
    testConfiguration: TestConfig
    statisticConfig: StatisticConfig
    analysisResults: any
  }
  ui: {
    loading: boolean
    selectedTest: Project | null
    readyTests: ReadyForAnalysisTest[]
    error: string | null
    progress: number
    status: string
    elapsedTime: number
  }
}

// Actions du reducer
export type AnalysisAction =
  | { type: 'SET_ACTIVE_TAB'; payload: 'existing' | 'scratch' }
  | { type: 'SET_CURRENT_STEP'; payload: AnalysisStep }
  | { type: 'SELECT_TEST'; payload: Project }
  | { type: 'SET_READY_TESTS'; payload: ReadyForAnalysisTest[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_IMPORTED_DATA'; payload: Record<string, unknown>[] }
  | { type: 'SET_SELECTED_COLUMNS'; payload: string[] }
  | { type: 'SET_SELECTED_METRICS'; payload: AnalysisMetric[] }
  | { type: 'SET_TEST_CONFIGURATION'; payload: TestConfig }
  | { type: 'SET_STATISTIC_CONFIG'; payload: StatisticConfig }
  | { type: 'START_ANALYSIS' }
  | { type: 'UPDATE_PROGRESS'; payload: { progress: number; status: string; elapsedTime: number } }
  | { type: 'ANALYSIS_SUCCESS'; payload: any }
  | { type: 'ANALYSIS_ERROR'; payload: string }
  | { type: 'RESET_ANALYSIS' }

// Configuration d'analyse complète
export interface AnalysisConfig {
  data: Record<string, unknown>[]
  metrics: AnalysisMetric[]
  testConfig: TestConfig
  statisticConfig: StatisticConfig
}

// Résultats d'analyse
export interface AnalysisResults {
  overall_results: {
    total_users: number
    total_variations: number
  }
  metric_results: MetricResult[]
  dimension_columns?: Record<string, DimensionColumn>
}

// Résultat d'une métrique
export interface MetricResult {
  metric_name: string
  metric_type: string
  metric_unit?: string
  metric_currency?: string
  metric_decimals?: number
  variation_stats: VariationStats[]
  pairwise_comparisons: PairwiseComparison[]
  is_significant: boolean
}

// Statistiques d'une variation
export interface VariationStats {
  variation: string
  sample_size: number
  mean: number
  std?: number
  conversions?: number
  conversion_rate?: number
  total_revenue?: number
  revenue_per_user?: number
}

// Comparaison entre variations
export interface PairwiseComparison {
  variation_name: string
  absolute_uplift: number
  relative_uplift: number
  p_value: number
  is_significant: boolean
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
}

// État initial de l'analyse
export const initialAnalysisState: AnalysisState = {
  activeTab: 'existing',
  currentStep: AnalysisStep.SELECT_TEST,
  data: {
    importedFile: [],
    selectedColumns: [],
    selectedMetrics: [],
    testConfiguration: {
      variationColumn: '',
      userColumn: '',
      dataType: 'aggregated'
    },
    statisticConfig: {
      confidenceLevel: 85,
      statisticalMethod: 'frequentist',
      multipleTestingCorrection: 'none'
    },
    analysisResults: null
  },
  ui: {
    loading: false,
    selectedTest: null,
    readyTests: [],
    error: null,
    progress: 0,
    status: 'Ready',
    elapsedTime: 0
  }
}
