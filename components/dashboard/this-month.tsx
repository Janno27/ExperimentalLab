'use client'

import { useMemo } from 'react'
import { Play, TrendingUp, XCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useDashboardContext } from '@/contexts/DashboardContext'

interface ThisMonthProps {
  showComparison?: boolean
  selectedMonth?: Date
}

export function ThisMonth({ showComparison = false, selectedMonth = new Date() }: ThisMonthProps) {
  const { filteredExperimentations, loading, error } = useDashboardContext()

  // Calculer les stats du mois sélectionné et du mois précédent
  const { stats, previousStats } = useMemo(() => {
    if (!filteredExperimentations || filteredExperimentations.length === 0) {
      return {
        stats: { testLive: 0, testConclusive: 0, testNonConclusive: 0 },
        previousStats: { testLive: 0, testConclusive: 0, testNonConclusive: 0 }
      }
    }

    const selectedDate = new Date(selectedMonth)
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    
    const startOfPreviousMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
    const endOfPreviousMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0)

    // Stats mois actuel
    const testLive = filteredExperimentations.filter(record => 
      record.fields.Status === 'Running'
    ).length

    const testConclusive = filteredExperimentations.filter(record => {
      const doneDate = record.fields['Date - Done']
      const conclusive = record.fields['Conclusive vs Non Conclusive']
      
      if (!doneDate || conclusive !== 'Conclusive') return false
      
      const doneDateObj = new Date(doneDate)
      return doneDateObj >= startOfMonth && doneDateObj <= endOfMonth
    }).length

    const testNonConclusive = filteredExperimentations.filter(record => {
      const doneDate = record.fields['Date - Done']
      const conclusive = record.fields['Conclusive vs Non Conclusive']
      
      if (!doneDate || conclusive !== 'Non Conclusive') return false
      
      const doneDateObj = new Date(doneDate)
      return doneDateObj >= startOfMonth && doneDateObj <= endOfMonth
    }).length

    // Stats mois précédent
    const previousTestLive = testLive // Les tests live sont l'état actuel
    
    const previousTestConclusive = filteredExperimentations.filter(record => {
      const doneDate = record.fields['Date - Done']
      const conclusive = record.fields['Conclusive vs Non Conclusive']
      
      if (!doneDate || conclusive !== 'Conclusive') return false
      
      const doneDateObj = new Date(doneDate)
      return doneDateObj >= startOfPreviousMonth && doneDateObj <= endOfPreviousMonth
    }).length

    const previousTestNonConclusive = filteredExperimentations.filter(record => {
      const doneDate = record.fields['Date - Done']
      const conclusive = record.fields['Conclusive vs Non Conclusive']
      
      if (!doneDate || conclusive !== 'Non Conclusive') return false
      
      const doneDateObj = new Date(doneDate)
      return doneDateObj >= startOfPreviousMonth && doneDateObj <= endOfPreviousMonth
    }).length

    return {
      stats: { testLive, testConclusive, testNonConclusive },
      previousStats: { testLive: previousTestLive, testConclusive: previousTestConclusive, testNonConclusive: previousTestNonConclusive }
    }
  }, [filteredExperimentations, selectedMonth])

  // Fonction pour obtenir les détails des tests
  const getTestDetails = (type: 'live' | 'conclusive' | 'nonConclusive') => {
    if (!filteredExperimentations) return []
    
    const selectedDate = new Date(selectedMonth)
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    
    switch (type) {
      case 'live':
        return filteredExperimentations.filter(record => record.fields.Status === 'Running')
      case 'conclusive':
        return filteredExperimentations.filter(record => {
          const doneDate = record.fields['Date - Done']
          const conclusive = record.fields['Conclusive vs Non Conclusive']
          if (!doneDate || conclusive !== 'Conclusive') return false
          const doneDateObj = new Date(doneDate)
          return doneDateObj >= startOfMonth && doneDateObj <= endOfMonth
        })
      case 'nonConclusive':
        return filteredExperimentations.filter(record => {
          const doneDate = record.fields['Date - Done']
          const conclusive = record.fields['Conclusive vs Non Conclusive']
          if (!doneDate || conclusive !== 'Non Conclusive') return false
          const doneDateObj = new Date(doneDate)
          return doneDateObj >= startOfMonth && doneDateObj <= endOfMonth
        })
      default:
        return []
    }
  }

  // Fonction pour calculer la variation en pourcentage
  const calculateVariation = (current: number, previous: number): { percentage: number; isPositive: boolean } => {
    if (previous === 0) {
      return { percentage: current > 0 ? 100 : 0, isPositive: current > 0 }
    }
    const variation = ((current - previous) / previous) * 100
    return { percentage: Math.abs(variation), isPositive: variation >= 0 }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 py-2 w-full min-h-[115px]">
        <div className="space-y-2 px-4">
          <div className="pb-1.5 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 py-2 w-full min-h-[115px]">
        <div className="flex items-center justify-center py-4 text-gray-500">
          <div className="text-center">
            <XCircle className="w-5 h-5 mx-auto mb-1 text-gray-300" />
            <p className="text-[10px]">Erreur de chargement</p>
            <p className="text-[8px] text-gray-400 mt-0.5">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const conclusiveVariation = calculateVariation(stats.testConclusive, previousStats.testConclusive)
  const nonConclusiveVariation = calculateVariation(stats.testNonConclusive, previousStats.testNonConclusive)

  return (
    <TooltipProvider delayDuration={0}>
      <div className="bg-white rounded-lg border border-gray-200 py-2 w-full min-h-[115px]">
        <div className="space-y-2 px-4">
          {/* Tests Live - Séparé visuellement car c'est l'état actuel */}
          <div className="pb-1.5 border-b border-gray-100">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-between items-center hover:bg-gray-50 rounded px-1 -mx-1">
                  <div className="flex items-center gap-1.5">
                    <Play className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-gray-600">Live Tests</span>
                    <span className="text-xs text-gray-400">(current state)</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-gray-900">{stats.testLive}</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="p-0 border-0 shadow-lg bg-transparent">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Live Tests ({stats.testLive})</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {getTestDetails('live').map((record, index) => (
                      <div key={record.id || index} className="text-xs text-gray-600 truncate">
                        • {record.fields.Name || record.fields.Title || 'Untitled'}
                      </div>
                    ))}
                    {getTestDetails('live').length === 0 && (
                      <div className="text-xs text-gray-500">No live tests</div>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Métriques du mois sélectionné */}
          <div className="space-y-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-between items-center hover:bg-gray-50 rounded px-1 -mx-1">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-purple-500" />
                    <span className="text-xs text-gray-600">Conclusive Tests</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-gray-900">{stats.testConclusive}</span>
                    {showComparison && previousStats.testConclusive > 0 && (
                      <span className={`text-[8px] ${
                        conclusiveVariation.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {conclusiveVariation.isPositive ? '+' : '-'}{conclusiveVariation.percentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="p-0 border-0 shadow-lg bg-transparent">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Conclusive Tests This Month ({stats.testConclusive})</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {getTestDetails('conclusive').map((record, index) => (
                      <div key={record.id || index} className="text-xs text-gray-600 truncate">
                        • {record.fields.Name || record.fields.Title || 'Untitled'}
                      </div>
                    ))}
                    {getTestDetails('conclusive').length === 0 && (
                      <div className="text-xs text-gray-500">No conclusive tests this month</div>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-between items-center hover:bg-gray-50 rounded px-1 -mx-1">
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-3 w-3 text-orange-500" />
                    <span className="text-xs text-gray-600">Non Conclusive Tests</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-gray-900">{stats.testNonConclusive}</span>
                    {showComparison && previousStats.testNonConclusive > 0 && (
                      <span className={`text-[8px] ${
                        nonConclusiveVariation.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {nonConclusiveVariation.isPositive ? '+' : '-'}{nonConclusiveVariation.percentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="p-0 border-0 shadow-lg bg-transparent">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Non Conclusive Tests This Month ({stats.testNonConclusive})</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {getTestDetails('nonConclusive').map((record, index) => (
                      <div key={record.id || index} className="text-xs text-gray-600 truncate">
                        • {record.fields.Name || record.fields.Title || 'Untitled'}
                      </div>
                    ))}
                    {getTestDetails('nonConclusive').length === 0 && (
                      <div className="text-xs text-gray-500">No non conclusive tests this month</div>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
} 