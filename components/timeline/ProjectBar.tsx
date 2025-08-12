'use client'

import { Project } from "@/hooks/useExperimentation"
import { STATUS_COLORS } from "@/constants/timeline"
import { TimelineTooltip } from "./TimelineTooltip"

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
  
  // Si les dates ne sont pas trouvées, utiliser le calcul par défaut
  const startDay = startDayIndex >= 0 ? startDayIndex : Math.round((project.startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
  const endDay = endDayIndex >= 0 ? endDayIndex : Math.round((project.endDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
  const duration = Math.max(1, endDay - startDay + 1)

  const leftPosition = (startDay * dayWidth) // Petit décalage vers la droite pour aligner avec les dates
  const barWidth = duration * dayWidth

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
          className={`h-full rounded-md ${getStatusColor(project.status, project.winLoss)} shadow-sm transition-all duration-200`}
        >
          {/* Texte du projet aligné à gauche */}
          <div className="absolute inset-0 flex items-center px-2">
            <span className={`text-xs font-medium truncate ${getTextColor(project.status, project.winLoss)}`}>
              {project.title} | {project.status}
            </span>
          </div>
        </div>
      </div>
    </TimelineTooltip>
  )
} 