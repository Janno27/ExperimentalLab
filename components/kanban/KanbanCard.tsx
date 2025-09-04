import React, { useState } from 'react'
import type { Experimentation, Project } from '@/hooks/useExperimentation'
import { ChevronDown, ChevronUp, FlaskConical, Sparkles, Wrench } from 'lucide-react'
import { TicketOverlay } from '@/components/timeline/TicketOverlay'

interface KanbanCardProps {
  card: Experimentation
  kpis: { id: string, name: string }[]
  pages: { id: string, name: string }[]
  products: { id: string, name: string }[]
  onDataRefresh?: () => Promise<void>
}

// Fonction pour convertir Experimentation en Project
function convertExperimentationToProject(card: Experimentation): Project {
  return {
    id: card.id,
    country: card.market?.[0]?.name || '',
    section: card.section || '',
    title: card.name,
    status: card.status as Project['status'],
    startDate: card.startDate ? new Date(card.startDate) : new Date(),
    endDate: card.endDate ? new Date(card.endDate) : new Date(),
    progress: 0,
    owner: card.owner?.[0]?.name || '',
    analysisOwner: card['Analysis Owner']?.[0]?.name || '',
    mainKPI: card['Main KPI']?.[0]?.name || '',
    testType: card.Type || card.type || '',
    estimatedTime: card['Estimated Time'] || 0,
    mde: card.MDE || '',
    successCriteria1: card['Success Criteria #1'] || '',
    successCriteria2: card['Success Criteria #2'] || '',
    successCriteria3: card['Success Criteria #3'] || '',
    readyForAnalysisDate: card['Date - Ready for Analysis'] ? new Date(card['Date - Ready for Analysis']) : undefined,
    analysisStartDate: card['Date - Analysis'] ? new Date(card['Date - Analysis']) : undefined,
    analysisEndDate: card['Date - Analysis'] ? new Date(card['Date - Analysis']) : undefined,
    doneDate: card['Date - Done'] ? new Date(card['Date - Done']) : undefined,
    timeFromReadyToAnalysis: card['Days from Waiting for Analysis to Analysing'],
    timeFromAnalysisToDone: card['Days from Analysing to Done'],
    tool: card['Tool:'] || '',
    scope: card.scope || '',
    audience: card.Audience || '',
    conversion: card.Conversion || '',
    existingRate: card['Existing % Rate'] || card['Existing %'] || '',
    trafficAllocation: card['Traffic allocation'] || card['Traffic Allocation'] || '',
    page: card.Page?.[0]?.name || '',
    product: card.Product?.[0]?.name || '',
    devices: card.Devices || '',
    hypothesis: card.Hypothesis || '',
    description: card.Description || '',
    context: card.Context || '',
    control: card.Control,
    variation1: card['Variation 1'],
    metThreshold1: card['Met Threshold - Success Criteria #1'],
    metThreshold2: card['Met Threshold - Success Criteria #2'],
    metThreshold3: card['Met Threshold - Success Criteria #3'],
    learnings: card.Learnings || '',
    nextSteps: card['Next Steps'] || '',
    conclusive: card['Conclusive vs Non Conclusive'] || '',
    winLoss: card['Win vs Loss'] || '',
  }
}

function typeIcon(type?: string) {
  if (!type) return null
  if (type === 'A/B-Test') return <span className="flex items-center"><FlaskConical size={15} className="text-blue-500" /><span className="sr-only">A/B-Test</span></span>
  if (type === 'Personalization') return <span className="flex items-center"><Sparkles size={15} className="text-cyan-500" /><span className="sr-only">Personalization</span></span>
  if (type === 'Fix/Patch') return <span className="flex items-center"><Wrench size={15} className="text-teal-500" /><span className="sr-only">Fix/Patch</span></span>
  return null
}

export function KanbanCard({ card, onDataRefresh }: KanbanCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [open, setOpen] = useState(false)
  
  const project = convertExperimentationToProject(card)
  
  return (
    <>
      <div
        className="bg-white dark:bg-zinc-800 rounded-xl shadow p-3 text-xs text-zinc-800 dark:text-zinc-100 flex flex-col gap-2 border border-zinc-100 dark:border-zinc-700 relative cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition"
        onClick={e => {
          // Ne pas ouvrir la modale si on clique sur le bouton expand
          if ((e.target as HTMLElement).closest('button')) return
          setOpen(true)
        }}
        tabIndex={0}
        role="button"
        aria-label="Voir le détail du ticket"
      >
        <div className="flex items-center justify-between mb-1 min-h-[20px]">
          <div>{typeIcon(card.Type || card.type)}</div>
          {card.scope && <span className="bg-zinc-100 dark:bg-zinc-700 rounded px-1.5 py-0.5 ml-1 whitespace-nowrap text-[10px] font-normal">{card.scope}</span>}
        </div>
        <div className="font-medium text-xs break-words line-clamp-2" style={{wordBreak:'break-word'}} title={card.name}>{card.name}</div>
        {card.owner && Array.isArray(card.owner) && card.owner.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {card.owner.map((o: {id: string, name: string}, idx: number) => (
              <span key={o.id || idx} className="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-200 rounded px-2 py-0.5">
                {o.name}
              </span>
            ))}
          </div>
        )}
        {expanded && (
          <div className="flex flex-wrap gap-2 text-[10px] text-zinc-500 dark:text-zinc-300 mt-1">
            {card.startDate && <span>Start: {card.startDate}</span>}
            {card.endDate && <span>End: {card.endDate}</span>}
          </div>
        )}
        <button
          className="absolute bottom-2 right-2 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
          onClick={e => { e.stopPropagation(); setExpanded((v) => !v) }}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      
      <TicketOverlay 
        project={project}
        isOpen={open}
        onClose={() => setOpen(false)}
        onDataRefresh={onDataRefresh}
      />
    </>
  )
} 