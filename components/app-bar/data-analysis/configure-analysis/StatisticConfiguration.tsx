'use client'

import React, { useState, useRef, useEffect } from 'react'
import { CheckCircle, ChevronDown, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface StatisticConfigurationProps {
  onNextStep?: () => void
  onBackStep?: () => void
  onConfigurationChange: (config: StatisticConfig) => void
  initialConfig?: StatisticConfig
}

export interface StatisticConfig {
  confidenceLevel: number
  statisticalMethod: 'frequentist' | 'bayesian' | 'bootstrap'
  multipleTestingCorrection: 'none' | 'bonferroni' | 'fdr'
}

const defaultConfig: StatisticConfig = {
  confidenceLevel: 85,
  statisticalMethod: 'frequentist',
  multipleTestingCorrection: 'none'
}

export function StatisticConfiguration({ 
  onNextStep, 
  onBackStep, 
  onConfigurationChange,
  initialConfig = defaultConfig 
}: StatisticConfigurationProps) {
  const [config, setConfig] = useState<StatisticConfig>(initialConfig)
  const [showMethodDropdown, setShowMethodDropdown] = useState(false)
  const [showCorrectionDropdown, setShowCorrectionDropdown] = useState(false)
  const methodDropdownRef = useRef<HTMLDivElement>(null)
  const correctionDropdownRef = useRef<HTMLDivElement>(null)

  const handleConfigChange = (key: keyof StatisticConfig, value: unknown) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    onConfigurationChange(newConfig)
  }

  const handleNextStep = () => {
    if (onNextStep) {
      onNextStep()
    }
  }

  const handleBackStep = () => {
    if (onBackStep) {
      onBackStep()
    }
  }

  // Fermer les dropdowns en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (methodDropdownRef.current && !methodDropdownRef.current.contains(event.target as Node)) {
        setShowMethodDropdown(false)
      }
      if (correctionDropdownRef.current && !correctionDropdownRef.current.contains(event.target as Node)) {
        setShowCorrectionDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="flex h-full w-full">
      {/* Sidebar avec stepper */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-6 flex flex-col justify-center">
        {/* Stepper vertical */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 border-2 border-green-300">
              <CheckCircle className="w-3 h-3 text-green-600" />
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-green-700">Select Columns</div>
              <div className="text-xs text-green-600">Completed</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 border-2 border-green-300">
              <CheckCircle className="w-3 h-3 text-green-600" />
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-green-700">Test Configuration</div>
              <div className="text-xs text-green-600">Completed</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 border-2 border-green-300">
              <CheckCircle className="w-3 h-3 text-green-600" />
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-green-700">Configure Metrics</div>
              <div className="text-xs text-green-600">Completed</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 border-2 border-purple-300">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-purple-700">Statistical Configuration</div>
              <div className="text-xs text-purple-600">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto py-8 flex items-center min-h-full px-8">
            <div className="w-full space-y-8">
            {/* Header Section */}
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Statistical Configuration</h3>
                <p className="text-sm text-gray-600">
                  Configure statistical parameters for your analysis
                </p>
              </div>
            </div>

            {/* Statistical Settings */}
            <div className="space-y-6">
              
              {/* Confidence Level */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Confidence Level</span>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent 
                          side="top" 
                          align="center" 
                          className="p-0 border-0 shadow-lg bg-transparent [&>svg]:fill-white [&>svg]:stroke-white"
                        >
                          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
                            <div className="text-xs text-gray-900">
                              <strong>Confidence Level:</strong> The probability that the true effect lies within the confidence interval.<br/><br/>
                              <strong>80-85%:</strong> Lower confidence, faster results, higher risk of false positives<br/>
                              <strong>90-95%:</strong> Standard choice, good balance between speed and accuracy<br/>
                              <strong>99%:</strong> Highest confidence, slower results, most conservative approach
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-sm font-medium text-purple-600">{config.confidenceLevel}%</span>
                </div>
                <div className="px-4">
                  <input
                    type="range"
                    min="80"
                    max="99"
                    value={config.confidenceLevel}
                    onChange={(e) => handleConfigChange('confidenceLevel', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>80%</span>
                    <span>99%</span>
                  </div>
                </div>
              </div>

              

              {/* Statistical Method */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Statistical Method</span>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent 
                        side="top" 
                        align="center" 
                        className="p-0 border-0 shadow-lg bg-transparent [&>svg]:fill-white [&>svg]:stroke-white"
                      >
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
                                                      <div className="text-xs text-gray-900">
                              <strong>Statistical Method:</strong> The approach used to analyze your data.<br/><br/>
                              <strong>Frequentist:</strong> Traditional p-value approach. Tests if the observed effect is unlikely under the null hypothesis. Most common in A/B testing.<br/><br/>
                              <strong>Bayesian:</strong> Probability-based inference. Provides the probability that your hypothesis is true given the data. More intuitive interpretation.<br/><br/>
                              <strong>Bootstrap:</strong> Resampling-based estimation. Creates confidence intervals by resampling your data. Robust to non-normal distributions.
                            </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative" ref={methodDropdownRef}>
                  <div 
                    className="flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => setShowMethodDropdown(!showMethodDropdown)}
                  >
                    <span className="text-sm text-gray-900 capitalize">{config.statisticalMethod}</span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                  
                  {showMethodDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      {(['frequentist', 'bayesian', 'bootstrap'] as const).map((method) => (
                        <button
                          key={method}
                          onClick={() => {
                            handleConfigChange('statisticalMethod', method)
                            setShowMethodDropdown(false)
                          }}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 capitalize"
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>



              {/* Multiple Testing Correction */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Multiple Testing Correction</span>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent 
                        side="top" 
                        align="center" 
                        className="p-0 border-0 shadow-lg bg-transparent [&>svg]:fill-white [&>svg]:stroke-white"
                      >
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
                                                      <div className="text-xs text-gray-900">
                              <strong>Multiple Testing Correction:</strong> Controls for false positives when testing multiple hypotheses.<br/><br/>
                              <strong>None:</strong> No correction applied. Use when testing only one primary metric or when you want to maximize statistical power.<br/><br/>
                              <strong>Bonferroni:</strong> Conservative correction that divides significance level by number of tests. Very safe but may miss real effects.<br/><br/>
                              <strong>FDR:</strong> False Discovery Rate control. Less conservative than Bonferroni, controls the proportion of false positives among significant results.
                            </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative" ref={correctionDropdownRef}>
                  <div 
                    className="flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => setShowCorrectionDropdown(!showCorrectionDropdown)}
                  >
                    <span className="text-sm text-gray-900 capitalize">{config.multipleTestingCorrection}</span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                  
                  {showCorrectionDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      {(['none', 'bonferroni', 'fdr'] as const).map((correction) => (
                        <button
                          key={correction}
                          onClick={() => {
                            handleConfigChange('multipleTestingCorrection', correction)
                            setShowCorrectionDropdown(false)
                          }}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 capitalize"
                        >
                          {correction}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>



            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-4">
              <button
                onClick={handleBackStep}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back
              </button>
              
              <button
                onClick={handleNextStep}
                className="px-6 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
              >
                Run Analysis
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 