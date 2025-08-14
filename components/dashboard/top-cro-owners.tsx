'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Users, XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/contexts/DashboardContext'

interface TopCroOwnersProps {
  selectedMonth?: Date
  showComparison?: boolean
}

export function TopCroOwners({ selectedMonth, showComparison = false }: TopCroOwnersProps) {
  const [activeTab, setActiveTab] = useState<'launched' | 'analyzed'>('launched')
  const { filteredExperimentations, owners, loading, error } = useDashboardContext()

  // Helper pour trouver le nom depuis l'id
  const getName = (id: string, arr: {id: string, name: string}[]) => arr.find(x => x.id === id)?.name || id

  // Helper pour calculer la variation en pourcentage
  const calculateVariation = (current: number, previous: number): { percentage: number; isPositive: boolean } => {
    if (previous === 0) {
      return { percentage: current > 0 ? 100 : 0, isPositive: current > 0 }
    }
    const variation = ((current - previous) / previous) * 100
    return { percentage: Math.abs(variation), isPositive: variation >= 0 }
  }

  // Calculer les stats de manière optimisée avec useMemo
  const ownerStats = useMemo(() => {
    if (!filteredExperimentations || filteredExperimentations.length === 0) return { launched: [], analyzed: [], previousLaunched: [], previousAnalyzed: [] }

    const currentMonth = selectedMonth || new Date()
    const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    
    const ownerCounts: Record<string, { launched: number; analyzed: number }> = {}
    const previousOwnerCounts: Record<string, { launched: number; analyzed: number }> = {}

    filteredExperimentations.forEach(record => {
      const startDate = record.fields['Start Date']
      if (!startDate) return

      const testDate = new Date(startDate)
      const isInCurrentMonth = testDate.getMonth() === currentMonth.getMonth() && 
                              testDate.getFullYear() === currentMonth.getFullYear()
      const isInPreviousMonth = testDate.getMonth() === previousMonth.getMonth() && 
                               testDate.getFullYear() === previousMonth.getFullYear()
      
      const recordStatus = record.fields.Status
      const ownerIds = record.fields.Owner || []
      
      // Utiliser le nom correct du champ Analysis Owner
      const analysisOwners = record.fields["Analysis' Owner"] as string[] || []

      // Compter pour le mois actuel
      if (isInCurrentMonth) {
        // Pour les tests Running, compter les Owner (lanceurs)
        ownerIds.forEach((ownerId: string) => {
          if (!ownerCounts[ownerId]) {
            ownerCounts[ownerId] = { launched: 0, analyzed: 0 }
          }
          
          if (recordStatus === 'Running') {
            ownerCounts[ownerId].launched++
          }
        })
      }
      
      // Pour les tests Done, compter les Analysis' Owner (analyseurs) - utiliser Date - Analysis ou Date - Done
      if (recordStatus === 'Done') {
        const analysisDate = record.fields['Date - Analysis'] || record.fields['Date - Done'] || startDate
        const analysisDateObj = analysisDate ? new Date(analysisDate) : null
        const isAnalysisInCurrentMonth = analysisDateObj && 
                                        analysisDateObj.getMonth() === currentMonth.getMonth() && 
                                        analysisDateObj.getFullYear() === currentMonth.getFullYear()
        
        if (isAnalysisInCurrentMonth) {
          analysisOwners.forEach((analysisOwnerId: string) => {
            if (!ownerCounts[analysisOwnerId]) {
              ownerCounts[analysisOwnerId] = { launched: 0, analyzed: 0 }
            }
            
            ownerCounts[analysisOwnerId].analyzed++
          })
        }
      }

      // Compter pour le mois précédent
      if (isInPreviousMonth) {
        // Pour les tests Running, compter les Owner (lanceurs)
        ownerIds.forEach((ownerId: string) => {
          if (!previousOwnerCounts[ownerId]) {
            previousOwnerCounts[ownerId] = { launched: 0, analyzed: 0 }
          }
          
          if (recordStatus === 'Running') {
            previousOwnerCounts[ownerId].launched++
          }
        })
      }
      
      // Pour les tests Done, compter les Analysis' Owner (analyseurs) pour le mois précédent
      if (recordStatus === 'Done') {
        const analysisDate = record.fields['Date - Analysis'] || record.fields['Date - Done'] || startDate
        const analysisDateObj = analysisDate ? new Date(analysisDate) : null
        const isAnalysisInPreviousMonth = analysisDateObj && 
                                         analysisDateObj.getMonth() === previousMonth.getMonth() && 
                                         analysisDateObj.getFullYear() === previousMonth.getFullYear()
        
        if (isAnalysisInPreviousMonth) {
          analysisOwners.forEach((analysisOwnerId: string) => {
            if (!previousOwnerCounts[analysisOwnerId]) {
              previousOwnerCounts[analysisOwnerId] = { launched: 0, analyzed: 0 }
            }
            
            previousOwnerCounts[analysisOwnerId].analyzed++
          })
        }
      }
    })

    // Convertir en arrays avec les noms des owners
    const launched = Object.entries(ownerCounts)
      .map(([ownerId, counts]) => ({ 
        id: ownerId,
        name: getName(ownerId, owners),
        count: counts.launched 
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    const analyzed = Object.entries(ownerCounts)
      .map(([ownerId, counts]) => ({ 
        id: ownerId,
        name: getName(ownerId, owners),
        count: counts.analyzed 
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    const previousLaunched = Object.entries(previousOwnerCounts)
      .map(([ownerId, counts]) => ({ 
        id: ownerId,
        name: getName(ownerId, owners),
        count: counts.launched 
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    const previousAnalyzed = Object.entries(previousOwnerCounts)
      .map(([ownerId, counts]) => ({ 
        id: ownerId,
        name: getName(ownerId, owners),
        count: counts.analyzed 
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    return { launched, analyzed, previousLaunched, previousAnalyzed }
  }, [filteredExperimentations, selectedMonth, owners])

  const currentMonthStats = activeTab === 'launched' ? ownerStats.launched : ownerStats.analyzed
  const previousMonthStats = activeTab === 'launched' ? ownerStats.previousLaunched : ownerStats.previousAnalyzed

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg border border-gray-200 py-2 w-full min-h-[115px]">
        {/* Skeleton pour les boutons de navigation */}
        <div className="flex justify-center px-4">
          <div className="flex items-center gap-0.5 bg-gray-200 rounded-2xl p-0.5">
            <div className="h-5 w-16 bg-gray-300 rounded-xl animate-pulse"></div>
            <div className="h-5 w-16 bg-gray-300 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Skeleton pour la liste des owners */}
        <div className="space-y-1 px-4 mt-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="w-20 h-2.5 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-1">
                <div className="w-8 h-2 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-100 rounded-lg border border-gray-200 py-2 w-full min-h-[115px]">
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

  return (
    <div className="bg-gray-100 rounded-lg border border-gray-200 py-2 w-full min-h-[115px]">
      <div className="flex flex-col gap-2">
        <div className="flex justify-center px-4">
          <div className="flex items-center gap-0.5 bg-gray-200 rounded-2xl p-0.5">
            <Button
              variant={activeTab === 'launched' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('launched')}
              className={`rounded-xl text-[10px] h-5 px-2 cursor-pointer ${activeTab !== 'launched' ? 'hover:bg-gray-100' : ''}`}
            >
              Launched
            </Button>
            <Button
              variant={activeTab === 'analyzed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('analyzed')}
              className={`rounded-xl text-[10px] h-5 px-2 cursor-pointer ${activeTab !== 'analyzed' ? 'hover:bg-gray-100' : ''}`}
            >
              Analyzed
            </Button>
          </div>
        </div>

        <div className="space-y-1 px-4">
          {currentMonthStats.length > 0 ? (
            currentMonthStats.map((owner, index) => {
              // Trouver les données du mois précédent pour cet owner
              const previousOwner = previousMonthStats.find(p => p.id === owner.id)
              const previousCount = previousOwner?.count || 0
              const variation = calculateVariation(owner.count, previousCount)
              
              return (
                <div key={owner.id} className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium",
                    index === 0 && "bg-yellow-100 text-yellow-700",
                    index === 1 && "bg-gray-100 text-gray-700", 
                    index === 2 && "bg-orange-100 text-orange-700"
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-gray-900 truncate">{owner.name}</p>
                  </div>
                  <div className="text-right flex items-center gap-1">
                    <p className="text-[8px] text-gray-500">{owner.count} test{owner.count > 1 ? 's' : ''}</p>
                    {showComparison && (
                      <>
                        {previousCount > 0 && owner.count > 0 && (
                          <span className={`text-[7px] ${
                            variation.isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {variation.isPositive ? '+' : '-'}{variation.percentage.toFixed(0)}%
                          </span>
                        )}
                        {previousCount === 0 && owner.count > 0 && (
                          <TrendingUp className="w-2.5 h-2.5 text-green-600" />
                        )}
                        {previousCount > 0 && owner.count === 0 && (
                          <TrendingDown className="w-2.5 h-2.5 text-red-600" />
                        )}
                        {previousCount === 0 && owner.count === 0 && (
                          <Minus className="w-2.5 h-2.5 text-gray-400" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="flex items-center justify-center py-4 text-gray-500">
              <div className="text-center">
                <Users className="w-5 h-5 mx-auto mb-1 text-gray-300" />
                <p className="text-[10px]">Aucun owner trouvé</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 