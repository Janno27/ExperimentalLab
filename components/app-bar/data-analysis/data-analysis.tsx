'use client'

import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react'
import { fetchExperimentations, fetchMarkets, fetchOwners, fetchKPIs, fetchPages, fetchProducts } from '@/lib/airtable'
import { SelectAnalysis, SelectColumns, TestConfiguration, SuggestedMetrics, StatisticConfiguration, type StatisticConfig } from './configure-analysis'
import { ResultsView } from './ResultsView'
import { DetailsSelectAnalysis } from './DetailsSelectAnalysis'
import { DataImport } from './DataImport'
import { RunScript } from './RunScript'
import type { Project } from '@/hooks/useExperimentation'

interface ReadyForAnalysisTest {
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
    estimatedTime: '30 days',
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
    estimatedTime: '30 days',
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

interface DataAnalysisProps {
  onStepChange?: (step: number) => void
  showDataImport?: boolean
  setShowDataImport?: (show: boolean) => void
  activeTab?: string
  setActiveTab?: (tab: string) => void
}

export interface DataAnalysisRef {
  handleBackStep?: () => void
  handleFilterClick?: () => void
  getActiveFiltersCount?: () => number
}

export const DataAnalysis = forwardRef<DataAnalysisRef, DataAnalysisProps>(({
  onStepChange,
  showDataImport = false,
  setShowDataImport,
  activeTab = 'existing'
}, ref) => {
  const [importedFileData, setImportedFileData] = useState<Record<string, unknown>[]>([])
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [selectedTest, setSelectedTest] = useState<Project | null>(null)
  const [readyTests, setReadyTests] = useState<ReadyForAnalysisTest[]>([])
  const [loading, setLoading] = useState(true)
  const [showSelectColumns, setShowSelectColumns] = useState(false)
  const [showTestConfiguration, setShowTestConfiguration] = useState(false)
  const [showSuggestedMetrics, setShowSuggestedMetrics] = useState(false)
  const [showStatisticConfiguration, setShowStatisticConfiguration] = useState(false)
  const [showRunScript, setShowRunScript] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedMetrics, setSelectedMetrics] = useState<Array<{
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
  }>>([])
  const [testConfiguration, setTestConfiguration] = useState<{ variationColumn: string; userColumn: string; dataType: 'aggregated' | 'raw' }>({
    variationColumn: '',
    userColumn: '',
    dataType: 'aggregated'
  })
  const [statisticConfig, setStatisticConfig] = useState<StatisticConfig>({
    confidenceLevel: 85,
    statisticalMethod: 'frequentist',
    multipleTestingCorrection: 'none'
  })
  const [analysisResults, setAnalysisResults] = useState<{
    overall_results?: {
      total_users?: number
    }
    metric_results?: Array<{
      metric_name: string
      metric_type: string
      metric_unit?: string
      metric_currency?: string
      metric_decimals?: number
      variation_stats: Array<{
        variation: string
        sample_size: number
        mean: number
        conversions?: number
        conversion_rate?: number
        total_revenue?: number
        revenue_per_user?: number
      }>
      pairwise_comparisons: Array<{
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
      }>
      is_significant: boolean
    }>
  } | null>(null)
  
  const resultsViewRef = useRef<{ handleBackStep?: () => void, handleFilterClick?: () => void, getActiveFiltersCount?: () => number }>(null)

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleBackStep: () => resultsViewRef.current?.handleBackStep?.(),
    handleFilterClick: () => resultsViewRef.current?.handleFilterClick?.(),
    getActiveFiltersCount: () => resultsViewRef.current?.getActiveFiltersCount?.() || 0
  }))

  // Function to fetch "Ready for Analysis" tests
  const fetchReadyForAnalysisTests = async () => {
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
      // Using any for Airtable data due to complex nested types
      const readyTests = experimentations
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((exp: any) => exp.fields?.Status === 'Ready for Analysis')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      
      setReadyTests(readyTests.length > 0 ? readyTests : mockupTests)
    } catch (error) {
      console.error('Error fetching tests:', error)
      setReadyTests(mockupTests)
    } finally {
      setLoading(false)
    }
  }

  // Load tests on component mount
  useEffect(() => {
    fetchReadyForAnalysisTests()
  }, [])

  // Convertir ReadyForAnalysisTest en Project
  const convertTestToProject = (test: ReadyForAnalysisTest): Project => {
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
      // Timeline fields
      readyForAnalysisDate: undefined,
      analysisStartDate: undefined,
      analysisEndDate: undefined,
      doneDate: undefined,
      timeFromReadyToAnalysis: undefined,
      timeFromAnalysisToDone: undefined,
      tool: '', // Will be filled from fields if available
      scope: test.scope || '',
      region: test.market || '', // Using market as region for now
      // Data fields
      audience: test.audience || '',
      conversion: test.conversion || '',
      existingRate: test.existingRate || '',
      trafficAllocation: test.trafficAllocation || '',
      // Audience fields
      page: test.page || '',
      product: test.product || '',
      devices: test.devices || '',
      // Description fields
      hypothesis: test.hypothesis || '',
      description: test.description || '',
      context: test.context || '',
      // Images
      control: test.control,
      variation1: test.variation,
      // Results
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
  }

  // Handle test selection
  const handleTestSelect = (test: ReadyForAnalysisTest) => {
    const project = convertTestToProject(test)
    setSelectedTest(project)
    // L'étape 1 est complétée quand un test est sélectionné
    if (onStepChange) {
      onStepChange(1)
    }
  }

  // Handle opening data import
  const handleStartAnalysis = () => {
    if (setShowDataImport) {
      setShowDataImport(true)
    }
    if (onStepChange) {
      onStepChange(2)
    }
  }

  // Gérer le passage à l'étape de sélection des colonnes
  const handleDataImportNext = (fileData: Record<string, unknown>[]) => {
    setImportedFileData(fileData)
    setShowSelectColumns(true)
    if (setShowDataImport) {
      setShowDataImport(false)
    }
    if (onStepChange) {
      onStepChange(3)
    }
  }

  // Gérer le passage à l'étape de configuration du test
  const handleSelectColumnsNext = (columns: string[]) => {
    setSelectedColumns(columns)
    setShowSelectColumns(false)
    setShowTestConfiguration(true)
  }

  // Gérer le retour depuis la configuration du test
  const handleTestConfigurationBack = () => {
    setShowTestConfiguration(false)
    setShowSelectColumns(true)
  }

  // Gérer le passage à l'étape des métriques suggérées
  const handleTestConfigurationNext = (config: { variationColumn: string; userColumn: string; dataType: 'aggregated' | 'raw' }) => {
    setTestConfiguration(config)
    setShowTestConfiguration(false)
    setShowSuggestedMetrics(true)
  }

  // Gérer le retour depuis les métriques suggérées
  const handleSuggestedMetricsBack = () => {
    setShowSuggestedMetrics(false)
    setShowTestConfiguration(true)
  }

  // Gérer le passage à l'étape suivante depuis les métriques suggérées
  const handleSuggestedMetricsNext = (metrics: typeof selectedMetrics) => {
    setSelectedMetrics(metrics)
    setShowSuggestedMetrics(false)
    setShowStatisticConfiguration(true)
  }

  // Gérer le retour depuis la configuration statistique
  const handleStatisticConfigurationBack = () => {
    setShowStatisticConfiguration(false)
    setShowSuggestedMetrics(true)
  }

  // Gérer le passage à l'étape suivante depuis la configuration statistique
  const handleStatisticConfigurationNext = () => {
    setShowStatisticConfiguration(false)
    setShowRunScript(true)
    if (onStepChange) {
      onStepChange(4)
    }
  }

  // Gérer les changements de configuration statistique
  const handleStatisticConfigChange = (newConfig: StatisticConfig) => {
    setStatisticConfig(newConfig)
  }

  // Gérer le passage aux résultats depuis RunScript
  const handleRunScriptNext = (results: typeof analysisResults) => {
    setAnalysisResults(results)
    setShowRunScript(false)
    setShowResults(true)
    if (onStepChange) {
      onStepChange(5)
    }
  }

  // Gérer le retour depuis les résultats - retourner vers SelectColumns
  const handleResultsBack = () => {
    setShowResults(false)
    setShowRunScript(false)
    setShowStatisticConfiguration(false)
    setShowSuggestedMetrics(false)
    setShowTestConfiguration(false)
    setShowSelectColumns(true)
    if (onStepChange) {
      onStepChange(2)
    }
  }

  // Gérer le retour depuis RunScript
  const handleRunScriptBack = () => {
    setShowRunScript(false)
    setShowStatisticConfiguration(true)
  }

  // Si on affiche les résultats, montrer seulement ce composant
  if (showResults) {
    return (
      <div className="w-full h-[88vh] overflow-hidden flex flex-col">
        <ResultsView
          ref={resultsViewRef}
          onBackStep={handleResultsBack}
          analysisResults={analysisResults || undefined}
          selectedTest={selectedTest || undefined}
          originalData={importedFileData}
          metrics={selectedMetrics}
          variationColumn={testConfiguration.variationColumn}
          userColumn={testConfiguration.userColumn}
          dataType={testConfiguration.dataType}
          confidenceLevel={statisticConfig.confidenceLevel}
          statisticalMethod={statisticConfig.statisticalMethod}
          multipleTestingCorrection={statisticConfig.multipleTestingCorrection}
        />
      </div>
    )
  }

  // Si on affiche RunScript, montrer seulement ce composant
  if (showRunScript) {
    return (
      <div className="w-full h-[88vh] overflow-hidden flex flex-col">
        <RunScript
          onBackStep={handleRunScriptBack}
          onNextStep={handleRunScriptNext}
          data={importedFileData}
          metrics={selectedMetrics}
          variationColumn={testConfiguration.variationColumn}
          userColumn={testConfiguration.userColumn}
          dataType={testConfiguration.dataType}
          confidenceLevel={statisticConfig.confidenceLevel}
          statisticalMethod={statisticConfig.statisticalMethod}
          multipleTestingCorrection={statisticConfig.multipleTestingCorrection}
        />
      </div>
    )
  }

  // Si on affiche la configuration statistique, montrer seulement ce composant
  if (showStatisticConfiguration) {
    return (
      <div className="w-full h-[88vh] overflow-hidden flex flex-col">
        <StatisticConfiguration
          onNextStep={handleStatisticConfigurationNext}
          onBackStep={handleStatisticConfigurationBack}
          onConfigurationChange={handleStatisticConfigChange}
          initialConfig={statisticConfig}
        />
      </div>
    )
  }

  // Si on affiche les métriques suggérées, montrer seulement ce composant
  if (showSuggestedMetrics) {
    return (
      <div className="w-full h-[88vh] overflow-hidden flex flex-col">
        <SuggestedMetrics
          onNextStep={handleSuggestedMetricsNext}
          onBackStep={handleSuggestedMetricsBack}
          fileData={importedFileData}
          selectedColumns={selectedColumns}
        />
      </div>
    )
  }

  // Si on affiche la configuration du test, montrer seulement ce composant
  if (showTestConfiguration) {
    return (
      <div className="w-full h-full overflow-hidden flex flex-col">
        <TestConfiguration
          onNextStep={handleTestConfigurationNext}
          onBackStep={handleTestConfigurationBack}
          selectedColumns={selectedColumns}
        />
      </div>
    )
  }

  // Si on affiche la sélection des colonnes, montrer seulement ce composant
  if (showSelectColumns) {
    return (
      <div className="w-full h-full overflow-hidden flex flex-col">
        <SelectColumns
          onNextStep={handleSelectColumnsNext}
          fileData={importedFileData}
        />
      </div>
    )
  }

  // Si data import is shown, display only this component
  if (showDataImport) {
    return (
      <div className="w-full h-full overflow-hidden flex flex-col">
        <DataImport
          onNextStep={handleDataImportNext}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab content with full height */}
      {activeTab === 'existing' && (
        <div className="w-full h-full overflow-hidden flex flex-col">
          <div className="flex flex-1 overflow-hidden gap-2">
            {/* Column 1: List of tests (always 50% width) */}
            <div className="w-1/2 overflow-hidden">
              <SelectAnalysis
                tests={readyTests}
                loading={loading}
                onTestSelect={handleTestSelect}
                selectedTestId={selectedTest?.id}
              />
            </div>

            {/* Column 2: Details of the selected test (always 50% width) */}
            <div className="w-1/2 bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              {selectedTest ? (
                <DetailsSelectAnalysis
                  project={selectedTest}
                  onDataRefresh={fetchReadyForAnalysisTests}
                  onStartAnalysis={handleStartAnalysis}
                />
              ) : (
                <div className="flex items-center justify-center h-full p-6">
                  <div className="text-center">
                    <p className="text-gray-600">
                      Select a test to view its details
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scratch' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-gray-600">
              Configuration interface to be developed...
            </p>
          </div>
        </div>
      )}
    </div>
  )
})

DataAnalysis.displayName = 'DataAnalysis' 