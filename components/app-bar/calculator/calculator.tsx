'use client'

import { useState } from 'react'
import { useDraggable } from '@/hooks'
import { GenieAnimation } from '@/components/ui'
import { Calculator, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CalculatorProps {
  isOpen: boolean
  onClose: () => void
  triggerPosition: { x: number; y: number }
}

export function ABTestCalculator({ isOpen, onClose, triggerPosition }: CalculatorProps) {
  const [activeTab, setActiveTab] = useState('conversion-rate')
  const [dailyVisitors, setDailyVisitors] = useState('')
  
  // Utilisation du hook useDraggable avec position initiale sécurisée
  const { position, isDragging, dragRef, handleMouseDown } = useDraggable({
    initialPosition: { x: 0, y: 20 }, // Position par défaut sécurisée
    windowSize: { width: 420, height: 600 },
    isOpen
  })

  const handleClose = () => {
    // Déclencher l'animation de sortie en fermant d'abord
    onClose()
  }

  const handleDailyVisitorsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDailyVisitors(e.target.value)
  }

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '1000') {
      setDailyVisitors('')
    }
  }

  if (!isOpen) return null;

  return (
    <GenieAnimation
      isOpen={isOpen}
      onClose={onClose}
      triggerPosition={triggerPosition}
    >
      <div
        ref={dragRef}
        className={`w-[420px] h-[600px] bg-white shadow-xs border border-gray-200 rounded-md pointer-events-auto flex flex-col select-none draggable-element ${isDragging ? 'dragging' : ''}`}
        style={{
          cursor: isDragging ? 'grabbing' : 'default',
          position: 'absolute',
          left: position.x,
          top: position.y,
          zIndex: 1000,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Header - Zone de drag */}
        <div
          className="flex items-center justify-between p-2 border-b border-gray-200 drag-handle"
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-gray-500" />
            <h2 className="text-xs font-medium text-gray-900">A/B Test Calculator</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Tabs personnalisés comme dans TimelineControls */}
        <div className="p-3">
          <div className="flex justify-center">
            <div className="flex items-center gap-0.5 bg-gray-200 rounded-2xl p-0.5">
              <Button
                variant={activeTab === 'conversion-rate' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('conversion-rate')}
                className={`rounded-xl text-xs h-7 px-3 cursor-pointer ${activeTab !== 'conversion-rate' ? 'hover:bg-gray-100' : ''}`}
              >
                Conversion Rate
              </Button>
              <Button
                variant={activeTab === 'revenue' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('revenue')}
                className={`rounded-xl text-xs h-7 px-3 cursor-pointer ${activeTab !== 'revenue' ? 'hover:bg-gray-100' : ''}`}
              >
                Revenue
              </Button>
            </div>
          </div>
        </div>

        {/* Contenu des tabs */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Champ Daily Visitors */}
            <div className="grid gap-3">
              <Label htmlFor="dailyVisitors">Daily Visitors</Label>
              <Input 
                id="dailyVisitors"
                type="number"
                placeholder="1000"
                min="100"
                step="100"
                value={dailyVisitors}
                onChange={handleDailyVisitorsChange}
                onFocus={handleInputFocus}
                onMouseDown={(e) => e.stopPropagation()}
                className="rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200 hover:border-primary/60 hover:bg-accent/50 focus-visible:ring-violet-500/30"
              />
            </div>
          </div>
        </div>
      </div>
    </GenieAnimation>
  )
} 