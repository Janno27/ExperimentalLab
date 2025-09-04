'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ArrowRight, ArrowLeft, CheckCircle, Circle, Plus, Edit2, X } from 'lucide-react'
import { detectMetricsFromData, enhanceMetricDetection, type DetectedMetric } from '@/lib/analysis/metric-detector'
import { MetricModal } from './MetricModal'
import type { AnalysisMetric } from '@/types/analysis'

type CustomMetric = AnalysisMetric

interface SuggestedMetricsProps {
  onNextStep?: (metrics: CustomMetric[]) => void
  onBackStep?: () => void
  fileData: Record<string, unknown>[]
  selectedColumns: string[]
}

export function SuggestedMetrics({ onNextStep, onBackStep, fileData, selectedColumns }: SuggestedMetricsProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<CustomMetric[]>([])
  const [detectedMetrics, setDetectedMetrics] = useState<DetectedMetric[]>([])
  const [showCreateMetric, setShowCreateMetric] = useState(false)
  const [editingMetric, setEditingMetric] = useState<CustomMetric | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Créer un sous-ensemble des données avec seulement les colonnes sélectionnées
  const filteredData = useMemo(() => {
    return fileData.map(row => {
      const filteredRow: Record<string, unknown> = {}
      selectedColumns.forEach(col => {
        if (row[col] !== undefined) {
          filteredRow[col] = row[col]
        }
      })
      return filteredRow
    })
  }, [fileData, selectedColumns])

  // Détecter automatiquement les colonnes disponibles (uniquement les colonnes sélectionnées)
  const availableColumns = selectedColumns

  // Détecter les métriques automatiquement basées sur les colonnes sélectionnées
  useEffect(() => {
    if (filteredData && filteredData.length > 0) {
      const initialDetection = detectMetricsFromData(filteredData)
      const enhancedDetection = enhanceMetricDetection(filteredData, initialDetection)
      
      setDetectedMetrics(enhancedDetection.suggestedMetrics)
      
      // Convertir les métriques détectées en CustomMetric et sélectionner automatiquement TOUTES les métriques
      const customMetrics: CustomMetric[] = enhancedDetection.suggestedMetrics.map(metric => ({
        id: `${metric.name}-${metric.type}`,
        name: metric.name,
        type: metric.type,
        numerator: metric.numerator,
        denominator: metric.denominator,
        valueColumn: metric.valueColumn,
        valueColumn2: metric.valueColumn2,
        description: metric.description,
        isCustom: false,
        unit: metric.unit,
        currency: metric.currency,
        decimals: metric.decimals,
        isRevenue: metric.isRevenue
      }))
      
      if (customMetrics.length > 0) {
        setSelectedMetrics(customMetrics) // Sélectionner toutes les métriques par défaut
      }
    }
  }, [filteredData])

  const handleMetricToggle = (metric: CustomMetric) => {
    setSelectedMetrics(prev => 
      prev.some(m => m.id === metric.id)
        ? prev.filter(m => m.id !== metric.id)
        : [...prev, metric]
    )
  }

  const handleNextStep = () => {
    if (onNextStep) {
      onNextStep(selectedMetrics)
    }
  }

  const handleBackStep = () => {
    if (onBackStep) {
      onBackStep()
    }
  }

  const handleCreateMetric = () => {
    setShowCreateMetric(true)
    setEditingMetric(null)
  }

  const handleEditMetric = (metric: CustomMetric) => {
    setEditingMetric(metric)
    setShowCreateMetric(true)
  }

  const handleSaveMetric = (metric: CustomMetric) => {
    if (editingMetric) {
      // Modifier la métrique existante
      setSelectedMetrics(prev => 
        prev.map(m => m.id === editingMetric.id ? metric : m)
      )
    } else {
      // Créer une nouvelle métrique
      setSelectedMetrics(prev => [...prev, metric])
    }
    setShowCreateMetric(false)
    setEditingMetric(null)
  }

  const handleDeleteMetric = (metricId: string) => {
    setSelectedMetrics(prev => prev.filter(m => m.id !== metricId))
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
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 border-2 border-green-300">
              <CheckCircle className="w-3 h-3 text-green-600" />
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-green-700">Test Configuration</div>
              <div className="text-xs text-green-600">Completed</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 border-2 border-purple-300">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
            </div>
            <div className="text-left">
              <div className="text-xs font-medium text-purple-700">Configure Metrics</div>
              <div className="text-xs text-purple-600">Active</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-300">
              <Circle className="w-3 h-3 text-gray-400" />
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
          className="flex-1 min-h-0 overflow-y-auto"
        >
          <div className="w-full max-w-4xl mx-auto py-8 flex items-center min-h-full">
            <div className="w-full space-y-8">
              {/* Header */}
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Configure Metrics</h3>
                <p className="text-sm text-gray-600">Review and configure your analysis metrics</p>
              </div>

              {/* Metrics Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Metrics</h4>
                  <button
                    onClick={handleCreateMetric}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Add custom metric</span>
                  </button>
                </div>

                {/* Suggested Metrics */}
                {detectedMetrics.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-700">Suggested Metrics</h5>
                    {detectedMetrics.map((metric) => {
                      const customMetric: CustomMetric = {
                        id: `${metric.name}-${metric.type}`,
                        name: metric.name,
                        type: metric.type,
                        numerator: metric.numerator,
                        denominator: metric.denominator,
                        valueColumn: metric.valueColumn,
                        valueColumn2: metric.valueColumn2,
                        description: metric.description,
                        isCustom: false,
                        unit: metric.unit,
                        currency: metric.currency,
                        decimals: metric.decimals,
                        isRevenue: metric.isRevenue
                      }
                      
                      const isSelected = selectedMetrics.some(m => m.id === customMetric.id)
                      
                      return (
                        <div
                          key={customMetric.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                            isSelected
                              ? 'bg-purple-50 border-purple-200'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center justify-center w-4 h-4">
                              {isSelected ? (
                                <CheckCircle className="w-3 h-3 text-purple-600" />
                              ) : (
                                <Circle className="w-3 h-3 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-xs font-medium text-gray-900">{metric.name}</div>
                              <div className="text-xs text-gray-600">{metric.description}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                Type: {metric.type} | 
                                {metric.type === 'binary' 
                                  ? ` Numerator: ${metric.numerator}${metric.denominator ? ` / Denominator: ${metric.denominator}` : ''}`
                                  : metric.valueColumn2 
                                    ? ` Ratio: ${metric.valueColumn} / ${metric.valueColumn2}`
                                    : ` Column: ${metric.valueColumn}`
                                }
                                {metric.unit && ` | Unit: ${metric.unit}`}
                                {metric.currency && ` | Currency: ${metric.currency}`}
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              metric.type === 'binary' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {metric.type}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleEditMetric(customMetric)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleMetricToggle(customMetric)}
                              className={cn(
                                "text-xs px-2 py-1 rounded transition-colors",
                                isSelected
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              )}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Custom Metrics */}
                {selectedMetrics.filter(m => m.isCustom).length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-700">Custom Metrics</h5>
                    {selectedMetrics.filter(m => m.isCustom).map((metric) => (
                      <div
                        key={metric.id}
                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <CheckCircle className="w-3 h-3 text-blue-600" />
                          <div className="flex-1">
                            <div className="text-xs font-medium text-gray-900">{metric.name}</div>
                            <div className="text-xs text-gray-600">{metric.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Type: {metric.type} | 
                              {metric.type === 'binary' 
                                ? ` Numerator: ${metric.numerator}${metric.denominator ? ` / Denominator: ${metric.denominator}` : ''}`
                                : metric.valueColumn2 
                                  ? ` Numerator: ${metric.valueColumn} / Denominator: ${metric.valueColumn2}`
                                  : ` Column: ${metric.valueColumn}`
                              }
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            metric.type === 'binary' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {metric.type}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleEditMetric(metric)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteMetric(metric.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6">
                <button 
                  onClick={handleBackStep}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Back to test configuration</span>
                </button>

                <button 
                  onClick={handleNextStep}
                  disabled={selectedMetrics.length === 0}
                  className={cn(
                    "flex items-center gap-2 text-sm transition-all duration-200",
                    selectedMetrics.length > 0
                      ? "text-blue-600 hover:text-blue-700 hover:scale-105 cursor-pointer"
                      : "text-gray-400 cursor-not-allowed"
                  )}
                >
                  <span>Configure statistics</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour créer/modifier une métrique */}
      <MetricModal
        isOpen={showCreateMetric}
        onClose={() => setShowCreateMetric(false)}
        onSave={handleSaveMetric}
        editingMetric={editingMetric}
        availableColumns={availableColumns}
      />
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
} 