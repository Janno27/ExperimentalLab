'use client'

import { Project } from "@/hooks/useExperimentation"
import { STATUS_COLORS } from "@/constants/timeline"
import { TimelineTooltip } from "./TimelineTooltip"

// Helper pour calculer la durée entre deux dates en jours
const calculateDaysBetween = (startDate?: Date, endDate?: Date): number | undefined => {
  if (!startDate || !endDate) return undefined
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

interface ProjectBarProps {
  project: Project
  dayWidth: number
  timelineStart: Date
  timelineDays: Date[]
  onProjectClick?: (project: Project) => void
}

export function ProjectBar({ project, dayWidth, timelineStart, timelineDays, onProjectClick }: ProjectBarProps) {
  const getWinLossColor = (winLoss: string) => {
    switch (winLoss) {
      case "Win":
        return "bg-green-500 hover:bg-green-600"
      case "Loss":
        return "bg-red-500 hover:bg-red-600"
      case "Non Conclusive":
        return "bg-gray-500 hover:bg-gray-600"
      default:
        return "bg-gray-400 hover:bg-gray-500"
    }
  }

  const getWinLossTextColor = (winLoss: string) => {
    switch (winLoss) {
      case "Win":
        return "text-white"
      case "Loss":
        return "text-white"
      case "Non Conclusive":
        return "text-white"
      default:
        return "text-white"
    }
  }

  // Utiliser Win/Loss pour la couleur si le projet est "Done", sinon utiliser le statut
  const getStatusColor = (status: Project['status'], winLoss?: string) => {
    if (status === "Done" && winLoss) {
      const color = getWinLossColor(winLoss)
      return color
    }
    const colorConfig = STATUS_COLORS[status] || STATUS_COLORS['Open']
    return `${colorConfig.bg} ${colorConfig.hover}`
  }

  const getTextColor = (status: Project['status'], winLoss?: string) => {
    if (status === "Done" && winLoss) {
      return getWinLossTextColor(winLoss)
    }
    const colorConfig = STATUS_COLORS[status] || STATUS_COLORS['Open']
    return colorConfig.text
  }

  // Calculer la position et la largeur de la barre basée sur l'index exact dans le tableau des jours
  const findDayIndex = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return timelineDays.findIndex(day => day.toISOString().split('T')[0] === dateString)
  }

  const startDayIndex = findDayIndex(project.startDate)
  const endDayIndex = findDayIndex(project.endDate)
  const doneDayIndex = project.doneDate ? findDayIndex(project.doneDate) : -1
  
  // Si les dates ne sont pas trouvées, utiliser le calcul par défaut
  const startDay = startDayIndex >= 0 ? startDayIndex : Math.round((project.startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
  const endDay = endDayIndex >= 0 ? endDayIndex : Math.round((project.endDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
  const doneDay = doneDayIndex >= 0 ? doneDayIndex : (project.doneDate ? Math.round((project.doneDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)) : -1)
  const duration = Math.max(1, endDay - startDay + 1)

  const leftPosition = (startDay * dayWidth)
  const barWidth = duration * dayWidth
  const donePosition = doneDay >= 0 ? (doneDay * dayWidth) - leftPosition : null
  
  // Calculer la position et largeur de la ligne horizontale de connexion
  const connectionLineLeft = barWidth // Position à la fin de la barre principale
  const connectionLineWidth = donePosition !== null ? (donePosition + 3) - barWidth : 0
  
  // Calculer la durée entre EndDate et Done - Date
  const daysBetweenEndAndDone = calculateDaysBetween(project.endDate, project.doneDate)

  return (
    <TimelineTooltip project={project}>
      <div
        className="absolute top-1/2 transform -translate-y-1/2 h-6 cursor-pointer transition-all duration-200"
        style={{
          left: `${leftPosition}px`,
          width: `${barWidth}px`
        }}
        onClick={() => onProjectClick?.(project)}
      >
        {/* Barre principale */}
        <div
          className={`h-full rounded-md ${getStatusColor(project.status, project.winLoss)} shadow-sm transition-all duration-200 relative`}
        >
          {/* Texte du projet aligné à gauche - peut dépasser de la barre */}
          <div className="absolute left-0 top-0 bottom-0 flex items-center px-2 whitespace-nowrap">
            <span className={`text-xs font-medium ${getTextColor(project.status, project.winLoss)}`}>
              {project.title} | {project.status}
            </span>
          </div>
          
          {/* Marqueur "Date - Done" (ligne verticale à l'extrémité) */}
          {donePosition !== null && project.status === "Done" && (
            <>
              {/* Ligne horizontale de connexion */}
              <div
                className="absolute top-1/2 left-0 bg-gray-400 transform -translate-y-1/2"
                style={{
                  left: `${connectionLineLeft}px`,
                  height: '1px',
                  width: `${connectionLineWidth}px`
                }}
              />
              {/* Affichage du nombre de jours au centre de la ligne */}
              {daysBetweenEndAndDone && daysBetweenEndAndDone > 0 && (
                <div
                  className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2 text-center"
                  style={{
                    left: `${connectionLineLeft + (connectionLineWidth / 2)}px`,
                    top: '4px'
                  }}
                >
                  <div className="text-[10px] text-gray-500 px-1 rounded">
                    {daysBetweenEndAndDone}d
                  </div>
                </div>
              )}
              {/* Marqueur vertical "Date - Done" */}
              <div
                className="absolute top-0 left-0 bg-gray-400"
                style={{
                  left: `${donePosition + 3}px`,
                  height: '16px',
                  width: '2px',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
                title={`Date - Done: ${project.doneDate?.toLocaleDateString()}`}
              />
            </>
          )}
        </div>
      </div>
    </TimelineTooltip>
  )
} 