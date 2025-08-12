'use client'

import { useEffect, useState, useMemo } from 'react'
import { useExperimentation } from '@/hooks/useExperimentation'
import { Play, CheckCircle, Target, XCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'


interface ThisMonthStats {
  testLive: number
  testCompleted: number
  testConclusive: number
  testNonConclusive: number
}

interface PreviousMonthStats {
  testLive: number
  testCompleted: number
  testConclusive: number
  testNonConclusive: number
}

interface ThisMonthProps {
  showComparison?: boolean
  selectedMonth?: Date
  region?: 'APAC' | 'EMEA' | 'AMER'
  status?: string[]
  owner?: string[]
  market?: string[]
}

export function ThisMonth({ showComparison = false, selectedMonth = new Date(), region, status, owner, market }: ThisMonthProps) {
  const [stats, setStats] = useState<ThisMonthStats>({
    testLive: 0,
    testCompleted: 0,
    testConclusive: 0,
    testNonConclusive: 0
  })
  const [previousStats, setPreviousStats] = useState<PreviousMonthStats>({
    testLive: 0,
    testCompleted: 0,
    testConclusive: 0,
    testNonConclusive: 0
  })
  const [loading, setLoading] = useState(true)

  // Utiliser useExperimentation pour récupérer les données
  const { cards: allCards, loading: dataLoading } = useExperimentation({ 
    useAirtable: true, 
    timelineMode: false,
    region
  })

  // Filtrer les cartes selon les filtres appliqués (TOUS les filtres y compris Month)
  const cards = useMemo(() => {
    if (!allCards) return []
    
    let filteredCards = allCards

    // Filtrer par status
    if (status && status.length > 0) {
      filteredCards = filteredCards.filter(card => 
        status.includes(card.status || card.Status)
      )
    }

    // Filtrer par owner
    if (owner && owner.length > 0) {
      filteredCards = filteredCards.filter(card => {
        const cardOwner = card.owner || card.Owner
        if (Array.isArray(cardOwner)) {
                  return cardOwner.some(o => {
          const ownerName = typeof o === 'string' ? o : (o as { name?: string })?.name
          return owner.includes(ownerName || '')
        })
        }
        const ownerName = typeof cardOwner === 'string' ? cardOwner : (cardOwner as { name?: string })?.name
        return owner.includes(ownerName || '')
      })
    }

    // Filtrer par market
    if (market && market.length > 0) {
      filteredCards = filteredCards.filter(card => {
        const cardMarket = card.market || card.Market
        if (Array.isArray(cardMarket)) {
                  return cardMarket.some(m => {
          const marketName = typeof m === 'string' ? m : (m as { name?: string })?.name
          return market.includes(marketName || '')
        })
        }
        const marketName = typeof cardMarket === 'string' ? cardMarket : (cardMarket as { name?: string })?.name
        return market.includes(marketName || '')
      })
    }

    // Filtrer par Month (pour ThisMonth, on filtre par le mois sélectionné)
    if (selectedMonth) {
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)
      
      filteredCards = filteredCards.filter(card => {
        // Pour les tests live, pas de filtrage par mois (état actuel)
        if (card.status === 'Running') return true
        
        // Pour les autres tests, filtrer par Date - Done
        const doneDate = card['Date - Done']
        if (!doneDate) return false
        
        const doneDateObj = new Date(doneDate)
        return doneDateObj >= startOfMonth && doneDateObj <= endOfMonth
      })
    }

    return filteredCards
  }, [allCards, status, owner, market, selectedMonth])

  useEffect(() => {
    if (dataLoading || !cards) return

    // Utiliser le mois sélectionné au lieu du mois actuel
    const selectedDate = new Date(selectedMonth)
    console.log('ThisMonth using selectedMonth:', selectedDate)
    
    // Mois sélectionné
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    
    // Mois précédent
    const startOfPreviousMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
    const endOfPreviousMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0)

    // Tests live (uniquement Running) - ÉTAT ACTUEL (pas filtré par mois)
    const testLive = cards.filter(card => 
      card.status === 'Running'
    ).length

    // Tests live - mois précédent (même logique car c'est l'état actuel)
    const previousTestLive = cards.filter(card => 
      card.status === 'Running'
    ).length

    // Tests completed ce mois-ci
    const testCompleted = cards.filter(card => {
      const doneDate = card['Date - Done']
      if (!doneDate) return false
      
      const doneDateObj = new Date(doneDate)
      return doneDateObj >= startOfMonth && doneDateObj <= endOfMonth
    }).length

    // Tests completed mois précédent
    const previousTestCompleted = cards.filter(card => {
      const doneDate = card['Date - Done']
      if (!doneDate) return false
      
      const doneDateObj = new Date(doneDate)
      return doneDateObj >= startOfPreviousMonth && doneDateObj <= endOfPreviousMonth
    }).length

    // Tests conclusifs ce mois-ci
    const testConclusive = cards.filter(card => {
      const doneDate = card['Date - Done']
      const conclusive = card['Conclusive vs Non Conclusive']
      
      if (!doneDate || conclusive !== 'Conclusive') return false
      
      const doneDateObj = new Date(doneDate)
      return doneDateObj >= startOfMonth && doneDateObj <= endOfMonth
    }).length

    // Tests conclusifs mois précédent
    const previousTestConclusive = cards.filter(card => {
      const doneDate = card['Date - Done']
      const conclusive = card['Conclusive vs Non Conclusive']
      
      if (!doneDate || conclusive !== 'Conclusive') return false
      
      const doneDateObj = new Date(doneDate)
      return doneDateObj >= startOfPreviousMonth && doneDateObj <= endOfPreviousMonth
    }).length

    // Tests non conclusifs ce mois-ci
    const testNonConclusive = cards.filter(card => {
      const doneDate = card['Date - Done']
      const conclusive = card['Conclusive vs Non Conclusive']
      
      if (!doneDate || conclusive !== 'Non Conclusive') return false
      
      const doneDateObj = new Date(doneDate)
      return doneDateObj >= startOfMonth && doneDateObj <= endOfMonth
    }).length

    // Tests non conclusifs mois précédent
    const previousTestNonConclusive = cards.filter(card => {
      const doneDate = card['Date - Done']
      const conclusive = card['Conclusive vs Non Conclusive']
      
      if (!doneDate || conclusive !== 'Non Conclusive') return false
      
      const doneDateObj = new Date(doneDate)
      return doneDateObj >= startOfPreviousMonth && doneDateObj <= endOfPreviousMonth
    }).length

    setStats({
      testLive,
      testCompleted,
      testConclusive,
      testNonConclusive
    })
    
    setPreviousStats({
      testLive: previousTestLive,
      testCompleted: previousTestCompleted,
      testConclusive: previousTestConclusive,
      testNonConclusive: previousTestNonConclusive
    })
    
    setLoading(false)
  }, [cards, dataLoading, selectedMonth])

  // Fonction pour calculer la variation en pourcentage
  const calculateVariation = (current: number, previous: number): { percentage: number; isPositive: boolean } => {
    if (previous === 0) {
      return { percentage: current > 0 ? 100 : 0, isPositive: current > 0 }
    }
    const variation = ((current - previous) / previous) * 100
    return { percentage: Math.abs(variation), isPositive: variation >= 0 }
  }

  // Fonction pour obtenir les détails des tests
  const getTestDetails = (type: 'live' | 'completed' | 'conclusive' | 'nonConclusive') => {
    if (!cards) return []
    
    const selectedDate = new Date(selectedMonth)
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    
    switch (type) {
      case 'live':
        return cards.filter(card => card.status === 'Running')
      case 'completed':
        return cards.filter(card => {
          const doneDate = card['Date - Done']
          if (!doneDate) return false
          const doneDateObj = new Date(doneDate)
          return doneDateObj >= startOfMonth && doneDateObj <= endOfMonth
        })
      case 'conclusive':
        return cards.filter(card => {
          const doneDate = card['Date - Done']
          const conclusive = card['Conclusive vs Non Conclusive']
          if (!doneDate || conclusive !== 'Conclusive') return false
          const doneDateObj = new Date(doneDate)
          return doneDateObj >= startOfMonth && doneDateObj <= endOfMonth
        })
      case 'nonConclusive':
        return cards.filter(card => {
          const doneDate = card['Date - Done']
          const conclusive = card['Conclusive vs Non Conclusive']
          if (!doneDate || conclusive !== 'Non Conclusive') return false
          const doneDateObj = new Date(doneDate)
          return doneDateObj >= startOfMonth && doneDateObj <= endOfMonth
        })
      default:
        return []
    }
  }

  if (loading || dataLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="space-y-3">
          {/* Skeleton pour Live Tests avec séparateur */}
          <div className="pb-2 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Skeletons pour les autres métriques */}
          <div className="space-y-2">
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
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
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

  const completedVariation = calculateVariation(stats.testCompleted, previousStats.testCompleted)
  const conclusiveVariation = calculateVariation(stats.testConclusive, previousStats.testConclusive)
  const nonConclusiveVariation = calculateVariation(stats.testNonConclusive, previousStats.testNonConclusive)

  return (
    <TooltipProvider delayDuration={0}>
      <div className="col-span-2 row-span-2 bg-white rounded-lg border border-gray-200 p-3">
        <div className="space-y-3">
          {/* Tests Live - Séparé visuellement car c'est l'état actuel */}
          <div className="pb-2 border-b border-gray-100">
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
                    {getTestDetails('live').map((card, index) => (
                      <div key={card.id || index} className="text-xs text-gray-600 truncate">
                        • {card.Name || card.Title || 'Untitled'}
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
          <div className="space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-between items-center hover:bg-gray-50 rounded px-1 -mx-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-gray-600">Completed Tests</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-gray-900">{stats.testCompleted}</span>
                    {showComparison && previousStats.testCompleted > 0 && (
                      <span className={`text-xs ${
                        completedVariation.isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {completedVariation.isPositive ? '+' : '-'}{completedVariation.percentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="p-0 border-0 shadow-lg bg-transparent">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Completed Tests This Month ({stats.testCompleted})</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {getTestDetails('completed').map((card, index) => (
                      <div key={card.id || index} className="text-xs text-gray-600 truncate">
                        • {card.Name || card.Title || 'Untitled'}
                      </div>
                    ))}
                    {getTestDetails('completed').length === 0 && (
                      <div className="text-xs text-gray-500">No completed tests this month</div>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-between items-center hover:bg-gray-50 rounded px-1 -mx-1">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3 w-3 text-purple-500" />
                    <span className="text-xs text-gray-600">Conclusive Tests</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-gray-900">{stats.testConclusive}</span>
                    {showComparison && previousStats.testConclusive > 0 && (
                      <span className={`text-xs ${
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
                    {getTestDetails('conclusive').map((card, index) => (
                      <div key={card.id || index} className="text-xs text-gray-600 truncate">
                        • {card.Name || card.Title || 'Untitled'}
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
                      <span className={`text-xs ${
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
                    {getTestDetails('nonConclusive').map((card, index) => (
                      <div key={card.id || index} className="text-xs text-gray-600 truncate">
                        • {card.Name || card.Title || 'Untitled'}
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