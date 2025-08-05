'use client'

import { useRef, forwardRef, useImperativeHandle } from "react"
import { TimelineSidebar } from "./TimelineSidebar"
import { TimelineMain, TimelineMainRef } from "./TimelineMain"
import { useTimelineData } from "./hooks/useTimelineData"

interface TimelineViewProps {
  currentView: 'week' | 'month' | 'quarter' | 'year'
}

export interface TimelineViewRef {
  scrollToToday: () => void
}

export const TimelineView = forwardRef<TimelineViewRef, TimelineViewProps>(
  ({ currentView }, ref) => {
    const { data, state, toggleCountry, loading } = useTimelineData()
    const timelineMainRef = useRef<TimelineMainRef | null>(null)
    const sidebarRef = useRef<HTMLDivElement>(null)

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

    // Exposer la fonction scrollToToday via ref
    useImperativeHandle(ref, () => ({
      scrollToToday: handleScrollToToday
    }))

    if (loading) {
      return (
        <div className="flex h-full w-full bg-white rounded-lg border overflow-hidden">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading data...</p>
            </div>
          </div>
        </div>
      )
    }

    if (data.projects.length === 0) {
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

    return (
      <div className="flex h-full w-full bg-white rounded-lg border overflow-hidden">
        {/* Sidebar (fixe) - nouvelle largeur */}
        <div className="flex-shrink-0 w-48 border-r bg-gray-50">
          <TimelineSidebar
            ref={sidebarRef}
            data={data}
            state={state}
            onToggleCountry={toggleCountry}
            currentView={currentView}
          />
        </div>
        
        {/* Timeline principale avec scroll vertical */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TimelineMain
            ref={timelineMainRef}
            data={data}
            currentView={currentView}
            onScrollChange={handleScrollChange}
          />
        </div>
      </div>
    )
  }
)

TimelineView.displayName = 'TimelineView' 