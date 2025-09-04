import { 
  AnalysisState, 
  AnalysisAction, 
  AnalysisStep, 
  initialAnalysisState 
} from '@/types/analysis'

export function analysisReducer(
  state: AnalysisState, 
  action: AnalysisAction
): AnalysisState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload
      }

    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload
      }

    case 'SELECT_TEST':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedTest: action.payload
        },
        currentStep: AnalysisStep.IMPORT_DATA
      }

    case 'SET_READY_TESTS':
      return {
        ...state,
        ui: {
          ...state.ui,
          readyTests: action.payload,
          loading: false
        }
      }

    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: action.payload
        }
      }

    case 'SET_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          error: action.payload,
          loading: false
        }
      }

    case 'SET_IMPORTED_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          importedFile: action.payload
        },
        currentStep: AnalysisStep.SELECT_COLUMNS
      }

    case 'SET_SELECTED_COLUMNS':
      return {
        ...state,
        data: {
          ...state.data,
          selectedColumns: action.payload
        },
        currentStep: AnalysisStep.CONFIGURE_TEST
      }

    case 'SET_SELECTED_METRICS':
      return {
        ...state,
        data: {
          ...state.data,
          selectedMetrics: action.payload
        },
        currentStep: AnalysisStep.CONFIGURE_STATS
      }

    case 'SET_TEST_CONFIGURATION':
      return {
        ...state,
        data: {
          ...state.data,
          testConfiguration: action.payload
        },
        currentStep: AnalysisStep.SELECT_METRICS
      }

    case 'SET_STATISTIC_CONFIG':
      return {
        ...state,
        data: {
          ...state.data,
          statisticConfig: action.payload
        }
      }

    case 'START_ANALYSIS':
      return {
        ...state,
        currentStep: AnalysisStep.RUN_ANALYSIS,
        ui: {
          ...state.ui,
          loading: true,
          error: null,
          progress: 0,
          status: 'Initializing analysis...',
          elapsedTime: 0
        }
      }

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        ui: {
          ...state.ui,
          progress: action.payload.progress,
          status: action.payload.status,
          elapsedTime: action.payload.elapsedTime
        }
      }

    case 'ANALYSIS_SUCCESS':
      return {
        ...state,
        currentStep: AnalysisStep.VIEW_RESULTS,
        data: {
          ...state.data,
          analysisResults: action.payload
        },
        ui: {
          ...state.ui,
          loading: false,
          error: null,
          progress: 100,
          status: 'Analysis completed successfully'
        }
      }

    case 'ANALYSIS_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: false,
          error: action.payload,
          progress: 0,
          status: 'Analysis failed'
        }
      }

    case 'RESET_ANALYSIS':
      return {
        ...initialAnalysisState,
        ui: {
          ...initialAnalysisState.ui,
          readyTests: state.ui.readyTests, // Conserver les tests chargés
          selectedTest: state.ui.selectedTest // Conserver le test sélectionné
        }
      }

    default:
      return state
  }
}

// Sélecteurs pour extraire des données spécifiques du state
export const selectCurrentStep = (state: AnalysisState): AnalysisStep => state.currentStep
export const selectSelectedTest = (state: AnalysisState) => state.ui.selectedTest
export const selectIsLoading = (state: AnalysisState): boolean => state.ui.loading
export const selectError = (state: AnalysisState): string | null => state.ui.error
export const selectProgress = (state: AnalysisState): number => state.ui.progress
export const selectStatus = (state: AnalysisState): string => state.ui.status
export const selectElapsedTime = (state: AnalysisState): number => state.ui.elapsedTime
export const selectReadyTests = (state: AnalysisState) => state.ui.readyTests
export const selectImportedData = (state: AnalysisState) => state.data.importedFile
export const selectSelectedColumns = (state: AnalysisState) => state.data.selectedColumns
export const selectSelectedMetrics = (state: AnalysisState) => state.data.selectedMetrics
export const selectTestConfiguration = (state: AnalysisState) => state.data.testConfiguration
export const selectStatisticConfig = (state: AnalysisState) => state.data.statisticConfig
export const selectAnalysisResults = (state: AnalysisState) => state.data.analysisResults
export const selectActiveTab = (state: AnalysisState) => state.activeTab

// Sélecteur pour vérifier si une étape est complète
export const selectIsStepComplete = (state: AnalysisState, step: AnalysisStep): boolean => {
  switch (step) {
    case AnalysisStep.SELECT_TEST:
      return !!state.ui.selectedTest
    case AnalysisStep.IMPORT_DATA:
      return state.data.importedFile.length > 0
    case AnalysisStep.SELECT_COLUMNS:
      return state.data.selectedColumns.length > 0
    case AnalysisStep.CONFIGURE_TEST:
      return !!(state.data.testConfiguration.variationColumn && state.data.testConfiguration.userColumn)
    case AnalysisStep.SELECT_METRICS:
      return state.data.selectedMetrics.length > 0
    case AnalysisStep.CONFIGURE_STATS:
      return !!state.data.statisticConfig.confidenceLevel
    case AnalysisStep.RUN_ANALYSIS:
      return state.ui.progress === 100 && !state.ui.error
    case AnalysisStep.VIEW_RESULTS:
      return !!state.data.analysisResults
    default:
      return false
  }
}

// Sélecteur pour obtenir la configuration complète d'analyse
export const selectAnalysisConfig = (state: AnalysisState) => ({
  data: state.data.importedFile,
  metrics: state.data.selectedMetrics,
  testConfig: state.data.testConfiguration,
  statisticConfig: state.data.statisticConfig
})
