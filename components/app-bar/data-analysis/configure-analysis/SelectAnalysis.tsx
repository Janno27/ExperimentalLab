'use client'

import React, { useState } from 'react'
import { Search, FlaskConical, Sparkles, Wrench, Database } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface ReadyForAnalysisTest {
  id: string
  name: string
  type: string
  owner: string
  startDate: string
  endDate: string
  mainKPI: string
  status: string
  description?: string
  hypothesis?: string
  context?: string
  successCriteria?: string[]
  control?: Record<string, unknown>
  variation?: Record<string, unknown>
  audience?: string
  conversion?: string
  mde?: string
  existingRate?: string
  trafficAllocation?: string
  scope?: string
  estimatedTime?: string
  role?: string
  market?: string
  page?: string
  product?: string
  devices?: string
  conclusive?: string
  winLoss?: string
  results?: string
  notes?: string
  fields?: Record<string, string | number | boolean>
}

interface SelectAnalysisProps {
  tests: ReadyForAnalysisTest[]
  loading: boolean
  onTestSelect: (test: ReadyForAnalysisTest) => void
  selectedTestId?: string
}

// Fonction pour obtenir l'icône du type de test
function typeIcon(type?: string) {
  if (!type) return null
  if (type === 'A/B-Test') return <span className="flex items-center"><FlaskConical size={15} className="text-blue-500" /><span className="sr-only">A/B-Test</span></span>
  if (type === 'Personalization') return <span className="flex items-center"><Sparkles size={15} className="text-cyan-500" /><span className="sr-only">Personalization</span></span>
  if (type === 'Fix/Patch') return <span className="flex items-center"><Wrench size={15} className="text-teal-500" /><span className="sr-only">Fix/Patch</span></span>
  return null
}

export function SelectAnalysis({ tests, loading, onTestSelect, selectedTestId }: SelectAnalysisProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrer les tests selon le terme de recherche
  const filteredTests = tests.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.mainKPI.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full max-h-[calc(90vh-4rem)]">
      {/* Search Bar */}
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, owner or KPI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Liste des tests avec ScrollArea */}
      <div className="flex-1 min-h-0 px-6 max-h-[calc(100vh-10rem)]">
        <div className="h-full overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Loading tests...</div>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No tests found' : 'No tests ready for analysis'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Try modifying your search criteria'
                  : 'All your tests are either in progress or already analyzed'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-6 pr-2 px-1">
              {filteredTests.map((test) => (
                <div
                  key={test.id}
                  className={`bg-white dark:bg-zinc-800 rounded-xl shadow p-3 text-xs text-zinc-800 dark:text-zinc-100 flex flex-col gap-2 border border-zinc-100 dark:border-zinc-700 relative cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition ${
                    selectedTestId === test.id 
                      ? 'ring-2 ring-violet-300 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700' 
                      : ''
                  }`}
                  onClick={() => onTestSelect(test)}
                  tabIndex={0}
                  role="button"
                  aria-label="Select test for analysis"
                >
                  <div className="flex items-center justify-between mb-1 min-h-[20px]">
                    <div>{typeIcon(test.type)}</div>
                    {test.fields?.Scope && (
                      <span className="bg-zinc-100 dark:bg-zinc-700 rounded px-1.5 py-0.5 ml-1 whitespace-nowrap text-[10px] font-normal">
                        {test.fields.Scope}
                      </span>
                    )}
                  </div>
                  
                  <div className="font-medium text-xs break-words line-clamp-2" style={{wordBreak:'break-word'}} title={test.name}>
                    {test.name}
                  </div>
                  
                  <div className="flex items-center gap-1 flex-wrap">
                    {test.owner && test.owner !== 'Unknown' && (
                      <span className="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-200 rounded px-2 py-0.5">
                        {test.owner}
                      </span>
                    )}
                    {test.market && test.market !== 'Unknown' && (
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded px-2 py-0.5">
                        {test.market}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-[10px] text-zinc-500 dark:text-zinc-300 mt-1">
                    {test.startDate && <span>Start: {test.startDate}</span>}
                    {test.endDate && <span>End: {test.endDate}</span>}
                  </div>
                  
                  <div className="space-y-1 text-[10px] text-zinc-500 dark:text-zinc-300">
                    {test.mainKPI && test.mainKPI !== 'Unknown' && (
                      <div><span className="font-medium">KPI:</span> {test.mainKPI}</div>
                    )}
                    {test.page && test.page !== 'Unknown' && (
                      <div><span className="font-medium">Page:</span> {test.page}</div>
                    )}
                    {test.product && test.product !== 'Unknown' && (
                      <div><span className="font-medium">Product:</span> {test.product}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 