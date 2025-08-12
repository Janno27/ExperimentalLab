import React, { useState } from 'react'
import type { Experimentation } from '@/hooks/useExperimentation'
import { DialogTitle } from '@/components/ui/dialog'
import { ChevronDown, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { updateExperimentationFields, fetchTestTypes } from '@/lib/airtable'

function KanbanTicketComments() {
  return (
    <div className="border-t border-zinc-100 dark:border-zinc-700 pt-2 mt-2 text-xs text-zinc-500 flex items-center gap-2">
      <span className="">💬 Ajouter un commentaire...</span>
    </div>
  )
}

function Chip({ children, color }: { children: React.ReactNode, color?: string }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium mr-1 ${color || 'bg-zinc-100 text-zinc-700'}`}>{children}</span>
  )
}

// Composant Image avec skeleton
function ImageWithSkeleton({ src, alt, width, height, className }: { src: string, alt: string, width: number, height: number, className?: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return <div className="text-xs text-zinc-500 mt-1">Image non disponible</div>
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded`} style={{ width, height }} />
      )}
      <Image 
        src={src} 
        alt={alt} 
        width={width}
        height={height}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
    </div>
  )
}

interface KanbanTicketProps {
  card: Experimentation
  kpis: { id: string, name: string }[]
  pages: { id: string, name: string }[]
  products: { id: string, name: string }[]
}

