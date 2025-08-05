'use client'

import { Button } from "@/components/ui/button"
import { Calendar, Table } from "lucide-react"

interface TimelineControlsProps {
  currentView: 'week' | 'month' | 'quarter' | 'year'
  onViewChange: (view: 'week' | 'month' | 'quarter' | 'year') => void
  onScrollToToday: () => void
}

export function TimelineControls({ currentView, onViewChange, onScrollToToday }: TimelineControlsProps) {
  const handleScrollToToday = () => {
    // Ajouter une animation de défilement fluide
    onScrollToToday()
  }

  return (
    <div className="flex items-center justify-between mb-4">
      {/* Icônes Timeline et Table à gauche */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          <Calendar className="w-3 h-3 mr-1" />
          Timeline
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          <Table className="w-3 h-3 mr-1" />
          Table
        </Button>
      </div>
      
      {/* Today et boutons de vue à droite */}
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleScrollToToday}
          className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-6 px-2 cursor-pointer transition-all duration-200 hover:scale-105"
        >
          Today
        </Button>
        
        {/* Séparateur discret */}
        <div className="h-4 w-px bg-gray-300 mx-2"></div>
        
        <Button
          variant={currentView === 'week' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('week')}
          className="text-xs h-6 px-2 cursor-pointer transition-all duration-200 hover:scale-105"
        >
          Week
        </Button>
        <Button
          variant={currentView === 'month' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('month')}
          className="text-xs h-6 px-2 cursor-pointer transition-all duration-200 hover:scale-105"
        >
          Month
        </Button>
        <Button
          variant={currentView === 'quarter' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('quarter')}
          className="text-xs h-6 px-2 cursor-pointer transition-all duration-200 hover:scale-105"
        >
          Quarter
        </Button>
        <Button
          variant={currentView === 'year' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('year')}
          className="text-xs h-6 px-2 cursor-pointer transition-all duration-200 hover:scale-105"
        >
          Year
        </Button>
      </div>
    </div>
  )
} 