'use client'

import { useMemo } from 'react'
import { Clock, TrendingUp, Target } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useDashboardContext } from '@/contexts/DashboardContext'

interface AnalysisMetricsProps {
  selectedMonth?: Date
  showComparison?: boolean
}

export function AnalysisMetrics({ 
  selectedMonth = new Date(),
  showComparison = false
}: AnalysisMetricsProps) {
  const { filteredExperimentations, loading, error } = useDashboardContext()

  // Calculer les métriques d'analyse pour le mois sélectionné et le mois précédent
  const { metrics, previousMetrics } = useMemo(() => {
    if (!filteredExperimentations || filteredExperimentations.length === 0) {
      return {
        metrics: {
          significantTestRate: 0,
          avgTimeReadyToAnalysis: 0,
          avgTimeAnalysisToDone: 0,
          totalTests: 0,
          conclusiveTests: 0
        },
        previousMetrics: {
          significantTestRate: 0,
          avgTimeReadyToAnalysis: 0,
          avgTimeAnalysisToDone: 0,
          totalTests: 0,
          conclusiveTests: 0
        }
      }
    }

    // Calculer les dates pour le mois sélectionné et le mois précédent
    const selectedDate = new Date(selectedMonth)
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    
    const startOfPreviousMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
    const endOfPreviousMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0)

    // Filtrer les tests du mois courant (utilise Date - Ready for Analysis)
    const currentMonthTests = filteredExperimentations.filter(record => {
      const readyDate = record.fields['Date - Ready for Analysis']
      if (!readyDate) return false
      const readyDateObj = new Date(readyDate)
      return readyDateObj >= startOfMonth && readyDateObj <= endOfMonth
    })

    // Filtrer les tests du mois précédent
    const previousMonthTests = filteredExperimentations.filter(record => {
      const readyDate = record.fields['Date - Ready for Analysis']
      if (!readyDate) return false
      const readyDateObj = new Date(readyDate)
      return readyDateObj >= startOfPreviousMonth && readyDateObj <= endOfPreviousMonth
    })

    // Calculer les métriques pour le mois courant
    const doneProjectsCurrent = currentMonthTests.filter(record => record.fields.Status === 'Done')
    const conclusiveTestsCurrent = doneProjectsCurrent.filter(record => {
      const conclusive = record.fields['Conclusive vs Non Conclusive']
      return conclusive === 'Conclusive'
    }).length

    const significantTestRateCurrent = doneProjectsCurrent.length > 0 
      ? (conclusiveTestsCurrent / doneProjectsCurrent.length) * 100 
      : 0

    // Calculer les métriques pour le mois précédent
    const doneProjectsPrevious = previousMonthTests.filter(record => record.fields.Status === 'Done')
    const conclusiveTestsPrevious = doneProjectsPrevious.filter(record => {
      const conclusive = record.fields['Conclusive vs Non Conclusive']
      return conclusive === 'Conclusive'
    }).length

    const significantTestRatePrevious = doneProjectsPrevious.length > 0 
      ? (conclusiveTestsPrevious / doneProjectsPrevious.length) * 100 
      : 0

    // Fonction helper pour valider et convertir les valeurs numériques (gère "X days", inclut 0 days)
    const parseValidNumber = (value: unknown): number | null => {
      if (value === null || value === undefined || value === '') {
        return null
      }
      
      // Si c'est une chaîne comme "3 days" ou "0 days", extraire le nombre
      if (typeof value === 'string') {
        const match = value.match(/^(\d+(?:\.\d+)?)\s*days?$/i)
        if (match) {
          const num = Number(match[1])
          return !isNaN(num) && num >= 0 ? num : null // Inclut 0 maintenant
        }
        // Essayer de parser directement si ce n'est pas au format "X days"
        const num = Number(value)
        return !isNaN(num) && num >= 0 ? num : null // Inclut 0 maintenant
      }
      
      const num = Number(value)
      return !isNaN(num) && num >= 0 ? num : null // Inclut 0 maintenant
    }

    // Calculer les temps moyens pour le mois courant
    const currentMonthReadyToAnalysis = currentMonthTests
      .map(record => {
        const days = parseValidNumber(record.fields['Days from Waiting for Analysis to Analysing'])
        return { record, days }
      })
      .filter(item => item.days !== null)
    
    const avgTimeReadyToAnalysisCurrent = currentMonthReadyToAnalysis.length > 0
      ? currentMonthReadyToAnalysis.reduce((sum, item) => sum + item.days!, 0) / currentMonthReadyToAnalysis.length
      : 0

    const currentMonthAnalysisToDone = currentMonthTests
      .map(record => {
        const days = parseValidNumber(record.fields['Days from Analysing to Done'])
        return { record, days }
      })
      .filter(item => item.days !== null)
    
    const avgTimeAnalysisToDoneCurrent = currentMonthAnalysisToDone.length > 0
      ? currentMonthAnalysisToDone.reduce((sum, item) => sum + item.days!, 0) / currentMonthAnalysisToDone.length
      : 0

    // Calculer les temps moyens pour le mois précédent
    const previousMonthReadyToAnalysis = previousMonthTests
      .map(record => {
        const days = parseValidNumber(record.fields['Days from Waiting for Analysis to Analysing'])
        return { record, days }
      })
      .filter(item => item.days !== null)
    
    const avgTimeReadyToAnalysisPrevious = previousMonthReadyToAnalysis.length > 0
      ? previousMonthReadyToAnalysis.reduce((sum, item) => sum + item.days!, 0) / previousMonthReadyToAnalysis.length
      : 0

    const previousMonthAnalysisToDone = previousMonthTests
      .map(record => {
        const days = parseValidNumber(record.fields['Days from Analysing to Done'])
        return { record, days }
      })
      .filter(item => item.days !== null)
    
    const avgTimeAnalysisToDonePrevious = previousMonthAnalysisToDone.length > 0
      ? previousMonthAnalysisToDone.reduce((sum, item) => sum + item.days!, 0) / previousMonthAnalysisToDone.length
      : 0

    // Logs pour identifier les tests pris en compte
    console.log('Analysis Metrics - Tests pris en compte pour le mois sélectionné:')
    console.log('Tests avec données "Ready to Analysis":', 
      currentMonthReadyToAnalysis.map(item => ({
        name: item.record.fields.Name || item.record.fields.Title || 'Untitled',
        days: item.days,
        readyDate: item.record.fields['Date - Ready for Analysis']
      }))
    )
    console.log('Tests avec données "Analysis to Done":', 
      currentMonthAnalysisToDone.map(item => ({
        name: item.record.fields.Name || item.record.fields.Title || 'Untitled',
        days: item.days,
        readyDate: item.record.fields['Date - Ready for Analysis']
      }))
    )

    return {
      metrics: {
        significantTestRate: Math.round(significantTestRateCurrent),
        avgTimeReadyToAnalysis: Math.round(avgTimeReadyToAnalysisCurrent * 10) / 10, // 1 décimale
        avgTimeAnalysisToDone: Math.round(avgTimeAnalysisToDoneCurrent * 10) / 10, // 1 décimale
        totalTests: doneProjectsCurrent.length,
        conclusiveTests: conclusiveTestsCurrent
      },
      previousMetrics: {
        significantTestRate: Math.round(significantTestRatePrevious),
        avgTimeReadyToAnalysis: Math.round(avgTimeReadyToAnalysisPrevious * 10) / 10, // 1 décimale
        avgTimeAnalysisToDone: Math.round(avgTimeAnalysisToDonePrevious * 10) / 10, // 1 décimale
        totalTests: doneProjectsPrevious.length,
        conclusiveTests: conclusiveTestsPrevious
      }
    }
  }, [filteredExperimentations, selectedMonth])

  // Fonction pour calculer la variation en pourcentage
  const calculateVariation = (current: number, previous: number): { percentage: number; isPositive: boolean } => {
    if (previous === 0) {
      return { percentage: current > 0 ? 100 : 0, isPositive: current > 0 }
    }
    const variation = ((current - previous) / previous) * 100
    return { percentage: Math.abs(variation), isPositive: variation >= 0 }
  }

  const readyToAnalysisVariation = calculateVariation(metrics.avgTimeReadyToAnalysis, previousMetrics.avgTimeReadyToAnalysis)
  const analysisToDoneVariation = calculateVariation(metrics.avgTimeAnalysisToDone, previousMetrics.avgTimeAnalysisToDone)
  const conclusiveRateVariation = calculateVariation(metrics.significantTestRate, previousMetrics.significantTestRate)

  if (loading) {
    return (
      <div className="w-full h-[120px] bg-white border border-gray-200 rounded-md">
        {/* Layout en 2 sections - skeleton */}
        <div className="h-full flex">
          {/* Section gauche: Conclusive test rate skeleton */}
          <div className="flex-1 flex flex-col justify-center items-center border-r border-gray-100 p-3">
            <div className="text-center animate-pulse">
              <div className="flex items-center justify-center mb-1">
                <div className="w-4 h-4 bg-gray-300 rounded mr-1" />
                <div className="h-5 w-12 bg-gray-300 rounded" />
              </div>
              <div className="space-y-1">
                <div className="h-2 w-16 bg-gray-300 rounded mx-auto" />
                <div className="h-2 w-12 bg-gray-300 rounded mx-auto" />
              </div>
            </div>
          </div>

          {/* Section droite: Temps moyens skeleton */}
          <div className="flex-1 flex flex-col justify-center items-center p-3">
            <div className="text-center w-full animate-pulse">
              {/* Ligne 1: Ready to Analysis skeleton */}
              <div className="flex items-center justify-center mb-1">
                <div className="w-3 h-3 bg-gray-300 rounded mr-1" />
                <div className="h-4 w-16 bg-gray-300 rounded" />
              </div>
              <div className="h-2 w-20 bg-gray-300 rounded mx-auto mb-2" />
              
              {/* Ligne 2: Analysis to Done skeleton */}
              <div className="flex items-center justify-center mb-1">
                <div className="w-3 h-3 bg-gray-300 rounded mr-1" />
                <div className="h-4 w-16 bg-gray-300 rounded" />
              </div>
              <div className="h-2 w-18 bg-gray-300 rounded mx-auto" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-[120px] bg-white border border-red-200 rounded-md flex items-center justify-center">
        <div className="text-center text-red-400">
          <p className="text-xs">Error loading data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[120px] bg-white border border-gray-200 rounded-md">
      {/* Layout en 2 sections */}
      <div className="h-full flex">
        {/* Section gauche: Conclusive test rate */}
        <div className="flex-1 flex flex-col justify-center items-center border-r border-gray-100 p-3">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-help">
                  <div className="flex items-center justify-center mb-1">
                    <Target size={14} className="text-green-600 mr-1" />
                    <span className="text-lg font-semibold text-gray-900">
                      {metrics.significantTestRate}%
                    </span>
                    {showComparison && previousMetrics.significantTestRate > 0 && (
                      <span className={`text-[8px] ml-1 ${
                        conclusiveRateVariation.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {conclusiveRateVariation.isPositive ? '+' : '-'}{conclusiveRateVariation.percentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 leading-tight">
                    Conclusive
                    <br />
                    test rate
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p>{metrics.conclusiveTests} conclusive tests out of {metrics.totalTests} completed tests this month</p>
                {showComparison && (
                  <p className="text-gray-400 mt-1">Previous month: {previousMetrics.conclusiveTests}/{previousMetrics.totalTests} ({previousMetrics.significantTestRate}%)</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Section droite: Temps moyens superposés */}
        <div className="flex-1 flex flex-col justify-center items-center p-3">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-help w-full">
                  {/* Ligne 1: Ready to Analysis */}
                  <div className="flex items-center justify-center mb-1">
                    <Clock size={12} className="text-blue-600 mr-1" />
                    <span className="text-base font-semibold text-gray-900">
                      {metrics.avgTimeReadyToAnalysis} days
                    </span>
                    {showComparison && previousMetrics.avgTimeReadyToAnalysis > 0 && (
                      <span className={`text-[8px] ml-1 ${
                        !readyToAnalysisVariation.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {readyToAnalysisVariation.isPositive ? '+' : '-'}{readyToAnalysisVariation.percentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-gray-500 mb-2 leading-tight">
                    Avg. ready to analysis
                  </p>
                  
                  {/* Ligne 2: Analysis to Done */}
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp size={12} className="text-purple-600 mr-1" />
                    <span className="text-base font-semibold text-gray-900">
                      {metrics.avgTimeAnalysisToDone} days
                    </span>
                    {showComparison && previousMetrics.avgTimeAnalysisToDone > 0 && (
                      <span className={`text-[8px] ml-1 ${
                        !analysisToDoneVariation.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {analysisToDoneVariation.isPositive ? '+' : '-'}{analysisToDoneVariation.percentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-gray-500 leading-tight">
                    Avg. analysis to done
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <div>
                  <p><strong>Ready to Analysis:</strong> {metrics.avgTimeReadyToAnalysis} days average</p>
                  <p><strong>Analysis to Done:</strong> {metrics.avgTimeAnalysisToDone} days average</p>
                  <p className="text-gray-400 mt-1">Based on experiments from this month</p>
                  {showComparison && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-gray-400">Previous month:</p>
                      <p>Ready to Analysis: {previousMetrics.avgTimeReadyToAnalysis} days</p>
                      <p>Analysis to Done: {previousMetrics.avgTimeAnalysisToDone} days</p>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
