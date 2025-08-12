'use client'

import { useRef, forwardRef, useImperativeHandle, useState } from "react"
import { TimelineSidebar } from "./TimelineSidebar"
import { TimelineMain, TimelineMainRef } from "./TimelineMain"
import { TimelineTable } from "./TimelineTable"
import { TicketOverlay } from "./TicketOverlay"
import { TimelineSkeleton } from "./TimelineSkeleton"
import { TimelineTableSkeleton } from "./TimelineTableSkeleton"
import { useExperimentation } from "@/hooks/useExperimentation"
import { Project } from "@/hooks/useExperimentation"

interface TimelineViewProps {
  currentView: 'week' | 'month' | 'quarter' | 'year'
  activeView?: 'timeline' | 'table'
  validStatuses?: string[]
  searchValue?: string
  groupBy?: 'country' | 'conclusive'
  requireDoneDate?: boolean
}

export interface TimelineViewRef {
  scrollToToday: () => void
}

export const TimelineView = forwardRef<TimelineViewRef, TimelineViewProps>(
  ({ currentView, activeView = 'timeline', validStatuses, searchValue = "", groupBy = 'country', requireDoneDate = false }, ref) => {
    const result = useExperimentation({ 
      useAirtable: true, 
      timelineMode: true,
      validStatuses,
      requireDoneDate
    })
    
    // Extraire les données avec des valeurs par défaut
    const { data = { projects: [], countries: [], sections: [], timeline: { months: [], days: [], dateRange: { start: new Date(), end: new Date() }, todayIndex: 0 } }, 
            state = { expandedCountries: new Set() }, 
            toggleCountry = () => {}, 
            loading = false, 
            refreshDataSilent = async () => {} } = result
    
    // Filtrer les projets par recherche
    const filteredProjects = searchValue 
      ? data.projects.filter(project => 
          project.title.toLowerCase().includes(searchValue.toLowerCase())
        )
      : data.projects
    
    // Créer une nouvelle data avec les projets filtrés
    const filteredData = {
      ...data,
      projects: filteredProjects
    }
    
    const timelineMainRef = useRef<TimelineMainRef | null>(null)
    const sidebarRef = useRef<HTMLDivElement>(null)
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)
    const [isOverlayOpen, setIsOverlayOpen] = useState(false)

    const handleScrollToToday = () => {
      if (timelineMainRef.current) {
        timelineMainRef.current.scrollToToday()
      }
    }

    // Synchroniser le scroll de la sidebar avec le contenu principal
    const handleScrollChange = (scrollTop: number) => {
      if (sidebarRef.current) {
        sidebarRef.current.scrollTop = scrollTop
      }
    }

    // Synchroniser le scroll de la sidebar vers le contenu principal
    const handleSidebarScroll = (scrollTop: number) => {
      if (timelineMainRef.current) {
        timelineMainRef.current.scrollToVertical(scrollTop)
      }
    }

    // Gérer l'ouverture de l'overlay
    const handleProjectClick = (project: Project) => {
      setSelectedProject(project)
      setIsOverlayOpen(true)
    }

    // Fermer l'overlay
    const handleCloseOverlay = () => {
      setIsOverlayOpen(false)
      setSelectedProject(null)
    }

    // Exposer la fonction scrollToToday via ref
    useImperativeHandle(ref, () => ({
      scrollToToday: handleScrollToToday
    }))

    if (loading) {
      return (
        <div className="flex-1 p-2 overflow-hidden relative">
          {activeView === 'table' ? (
            <TimelineTableSkeleton />
          ) : (
            <TimelineSkeleton />
          )}
        </div>
      )
    }

    if (filteredData.projects.length === 0) {
      return (
        <div className="flex h-full w-full bg-white rounded-lg border overflow-hidden">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600">No projects to display</p>
              <p className="text-sm text-gray-500 mt-2">
                Projects with statuses &quot;Refinement&quot;, &quot;Design &amp; Development&quot;, &quot;Setup&quot;, &quot;Running&quot;, &quot;Ready for Analysis&quot;, &quot;Analysing&quot;, &quot;Open&quot; will appear here.
              </p>
            </div>
          </div>
        </div>
      )
    }

    // Si on est en mode table, afficher seulement la table sans sidebar
    if (activeView === 'table') {
      return (
        <div className="flex h-full w-full bg-white overflow-hidden relative">
          <div className="flex-1 p-2 overflow-hidden">
            <TimelineTable projects={filteredData.projects} onProjectClick={handleProjectClick} />
          </div>
          <TicketOverlay 
            project={selectedProject}
            isOpen={isOverlayOpen}
            onClose={handleCloseOverlay}
            onDataRefresh={refreshDataSilent}
          />
        </div>
      )
    }

        // Mode timeline (par défaut)
    return (
      <div className="flex-1 p-2 overflow-hidden relative">
        <div className="flex h-full w-full bg-white rounded-lg border overflow-hidden">
          {/* Sidebar (fixe) - nouvelle largeur */}
          <div className="flex-shrink-0 w-48 border-r bg-gray-50">
            <TimelineSidebar
              ref={sidebarRef}
              data={filteredData}
              state={state}
              onToggleCountry={toggleCountry}
              currentView={currentView}
              onScrollChange={handleSidebarScroll}
              groupBy={groupBy}
            />
          </div>
          
          {/* Timeline principale avec scroll vertical */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <TimelineMain
              ref={timelineMainRef}
              data={filteredData}
              currentView={currentView}
              onScrollChange={handleScrollChange}
              onProjectClick={handleProjectClick}
              groupBy={groupBy}
            />
          </div>
        </div>
        <TicketOverlay 
          project={selectedProject}
          isOpen={isOverlayOpen}
          onClose={handleCloseOverlay}
          onDataRefresh={refreshDataSilent}
        />
      </div>
    )
  }
)

TimelineView.displayName = 'TimelineView' 