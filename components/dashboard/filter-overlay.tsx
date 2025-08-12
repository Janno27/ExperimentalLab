'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Calendar, ChevronDown, ChevronRight, Filter, Globe } from 'lucide-react'
import { MonthPicker } from './month-picker'
import { useFilters } from '@/contexts/FilterContext'

interface FilterOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function FilterOverlay({ isOpen, onClose }: FilterOverlayProps) {
  const { filters, appliedFilters, setFilters, setAppliedFilters, resetFilters } = useFilters()
  const [localFilters, setLocalFilters] = useState(filters)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['region','date']))
  const overlayRef = useRef<HTMLDivElement>(null)

  // Réinitialiser les filtres en cours d'édition quand l'overlay s'ouvre
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(appliedFilters)
    }
  }, [isOpen, appliedFilters])

  // Gérer le clic en dehors de l'overlay
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

  // Fonction pour gérer les changements de mois localement
  const handleMonthChange = (date: Date) => {
    setLocalFilters(prev => ({ ...prev, selectedMonth: date }))
  }

  // Sélection unique de la région
  const handleRegionSelect = (region: 'APAC' | 'EMEA' | 'AMER' | null) => {
    setLocalFilters(prev => ({ ...prev, region: region || undefined }))
  }

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

  const handleApplyFilters = () => {
    // Appliquer directement les filtres locaux
    console.log('Applying filters:', localFilters)
    setFilters(localFilters)
    setAppliedFilters(localFilters)
    onClose()
  }

  const handleCancel = () => {
    setLocalFilters(appliedFilters)
    onClose()
  }

  const handleReset = () => {
    const defaultFilters = { selectedMonth: new Date() }
    setLocalFilters(defaultFilters)
    resetFilters()
    onClose()
  }

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
            Filters
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Contenu avec scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Section Region */}
            <div className="space-y-3">
              <button
                onClick={() => toggleSection('region')}
                className="w-full flex items-center justify-between p-0 text-left hover:bg-transparent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-900">Region</span>
                </div>
                {expandedSections.has('region') ? (
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </button>

              {expandedSections.has('region') && (
                <div className="pl-6">
                  <div className="flex flex-wrap gap-2">
                    {(['APAC','EMEA','AMER'] as const).map(option => {
                      const selected = localFilters.region === option
                      return (
                        <button
                          key={option}
                          onClick={() => handleRegionSelect(selected ? null : option)}
                          className={`px-2 py-1 text-xs rounded border transition-colors cursor-pointer ${selected ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Section Month */}
            <div className="space-y-3">
              <button
                onClick={() => toggleSection('date')}
                className="w-full flex items-center justify-between p-0 text-left hover:bg-transparent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-900">Month</span>
                </div>
                {expandedSections.has('date') ? (
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </button>
              
              {expandedSections.has('date') && (
                <div className="pl-6">
                  <MonthPicker
                    value={localFilters.selectedMonth}
                    onChange={handleMonthChange}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Section Status (préparé pour le futur) */}
            <div className="space-y-3 opacity-50">
              <button
                onClick={() => toggleSection('status')}
                className="w-full flex items-center justify-between p-0 text-left hover:bg-transparent transition-colors cursor-not-allowed"
                disabled
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-500">Status</span>
                </div>
                {expandedSections.has('status') ? (
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </button>
              
              {expandedSections.has('status') && (
                <div className="pl-6">
                  <p className="text-xs text-gray-500">Coming soon...</p>
                </div>
              )}
            </div>

            {/* Section Owner (préparé pour le futur) */}
            <div className="space-y-3 opacity-50">
              <button
                onClick={() => toggleSection('owner')}
                className="w-full flex items-center justify-between p-0 text-left hover:bg-transparent transition-colors cursor-not-allowed"
                disabled
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-500">Owner</span>
                </div>
                {expandedSections.has('owner') ? (
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </button>
              
              {expandedSections.has('owner') && (
                <div className="pl-6">
                  <p className="text-xs text-gray-500">Coming soon...</p>
                </div>
              )}
            </div>

            {/* Section Market (préparé pour le futur) */}
            <div className="space-y-3 opacity-50">
              <button
                onClick={() => toggleSection('market')}
                className="w-full flex items-center justify-between p-0 text-left hover:bg-transparent transition-colors cursor-not-allowed"
                disabled
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-500">Market</span>
                </div>
                {expandedSections.has('market') ? (
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </button>
              
              {expandedSections.has('market') && (
                <div className="pl-6">
                  <p className="text-xs text-gray-500">Coming soon...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer avec CTA */}
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
              disabled={JSON.stringify(localFilters) === JSON.stringify(appliedFilters)}
              className="px-4 py-2 text-xs font-medium text-white bg-purple-600 border border-purple-600 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 