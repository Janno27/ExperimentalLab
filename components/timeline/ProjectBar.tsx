'use client'

import { Project } from "./hooks/useTimelineData"

interface ProjectBarProps {
  project: Project
  dayWidth: number
  timelineStart: Date
}

export function ProjectBar({ project, dayWidth, timelineStart }: ProjectBarProps) {
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'Refinement':
        return 'bg-gray-500 hover:bg-gray-600'
      case 'Design & Development':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'Setup':
        return 'bg-yellow-500 hover:bg-yellow-600'
      case 'Running':
        return 'bg-violet-500 hover:bg-violet-600'
      case 'Ready for Analysis':
        return 'bg-orange-500 hover:bg-orange-600'
      case 'Analysing':
        return 'bg-purple-500 hover:bg-purple-600'
      case 'Open':
        return 'bg-green-500 hover:bg-green-600'
      default:
        return 'bg-violet-500 hover:bg-violet-600'
    }
  }

  // Calculer la position et la largeur de la barre basÃ©e sur les vraies dates
  const getDaysFromStart = (date: Date) => {
    const diffTime = date.getTime() - timelineStart.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  const startDay = getDaysFromStart(project.startDate)
  const endDay = getDaysFromStart(project.endDate)
  const duration = Math.max(1, endDay - startDay + 1)

  const leftPosition = startDay * dayWidth
  const barWidth = duration * dayWidth

  return (
    <div
      className="absolute top-1/2 transform -translate-y-1/2 h-6 cursor-pointer transition-all duration-200"
      style={{
        left: `${leftPosition}px`,
        width: `${barWidth}px`
      }}
    >
      {/* Barre principale */}
      <div
        className={`h-full rounded-md ${getStatusColor(project.status)} shadow-sm transition-all duration-200`}
      >
        {/* Texte du projet */}
        <div className="absolute inset-0 flex items-center justify-center px-2">
          <span className="text-xs font-medium text-white truncate">
            {project.title}
          </span>
        </div>
      </div>
    </div>
  )
} 