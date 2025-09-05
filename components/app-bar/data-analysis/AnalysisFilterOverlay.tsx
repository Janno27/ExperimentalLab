'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, ChevronDown, ChevronRight, Filter } from 'lucide-react'

interface DimensionColumn {
  type: 'categorical'
  values: string[]
  count: number
  display_name: string
}

interface AnalysisFilterOverlayProps {
  isOpen: boolean
  onClose: () => void
  dimensionColumns: Record<string, DimensionColumn>
  activeFilters: Record<string, string[]>
  onFiltersChange: (filters: Record<string, string[]>) => void
  isLoading?: boolean
}

export function AnalysisFilterOverlay({ 
  isOpen, 
  onClose, 
  dimensionColumns, 
  activeFilters, 
  onFiltersChange, 
  isLoading 
}: AnalysisFilterOverlayProps) {
  const [localFilters, setLocalFilters] = useState<Record<string, string[]>>(activeFilters)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({})
  const overlayRef = useRef<HTMLDivElement>(null)

  // Initialize local filters when overlay opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(activeFilters)
      // Expand sections that have active filters
      const sectionsToExpand = new Set<string>()
      Object.keys(activeFilters).forEach(key => {
        if (activeFilters[key].length > 0) {
          sectionsToExpand.add(key)
        }
      })
      setExpandedSections(sectionsToExpand)
    }
  }, [isOpen, activeFilters])

  // Handle click outside to close overlay
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const handleValueToggle = (dimensionKey: string, value: string) => {
    setLocalFilters(prev => {
      const currentValues = prev[dimensionKey] || []
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      
      if (newValues.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [dimensionKey]: _, ...rest } = prev
        return rest
      }
      
      return { ...prev, [dimensionKey]: newValues }
    })
  }

  const handleSelectAll = (dimensionKey: string, filteredValues: string[]) => {
    setLocalFilters(prev => ({
      ...prev,
      [dimensionKey]: filteredValues
    }))
  }

  const handleClearAll = (dimensionKey: string) => {
    setLocalFilters(prev => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [dimensionKey]: _, ...rest } = prev
      return rest
    })
  }

  const handleSearchChange = (dimensionKey: string, searchTerm: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [dimensionKey]: searchTerm
    }))
  }

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    onClose()
  }

  const handleCancel = () => {
    setLocalFilters(activeFilters)
    onClose()
  }

  const handleReset = () => {
    setLocalFilters({})
    onFiltersChange({})
    onClose()
  }

  const getFilteredValues = (dimensionKey: string, dimension: DimensionColumn) => {
    const searchTerm = searchTerms[dimensionKey] || ''
    return dimension.values.filter(value =>
      value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const isAllSelected = (dimensionKey: string, filteredValues: string[]) => {
    const selectedValues = localFilters[dimensionKey] || []
    return filteredValues.length > 0 && filteredValues.every(value => selectedValues.includes(value))
  }

  const hasChanges = JSON.stringify(localFilters) !== JSON.stringify(activeFilters)

  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-[9999] pointer-events-none">
      <div 
        ref={overlayRef}
        className="absolute top-0 right-0 w-[420px] h-full bg-white shadow-xs border-l border-gray-200 pointer-events-auto flex flex-col rounded-l-lg"
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-200">
          <Filter className="w-4 h-4 text-gray-500" />
          <h2 className="text-xs font-medium text-gray-900 flex-1">
            Analysis Filters
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-4 text-center text-sm text-gray-500">
            Loading filters...
          </div>
        )}

        {/* Content with scroll */}
        {!isLoading && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
              {Object.entries(dimensionColumns).map(([dimensionKey, dimension]) => {
                const selectedValues = localFilters[dimensionKey] || []
                const filteredValues = getFilteredValues(dimensionKey, dimension)
                const searchTerm = searchTerms[dimensionKey] || ''

                return (
                  <div key={dimensionKey} className="space-y-3">
                    {/* Section Header */}
                    <button
                      onClick={() => toggleSection(dimensionKey)}
                      className="w-full flex items-center justify-between p-0 text-left hover:bg-transparent transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-900">
                          {dimension.display_name}
                        </span>
                        {selectedValues.length > 0 && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {selectedValues.length} selected
                          </span>
                        )}
                      </div>
                      {expandedSections.has(dimensionKey) ? (
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                      )}
                    </button>

                    {/* Section Content */}
                    {expandedSections.has(dimensionKey) && (
                      <div className="pl-6 space-y-3">
                        {/* Search */}
                        {dimension.values.length > 5 && (
                          <input
                            type="text"
                            placeholder="Search values..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(dimensionKey, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}

                        {/* Select All / Clear All */}
                        <div className="flex items-center justify-between text-xs">
                          <button
                            onClick={() => handleSelectAll(dimensionKey, filteredValues)}
                            disabled={isAllSelected(dimensionKey, filteredValues)}
                            className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            Select All
                          </button>
                          <button
                            onClick={() => handleClearAll(dimensionKey)}
                            disabled={selectedValues.length === 0}
                            className="text-gray-600 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            Clear All
                          </button>
                        </div>

                        {/* Values */}
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {filteredValues.map((value) => (
                            <label
                              key={value}
                              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedValues.includes(value)}
                                onChange={() => handleValueToggle(dimensionKey, value)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700 flex-1">{value}</span>
                            </label>
                          ))}
                        </div>

                        {filteredValues.length === 0 && searchTerm && (
                          <div className="text-center py-4 text-xs text-gray-500">
                            No values found matching &ldquo;{searchTerm}&rdquo;
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {Object.keys(dimensionColumns).length === 0 && (
                <div className="text-center py-8 text-sm text-gray-500">
                  No filter dimensions available for this dataset.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer with CTA */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              disabled={!hasChanges || isLoading}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
