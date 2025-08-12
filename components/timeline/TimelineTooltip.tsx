'use client'

import { Project } from "@/hooks/useExperimentation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { User, Globe, Calendar, Clock, FlaskConical, Sparkles, Wrench, CheckCircle, Circle, PlayCircle } from 'lucide-react'
import { STATUS_COLORS } from '@/constants/timeline'

interface TimelineTooltipProps {
  project: Project
  children: React.ReactNode
}

export function TimelineTooltip({ project, children }: TimelineTooltipProps) {
  const getStatusColor = (status: Project['status']) => {
    const colorConfig = STATUS_COLORS[status] || STATUS_COLORS['Open']
    return `${colorConfig.bg} ${colorConfig.text}`
  }

  const getWinLossColor = (winLoss: string) => {
    switch (winLoss) {
      case "Win":
        return "bg-green-500 text-white"
      case "Loss":
        return "bg-red-500 text-white"
      case "Non Conclusive":
        return "bg-gray-500 text-white"
      default:
        return "bg-gray-400 text-white"
    }
  }

  const getWinLossText = (winLoss: string) => {
    switch (winLoss) {
      case "Win":
        return "Win"
      case "Loss":
        return "Loss"
      case "Non Conclusive":
        return "Non Conclusive"
      default:
        return "Unknown"
    }
  }

  // Helper pour formater les dates
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // Calculer la durée en jours
  const getDurationInDays = () => {
    const diffTime = project.endDate.getTime() - project.startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Fonction pour l'icône Type (inspirée de KanbanCard.tsx)
  const typeIcon = (type?: string) => {
    if (!type) return null
    if (type === 'A/B-Test') return <FlaskConical size={12} className="text-blue-500" />
    if (type === 'Personalization') return <Sparkles size={12} className="text-cyan-500" />
    if (type === 'Fix/Patch') return <Wrench size={12} className="text-teal-500" />
    return null
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

  const timelineState = getTimelineState(project)
  const timelineDurations = getTimelineDurations(project)

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="center" 
          className="p-0 border-0 shadow-lg bg-transparent [&>svg]:fill-white [&>svg]:stroke-white"
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs relative">
            {/* Status chips au-dessus du titre */}
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              
              {/* Chips supplémentaires pour les projets Done */}
              {project.status === "Done" && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs rounded-full flex-shrink-0 bg-blue-500 text-white">
                    Conclusive
                  </span>
                  {project.winLoss && (
                    <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${getWinLossColor(project.winLoss)}`}>
                      {getWinLossText(project.winLoss)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Titre avec icône Type */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-shrink-0">
                {typeIcon(project.testType)}
              </div>
              <h4 className="text-xs font-semibold text-gray-900 truncate">
                {project.title}
              </h4>
            </div>

            {/* Corps du tooltip - style inspiré de TicketOverlayProperties */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-600 w-16 flex-shrink-0">Market:</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Globe className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-900 truncate">{project.country}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-600 w-16 flex-shrink-0">Owner:</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <User className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-900 truncate">{project.owner || '-'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-600 w-16 flex-shrink-0">Dates:</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Calendar className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-900 truncate">
                    {formatDate(project.startDate)} → {formatDate(project.endDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-600 w-16 flex-shrink-0">Duration:</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-900 truncate">{getDurationInDays()} days</span>
                </div>
              </div>

              {/* Section Timeline - conditionnelle comme dans TicketOverlayTimeline */}
              {shouldShowTimeline(project) && (
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-600 mb-2">Timeline:</div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      {timelineState.ready ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <Circle className="w-3 h-3 text-gray-400" />
                      )}
                      <span className="text-gray-600 text-[10px]">Ready</span>
                    </div>
                    <div className="flex-1 h-px bg-gray-200 relative">
                      {timelineDurations.readyToAnalysis && timelineDurations.readyToAnalysis > 0 && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-center">
                          <div className="text-[8px] text-gray-500">{timelineDurations.readyToAnalysis}d</div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {timelineState.analysis ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : timelineState.ready ? (
                        <PlayCircle className="w-3 h-3 text-blue-500" />
                      ) : (
                        <Circle className="w-3 h-3 text-gray-400" />
                      )}
                      <span className="text-gray-600 text-[10px]">Analysis</span>
                    </div>
                    <div className="flex-1 h-px bg-gray-200 relative">
                      {timelineDurations.analysisToDone && timelineDurations.analysisToDone > 0 && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-center">
                          <div className="text-[8px] text-gray-500">{timelineDurations.analysisToDone}d</div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {timelineState.done ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <Circle className="w-3 h-3 text-gray-400" />
                      )}
                      <span className="text-gray-600 text-[10px]">Done</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 