export default function KanbanTicket({ card, kpis, pages, products }: KanbanTicketProps) {
  const [dataExpanded, setDataExpanded] = useState(false)
  const [audienceExpanded, setAudienceExpanded] = useState(false)
  const [testTypes, setTestTypes] = useState<{id: string, name: string}[]>([])
  const [startDate, setStartDate] = useState(card.startDate || '')
  const [estimatedTime, setEstimatedTime] = useState(card['Estimated Time'] || '')
  const [endDate, setEndDate] = useState(card.endDate || '')
  const [saving, setSaving] = useState(false)
  const [contextExpanded, setContextExpanded] = useState(false)
  
  // Helper pour extraire l'URL d'un champ d'attachement Airtable
  const getAttachmentUrl = (field: unknown): string | null => {
    if (Array.isArray(field) && field.length > 0 && field[0]?.url) {
      return field[0].url
    }
    return null
  }
  
  // Helper pour trouver le nom depuis l'id (linked record)
  const getName = (id: string, arr: {id: string, name: string}[]) => arr.find(x => x.id === id)?.name || id
  // Helper pour chips colorées
  const statusColor = (status: string) => {
    switch (status) {
      case 'Denied': return 'bg-red-100 text-red-700';
      case 'To be prioritized': return 'bg-zinc-100 text-zinc-600';
      case 'Open': return 'bg-blue-100 text-blue-700';
      case 'Refinement': return 'bg-blue-200 text-blue-800';
      case 'Design & Development': return 'bg-blue-100 text-blue-700';
      case 'Setup': return 'bg-blue-200 text-blue-800';
      case 'Running': return 'bg-green-100 text-green-700';
      case 'Ready for Analysis': return 'bg-green-200 text-green-800';
      case 'Analysing': return 'bg-green-300 text-green-900';
      case 'Done': return 'bg-zinc-200 text-zinc-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  }

  // Calcul automatique de la date de fin
  useEffect(() => {
    if (!startDate || !estimatedTime) return
    // On attend un format "X days" ou "X weeks" ou "X months" ou nombre de jours
    let days = 0
    const match = String(estimatedTime).toLowerCase().match(/(\d+)\s*(day|week|month|d|w|m)?/)
    if (match) {
      const n = parseInt(match[1], 10)
      const unit = match[2] || 'day'
      if (unit.startsWith('w')) days = n * 7
      else if (unit.startsWith('m')) days = n * 30
      else days = n
    }
    if (days > 0) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + days)
      setEndDate(d.toISOString().slice(0, 10))
    }
  }, [startDate, estimatedTime])

  // Sauvegarde Airtable
  const handleSave = async (fields: Record<string, unknown>) => {
    setSaving(true)
    try {
      await updateExperimentationFields(card.id, fields)
    } catch (e: unknown) {
      alert('Erreur Airtable: ' + (e && typeof e === 'object' && 'message' in e ? (e as {message?: string}).message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Sauvegarde Airtable avec debounce pour Estimated Time et Start Date
  const debouncedSave = (fields: Record<string, unknown>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const cleanFields = { ...fields }
    delete cleanFields['End Date']
    if (cleanFields['Estimated Time'] !== undefined) {
      const num = Number(cleanFields['Estimated Time'])
      cleanFields['Estimated Time'] = isNaN(num) ? undefined : num
    }
    debounceRef.current = setTimeout(() => {
      // On ne sauvegarde que si les valeurs sont non vides
      if (cleanFields['Estimated Time'] !== undefined && String(cleanFields['Estimated Time']).trim() === '') return
      if (cleanFields['Start Date'] !== undefined && String(cleanFields['Start Date']).trim() === '') return
      handleSave(cleanFields)
    }, 1000)
  }

  useEffect(() => {
    fetchTestTypes().then(setTestTypes)
  }, [])

  return (
    <div className="relative flex flex-col max-w-xl w-full min-h-[400px] max-h-[90vh] text-sm">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-900 pb-2 pt-1 flex flex-col gap-1 border-b border-zinc-100 dark:border-zinc-700">
        <div className="flex flex-row items-center justify-between mb-0">
          <div className="flex items-center gap-2">
            {card.Type && <Chip color="bg-blue-100 text-blue-700">{card.Type}</Chip>}
          </div>
          {card.status && <Chip color={statusColor(card.status)}>{card.status}</Chip>}
        </div>
        <DialogTitle>
          <span className="text-base font-semibold leading-tight">{card.name}</span>
        </DialogTitle>
      </div>
      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto px-1 py-2">
        {/* Section Parameters */}
        <div className="flex flex-col gap-3 mb-4 bg-zinc-50 dark:bg-zinc-900/40 rounded p-3">
          <div className="font-bold text-xs text-zinc-500 mb-1 uppercase tracking-wider">Parameters</div>
          {/* Ligne Owner - Role - Market */}
          <div className="grid grid-cols-3 gap-4 w-full items-start">
            <div className="flex flex-col items-start">
              <span className="font-semibold text-xs">Owner:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {card.owner && card.owner.length > 0 && card.owner.map(o => <Chip key={o.id} color="bg-violet-100 text-violet-700">{o.name}</Chip>)}
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-semibold text-xs">Role:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {card.role && <Chip color="bg-cyan-100 text-cyan-700">{card.role}</Chip>}
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-semibold text-xs">Market:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {card.market && card.market.length > 0 && card.market.map(m => <Chip key={m.id} color="bg-green-100 text-green-700">{m.name}</Chip>)}
              </div>
            </div>
          </div>
          {/* Type sur une ligne séparée */}
          <div className="flex flex-col items-start mt-2">
            <span className="font-semibold text-xs">Type:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {Array.isArray(card['Test Type']) && card['Test Type'].length > 0 && testTypes.length > 0 && (
                card['Test Type'].map((id: string) => <Chip key={id} color="bg-blue-100 text-blue-700">{getName(id, testTypes)}</Chip>)
              )}
            </div>
          </div>
          <div className="border-t border-zinc-200 dark:border-zinc-600 my-2"></div>
          {/* Ligne StartDate . EndDate . EstimatedTime */}
          <div className="grid grid-cols-3 gap-4 w-full justify-between items-center">
            <div className="flex flex-col items-start">
              <span className="font-semibold text-xs">Start Date:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value)
                  debouncedSave({ 'Start Date': e.target.value, 'End Date': endDate })
                }}
                className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                style={{minWidth:120}}
                disabled={saving}
              />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-semibold text-xs">End Date:</span>
              <span className="ml-2 text-sm mt-1">{endDate}</span>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-semibold text-xs">Estimated Time:</span>
              <input
                type="text"
                value={estimatedTime}
                onChange={e => {
                  setEstimatedTime(e.target.value)
                  // recalcul endDate automatiquement
                  let days = 0
                  const match = String(e.target.value).toLowerCase().match(/(\d+)\s*(day|week|month|d|w|m)?/)
                  if (match) {
                    const n = parseInt(match[1], 10)
                    const unit = match[2] || 'day'
                    if (unit.startsWith('w')) days = n * 7
                    else if (unit.startsWith('m')) days = n * 30
                    else days = n
                  }
                  let newEnd = endDate
                  if (days > 0 && startDate) {
                    const d = new Date(startDate)
                    d.setDate(d.getDate() + days)
                    newEnd = d.toISOString().slice(0, 10)
                    setEndDate(newEnd)
                  }
                  debouncedSave({ 'Estimated Time': e.target.value, 'End Date': newEnd })
                }}
                className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs w-24"
                style={{minWidth:80}}
                disabled={saving}
              />
            </div>
          </div>
        </div>
        {/* Section Data - Collapsible */}
        <div className="flex flex-col gap-3 mb-4 bg-zinc-50 dark:bg-zinc-900/40 rounded p-3">
          <button 
            onClick={() => setDataExpanded(!dataExpanded)}
            className="flex items-center gap-2 font-bold text-xs text-zinc-500 mb-1 uppercase tracking-wider hover:text-zinc-700 transition-colors"
          >
            {dataExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Data
          </button>
          {dataExpanded && (
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
              {/* Ligne 1 titres */}
              <span className="font-semibold text-xs">Main KPI</span>
              <span className="font-semibold text-xs">Audience</span>
              <span className="font-semibold text-xs">Conversion</span>
              {/* Ligne 1 valeurs */}
              <div className="flex flex-wrap gap-1 mt-1">
                {Array.isArray(card['Main KPI']) && card['Main KPI'].length > 0 && (
                  card['Main KPI'].map((id: string) => <Chip key={id} color="bg-blue-100 text-blue-700">{getName(id, kpis)}</Chip>)
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">{card.Audience && <span>{card.Audience}</span>}</div>
              <div className="flex flex-wrap gap-1 mt-1">{card.Conversion && <span>{card.Conversion}</span>}</div>
              {/* Ligne 2 titres */}
              <span className="font-semibold text-xs">MDE</span>
              <span className="font-semibold text-xs">Existing Rate</span>
              <span className="font-semibold text-xs">Traffic Allocation</span>
              {/* Ligne 2 valeurs */}
              <div className="flex flex-wrap gap-1 mt-1">{card.MDE && <Chip color="bg-blue-100 text-blue-700">{card.MDE}</Chip>}</div>
              <div className="flex flex-wrap gap-1 mt-1">{(card['Existing % Rate'] || card['Existing %']) && <Chip color="bg-blue-100 text-blue-700">{((parseFloat(card['Existing % Rate'] || card['Existing %']) || 0) * 100).toFixed(1)}%</Chip>}</div>
              <div className="flex flex-wrap gap-1 mt-1">{(card['Traffic allocation'] || card['Traffic Allocation']) && <Chip color="bg-blue-100 text-blue-700">{card['Traffic allocation'] || card['Traffic Allocation']}</Chip>}</div>
            </div>
          )}
        </div>
        {/* Section Audience - Collapsible */}
        <div className="flex flex-col gap-3 mb-4 bg-zinc-50 dark:bg-zinc-900/40 rounded p-3">
          <button 
            onClick={() => setAudienceExpanded(!audienceExpanded)}
            className="flex items-center gap-2 font-bold text-xs text-zinc-500 mb-1 uppercase tracking-wider hover:text-zinc-700 transition-colors"
          >
            {audienceExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Audience
          </button>
          {audienceExpanded && (
            <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
              {/* Titres */}
              <span className="font-semibold text-xs">Page</span>
              <span className="font-semibold text-xs">Product</span>
              <span className="font-semibold text-xs">Devices</span>
              {/* Valeurs */}
              <div className="flex flex-wrap gap-1 mt-1">
                {Array.isArray(card.Page) && card.Page.length > 0 && (
                  card.Page.map((id: string) => <Chip key={id} color="bg-orange-100 text-orange-700">{getName(id, pages)}</Chip>)
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {Array.isArray(card.Product) && card.Product.length > 0 && (
                  card.Product.map((id: string) => <Chip key={id} color="bg-pink-100 text-pink-700">{getName(id, products)}</Chip>)
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">{card.Devices && <Chip color="bg-blue-100 text-blue-700">{card.Devices}</Chip>}</div>
            </div>
          )}
        </div>
        {/* Section Description */}
        <div className="flex flex-col gap-3 mb-4 bg-zinc-50 dark:bg-zinc-900/40 rounded p-3">
          <div className="font-bold text-xs text-zinc-500 mb-1 uppercase tracking-wider">Description</div>
          <div className="flex flex-col gap-3 text-xs">
            {card.Hypothesis && (
              <div>
                <div className="font-semibold mb-1">Hypothesis:</div>
                <div className="italic text-zinc-700 dark:text-zinc-300">{card.Hypothesis}</div>
              </div>
            )}
            {card.Description && (
              <div>
                <div className="font-semibold mb-1">Description:</div>
                <div className="text-zinc-700 dark:text-zinc-300">{card.Description}</div>
              </div>
            )}
            {/* Context collapsible */}
            {card.Context && (
              <div className="flex flex-col">
                <button
                  onClick={() => setContextExpanded(v => !v)}
                  className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-700 transition-colors font-semibold mt-2"
                  aria-expanded={contextExpanded}
                >
                  {contextExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Context
                </button>
                {contextExpanded && (
                  <div className="mt-2 text-zinc-700 dark:text-zinc-300">{card.Context}</div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Section Images - Control et Target */}
        {(card.Control || card['Variation 1']) && (
          <div className="flex flex-col gap-3 mb-4 bg-zinc-50 dark:bg-zinc-900/40 rounded p-3">
            <div className="font-bold text-xs text-zinc-500 mb-1 uppercase tracking-wider">Images</div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {card.Control && (
                <div>
                  <span className="font-semibold text-xs">Control:</span>
                  {(() => {
                    const controlUrl = getAttachmentUrl(card.Control)
                    return controlUrl ? (
                      <ImageWithSkeleton 
                        src={controlUrl} 
                        alt="Control" 
                        width={200}
                        height={128}
                        className="mt-1 rounded max-h-32 object-contain" 
                      />
                    ) : (
                      <div className="text-xs text-zinc-500 mt-1">Aucune image</div>
                    )
                  })()}
                </div>
              )}
              {card['Variation 1'] && (
                <div>
                  <span className="font-semibold text-xs">Target:</span>
                  {(() => {
                    const targetUrl = getAttachmentUrl(card['Variation 1'])
                    return targetUrl ? (
                      <ImageWithSkeleton 
                        src={targetUrl} 
                        alt="Target" 
                        width={200}
                        height={128}
                        className="mt-1 rounded max-h-32 object-contain" 
                      />
                    ) : (
                      <div className="text-xs text-zinc-500 mt-1">Aucune image</div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Section Success Criteria */}
        <div className="flex flex-col gap-3 mb-4 bg-zinc-50 dark:bg-zinc-900/40 rounded p-3">
          <div className="font-bold text-xs text-zinc-500 mb-1 uppercase tracking-wider">Success Criteria</div>
          <div className="grid grid-cols-1 gap-y-2 text-xs">
            <div>
              <span className="font-semibold text-xs">Success Criteria #1:</span>
              <div className="mt-1">{card['Success Criteria #1'] || <span className="text-zinc-400">-</span>}</div>
            </div>
            <div>
              <span className="font-semibold text-xs">Success Criteria #2:</span>
              <div className="mt-1">{card['Success Criteria #2'] || <span className="text-zinc-400">-</span>}</div>
            </div>
            <div>
              <span className="font-semibold text-xs">Success Criteria #3:</span>
              <div className="mt-1">{card['Success Criteria #3'] || <span className="text-zinc-400">-</span>}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer commentaires */}
      <KanbanTicketComments />
    </div>
  )
} 