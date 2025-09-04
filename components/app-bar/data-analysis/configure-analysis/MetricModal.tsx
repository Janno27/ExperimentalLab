'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { X, ChevronDown } from 'lucide-react'

import type { AnalysisMetric } from '@/types/analysis'

type CustomMetric = AnalysisMetric

interface MetricModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (metric: CustomMetric) => void
  editingMetric?: CustomMetric | null
  availableColumns: string[]
}

export function MetricModal({ isOpen, onClose, onSave, editingMetric, availableColumns }: MetricModalProps) {
  const [metricName, setMetricName] = useState('')
  const [metricType, setMetricType] = useState<'binary' | 'continuous'>('binary')
  const [numeratorColumn, setNumeratorColumn] = useState('')
  const [denominatorColumn, setDenominatorColumn] = useState('')
  const [valueColumn, setValueColumn] = useState('')
  const [valueColumn2, setValueColumn2] = useState('')
  const [continuousCalculation, setContinuousCalculation] = useState<'single' | 'ratio'>('single')
  const [description, setDescription] = useState('')
  
  // Dropdown states
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showCalculationDropdown, setShowCalculationDropdown] = useState(false)
  const [showNumeratorDropdown, setShowNumeratorDropdown] = useState(false)
  const [showDenominatorDropdown, setShowDenominatorDropdown] = useState(false)
  const [showValueDropdown, setShowValueDropdown] = useState(false)
  const [showValue2Dropdown, setShowValue2Dropdown] = useState(false)
  
  // Refs for dropdowns
  const typeDropdownRef = useRef<HTMLDivElement>(null)
  const calculationDropdownRef = useRef<HTMLDivElement>(null)
  const numeratorDropdownRef = useRef<HTMLDivElement>(null)
  const denominatorDropdownRef = useRef<HTMLDivElement>(null)
  const valueDropdownRef = useRef<HTMLDivElement>(null)
  const value2DropdownRef = useRef<HTMLDivElement>(null)

  // Reset form when modal opens/closes or editing metric changes
  useEffect(() => {
    if (isOpen) {
      if (editingMetric) {
        setMetricName(editingMetric.name)
        setMetricType(editingMetric.type)
        setNumeratorColumn(editingMetric.numerator || '')
        setDenominatorColumn(editingMetric.denominator || '')
        setValueColumn(editingMetric.valueColumn || '')
        setValueColumn2(editingMetric.valueColumn2 || '')
        setContinuousCalculation(editingMetric.valueColumn2 ? 'ratio' : 'single')
        setDescription(editingMetric.description || '')
      } else {
        setMetricName('')
        setMetricType('binary')
        setNumeratorColumn('')
        setDenominatorColumn('')
        setValueColumn('')
        setValueColumn2('')
        setContinuousCalculation('single')
        setDescription('')
      }
    }
  }, [isOpen, editingMetric])

  // Fermer les dropdowns en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false)
      }
      if (calculationDropdownRef.current && !calculationDropdownRef.current.contains(event.target as Node)) {
        setShowCalculationDropdown(false)
      }
      if (numeratorDropdownRef.current && !numeratorDropdownRef.current.contains(event.target as Node)) {
        setShowNumeratorDropdown(false)
      }
      if (denominatorDropdownRef.current && !denominatorDropdownRef.current.contains(event.target as Node)) {
        setShowDenominatorDropdown(false)
      }
      if (valueDropdownRef.current && !valueDropdownRef.current.contains(event.target as Node)) {
        setShowValueDropdown(false)
      }
      if (value2DropdownRef.current && !value2DropdownRef.current.contains(event.target as Node)) {
        setShowValue2Dropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSave = () => {
    if (!metricName.trim()) {
      alert('Please enter a metric name')
      return
    }

    if (metricType === 'binary' && (!numeratorColumn || !denominatorColumn)) {
      alert('Please select both numerator and denominator columns for binary metrics')
      return
    }

    if (metricType === 'continuous') {
      if (continuousCalculation === 'single' && !valueColumn) {
        alert('Please select a value column for continuous metrics')
        return
      }
      if (continuousCalculation === 'ratio' && (!valueColumn || !valueColumn2)) {
        alert('Please select both columns for ratio calculation')
        return
      }
    }

    const metric: CustomMetric = {
      id: editingMetric?.id || `custom-${Date.now()}`,
      name: metricName.trim(),
      type: metricType,
      numerator: metricType === 'binary' ? numeratorColumn : undefined,
      denominator: metricType === 'binary' ? denominatorColumn : undefined,
      valueColumn: metricType === 'continuous' ? valueColumn : undefined,
      valueColumn2: metricType === 'continuous' && continuousCalculation === 'ratio' ? valueColumn2 : undefined,
      description: description.trim() || `${metricName} metric`,
      isCustom: true
    }

    onSave(metric)
    onClose()
  }

  const handleClose = () => {
    onClose()
  }

  const handleDropdownChange = (type: string, value: string) => {
    switch (type) {
      case 'metricType':
        setMetricType(value as 'binary' | 'continuous')
        setShowTypeDropdown(false)
        break
      case 'calculation':
        setContinuousCalculation(value as 'single' | 'ratio')
        setShowCalculationDropdown(false)
        break
      case 'numerator':
        setNumeratorColumn(value)
        setShowNumeratorDropdown(false)
        break
      case 'denominator':
        setDenominatorColumn(value)
        setShowDenominatorDropdown(false)
        break
      case 'value':
        setValueColumn(value)
        setShowValueDropdown(false)
        break
      case 'value2':
        setValueColumn2(value)
        setShowValue2Dropdown(false)
        break
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="!w-[95vw] !max-w-[500px] !h-[80vh] !max-h-[500px] !p-0 overflow-hidden flex flex-col" 
        style={{
          width: '95vw',
          maxWidth: '500px',
          height: '80vh',
          maxHeight: '500px'
        }}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          {editingMetric ? 'Edit Metric' : 'Create Custom Metric'}
        </DialogTitle>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            {editingMetric ? 'Edit Metric' : 'Create Custom Metric'}
          </h2>
          <button 
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Metric Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Metric Name *
              </label>
              <input
                type="text"
                value={metricName}
                onChange={(e) => setMetricName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-text"
                placeholder="e.g., Conversion Rate, Revenue per User, AOV"
              />
            </div>

            {/* Metric Type */}
            <div className="relative" ref={typeDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Metric Type *
              </label>
              <div 
                className="flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              >
                <span className="text-sm text-gray-900">
                  {metricType === 'binary' ? 'Binary (Conversion Rate, Click Rate)' : 'Continuous (Revenue, AOV, Quantity)'}
                </span>
                <ChevronDown size={16} className="text-gray-500" />
              </div>
              
              {showTypeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <button
                    onClick={() => handleDropdownChange('metricType', 'binary')}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 border-b border-gray-100"
                  >
                    Binary (Conversion Rate, Click Rate)
                  </button>
                  <button
                    onClick={() => handleDropdownChange('metricType', 'continuous')}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50"
                  >
                    Continuous (Revenue, AOV, Quantity)
                  </button>
                </div>
              )}
            </div>

            {/* Binary Metric Configuration */}
            {metricType === 'binary' && (
              <div className="space-y-3">
                <div className="relative" ref={numeratorDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numerator Column *
                  </label>
                  <div 
                    className="flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => setShowNumeratorDropdown(!showNumeratorDropdown)}
                  >
                    <span className="text-sm text-gray-900">{numeratorColumn || 'Select numerator column'}</span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                  
                  {showNumeratorDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto">
                      {availableColumns.map((column) => (
                        <button
                          key={column}
                          onClick={() => handleDropdownChange('numerator', column)}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          {column}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Column containing the events you want to count (e.g., purchases, clicks)
                  </p>
                </div>

                <div className="relative" ref={denominatorDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Denominator Column *
                  </label>
                  <div 
                    className="flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => setShowDenominatorDropdown(!showDenominatorDropdown)}
                  >
                    <span className="text-sm text-gray-900">{denominatorColumn || 'Select denominator column'}</span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                  
                  {showDenominatorDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto">
                      {availableColumns.map((column) => (
                        <button
                          key={column}
                          onClick={() => handleDropdownChange('denominator', column)}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          {column}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Column containing the total population (e.g., users, sessions)
                  </p>
                </div>

                {/* Preview */}
                {numeratorColumn && denominatorColumn && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-blue-900 mb-1">Metric Preview</h4>
                    <p className="text-xs text-blue-800">
                      {metricName || 'Your metric'} = {numeratorColumn} / {denominatorColumn}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      This will calculate the ratio of {numeratorColumn} events per {denominatorColumn}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Continuous Metric Configuration */}
            {metricType === 'continuous' && (
              <div className="space-y-3">
                <div className="relative" ref={calculationDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calculation Type *
                  </label>
                  <div 
                    className="flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => setShowCalculationDropdown(!showCalculationDropdown)}
                  >
                    <span className="text-sm text-gray-900">
                      {continuousCalculation === 'single' ? 'Single Value (e.g., Total Revenue)' : 'Ratio (e.g., AOV = Revenue / Purchase)'}
                    </span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                  
                  {showCalculationDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      <button
                        onClick={() => handleDropdownChange('calculation', 'single')}
                        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 border-b border-gray-100"
                      >
                        Single Value (e.g., Total Revenue)
                      </button>
                      <button
                        onClick={() => handleDropdownChange('calculation', 'ratio')}
                        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50"
                      >
                        Ratio (e.g., AOV = Revenue / Purchase)
                      </button>
                    </div>
                  )}
                </div>

                {continuousCalculation === 'single' ? (
                  <div className="relative" ref={valueDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value Column *
                    </label>
                    <div 
                      className="flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                      onClick={() => setShowValueDropdown(!showValueDropdown)}
                    >
                      <span className="text-sm text-gray-900">{valueColumn || 'Select value column'}</span>
                      <ChevronDown size={16} className="text-gray-500" />
                    </div>
                    
                    {showValueDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto">
                        {availableColumns.map((column) => (
                          <button
                            key={column}
                            onClick={() => handleDropdownChange('value', column)}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            {column}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Column containing the numeric values you want to analyze (e.g., revenue, quantity)
                    </p>

                    {/* Preview */}
                    {valueColumn && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                        <h4 className="text-xs font-medium text-blue-900 mb-1">Metric Preview</h4>
                        <p className="text-xs text-blue-800">
                          {metricName || 'Your metric'} = Average of {valueColumn}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          This will calculate the average value of {valueColumn} per user/variation
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative" ref={valueDropdownRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numerator Column *
                      </label>
                      <div 
                        className="flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                        onClick={() => setShowValueDropdown(!showValueDropdown)}
                      >
                        <span className="text-sm text-gray-900">{valueColumn || 'Select numerator column'}</span>
                        <ChevronDown size={16} className="text-gray-500" />
                      </div>
                      
                      {showValueDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto">
                          {availableColumns.map((column) => (
                            <button
                              key={column}
                              onClick={() => handleDropdownChange('value', column)}
                              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              {column}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Column containing the numerator values (e.g., revenue for AOV)
                      </p>
                    </div>

                    <div className="relative" ref={value2DropdownRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Denominator Column *
                      </label>
                      <div 
                        className="flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                        onClick={() => setShowValue2Dropdown(!showValue2Dropdown)}
                      >
                        <span className="text-sm text-gray-900">{valueColumn2 || 'Select denominator column'}</span>
                        <ChevronDown size={16} className="text-gray-500" />
                      </div>
                      
                      {showValue2Dropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto">
                          {availableColumns.map((column) => (
                            <button
                              key={column}
                              onClick={() => handleDropdownChange('value2', column)}
                              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              {column}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Column containing the denominator values (e.g., purchase count for AOV)
                      </p>
                    </div>

                    {/* Preview */}
                    {valueColumn && valueColumn2 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="text-xs font-medium text-blue-900 mb-1">Metric Preview</h4>
                        <p className="text-xs text-blue-800">
                          {metricName || 'Your metric'} = {valueColumn} / {valueColumn2}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          This will calculate the ratio of {valueColumn} per {valueColumn2}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-text"
                rows={2}
                placeholder="Describe what this metric measures and how it's calculated..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            {editingMetric ? 'Update Metric' : 'Create Metric'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 