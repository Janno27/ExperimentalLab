'use client'

import { useMemo } from 'react'
import { Clock, TrendingUp, Target } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useDashboardContext } from '@/contexts/DashboardContext'

interface AnalysisMetricsProps {
  selectedMonth?: Date
}

export function AnalysisMetrics({ 
  selectedMonth = new Date()
}: AnalysisMetricsProps) {
  const { filteredExperimentations, loading, error } = useDashboardContext()

  // Debug logging
  console.log('AnalysisMetrics Debug:', {
    loading,
    error,
    hasData: !!filteredExperimentations,
    experimentsCount: filteredExperimentations?.length || 0,
    selectedMonth
  })

  // Debug: Examiner les noms de colonnes disponibles
  if (filteredExperimentations && filteredExperimentations.length > 0) {
    console.log('Available field names:', Object.keys(filteredExperimentations[0].fields))
    
    // Examiner les premières entrées pour voir les valeurs
    console.log('Sample data (first 3 records):', 
      filteredExperimentations.slice(0, 3).map(record => ({
        id: record.id,
        status: record.fields.Status,
        conclusive: record.fields['Conclusive vs Non Conclusive'],
        conclusive_alt: record.fields['Conclusive'], // Alternative possible
        readyToAnalysis: record.fields['Days from Waiting for Analysis to Analysing'],
        analysisToDone: record.fields['Days from Analysing to Done'],
        doneDate: record.fields['Date - Done']
      }))
    )
    
    // Compter les tests conclusifs dans toutes les données
    const allConclusiveTests = filteredExperimentations.filter(record => 
      record.fields['Conclusive vs Non Conclusive'] === 'Conclusive'
    )
    console.log('Total conclusive tests found:', allConclusiveTests.length)
  }

  // Calculer les métriques d'analyse
  const metrics = useMemo(() => {
    if (!filteredExperimentations || filteredExperimentations.length === 0) {
      return {
        significantTestRate: 0,
        avgTimeReadyToAnalysis: 0,
        avgTimeAnalysisToDone: 0,
        totalTests: 0,
        conclusiveTests: 0
      }
    }

    // TEMPORAIRE: Utiliser tous les projets "Done" pour le debug (pas de filtre de mois)
    const doneProjects = filteredExperimentations.filter(record => {
      return record.fields.Status === 'Done'
    })
    
    console.log('DEBUG - Done projects found:', doneProjects.length)
    console.log('DEBUG - Done projects sample:', doneProjects.slice(0, 3).map(p => ({
      id: p.id,
      status: p.fields.Status,
      conclusive: p.fields['Conclusive vs Non Conclusive'],
      doneDate: p.fields['Date - Done']
    })))

    // Calculer le taux de tests conclusifs (utilise uniquement "Conclusive vs Non Conclusive")
    const conclusiveTests = doneProjects.filter(record => {
      const conclusive = record.fields['Conclusive vs Non Conclusive']
      return conclusive === 'Conclusive'
    }).length

    const significantTestRate = doneProjects.length > 0 
      ? (conclusiveTests / doneProjects.length) * 100 
      : 0

    // Calculer les temps moyens UNIQUEMENT pour les tests conclusifs
    const conclusiveExperiments = filteredExperimentations.filter(record => {
      const conclusive = record.fields['Conclusive vs Non Conclusive']
      return conclusive === 'Conclusive'
    })

    // Temps moyen entre Ready for Analysis et Analysis (pour tests conclusifs seulement)
    const experimentsWithReadyToAnalysis = conclusiveExperiments.filter(record => {
      const timeFromReady = record.fields['Days from Waiting for Analysis to Analysing']
      return timeFromReady && Number(timeFromReady) > 0
    })
    
    const avgTimeReadyToAnalysis = experimentsWithReadyToAnalysis.length > 0
      ? experimentsWithReadyToAnalysis.reduce((sum, record) => {
          const days = Number(record.fields['Days from Waiting for Analysis to Analysing']) || 0
          return sum + days
        }, 0) / experimentsWithReadyToAnalysis.length
      : 0

    // Temps moyen entre Analysis et Done (pour tests conclusifs seulement)
    const experimentsWithAnalysisToDone = conclusiveExperiments.filter(record => {
      const timeFromAnalysis = record.fields['Days from Analysing to Done']
      return timeFromAnalysis && Number(timeFromAnalysis) > 0
    })
    
    const avgTimeAnalysisToDone = experimentsWithAnalysisToDone.length > 0
      ? experimentsWithAnalysisToDone.reduce((sum, record) => {
          const days = Number(record.fields['Days from Analysing to Done']) || 0
          return sum + days
        }, 0) / experimentsWithAnalysisToDone.length
      : 0

    console.log('Analysis Metrics Debug - Calculations:', {
      totalDoneProjects: doneProjects.length,
      conclusiveTests,
      significantTestRate,
      conclusiveExperimentsCount: conclusiveExperiments.length,
      experimentsWithReadyToAnalysis: experimentsWithReadyToAnalysis.length,
      experimentsWithAnalysisToDone: experimentsWithAnalysisToDone.length,
      avgTimeReadyToAnalysis,
      avgTimeAnalysisToDone
    })

    return {
      significantTestRate: Math.round(significantTestRate),
      avgTimeReadyToAnalysis: Math.round(avgTimeReadyToAnalysis),
      avgTimeAnalysisToDone: Math.round(avgTimeAnalysisToDone),
      totalTests: doneProjects.length,
      conclusiveTests
    }
  }, [filteredExperimentations])

  if (loading) {
    return (
      <div className="w-full h-[120px] bg-white border border-gray-200 rounded-md flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs">Loading...</p>
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
                    <span className="text-xl font-semibold text-gray-900">
                      {metrics.significantTestRate}%
                    </span>
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
                    <span className="text-lg font-semibold text-gray-900">
                      {metrics.avgTimeReadyToAnalysis}d
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-500 mb-2 leading-tight">
                    Avg. ready to analysis
                  </p>
                  
                  {/* Ligne 2: Analysis to Done */}
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp size={12} className="text-purple-600 mr-1" />
                    <span className="text-lg font-semibold text-gray-900">
                      {metrics.avgTimeAnalysisToDone}d
                    </span>
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
                  <p className="text-gray-400 mt-1">Based on conclusive tests only</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
