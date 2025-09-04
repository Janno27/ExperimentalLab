'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { CheckCircle, Circle, AlertCircle, Loader2 } from 'lucide-react'
import { analysisAPI, AnalysisConfig, AnalysisResults } from '@/lib/api/analysis-api'
import { prepareAnalysisConfig, enrichAnalysisResults } from '@/lib/api/analysis-api-transformer'


interface RunScriptProps {
  onBackStep?: () => void
  onNextStep?: (results: AnalysisResults) => void
  data: Record<string, unknown>[]
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
  }>
  variationColumn: string
  userColumn?: string
  dataType?: 'aggregated' | 'raw'
  confidenceLevel: number
  statisticalMethod: 'frequentist' | 'bayesian' | 'bootstrap'
  multipleTestingCorrection: 'none' | 'bonferroni' | 'fdr'
}

type AnalysisStep = 'queued' | 'processing' | 'completed' | 'failed'

export function RunScript({
  onNextStep,
  data,
  metrics,
  variationColumn,
  userColumn,
  dataType = 'aggregated',
  confidenceLevel,
  statisticalMethod,
  multipleTestingCorrection
}: RunScriptProps) {
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('queued')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<AnalysisResults | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const metricsRef = useRef<RunScriptProps['metrics']>([])

  const startPolling = useCallback((id: string) => {
    setCurrentStep('processing')
    setProgress(30)
    
    intervalRef.current = setInterval(async () => {
      try {
        const status = await analysisAPI.checkStatus(id)
        
        if (status.status === 'completed') {
          clearInterval(intervalRef.current!)
          
          try {
            // Get results
            const analysisResults = await analysisAPI.getResults(id)
            const enrichedResults = enrichAnalysisResults(
              analysisResults.results as unknown as Record<string, unknown>,
              metricsRef.current
            )
            
            setResults(enrichedResults as unknown as AnalysisResults)
            setCurrentStep('completed')
            setProgress(100)
            
            if (onNextStep) {
              onNextStep(enrichedResults as unknown as AnalysisResults)
            }
          } catch (resultsError) {
            console.error("Failed to fetch results:", resultsError)
            setError(resultsError instanceof Error ? resultsError.message : "Analysis completed, but failed to fetch results.")
            setCurrentStep('failed')
          }
          
        } else if (status.status === 'failed') {
          clearInterval(intervalRef.current!)
          setCurrentStep('failed')
          setError(status.error || 'Analysis failed')
          setProgress(0)
          
        } else if (status.status === 'processing') {
          // Update progress based on time elapsed
          const timeElapsed = (Date.now() - startTimeRef.current) / 1000
          if (timeElapsed < 5) {
            setProgress(30 + (timeElapsed / 5) * 30) // 30% to 60% in first 5 seconds
          } else {
            setProgress(60 + Math.min((timeElapsed - 5) / 10, 1) * 30) // 60% to 90% in next 10 seconds
          }
        }
        
      } catch (err) {
        console.error('Polling error:', err)
        setError(err instanceof Error ? err.message : 'Polling failed due to a network or server error.')
        setCurrentStep('failed')
        clearInterval(intervalRef.current!)
      }
    }, 500)
  }, [onNextStep])

  const startAnalysis = useCallback(async () => {
    try {
      setCurrentStep('queued')
      setError(null)
      setProgress(10)
      
      // Transform config to API format
      const config: AnalysisConfig = prepareAnalysisConfig(
        data,
        metrics,
        variationColumn,
        userColumn,
        confidenceLevel,
        statisticalMethod,
        multipleTestingCorrection,
        dataType
      )
      metricsRef.current = metrics

      // Start analysis
      const response = await analysisAPI.startAnalysis(config)
      setProgress(20)
      
      // Start polling
      startPolling(response.job_id)
      
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start analysis')
      setCurrentStep('failed')
    }
  }, [data, metrics, variationColumn, userColumn, dataType, confidenceLevel, statisticalMethod, multipleTestingCorrection, startPolling])

  // Start analysis when component mounts
  useEffect(() => {
    startAnalysis()
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [startAnalysis])

  // Timer for elapsed time
  useEffect(() => {
    if (currentStep === 'queued' || currentStep === 'processing') {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [currentStep])

  return (
    <div className="flex h-full w-full">
      {/* Contenu principal - full width sans sidebar */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-4xl mx-auto py-8 px-6">
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Running A/B Test Analysis</h3>
                <p className="text-sm text-gray-600">Please wait while we process your data...</p>
              </div>

              {/* Progress Section */}
              <div className="space-y-6">
                {/* Current Step */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-3 mb-4">
                    {currentStep === 'queued' && <Circle className="w-6 h-6 text-gray-400" />}
                    {currentStep === 'processing' && <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />}
                    {currentStep === 'completed' && <CheckCircle className="w-6 h-6 text-green-600" />}
                    {currentStep === 'failed' && <AlertCircle className="w-6 h-6 text-red-600" />}
                    
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {currentStep === 'queued' && 'Queued'}
                      {currentStep === 'processing' && 'Processing'}
                      {currentStep === 'completed' && 'Completed'}
                      {currentStep === 'failed' && 'Failed'}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-xs text-gray-500">{progress}% Complete</p>
                </div>

                {/* Status Details */}
                {currentStep === 'processing' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      <span className="text-sm font-medium text-blue-900">Analysis in Progress</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Elapsed time: {elapsedTime.toFixed(1)}s
                    </p>
                  </div>
                )}

                {/* Results Preview */}
                {currentStep === 'completed' && results && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Analysis Completed Successfully!</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-700">
                          {results.overall_results?.total_variations || 0}
                        </div>
                        <div className="text-xs text-green-600">Variations</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-700">
                          {results.overall_results?.total_users?.toLocaleString() || 0}
                        </div>
                        <div className="text-xs text-green-600">Total Users</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-700">
                          {results.overall_results?.significant_metrics || 0}/{results.overall_results?.total_metrics || 0}
                        </div>
                        <div className="text-xs text-green-600">Significant Metrics</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {currentStep === 'failed' && error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium text-red-900">Analysis Failed</span>
                    </div>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-center pt-6">
                {currentStep === 'completed' ? (
                  <button
                    onClick={() => onNextStep && onNextStep(results!)}
                    className="px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View Full Results
                  </button>
                ) : currentStep === 'failed' ? (
                  <button
                    onClick={startAnalysis}
                    className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Retry Analysis
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 