'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

interface SelectColumnsProps {
  onNextStep?: (selectedColumns: string[]) => void
  fileData: Record<string, unknown>[]
}

export function SelectColumns({ onNextStep, fileData }: SelectColumnsProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Détecter automatiquement les colonnes disponibles avec useMemo
  const availableColumns = useMemo(() => {
    return fileData && fileData.length > 0 ? Object.keys(fileData[0]) : []
  }, [fileData])

  useEffect(() => {
    // Sélectionner automatiquement les premières colonnes par défaut
    if (availableColumns.length > 0 && selectedColumns.length === 0) {
      setSelectedColumns(availableColumns.slice(0, 3))
    }
  }, [availableColumns, selectedColumns.length])

  const scrollToPreview = () => {
    if (previewRef.current && containerRef.current) {
      const container = containerRef.current
      const preview = previewRef.current
      const containerHeight = container.clientHeight
      const previewTop = preview.offsetTop
      const previewHeight = preview.clientHeight
      
      const scrollTop = previewTop - (containerHeight / 2) + (previewHeight / 2)
      
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
    }
  }

  const handleColumnToggle = (column: string) => {
    setSelectedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(col => col !== column)
        : [...prev, column]
    )
  }

  const handleSelectAll = () => {
    setSelectedColumns(availableColumns)
  }

  const handleDeselectAll = () => {
    setSelectedColumns([])
  }

  const handleNextStep = () => {
    if (onNextStep) {
      onNextStep(selectedColumns)
    }
  }

  const togglePreview = () => {
    setShowPreview(!showPreview)
    if (!showPreview) {
      setTimeout(() => scrollToPreview(), 100)
    }
  }

  return (
    <div className="flex h-full w-full">
      {/* Sidebar avec stepper */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-6 flex flex-col justify-center">
        {/* Stepper vertical */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 border-2 border-purple-300">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-purple-700">Select Columns</div>
              <div className="text-xs text-purple-600">Active</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-300">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-gray-500">Test Configuration</div>
              <div className="text-xs text-gray-400">Pending</div>
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
              {/* Column Selection */}
              <div className="text-center">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Available Columns</h4>
                  <p className="text-xs text-gray-600">Select the columns you want to analyze</p>
                </div>

                {/* Select All / Deselect All Button */}
                {availableColumns.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={selectedColumns.length === availableColumns.length ? handleDeselectAll : handleSelectAll}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      {selectedColumns.length === availableColumns.length ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                )}

                {availableColumns.length > 0 ? (
                  <div className="max-w-md mx-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {availableColumns.map((column) => (
                        <button
                          key={column}
                          onClick={() => handleColumnToggle(column)}
                          className={cn(
                            "px-3 py-2 text-xs rounded-lg border transition-all duration-200 cursor-pointer",
                            selectedColumns.includes(column)
                              ? "bg-purple-50 border-purple-200 text-purple-700"
                              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                          )}
                        >
                          {column}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No columns available. Please check your data.</p>
                  </div>
                )}
              </div>

              {/* Preview Toggle Button */}
              {selectedColumns.length > 0 && (
                <div className="text-center">
                  <button
                    onClick={togglePreview}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors mx-auto"
                  >
                    {showPreview ? (
                      <>
                        <EyeOff size={16} />
                        <span>Hide data preview</span>
                      </>
                    ) : (
                      <>
                        <Eye size={16} />
                        <span>Show data preview</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Data Preview - Hidden by default */}
              {showPreview && selectedColumns.length > 0 && fileData.length > 0 && (
                <div 
                  ref={previewRef}
                  className="transition-all duration-500 ease-in-out transform opacity-100 scale-100"
                >
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            {selectedColumns.map((header, index) => (
                              <th key={index} className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-200">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {fileData.slice(0, 5).map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50">
                              {selectedColumns.map((column, colIndex) => (
                                <td key={colIndex} className="px-3 py-2 border-b border-gray-100 text-gray-600">
                                  {String(row[column] || '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Continue Button */}
              {selectedColumns.length > 0 && (
                <div className="text-center">
                  <button 
                    onClick={handleNextStep}
                    disabled={selectedColumns.length === 0}
                    className={cn(
                      "flex items-center gap-1 text-sm transition-all duration-200 cursor-pointer mx-auto",
                      selectedColumns.length > 0
                        ? "text-blue-600 hover:text-blue-700 hover:scale-105"
                        : "text-gray-400 cursor-not-allowed"
                    )}
                  >
                    <span>Continue to test configuration</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
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