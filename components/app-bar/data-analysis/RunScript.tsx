'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { AlertCircle, Rocket, Sparkles, Trophy } from 'lucide-react'
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
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<AnalysisResults | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [animationDuration] = useState(() => Math.floor((Math.random() * 15 + 5) * 10) / 10) // 5.0-20.0 seconds with 1 decimal
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const metricsRef = useRef<RunScriptProps['metrics']>([])

  const startPolling = useCallback((id: string) => {
    setCurrentStep('processing')
    
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
      
      // Start processing animation immediately
      setTimeout(() => {
        setCurrentStep('processing')
      }, 1000)
      
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

      // Start analysis and wait for animation duration
      const [response] = await Promise.all([
        analysisAPI.startAnalysis(config),
        new Promise(resolve => setTimeout(resolve, animationDuration * 1000))
      ])
      
      // Start polling
      startPolling(response.job_id)
      
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start analysis')
      setCurrentStep('failed')
    }
  }, [data, metrics, variationColumn, userColumn, dataType, confidenceLevel, statisticalMethod, multipleTestingCorrection, startPolling, animationDuration])

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

  const getStepMessage = () => {
    const progressRatio = elapsedTime / animationDuration
    
    switch (currentStep) {
      case 'queued':
        return "Preparing for data liftoff..."
      case 'processing':
        if (progressRatio < 0.2) return "Igniting statistical engines..."
        if (progressRatio < 0.4) return "Crunching numbers at light speed..."
        if (progressRatio < 0.6) return "Computing confidence intervals..."
        if (progressRatio < 0.8) return "Analyzing conversion patterns..."
        return "Fine-tuning the results..."
      case 'completed':
        return "Mission accomplished! Data has landed!"
      case 'failed':
        return "Houston, we have a problem..."
      default:
        return "Ready for takeoff..."
    }
  }

  const getRocketPosition = () => {
    if (currentStep === 'queued') return 'translate-y-0'
    if (currentStep === 'processing') {
      const progressRatio = elapsedTime / animationDuration
      const remainingTime = animationDuration - elapsedTime
      
      // Last 2 seconds: rocket flies away and disappears
      if (remainingTime <= 2) {
        return '-translate-y-96 scale-50 opacity-0'
      }
      
      if (progressRatio < 0.25) return '-translate-y-12'
      if (progressRatio < 0.5) return '-translate-y-24'
      if (progressRatio < 0.75) return '-translate-y-36'
      return '-translate-y-48'
    }
    if (currentStep === 'completed') return '-translate-y-96 scale-50 opacity-0'
    return 'translate-y-0'
  }

  return (
    <div className="flex h-full w-full">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full h-full flex flex-col items-center justify-center px-6 py-8">
            <div className="space-y-6 w-full max-w-5xl h-full flex flex-col">
              {/* Header */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">🚀 Analysis in Progress</h2>
                <p className={`text-lg text-gray-600 transition-all duration-1000 ${
                  currentStep === 'processing' ? 'animate-pulse' : ''
                }`}>Launching your data into the stratosphere of insights!</p>
              </div>

              {/* Rocket Animation Section - Larger and Responsive */}
              <div className="relative flex-1 min-h-[450px] max-h-[550px] bg-gradient-to-b from-gray-50 via-gray-25 to-white rounded-xl overflow-hidden border border-gray-200">
                {/* Stars Background */}
                <div className="absolute inset-0">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-1 h-1 bg-gray-300 rounded-full animate-pulse`}
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 60}%`,
                        animationDelay: `${Math.random() * 2}s`
                      }}
                    />
                  ))}
                </div>

                {/* Clouds */}
                <div className="absolute bottom-0 left-0 w-full h-32 opacity-20">
                  <div className="absolute bottom-8 left-4 w-16 h-8 bg-gray-100 rounded-full"></div>
                  <div className="absolute bottom-12 left-12 w-20 h-6 bg-gray-100 rounded-full"></div>
                  <div className="absolute bottom-6 right-8 w-24 h-10 bg-gray-100 rounded-full"></div>
                  <div className="absolute bottom-16 right-16 w-18 h-7 bg-gray-100 rounded-full"></div>
                </div>

                                 {/* Rocket */}
                <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-2000 ease-out ${getRocketPosition()}`}>
                  <div className="relative">
                    {/* Rocket Body */}
                    <div className="w-12 h-20 bg-gradient-to-b from-red-500 to-red-600 rounded-t-full relative">
                      {/* Rocket Details */}
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-300 rounded-full"></div>
                      <div className="absolute top-6 left-1 w-2 h-6 bg-blue-600 rounded-r-full"></div>
                      <div className="absolute top-6 right-1 w-2 h-6 bg-blue-600 rounded-l-full"></div>
                    </div>
                    
                    {/* Rocket Fins */}
                    <div className="absolute -bottom-2 -left-2 w-4 h-6 bg-gray-600 transform rotate-12"></div>
                    <div className="absolute -bottom-2 -right-2 w-4 h-6 bg-gray-600 transform -rotate-12"></div>
                    
                    {/* Fire Trail */}
                    {(currentStep === 'processing' || currentStep === 'queued') && (
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                        <div className="w-6 h-8 bg-gradient-to-b from-orange-400 via-red-500 to-yellow-300 rounded-b-full animate-pulse"></div>
                        <div className="w-4 h-6 bg-gradient-to-b from-yellow-300 to-transparent rounded-b-full mx-auto animate-bounce"></div>
                      </div>
                    )}
                    
                    {/* Success Sparkles */}
                    {currentStep === 'completed' && (
                      <div className="absolute -top-4 -left-4 w-8 h-8">
                        <Sparkles className="w-6 h-6 text-yellow-400 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Step Message at bottom of rocket animation */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200/50 shadow-sm">
                    <p className={`text-sm italic text-gray-700 transition-all duration-500 ${
                      currentStep === 'processing' ? 'animate-pulse' : ''
                    }`}>
                      {getStepMessage()}
                    </p>
                  </div>
                </div>

              </div>


              {/* Results Preview */}
              {currentStep === 'completed' && results && (
                <div className="bg-gradient-to-r from-gray-50 to-green-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <Trophy className="w-6 h-6 text-green-600" />
                    <span className="text-lg font-semibold text-gray-800">Mission Success! 🎉</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border border-gray-100">
                      <div className="text-2xl font-bold text-gray-700 mb-1">
                        {results.overall_results?.total_variations || 0}
                      </div>
                      <div className="text-sm text-gray-600">🎯 Variations Tested</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-gray-100">
                      <div className="text-2xl font-bold text-gray-700 mb-1">
                        {results.overall_results?.total_users?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-600">👥 Users Analyzed</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border border-gray-100">
                      <div className="text-2xl font-bold text-gray-700 mb-1">
                        {results.overall_results?.significant_metrics || 0}/{results.overall_results?.total_metrics || 0}
                      </div>
                      <div className="text-sm text-gray-600">📊 Significant Results</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {currentStep === 'failed' && error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <span className="text-lg font-semibold text-red-800">Mission Aborted! 💥</span>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-red-100">
                    <p className="text-sm text-red-700 font-mono">{error}</p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-center mt-auto pt-4">
                {currentStep === 'completed' ? (
                  <button
                    onClick={() => onNextStep && onNextStep(results!)}
                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Trophy className="w-4 h-4" />
                    Explore Mission Results
                  </button>
                ) : currentStep === 'failed' ? (
                  <button
                    onClick={startAnalysis}
                    className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Rocket className="w-4 h-4" />
                    Retry Mission
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