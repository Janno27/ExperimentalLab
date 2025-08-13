import React from 'react'
import { ChevronDown, ChevronRight, CheckCircle, Circle, PlayCircle } from 'lucide-react'
import { Project } from '@/hooks/useExperimentation'

interface TicketOverlayTimelineProps {
  project: Project
  expanded: boolean
  onToggleExpanded: () => void
}

// Helper pour calculer la durée entre deux dates en jours
const calculateDaysBetween = (startDate?: Date, endDate?: Date): number | undefined => {
  if (!startDate || !endDate) return undefined
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Helper pour déterminer si on doit afficher Analysis Owner
const shouldShowAnalysisOwner = (project: Project) => {
  return project?.analysisOwner && project.analysisOwner.trim() !== ''
}

// Helper pour déterminer si on doit afficher la timeline
const shouldShowTimeline = (project: Project) => {
  // Vérifier si Analysis Owner existe
  const hasAnalysisOwner = shouldShowAnalysisOwner(project)
  
  // Vérifier si les dates de timeline existent
  const hasTimelineDates = !!(project.readyForAnalysisDate || project.analysisStartDate)
  
  return hasAnalysisOwner && hasTimelineDates
}

// Helper pour déterminer l'état de la timeline
const getTimelineState = (project: Project) => {
  return {
    ready: !!project.readyForAnalysisDate,
    analysis: !!project.analysisStartDate,
    done: !!project.doneDate
  }
}

// Calculer les durées à partir des dates
const getTimelineDurations = (project: Project) => {
  const readyToAnalysis = calculateDaysBetween(project.readyForAnalysisDate, project.analysisStartDate)
  const analysisToDone = calculateDaysBetween(project.analysisStartDate, project.doneDate)
  
  return { readyToAnalysis, analysisToDone }
}

export function TicketOverlayTimeline({ project, expanded, onToggleExpanded }: TicketOverlayTimelineProps) {
  // Condition pour afficher la section Timeline
  if (!shouldShowTimeline(project)) {
    return null
  }

  const timelineState = getTimelineState(project)
  const timelineDurations = getTimelineDurations(project)

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <button 
          onClick={onToggleExpanded}
          className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
        >
          Timeline
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </div>
      {expanded && (
        <div className="space-y-4 pl-6 pr-6">
          {/* Timeline en ligne */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-2">
              {timelineState.ready ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <Circle className="w-3 h-3 text-gray-400" />
              )}
              <span className="text-gray-600">Ready for Analysis</span>
            </div>
            <div className="flex-1 h-px bg-gray-200 relative">
              {timelineDurations.readyToAnalysis !== undefined && timelineDurations.readyToAnalysis > 0 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-[10px] text-gray-500">{timelineDurations.readyToAnalysis}d</div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {timelineState.analysis ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : timelineState.ready ? (
                <PlayCircle className="w-3 h-3 text-blue-500" />
              ) : (
                <Circle className="w-3 h-3 text-gray-400" />
              )}
              <span className="text-gray-600">Analysis</span>
            </div>
            <div className="flex-1 h-px bg-gray-200 relative">
              {timelineDurations.analysisToDone !== undefined && timelineDurations.analysisToDone > 0 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-[10px] text-gray-500">{timelineDurations.analysisToDone}d</div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {timelineState.done ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <Circle className="w-3 h-3 text-gray-400" />
              )}
              <span className="text-gray-600">Done</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 