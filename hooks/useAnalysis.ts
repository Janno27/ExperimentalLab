'use client'

import { useReducer, useCallback, useEffect, useRef } from 'react'
import { 
  analysisReducer, 
  selectCurrentStep,
  selectSelectedTest,
  selectIsLoading,
  selectError,
  selectProgress,
  selectStatus,
  selectElapsedTime,
  selectReadyTests,
  selectImportedData,
  selectSelectedColumns,
  selectSelectedMetrics,
  selectTestConfiguration,
  selectStatisticConfig,
  selectAnalysisResults,
  selectActiveTab,
  selectIsStepComplete,
  selectAnalysisConfig
} from '@/lib/reducers/analysisReducer'
import { AnalysisService } from '@/lib/services/analysis.service'
import { fetchExperimentations, fetchMarkets, fetchOwners, fetchKPIs, fetchPages, fetchProducts } from '@/lib/airtable'
import type { 
  AnalysisState, 
  AnalysisStep, 
  AnalysisMetric, 
  TestConfig, 
  StatisticConfig,
  ReadyForAnalysisTest
} from '@/types/analysis'
import { initialAnalysisState } from '@/types/analysis'
import type { Project } from '@/hooks/useExperimentation'

// Mockup data for testing
const mockupTests: ReadyForAnalysisTest[] = [
  {
    id: '1',
    name: 'Homepage CTA Button Test',
    type: 'A/B Test',
    owner: 'John Doe',
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    mainKPI: 'Conversion Rate',
    status: 'Ready for Analysis',
    description: 'Testing different CTA button colors on homepage',
    hypothesis: 'Red buttons will increase conversion rate by 15%',
    context: 'Homepage has low conversion rate',
    successCriteria: ['Increase conversion rate by 15%', 'Maintain bounce rate'],
    audience: 'All visitors',
    conversion: 'Button click',
    mde: '15%',
    existingRate: '2.5%',
    trafficAllocation: '50/50',
    scope: 'Homepage',
    estimatedTime: '30',
    role: 'Product Manager',
    market: 'US',
    page: 'Homepage',
    product: 'E-commerce',
    devices: 'Desktop, Mobile',
    conclusive: 'Yes',
    winLoss: 'Win',
    results: 'Red button increased conversion by 18%',
    notes: 'Significant improvement observed'
  },
  {
    id: '2',
    name: 'Pricing Page Layout Test',
    type: 'A/B Test',
    owner: 'Jane Smith',
    startDate: '2024-01-20',
    endDate: '2024-02-20',
    mainKPI: 'Revenue per Visitor',
    status: 'Ready for Analysis',
    description: 'Testing different pricing page layouts',
    hypothesis: 'Three-column layout will increase revenue per visitor',
    context: 'Pricing page needs optimization',
    successCriteria: ['Increase revenue per visitor by 10%', 'Reduce bounce rate'],
    audience: 'Pricing page visitors',
    conversion: 'Purchase',
    mde: '10%',
    existingRate: '1.2%',
    trafficAllocation: '50/50',
    scope: 'Pricing Page',
    estimatedTime: '30',
    role: 'UX Designer',
    market: 'Global',
    page: 'Pricing',
    product: 'SaaS',
    devices: 'Desktop, Mobile',
    conclusive: 'Yes',
    winLoss: 'Loss',
    results: 'Three-column layout decreased revenue by 5%',
    notes: 'Users prefer simpler layout'
  }
]

