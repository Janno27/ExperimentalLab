'use client'

import { forwardRef } from "react"
import { TimelineData, TimelineState, Project } from "./hooks/useTimelineData"

interface TimelineSidebarProps {
  data: TimelineData
  state: TimelineState
  onToggleCountry: (countryCode: string) => void
  currentView?: 'week' | 'month' | 'quarter' | 'year'
}

export const TimelineSidebar = forwardRef<HTMLDivElement, TimelineSidebarProps>(
  ({ data, state, onToggleCountry, currentView = 'month' }, ref) => {
    // Note: state et onToggleCountry sont requis par l'interface mais pas utilisés dans cette implémentation
    // Grouper les projets par pays et par page
    const groupedProjects = data.projects.reduce((acc, project) => {
      if (!acc[project.country]) {
        acc[project.country] = {}
      }
      
      if (!acc[project.country][project.section]) {
        acc[project.country][project.section] = []
      }
      
      acc[project.country][project.section].push(project)
      return acc
    }, {} as Record<string, Record<string, Project[]>>)

    // Déterminer la hauteur des lignes selon la vue
    const getRowHeight = () => {
      switch (currentView) {
        case 'week':
          return 'h-12' // Plus grand pour la vue week
        case 'month':
          return 'h-10' // Taille standard
        case 'quarter':
          return 'h-8' // Plus petit
        case 'year':
          return 'h-6' // Très petit
        default:
          return 'h-10'
      }
    }

    // Calculer la hauteur du header selon la vue (proportionnelle à TimelineHeader)
    const getHeaderHeight = () => {
      switch (currentView) {
        case 'week':
          return 'h-20.5' // Plus grand header pour la vue week
        case 'month':
          return 'h-18.5' // Taille standard
        case 'quarter':
          return 'h-16.5' // Plus petit
        case 'year':
          return 'h-15.5' // Très petit
        default:
          return 'h-20'
      }
    }

    return (
      <div className="w-48 bg-gray-50 border-r border-gray-200 flex-shrink-0 flex flex-col h-full">
        {/* Header sticky pour aligner avec le header de la timeline */}
        <div className={`flex-shrink-0 bg-white border-b border-gray-200 z-10 ${getHeaderHeight()}`}></div>

        {/* Liste des groupes avec scroll */}
        <div 
          ref={ref}
          className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="flex flex-col">
            {Object.entries(groupedProjects).map(([country, countryData]) => (
              <div key={country}>
                {/* Pays */}
                <div className={`border-b border-gray-100 flex items-center px-3 bg-gray-50 flex-shrink-0 ${getRowHeight()}`}>
                  <div className="text-xs font-medium text-gray-700 truncate">
                    {country}
                  </div>
                </div>
                
                {/* Pages pour ce pays */}
                {Object.entries(countryData).map(([page]) => (
                  <div key={`${country}-${page}`} className={`border-b border-gray-100 flex items-center px-3 pl-6 flex-shrink-0 ${getRowHeight()}`}>
                    <div className="text-xs font-medium text-gray-600 truncate">
                      {page}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
)

TimelineSidebar.displayName = 'TimelineSidebar' 