// Point d'entrée pour les features Kanban
import { useMemo } from "react"
import { KanbanBoard } from "./KanbanBoard"
import { KanbanSkeleton } from "./KanbanSkeleton"
import { useExperimentation, MarketRef } from "@/hooks/useExperimentation"
import { useFilters } from '@/contexts/FilterContext'

interface KanbanProps {
  searchValue?: string
}

export default function Kanban({ searchValue = "" }: KanbanProps) {
  const result = useExperimentation({ 
    useAirtable: true, 
    timelineMode: false 
  })
  
  const { appliedFilters } = useFilters()
  
  // Extraire les données avec des valeurs par défaut
  const { 
    columns = [], 
    cards = [], 
    kpis = [], 
    pages = [], 
    products = [], 
    loading = false, 
    error = null 
  } = result

  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      // Filtre par recherche (nom, description, etc.)
      if (searchValue && searchValue.trim() !== "") {
        const searchLower = searchValue.toLowerCase()
        const cardName = (card.name || card.Name || "").toLowerCase()
        const cardDescription = (card.description || card.Description || "").toLowerCase()
        const cardScope = (card.scope || "").toLowerCase()
        
        if (!cardName.includes(searchLower) && 
            !cardDescription.includes(searchLower) && 
            !cardScope.includes(searchLower)) {
          return false
        }
      }
      
      // Filtre par market
      if (appliedFilters.market && appliedFilters.market.length > 0) {
        const cardMarkets = card.market || []
        if (!appliedFilters.market.some(filterMarket => 
          cardMarkets.some((m: MarketRef) => m.id === filterMarket)
        )) {
          return false
        }
      }
      
      // Filtre par scope
      if (appliedFilters.scope && appliedFilters.scope.length > 0) {
        if (!card.scope || !appliedFilters.scope.includes(card.scope)) {
          return false
        }
      }
      
      // Filtre par status
      if (appliedFilters.status && appliedFilters.status.length > 0) {
        if (!appliedFilters.status.includes(card.status)) {
          return false
        }
      }
      
      // Filtre par owner
      if (appliedFilters.owner && appliedFilters.owner.length > 0) {
        const cardOwners = card.owner || []
        if (!appliedFilters.owner.some(filterOwner => 
          cardOwners.some((o: { id?: string; name?: string }) => {
            const ownerName = typeof o === 'string' ? o : o?.name
            return ownerName === filterOwner
          })
        )) {
          return false
        }
      }
      
      // Filtre par region
      if (appliedFilters.region) {
        const cardRegion = card.region || card.Region
        if (!cardRegion) return false
        
        if (Array.isArray(cardRegion)) {
          if (!cardRegion.includes(appliedFilters.region)) return false
        } else {
          if (String(cardRegion) !== appliedFilters.region) return false
        }
      }
      
      // Note: Le filtre Month est intentionnellement ignoré pour la page Kanban
      // même s'il est présent dans le localStorage
      
      return true
    })
  }, [cards, appliedFilters, searchValue])

  return (
    <div className="p-2">
      {loading && <KanbanSkeleton />}
      {error && <div className="text-center text-red-500 py-8">{error}</div>}
      {!loading && !error && <KanbanBoard cards={filteredCards} columns={columns} kpis={kpis} pages={pages} products={products} />}
    </div>
  )
} 