'use client'

import { Filter } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface FilteredBadgeProps {
  filters: {
    status?: string[]
    owner?: string[]
    market?: string[]
    region?: string
    selectedMonth?: Date
    scope?: string[]
    role?: string[]
  }
  excludeMonth?: boolean
}

export function FilteredBadge({ filters, excludeMonth = false }: FilteredBadgeProps) {
  const activeFilters = []
  
  // Ajouter Month seulement si pas exclu
  if (!excludeMonth && filters.selectedMonth) {
    const defaultMonth = new Date()
    const isDefaultMonth = filters.selectedMonth.getMonth() === defaultMonth.getMonth() &&
      filters.selectedMonth.getFullYear() === defaultMonth.getFullYear()
    
    if (!isDefaultMonth) {
      const monthName = filters.selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      activeFilters.push(`Month: ${monthName}`)
    }
  }
  
  if (filters.status && filters.status.length > 0) {
    activeFilters.push(`Status: ${filters.status.join(', ')}`)
  }
  if (filters.owner && filters.owner.length > 0) {
    activeFilters.push(`Owner: ${filters.owner.join(', ')}`)
  }
  if (filters.market && filters.market.length > 0) {
    activeFilters.push(`Market: ${filters.market.join(', ')}`)
  }
  if (filters.region) {
    activeFilters.push(`Region: ${filters.region}`)
  }
  if (filters.scope && filters.scope.length > 0) {
    activeFilters.push(`Scope: ${filters.scope.join(', ')}`)
  }
  if (filters.role && filters.role.length > 0) {
    activeFilters.push(`Role: ${filters.role.join(', ')}`)
  }

  if (activeFilters.length === 0) return null

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs cursor-help">
            <Filter className="h-2.5 w-2.5" />
            <span>Filtered</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-0 border-0 shadow-lg bg-transparent">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
            <h4 className="text-xs font-semibold text-gray-900 mb-2">Active Filters</h4>
            <div className="space-y-1">
              {activeFilters.map((filter, index) => (
                <div key={index} className="text-xs text-gray-600">• {filter}</div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 