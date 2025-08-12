'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export interface FilterState {
  selectedMonth: Date
  status?: string[]
  owner?: string[]
  market?: string[]
  region?: string // APAC | EMEA | AMER
  scope?: string[]
  role?: string[]
}

interface FilterContextType {
  filters: FilterState
  appliedFilters: FilterState
  updateFilters: (newFilters: Partial<FilterState>) => void
  setFilters: (filters: FilterState) => void
  setAppliedFilters: (filters: FilterState) => void
  resetFilters: () => void
  applyFilters: () => void
  isDirty: boolean
  hasUnsavedChanges: boolean
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

const STORAGE_KEY = 'app_filters'

const getDefaultFilters = (): FilterState => ({
  selectedMonth: new Date(),
})

const loadFiltersFromStorage = (): FilterState => {
  if (typeof window === 'undefined') return getDefaultFilters()
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        ...getDefaultFilters(),
        ...parsed,
        selectedMonth: new Date(parsed.selectedMonth || new Date())
      }
    }
  } catch (error) {
    console.error('Error loading filters from localStorage:', error)
  }
  
  return getDefaultFilters()
}

const saveFiltersToStorage = (filters: FilterState) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  } catch (error) {
    console.error('Error saving filters to localStorage:', error)
  }
}

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(loadFiltersFromStorage)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(filters)
  const [isDirty, setIsDirty] = useState(false)

  // Sauvegarder les filtres appliqués dans localStorage
  useEffect(() => {
    saveFiltersToStorage(appliedFilters)
  }, [appliedFilters])

  // Charger les filtres depuis localStorage au montage
  useEffect(() => {
    const loadedFilters = loadFiltersFromStorage()
    setFilters(loadedFilters)
    setAppliedFilters(loadedFilters)
  }, [])

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters }
      setIsDirty(true)
      return updated
    })
  }

  const setFiltersDirectly = (newFilters: FilterState) => {
    setFilters(newFilters)
    setIsDirty(false)
  }

  const applyFilters = () => {
    setAppliedFilters(filters)
    setIsDirty(false)
  }

  const resetFilters = () => {
    const defaultFilters = getDefaultFilters()
    setFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    setIsDirty(false)
  }

  const hasUnsavedChanges = isDirty && JSON.stringify(filters) !== JSON.stringify(appliedFilters)

  return (
    <FilterContext.Provider value={{
      filters,
      appliedFilters,
      updateFilters,
      setFilters: setFiltersDirectly,
      setAppliedFilters,
      resetFilters,
      applyFilters,
      isDirty,
      hasUnsavedChanges
    }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider')
  }
  return context
} 