export function useAnalysis() {
  const [state, dispatch] = useReducer(analysisReducer, initialAnalysisState)
  const analysisServiceRef = useRef<AnalysisService>(AnalysisService.getInstance())
  const currentJobIdRef = useRef<string | null>(null)

  // Helper function to convert ReadyForAnalysisTest to Project
  const convertTestToProject = useCallback((test: ReadyForAnalysisTest): Project => {
    return {
      id: test.id,
      country: test.market || '',
      section: test.page || '',
      title: test.name,
      status: test.status as Project['status'],
      startDate: test.startDate ? new Date(test.startDate) : new Date(),
      endDate: test.endDate ? new Date(test.endDate) : new Date(),
      progress: 0,
      owner: test.owner,
      analysisOwner: test.owner,
      mainKPI: test.mainKPI,
      testType: test.type,
      estimatedTime: test.estimatedTime ? parseInt(test.estimatedTime) || 0 : 0,
      mde: test.mde || '',
      successCriteria1: test.successCriteria?.[0] || '',
      successCriteria2: test.successCriteria?.[1] || '',
      successCriteria3: test.successCriteria?.[2] || '',
      readyForAnalysisDate: undefined,
      analysisStartDate: undefined,
      analysisEndDate: undefined,
      doneDate: undefined,
      timeFromReadyToAnalysis: undefined,
      timeFromAnalysisToDone: undefined,
      tool: '',
      scope: test.scope || '',
      region: test.market || '',
      audience: test.audience || '',
      conversion: test.conversion || '',
      existingRate: test.existingRate || '',
      trafficAllocation: test.trafficAllocation || '',
      page: test.page || '',
      product: test.product || '',
      devices: test.devices || '',
      hypothesis: test.hypothesis || '',
      description: test.description || '',
      context: test.context || '',
      control: test.control,
      variation1: test.variation,
      metThreshold1: undefined,
      metThreshold2: undefined,
      metThreshold3: undefined,
      resultsDeepdive: undefined,
      learnings: '',
      nextSteps: '',
      conclusive: test.conclusive || '',
      winLoss: test.winLoss || '',
      conclusiveGroup: test.conclusive || 'Non Conclusive'
    }
  }, [])

  // Load ready tests from Airtable
  const loadReadyTests = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      // Fetch all reference data first
      const [experimentations, markets, owners, kpis, pages, products] = await Promise.all([
        fetchExperimentations(),
        fetchMarkets(),
        fetchOwners(),
        fetchKPIs(),
        fetchPages(),
        fetchProducts()
      ])

      // Helper to resolve linked record names
      const getLinkedRecordName = (ids: string[] | undefined, referenceData: {id: string, name: string}[]) => {
        if (!ids || !Array.isArray(ids) || ids.length === 0) return 'Unknown'
        const record = referenceData.find(r => r.id === ids[0])
        return record?.name || 'Unknown'
      }

      // Convert Airtable records to ReadyForAnalysisTest format
      const readyTests = experimentations
        .filter((exp: any) => exp.fields?.Status === 'Ready for Analysis')
        .map((exp: any) => ({
          id: exp.id,
          name: exp.fields?.Name || exp.fields?.Title || 'Unknown',
          type: exp.fields?.Type || 'Unknown',
          owner: getLinkedRecordName(exp.fields?.Owner, owners),
          startDate: exp.fields?.['Start Date'] || '',
          endDate: exp.fields?.['End Date'] || '',
          mainKPI: getLinkedRecordName(exp.fields?.['Main KPI'], kpis),
          status: exp.fields?.Status || 'Unknown',
          description: exp.fields?.Description || '',
          hypothesis: exp.fields?.Hypothesis || '',
          context: exp.fields?.Context || '',
          successCriteria: [
            exp.fields?.['Success Criteria #1'] || '',
            exp.fields?.['Success Criteria #2'] || '',
            exp.fields?.['Success Criteria #3'] || ''
          ].filter(Boolean),
          control: exp.fields?.Control,
          variation: exp.fields?.['Variation 1'],
          audience: exp.fields?.Audience || '',
          conversion: exp.fields?.Conversion || '',
          mde: exp.fields?.MDE || '',
          existingRate: exp.fields?.['Existing % Rate'] || '',
          trafficAllocation: exp.fields?.['Traffic Allocation'] || '',
          scope: exp.fields?.Scope || '',
          estimatedTime: exp.fields?.['Estimated Time'] || '',
          role: exp.fields?.Role || '',
          market: getLinkedRecordName(exp.fields?.Market, markets),
          page: getLinkedRecordName(exp.fields?.Page, pages),
          product: getLinkedRecordName(exp.fields?.Product, products),
          devices: exp.fields?.Devices || '',
          conclusive: exp.fields?.['Conclusive vs Non Conclusive'] || '',
          winLoss: exp.fields?.['Win vs Loss'] || '',
          results: exp.fields?.Results || '',
          notes: exp.fields?.Notes || '',
          fields: exp.fields
        })) as ReadyForAnalysisTest[]
      
      dispatch({ type: 'SET_READY_TESTS', payload: readyTests.length > 0 ? readyTests : mockupTests })
    } catch (error) {
      console.error('Error fetching tests:', error)
      dispatch({ type: 'SET_READY_TESTS', payload: mockupTests })
    }
  }, [])

  // Load tests on mount
  useEffect(() => {
    loadReadyTests()
  }, [loadReadyTests])

  // Run analysis with progress tracking
  const runAnalysis = useCallback(async () => {
    const config = selectAnalysisConfig(state)
    
    dispatch({ type: 'START_ANALYSIS' })
    
    try {
      const results = await analysisServiceRef.current.runAnalysis(
        config,
        {
          onProgress: (progress, status, elapsedTime) => {
            dispatch({ 
              type: 'UPDATE_PROGRESS', 
              payload: { progress, status, elapsedTime } 
            })
          },
          onStatusChange: (status) => {
            dispatch({ 
              type: 'UPDATE_PROGRESS', 
              payload: { 
                progress: state.ui.progress, 
                status, 
                elapsedTime: state.ui.elapsedTime 
              } 
            })
          }
        }
      )
      
      dispatch({ type: 'ANALYSIS_SUCCESS', payload: results })
      return results
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed'
      dispatch({ type: 'ANALYSIS_ERROR', payload: errorMessage })
      throw error
    }
  }, [state])

  // Cancel current analysis
  const cancelAnalysis = useCallback(async () => {
    if (currentJobIdRef.current) {
      try {
        await analysisServiceRef.current.cancelAnalysis(currentJobIdRef.current)
      } catch (error) {
        console.warn('Failed to cancel analysis:', error)
      }
    }
    dispatch({ type: 'RESET_ANALYSIS' })
  }, [])

  // Navigation actions
  const selectTest = useCallback((test: ReadyForAnalysisTest) => {
    const project = convertTestToProject(test)
    dispatch({ type: 'SELECT_TEST', payload: project })
  }, [convertTestToProject])

  const setActiveTab = useCallback((tab: 'existing' | 'scratch') => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })
  }, [])

  const setCurrentStep = useCallback((step: AnalysisStep) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step })
  }, [])

  const setImportedData = useCallback((data: Record<string, unknown>[]) => {
    dispatch({ type: 'SET_IMPORTED_DATA', payload: data })
  }, [])

  const setSelectedColumns = useCallback((columns: string[]) => {
    dispatch({ type: 'SET_SELECTED_COLUMNS', payload: columns })
  }, [])

  const setSelectedMetrics = useCallback((metrics: AnalysisMetric[]) => {
    dispatch({ type: 'SET_SELECTED_METRICS', payload: metrics })
  }, [])

  const setTestConfiguration = useCallback((config: TestConfig) => {
    dispatch({ type: 'SET_TEST_CONFIGURATION', payload: config })
  }, [])

  const setStatisticConfig = useCallback((config: StatisticConfig) => {
    dispatch({ type: 'SET_STATISTIC_CONFIG', payload: config })
  }, [])

  const resetAnalysis = useCallback(() => {
    dispatch({ type: 'RESET_ANALYSIS' })
  }, [])

  // Selectors
  const currentStep = selectCurrentStep(state)
  const selectedTest = selectSelectedTest(state)
  const isLoading = selectIsLoading(state)
  const error = selectError(state)
  const progress = selectProgress(state)
  const status = selectStatus(state)
  const elapsedTime = selectElapsedTime(state)
  const readyTests = selectReadyTests(state)
  const importedData = selectImportedData(state)
  const selectedColumns = selectSelectedColumns(state)
  const selectedMetrics = selectSelectedMetrics(state)
  const testConfiguration = selectTestConfiguration(state)
  const statisticConfig = selectStatisticConfig(state)
  const analysisResults = selectAnalysisResults(state)
  const activeTab = selectActiveTab(state)

  // Helper to check if step is complete
  const isStepComplete = useCallback((step: AnalysisStep) => {
    return selectIsStepComplete(state, step)
  }, [state])

  return {
    // State
    currentStep,
    selectedTest,
    isLoading,
    error,
    progress,
    status,
    elapsedTime,
    readyTests,
    importedData,
    selectedColumns,
    selectedMetrics,
    testConfiguration,
    statisticConfig,
    analysisResults,
    activeTab,
    
    // Actions
    selectTest,
    setActiveTab,
    setCurrentStep,
    setImportedData,
    setSelectedColumns,
    setSelectedMetrics,
    setTestConfiguration,
    setStatisticConfig,
    runAnalysis,
    cancelAnalysis,
    resetAnalysis,
    loadReadyTests,
    
    // Helpers
    isStepComplete,
    convertTestToProject
  }
}
