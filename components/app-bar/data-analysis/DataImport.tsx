'use client'

import React, { useState, useRef } from 'react'
import { Upload, Database, FileText, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DataImportProps {
  onNextStep?: (fileData: Record<string, unknown>[], fileName: string) => void
}

export function DataImport({ onNextStep }: DataImportProps) {
  const [importedFile, setImportedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileData, setFileData] = useState<Record<string, unknown>[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [allFileData, setAllFileData] = useState<Record<string, unknown>[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const scrollToPreview = () => {
    if (previewRef.current && containerRef.current) {
      const container = containerRef.current
      const preview = previewRef.current
      const containerHeight = container.clientHeight
      const previewTop = preview.offsetTop
      const previewHeight = preview.clientHeight
      
      // Calculer la position pour centrer la preview
      const scrollTop = previewTop - (containerHeight / 2) + (previewHeight / 2)
      
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
    }
  }

  const handleFileSelect = (file: File) => {
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      setImportedFile(file)
      
      // Simuler la lecture du fichier CSV pour l'aperçu
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const lines = text.split('\n')
        const headers = lines[0]?.split(',') || []
        
        // Créer toutes les données du fichier
        const allData = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',')
          const row: Record<string, unknown> = {}
          headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || ''
          })
          return row
        })
        
        // Créer les données de preview (5 premières lignes)
        const previewData = allData.slice(0, 5)
        
        setAllFileData(allData)
        setFileData(previewData)
        
        // Animation pour afficher l'aperçu
        setTimeout(() => {
          setShowPreview(true)
          // Scroll automatique après l'animation
          setTimeout(() => scrollToPreview(), 100)
        }, 300)
      }
      reader.readAsText(file)
    } else {
      alert('Please select a valid CSV or Excel file')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const removeFile = () => {
    setImportedFile(null)
    setFileData([])
    setAllFileData([])
    setShowPreview(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleNextStep = () => {
    if (onNextStep && importedFile) {
      onNextStep(allFileData, importedFile.name)
    }
  }

  return (
    <div className="flex flex-col h-full w-full max-h-full overflow-hidden">
      <div 
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto flex items-center"
      >
        <div className="w-full max-w-2xl mx-auto py-8">
          <div className="space-y-8">
            {/* CSV/Excel Import Section */}
            <div className="text-center">
              <div className="mb-6">
                <FileText className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                <h3 className="text-base font-medium text-gray-900 mb-1">
                  Import CSV/Excel File
                </h3>
                <p className="text-sm text-gray-600">
                  Upload your A/B test data from a CSV or Excel file
                </p>
              </div>

              {!importedFile ? (
                <div
                  className={`max-w-sm mx-auto border-2 border-dashed rounded-lg p-6 transition-colors ${
                    isDragging 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-3">
                    Drag and drop your file here, or
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="w-full cursor-pointer"
                  >
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="max-w-sm mx-auto bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800 truncate">
                        {importedFile.name}
                      </p>
                      <p className="text-xs text-green-600">
                        {(importedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={removeFile}
                      className="text-green-600 hover:text-green-800 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Data Preview */}
            {importedFile && showPreview && (
              <div 
                ref={previewRef}
                className="transition-all duration-500 ease-in-out transform opacity-100 scale-100"
              >
                <div className="text-center mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Data Preview</h4>
                  <p className="text-xs text-gray-600">Verify that your data is correctly imported</p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm max-h-64">
                  <div className="overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {fileData.length > 0 && Object.keys(fileData[0]).map((header, index) => (
                            <th key={index} className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-200">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fileData.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {Object.values(row).map((value, colIndex) => (
                              <td key={colIndex} className="px-3 py-2 border-b border-gray-100 text-gray-600">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="text-center mt-6">
                  <button 
                    onClick={handleNextStep}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105 cursor-pointer mx-auto"
                  >
                    <span>Continue to analysis</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* BigQuery/GA4 Section - seulement si pas de fichier importé */}
            {!importedFile && (
              <>
                {/* Divider épuré */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 text-gray-500">or</span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="mb-4">
                    <Database className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-gray-900 mb-1">
                      Connect to BigQuery/GA4
                    </h3>
                    <p className="text-sm text-gray-600">
                      Fetch data directly from your BigQuery or Google Analytics 4
                    </p>
                  </div>

                  <div className="max-w-sm mx-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 cursor-pointer"
                    >
                      Connect to Data Source
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 