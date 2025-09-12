'use client'

import React, { useState, useCallback } from 'react'
import { X, FileUp, Check, AlertCircle, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { analysisAPI } from '@/lib/api/analysis-api'

interface TransactionUploadModalProps {
  isOpen: boolean
  onClose: () => void
  metricName: string
  originalJobId?: string
  onUploadComplete: (success: boolean, enrichedJobId?: string, transactionData?: Record<string, unknown>[]) => void
}

interface FileValidationResult {
  isValid: boolean
  dataType: 'transaction' | 'aggregated' | 'unknown'
  detectedColumns: string[]
  recommendations: string[]
  warnings: string[]
}

interface ColumnMapping {
  detected: string
  required: string
  mapped: boolean
}

const REQUIRED_COLUMNS = [
  { key: 'transaction_id', label: 'Transaction ID', description: 'Unique identifier for the transaction' },
  { key: 'variation', label: 'Variation', description: 'Variation name (Control, Treatment, etc.)' },
  { key: 'revenue', label: 'Revenue', description: 'Transaction amount' },
  { key: 'quantity', label: 'Quantity', description: 'Quantity purchased (optional)' }
]

export function TransactionUploadModal({ 
  isOpen, 
  onClose, 
  metricName,
  originalJobId,
  onUploadComplete 
}: TransactionUploadModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [csvPreview, setCsvPreview] = useState<string[][]>([])
  const [fullCsvData, setFullCsvData] = useState<string[][]>([])
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [fileValidation, setFileValidation] = useState<FileValidationResult | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping'>('upload')

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validateFile = (headers: string[], sampleData: string[][]): FileValidationResult => {
    const recommendations: string[] = []
    const warnings: string[] = []
    let dataType: 'transaction' | 'aggregated' | 'unknown' = 'unknown'
    
    // Detect data type based on headers and content
    const hasTransactionId = headers.some(h => 
      h.toLowerCase().includes('transaction') || 
      h.toLowerCase().includes('order_id') ||
      h.toLowerCase().includes('purchase_id')
    )
    
    const hasUserColumn = headers.some(h => 
      h.toLowerCase().includes('user') ||
      h.toLowerCase().includes('visitor') ||
      h.toLowerCase().includes('customer')
    )
    
    const hasVariation = headers.some(h => 
      h.toLowerCase().includes('variation') ||
      h.toLowerCase().includes('variant') ||
      h.toLowerCase().includes('group')
    )
    
    const hasRevenue = headers.some(h => 
      h.toLowerCase().includes('revenue') ||
      h.toLowerCase().includes('amount') ||
      h.toLowerCase().includes('price') ||
      h.toLowerCase().includes('value')
    )
    
    // Analyze data structure
    if (hasTransactionId && hasRevenue) {
      dataType = 'transaction'
      recommendations.push('✓ Transaction-level data detected - perfect for enrichment!')
    } else if (hasUserColumn && hasRevenue) {
      dataType = 'aggregated'
      warnings.push('⚠️ Aggregated data detected - transaction-level data is preferred for more accurate analysis')
      recommendations.push('Consider uploading individual transaction records instead')
    }
    
    // Validate required columns
    const missingColumns: string[] = []
    if (!hasTransactionId && dataType === 'transaction') {
      missingColumns.push('transaction_id')
    }
    if (!hasVariation) {
      missingColumns.push('variation')
    }
    if (!hasRevenue) {
      missingColumns.push('revenue')
    }
    
    // Date validation
    const dateColumns = headers.filter(h => 
      h.toLowerCase().includes('date') ||
      h.toLowerCase().includes('time') ||
      h.toLowerCase().includes('created')
    )
    
    if (dateColumns.length > 0) {
      recommendations.push(`📅 Date columns detected: ${dateColumns.join(', ')} - ensure proper format (YYYY-MM-DD)`)
    }
    
    // Sample size validation
    if (sampleData.length < 100) {
      warnings.push(`⚠️ Small sample size (${sampleData.length} rows) - consider including more data for statistical significance`)
    } else if (sampleData.length > 100000) {
      recommendations.push(`📊 Large dataset (${sampleData.length} rows) - excellent for statistical analysis!`)
    }
    
    return {
      isValid: missingColumns.length === 0,
      dataType,
      detectedColumns: headers,
      recommendations,
      warnings
    }
  }

  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    setFile(uploadedFile)
    setUploading(true)

    try {
      const text = await uploadedFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      
      // Parse all data for processing
      const allData = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')))
      setFullCsvData(allData)
      
      // Keep only first 6 lines for preview
      const preview = lines.slice(0, 6).map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')))
      setCsvPreview(preview)
      
      
      // Validate file structure and content
      const validation = validateFile(headers, allData.slice(1))
      setFileValidation(validation)
      
      // Auto-detect column mappings
      const mappings: ColumnMapping[] = REQUIRED_COLUMNS.map(reqCol => {
        const detectedCol = headers.find(h => 
          h.toLowerCase().includes(reqCol.key.toLowerCase()) ||
          (reqCol.key === 'transaction_id' && (h.toLowerCase().includes('id') || h.toLowerCase().includes('transaction'))) ||
          (reqCol.key === 'variation' && (h.toLowerCase().includes('variant') || h.toLowerCase().includes('group'))) ||
          (reqCol.key === 'revenue' && (h.toLowerCase().includes('amount') || h.toLowerCase().includes('price')))
        )
        
        return {
          detected: detectedCol || '',
          required: reqCol.key,
          mapped: !!detectedCol
        }
      })
      
      setColumnMappings(mappings)
      setStep('preview')
    } catch (error) {
      console.error('Error reading file:', error)
      alert('Error reading CSV file')
    } finally {
      setUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleMappingChange = (requiredColumn: string, detectedColumn: string) => {
    setColumnMappings(prev => prev.map(mapping => 
      mapping.required === requiredColumn 
        ? { ...mapping, detected: detectedColumn, mapped: !!detectedColumn }
        : mapping
    ))
  }

  const canProceed = columnMappings.filter(m => m.required !== 'quantity').every(m => m.mapped)

  const handleConfirmUpload = async () => {
    if (!originalJobId) {
      alert('Error: Original job ID is required for enrichment')
      return
    }

    setUploading(true)
    
    try {
      // Transform CSV data to transaction records using FULL data, not just preview
      // CRITIQUE: Préserver TOUTES les colonnes pour le filtrage futur
      const transactionData = fullCsvData.slice(1).map(row => {
        const record: Record<string, unknown> = {}
        
        // D'abord, ajouter TOUTES les colonnes du CSV original
        fullCsvData[0].forEach((header, index) => {
          if (index < row.length) {
            let value: unknown = row[index]
            
            // Identifier les colonnes numériques par leur mapping ou contenu
            const isRevenueColumn = columnMappings.some(m => 
              m.mapped && m.detected === header && (m.required === 'revenue' || m.required === 'quantity')
            )
            
            if (isRevenueColumn || header.toLowerCase().includes('revenue') || 
                header.toLowerCase().includes('amount') || header.toLowerCase().includes('price') ||
                header.toLowerCase().includes('quantity')) {
              value = parseFloat(String(value)) || (header.toLowerCase().includes('quantity') ? 1 : 0)
            }
            
            record[header] = value
          }
        })
        
        // Ensuite, ajouter les colonnes mappées avec leurs noms standardisés
        columnMappings.forEach(mapping => {
          if (mapping.mapped && mapping.detected) {
            const columnIndex = fullCsvData[0].indexOf(mapping.detected)
          if (columnIndex >= 0 && columnIndex < row.length) {
            let value: unknown = row[columnIndex]
            
            // Convert numeric fields
            if (mapping.required === 'revenue' || mapping.required === 'quantity') {
              value = parseFloat(String(value)) || (mapping.required === 'quantity' ? 1 : 0)
            }
              
              record[mapping.required] = value
            }
          }
        })
        
        // Set default quantity if not mapped
        if (!record.quantity) {
          record.quantity = 1
        }
        
        return record
      }).filter(record => record.transaction_id && record.variation && record.revenue !== undefined)


      // Validate data before sending
      const invalidRecords = transactionData.filter(record => 
        !record.transaction_id || !record.variation || record.revenue === undefined || record.revenue === null
      )
      
      if (invalidRecords.length > 0) {
        throw new Error(`${invalidRecords.length} invalid records found. Missing required fields.`)
      }

      // Call API to enrich analysis
      const enrichmentResult = await analysisAPI.enrichWithTransactionData(
        originalJobId,
        transactionData
      )

      // Poll for completion
      await analysisAPI.getResults(enrichmentResult.job_id)
      
      onUploadComplete(true, enrichmentResult.job_id, transactionData)
      onClose()
      
      // Reset states
      setFile(null)
      setCsvPreview([])
      setFullCsvData([])
      setColumnMappings([])
      setFileValidation(null)
      setStep('upload')
    } catch (error) {
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      onUploadComplete(false, undefined)
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!uploading) {
      setFile(null)
      setCsvPreview([])
      setFullCsvData([])
      setColumnMappings([])
      setFileValidation(null)
      setStep('upload')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] sm:max-h-[99vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Upload Transaction Data</h2>
            <p className="text-sm text-gray-600 mt-1">
              Enrich the &ldquo;{metricName}&rdquo; metric with transaction-level data
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] sm:max-h-[calc(95vh-140px)]">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Upload Area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                  dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drag your CSV file here
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  or click to select a file
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="csv-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 hover:cursor-pointer"
                >
                  Select a file
                </label>
              </div>

              {/* Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-3">Required columns in your CSV file:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {REQUIRED_COLUMNS.map(col => (
                    <div key={col.key} className="flex items-start gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                        col.key === 'quantity' ? "bg-yellow-400" : "bg-blue-400"
                      )} />
                      <div>
                        <p className="text-sm font-medium text-blue-900">{col.label}</p>
                        <p className="text-xs text-blue-700">{col.description}</p>
                        {col.key === 'quantity' && (
                          <p className="text-xs text-yellow-700 font-medium">Optional</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && csvPreview.length > 0 && (
            <div className="space-y-6">
              {/* File Validation Results */}
              {fileValidation && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">File Analysis</h3>
                  
                  {/* Data Type Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Detected Type:</span>
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      fileValidation.dataType === 'transaction' ? "bg-green-100 text-green-700" :
                      fileValidation.dataType === 'aggregated' ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    )}>
                      {fileValidation.dataType === 'transaction' ? '📊 Transaction Data' :
                       fileValidation.dataType === 'aggregated' ? '📈 Aggregated Data' :
                       '❓ Unknown Type'}
                    </span>
                  </div>
                  
                  {/* Recommendations */}
                  {fileValidation.recommendations.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="space-y-1">
                        {fileValidation.recommendations.map((rec, index) => (
                          <p key={index} className="text-xs text-blue-700">{rec}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Warnings */}
                  {fileValidation.warnings.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="space-y-1">
                        {fileValidation.warnings.map((warning, index) => (
                          <p key={index} className="text-xs text-yellow-700">{warning}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preview Table */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">File preview:</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {csvPreview[0]?.map((header, index) => (
                            <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {csvPreview.slice(1, 6).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Column Mapping */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Column mapping:</h3>
                <div className="space-y-3">
                  {columnMappings.map(mapping => (
                    <div key={mapping.required} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {REQUIRED_COLUMNS.find(c => c.key === mapping.required)?.label}
                          </span>
                          {mapping.required !== 'quantity' && (
                            <span className="text-red-500 text-xs">*</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          {REQUIRED_COLUMNS.find(c => c.key === mapping.required)?.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <select
                          value={mapping.detected}
                          onChange={(e) => handleMappingChange(mapping.required, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-3 py-1"
                        >
                          <option value="">-- Select --</option>
                          {csvPreview[0]?.map(header => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                        
                        {mapping.mapped ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : mapping.required !== 'quantity' ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!canProceed && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">
                      Please map all required columns to continue.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          
          {step === 'preview' && (
            <Button
              onClick={handleConfirmUpload}
              disabled={!canProceed || uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Confirm Upload
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
