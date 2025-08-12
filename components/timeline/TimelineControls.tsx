'use client'

import { Button } from "@/components/ui/button"
import { Calendar, Table, Search } from "lucide-react"
import { SearchBar } from "@/components/ui/searchBar"
import { useState } from "react"

interface TimelineControlsProps {
  currentView: 'week' | 'month' | 'quarter' | 'year'
  onViewChange: (view: 'week' | 'month' | 'quarter' | 'year') => void
  activeTab: string
  onTabChange: (tab: string) => void
  activeView: 'timeline' | 'table'
  onViewTypeChange: (viewType: 'timeline' | 'table') => void
  onSearch?: (value: string) => void
}

export function TimelineControls({ 
  currentView, 
  onViewChange, 
  activeTab, 
  onTabChange, 
  activeView, 
  onViewTypeChange,
  onSearch
}: TimelineControlsProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded)
    if (isSearchExpanded) {
      setSearchValue("")
      onSearch?.("")
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    onSearch?.(value)
  }

  return (
    <div className="flex items-center justify-between mb-4 relative">
      {/* Icônes Timeline et Table à gauche */}
      <div className="flex items-center gap-1">
        <Button
          variant={activeView === 'timeline' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewTypeChange('timeline')}
          className={`text-xs h-6 px-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
            activeView === 'timeline' 
              ? 'text-white bg-gray-900 hover:bg-gray-800' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-3 h-3 mr-1" />
          Timeline
        </Button>
        <Button
          variant={activeView === 'table' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewTypeChange('table')}
          className={`text-xs h-6 px-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
            activeView === 'table' 
              ? 'text-white bg-gray-900 hover:bg-gray-800' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Table className="w-3 h-3 mr-1" />
          Table
        </Button>
      </div>
      
      {/* Tabs centrés */}
      <div className="flex items-center gap-0.5 bg-gray-200 rounded-2xl p-0.5">
        <Button
          variant={activeTab === 'market-overview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTabChange('market-overview')}
          className={`rounded-xl text-xs h-7 px-3 cursor-pointer ${activeTab !== 'market-overview' ? 'hover:bg-gray-100' : ''}`}
        >
          Market Overview
        </Button>
        <Button
          variant={activeTab === 'live-test' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTabChange('live-test')}
          className={`rounded-xl text-xs h-7 px-3 cursor-pointer ${activeTab !== 'live-test' ? 'hover:bg-gray-100' : ''}`}
        >
          Live Test
        </Button>
        <Button
          variant={activeTab === 'completed-test' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTabChange('completed-test')}
          className={`rounded-xl text-xs h-7 px-3 cursor-pointer ${activeTab !== 'completed-test' ? 'hover:bg-gray-100' : ''}`}
        >
          Completed Test
        </Button>
      </div>
      
      {/* Boutons de vue à droite */}
      <div className="flex items-center gap-1">
        {activeView === 'timeline' && (
          <>
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
            
            {/* Séparateur discret */}
            <div className="h-4 w-px bg-gray-300 mx-2"></div>
          </>
        )}
        
        {/* Barre de recherche (uniquement en mode table) */}
        {activeView === 'table' && (
          <div className="flex items-center gap-2">
            {/* Animation de la loupe vers la barre de recherche */}
            <div className={`transition-all duration-300 ease-in-out ${
              isSearchExpanded ? 'w-48 opacity-100' : 'w-0 opacity-0'
            } pt-1`}>
              {isSearchExpanded && (
                <SearchBar
                  placeholder="Search projects..."
                  value={searchValue}
                  onSearch={handleSearchChange}
                  className="min-w-0"
                />
              )}
            </div>
            
            {/* Bouton loupe */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSearchToggle}
              className={`text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-6 px-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                isSearchExpanded ? 'bg-gray-100 text-gray-700' : ''
              }`}
            >
              <Search className="w-3 h-3" />
            </Button>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="sm"
          className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-6 px-2 cursor-pointer transition-all duration-200 hover:scale-105"
        >
          Filter
        </Button>
      </div>
    </div>
  )
} 