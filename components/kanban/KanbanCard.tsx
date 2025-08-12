import React, { useState } from 'react'
import type { Experimentation } from '@/hooks/useExperimentation'
import { ChevronDown, ChevronUp, FlaskConical, Sparkles, Wrench } from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import KanbanTicket from './KanbanTicket'

interface KanbanCardProps {
  card: Experimentation
  kpis: { id: string, name: string }[]
  pages: { id: string, name: string }[]
  products: { id: string, name: string }[]
}

function typeIcon(type?: string) {
  if (!type) return null
  if (type === 'A/B-Test') return <span className="flex items-center"><FlaskConical size={15} className="text-blue-500" /><span className="sr-only">A/B-Test</span></span>
  if (type === 'Personalization') return <span className="flex items-center"><Sparkles size={15} className="text-cyan-500" /><span className="sr-only">Personalization</span></span>
  if (type === 'Fix/Patch') return <span className="flex items-center"><Wrench size={15} className="text-teal-500" /><span className="sr-only">Fix/Patch</span></span>
  return null
}

export function KanbanCard({ card, kpis, pages, products }: KanbanCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [open, setOpen] = useState(false)
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl w-full">
          <KanbanTicket card={card} kpis={kpis} pages={pages} products={products} />
        </DialogContent>
      </Dialog>
    </>
  )
} 