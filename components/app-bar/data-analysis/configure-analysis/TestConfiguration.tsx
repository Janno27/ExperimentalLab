'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ArrowRight, ArrowLeft, ChevronDown, CheckCircle } from 'lucide-react'

interface TestConfigurationProps {
  onNextStep?: (config: { variationColumn: string; userColumn: string; dataType: 'aggregated' | 'raw' }) => void
  onBackStep?: () => void
  selectedColumns: string[]
}

export function TestConfiguration({ onNextStep, onBackStep, selectedColumns }: TestConfigurationProps) {
  const [variationColumn, setVariationColumn] = useState<string>('')
  const [userColumn, setUserColumn] = useState<string>('')
  const [dataType, setDataType] = useState<'aggregated' | 'raw'>('aggregated')
  const [showVariationDropdown, setShowVariationDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const variationDropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  // Détecter automatiquement les colonnes disponibles
  const availableColumns = selectedColumns

  // Détecter automatiquement la colonne de variation par défaut
  useEffect(() => {
    if (availableColumns.length > 0) {
      // Chercher spécifiquement la colonne "variation"
      const variationCol = availableColumns.find(col => 
        col.toLowerCase() === 'variation'
      )
      setVariationColumn(variationCol || availableColumns[0])

      // Chercher une colonne contenant "user" ou "visitor" ou "id"
      const userCol = availableColumns.find(col => 
        col.toLowerCase().includes('user') || 
        col.toLowerCase().includes('visitor') || 
        col.toLowerCase().includes('id') ||
        col.toLowerCase().includes('session')
      )
      setUserColumn(userCol || '')
    }
  }, [availableColumns])

  // Fermer les dropdowns en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (variationDropdownRef.current && !variationDropdownRef.current.contains(event.target as Node)) {
        setShowVariationDropdown(false)
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleVariationColumnChange = (column: string) => {
    setVariationColumn(column)
    setShowVariationDropdown(false)
  }

  const handleUserColumnChange = (column: string) => {
    setUserColumn(column)
    setShowUserDropdown(false)
  }

  const handleNextStep = () => {
    if (onNextStep) {
      onNextStep({ variationColumn, userColumn, dataType })
    }
  }

  const handleBackStep = () => {
    if (onBackStep) {
      onBackStep()
    }
  }

  return (
    <div className="flex h-full w-full">
      {/* Sidebar avec stepper */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-6 flex flex-col justify-center">
        {/* Stepper vertical */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 border-2 border-green-300">
              <CheckCircle className="w-3 h-3 text-green-600" />
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-green-700">Select Columns</div>
              <div className="text-xs text-green-600">Completed</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 border-2 border-purple-300">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-purple-700">Test Configuration</div>
              <div className="text-xs text-purple-600">Active</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-300">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-gray-500">Configure Metrics</div>
              <div className="text-xs text-gray-400">Pending</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-300">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-gray-500">Statistical Configuration</div>
              <div className="text-xs text-gray-400">Pending</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-300">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-gray-500">View Results</div>
              <div className="text-xs text-gray-400">Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col">
        <div 
          ref={containerRef}
          className="flex-1 min-h-0 overflow-y-auto flex items-center"
        >
          <div className="w-full max-w-2xl mx-auto py-8">
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Configure Your A/B Test Parameters</h3>
                <p className="text-sm text-gray-600">Set up the basic configuration for your A/B test analysis</p>
              </div>

              {/* Test Configuration */}
              <div className="space-y-6">
                {/* Data Type Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Data Type
                  </label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dataType"
                        value="aggregated"
                        checked={dataType === 'aggregated'}
                        onChange={() => setDataType('aggregated')}
                        className="text-purple-600"
                      />
                      <span className="text-sm text-gray-900">Aggregated Data</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dataType"
                        value="raw"
                        checked={dataType === 'raw'}
                        onChange={() => setDataType('raw')}
                        className="text-purple-600"
                      />
                      <span className="text-sm text-gray-900">Raw Data</span>
                    </label>
                  </div>
                  <div className="text-xs text-gray-500">
                    {dataType === 'aggregated' 
                      ? 'Use for conversion rates: one row per segment (variation + device + product, etc.)'
                      : 'Use for revenue metrics: one row per transaction/user'
                    }
                  </div>
                </div>

                {/* Variation Column */}
                <div className="relative" ref={variationDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variation Column
                  </label>
                  <div 
                    className="flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => setShowVariationDropdown(!showVariationDropdown)}
                  >
                    <span className="text-sm text-gray-900">{variationColumn || 'Select variation column'}</span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                  
                  {showVariationDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto">
                      {availableColumns.map((column) => (
                        <button
                          key={column}
                          onClick={() => handleVariationColumnChange(column)}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          {column}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* User Column */}
                <div className="relative" ref={userDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {dataType === 'aggregated' ? 'User Count Column' : 'User ID Column'}
                  </label>
                  <div 
                    className="flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    <span className="text-sm text-gray-900">
                      {userColumn || (dataType === 'aggregated' ? 'Select user count column' : 'Select user ID column')}
                    </span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                  
                  {showUserDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto">
                      {availableColumns.map((column) => (
                        <button
                          key={column}
                          onClick={() => handleUserColumnChange(column)}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          {column}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6">
                <button 
                  onClick={handleBackStep}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Back to column selection</span>
                </button>

                <button 
                  onClick={handleNextStep}
                  disabled={!variationColumn || !userColumn}
                  className={cn(
                    "flex items-center gap-2 text-sm transition-all duration-200",
                    variationColumn && userColumn
                      ? "text-blue-600 hover:text-blue-700 hover:scale-105 cursor-pointer"
                      : "text-gray-400 cursor-not-allowed"
                  )}
                >
                  <span>Continue to metrics</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
} 