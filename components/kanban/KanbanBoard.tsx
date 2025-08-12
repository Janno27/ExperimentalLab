import React, { useState, useEffect } from 'react'
import type { Experimentation } from '@/hooks/useExperimentation'
import { COLUMN_ORDER } from '@/hooks/useExperimentation'
import { KanbanCard } from './KanbanCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { updateExperimentationStatus } from '@/lib/airtable'

interface KanbanBoardProps {
  columns: string[]
  cards: Experimentation[]
  kpis: { id: string, name: string }[]
  pages: { id: string, name: string }[]
  products: { id: string, name: string }[]
}

const STATUS_COLORS: Record<string, string> = {
  'Denied': 'bg-red-100 text-red-700',
  'To be prioritized': 'bg-zinc-100 text-zinc-600',
  'Open': 'bg-blue-100 text-blue-700',
  'Refinement': 'bg-blue-200 text-blue-800',
  'Design & Development': 'bg-blue-100 text-blue-700',
  'Setup': 'bg-blue-200 text-blue-800',
  'Running': 'bg-green-100 text-green-700',
  'Ready for Analysis': 'bg-green-200 text-green-800',
  'Analysing': 'bg-green-300 text-green-900',
  'Done': 'bg-zinc-200 text-zinc-700',
}

function getCreatedTime(card: Experimentation) {
  return card.createdTime || card["Created Time"] || card["created time"] || card.id
}

function getColumnFoldState(status: string) {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(`kanban_fold_${status}`) === '1'
}
function setColumnFoldState(status: string, folded: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`kanban_fold_${status}`, folded ? '1' : '0')
}

export function KanbanBoard({ cards, kpis, pages, products }: KanbanBoardProps) {
  const [folded, setFolded] = useState<Record<string, boolean>>({})
  const [localCards, setLocalCards] = useState(cards)
  const boardRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => { setLocalCards(cards) }, [cards])

  useEffect(() => {
    // Par défaut, To be prioritized et Denied sont repliées
    const state: Record<string, boolean> = {}
    COLUMN_ORDER.forEach(status => {
      // Si localStorage a une valeur, on la prend, sinon on replie par défaut les deux premières
      const stored = getColumnFoldState(status)
      if (typeof window !== 'undefined' && localStorage.getItem(`kanban_fold_${status}`) !== null) {
        state[status] = stored
      } else {
        state[status] = (status === 'To be prioritized' || status === 'Denied')
      }
    })
    setFolded(state)
  }, [])

  useEffect(() => {
    // Scroll automatique sur la première colonne ouverte
    if (!boardRef.current) return
    // On attend que le DOM soit prêt
    setTimeout(() => {
      const container = boardRef.current
      if (!container) return
      const firstOpenIdx = COLUMN_ORDER.findIndex(col => !folded[col])
      if (firstOpenIdx > 0) {
        // Largeur estimée d'une colonne fermée (w-8 + gap)
        const foldedWidth = 32 + 8 // px
        container.scrollLeft = foldedWidth * firstOpenIdx
      } else {
        container.scrollLeft = 0
      }
    }, 100)
  }, [folded])

  const handleToggleFold = (status: string) => {
    setFolded(prev => {
      const next = { ...prev, [status]: !prev[status] }
      setColumnFoldState(status, next[status])
      return next
    })
  }

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination || destination.droppableId === source.droppableId) return
    // Optimistic update
    setLocalCards(prev => prev.map(card => card.id === draggableId ? { ...card, status: destination.droppableId } : card))
    try {
      await updateExperimentationStatus(draggableId, destination.droppableId)
    } catch {
      // Rollback en cas d'erreur
      setLocalCards(cards)
      alert('Erreur lors de la mise à jour du status dans Airtable')
    }
  }

  const handleDragStart = () => {
    // setDraggingCardId(start.draggableId) // This line is removed as per the edit hint.
  }

  // Always use COLUMN_ORDER for folded columns order
  const foldedColumns = COLUMN_ORDER.filter(col => folded[col])
  const unfoldedColumns = COLUMN_ORDER.filter(col => !folded[col])

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <div ref={boardRef} className="w-full max-w-full overflow-x-auto pb-2 flex">
        {/* Mini-columns for folded columns */}
        {foldedColumns.length > 0 && (
          <div className="flex flex-row gap-2 mr-4 items-start pt-2">
            {foldedColumns.map(col => {
              const filtered = cards.filter(card => card.status === col)
              return (
                <div key={col} className="flex flex-col items-center w-8 transition-all duration-300 ease-in-out opacity-100">
                  <div className={`rounded-lg px-1 py-1 text-xs font-medium mb-1 flex flex-col items-center justify-center min-h-[4rem] w-full ${STATUS_COLORS[col] || 'bg-zinc-200 text-zinc-700'}`}
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  >
                    {col}
                  </div>
                  <div className="text-xs text-zinc-500 font-medium mb-1">{filtered.length}</div>
                  <button
                    className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                    onClick={() => handleToggleFold(col)}
                    aria-label="Unfold column"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
        {/* Main Kanban board */}
        <div className="flex gap-4 min-w-[900px] max-w-6xl">
          {unfoldedColumns.map((col) => {
            const filtered = localCards.filter(card => card.status === col)
            const sorted = filtered.slice().sort((a, b) => {
              const dateA = new Date(getCreatedTime(a)).getTime()
              const dateB = new Date(getCreatedTime(b)).getTime()
              return dateB - dateA
            })
            return (
              <Droppable droppableId={col} key={col}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`bg-muted/50 rounded-xl p-4 min-h-[75vh] flex flex-col max-h-[75vh] w-64 min-w-[16rem] max-w-xs overflow-y-auto transition-all duration-300 ease-in-out opacity-100 ${snapshot.isDraggingOver ? 'ring-2 ring-violet-300 ring-inset bg-violet-50/40 dark:bg-violet-900/20' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2 group relative">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[col] || 'bg-zinc-200 text-zinc-700'}`}>{col}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-zinc-500 font-medium">{sorted.length}</span>
                        <button
                          className="opacity-0 group-hover:opacity-100 ml-1 p-1 rounded transition bg-transparent hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                          onClick={() => handleToggleFold(col)}
                          aria-label="Fold column"
                        >
                          <ChevronLeft size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      {sorted.length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-xs text-zinc-400 italic">No cards</div>
                      )}
                      {snapshot.isDraggingOver && (
                        <div className="rounded-lg border-2 border-dashed border-violet-300 bg-violet-100/40 dark:bg-violet-900/30 min-h-[48px] flex items-center justify-center text-xs text-violet-700 dark:text-violet-200 mb-2 animate-pulse transition">
                          Drop here
                        </div>
                      )}
                      {sorted.map((card, idx) => (
                        <Draggable draggableId={card.id} index={idx} key={card.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.7 : 1,
                                zIndex: snapshot.isDragging ? 10 : 'auto',
                              }}
                            >
                              <KanbanCard card={card} kpis={kpis} pages={pages} products={products} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            )
          })}
        </div>
      </div>
    </DragDropContext>
  )
} 