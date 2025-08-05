// Point d'entrée pour les features Kanban
import { useState, useMemo } from "react"
import { FilterBar } from "./filter-bar"
import { KanbanBoard } from "./KanbanBoard"
import { useExperimentations, MarketRef } from "@/hooks/useExperimentations"

export default function Kanban() {
  const { columns, cards, markets, roles, scopes, kpis, pages, products, loading, error } = useExperimentations({ useAirtable: true })
  const [filters, setFilters] = useState({ market: '', role: '', scope: '', search: '' })

  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      if (filters.market && !card.market.some((m: MarketRef) => m.id === filters.market)) return false
      if (filters.role && card.role !== filters.role) return false
      if (filters.scope && card.scope !== filters.scope) return false
      if (filters.search && !card.name.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })
  }, [cards, filters])

  return (
    <div className="p-4">
      <FilterBar
        markets={markets}
        roles={roles}
        scopes={scopes}
        onFilterChange={setFilters}
      />
      {loading && <div className="text-center text-zinc-400 py-8">Loading...</div>}
      {error && <div className="text-center text-red-500 py-8">{error}</div>}
      {!loading && !error && <KanbanBoard cards={filteredCards} columns={columns} kpis={kpis} pages={pages} products={products} />}
    </div>
  )
} 