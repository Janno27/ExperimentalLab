'use client'

import { Project } from "./hooks/useTimelineData"

interface TimelineTooltipProps {
  project: Project
  position: { x: number; y: number }
  onClose: () => void
}

export function TimelineTooltip({ project, position, onClose }: TimelineTooltipProps) {
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'Refinement':
        return 'bg-gray-100 text-gray-800'
      case 'Design & Development':
        return 'bg-blue-100 text-blue-800'
      case 'Setup':
        return 'bg-yellow-100 text-yellow-800'
      case 'Running':
        return 'bg-violet-100 text-violet-800'
      case 'Ready for Analysis':
        return 'bg-orange-100 text-orange-800'
      case 'Analysing':
        return 'bg-purple-100 text-purple-800'
      case 'Open':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Helper pour formater les dates
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Calculer la durÃ©e en jours
  const getDurationInDays = () => {
    const diffTime = project.endDate.getTime() - project.startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
      style={{
        left: `${position.x + 10}px`,
        top: `${position.y - 10}px`,
        transform: 'translateY(-50%)'
      }}
      onMouseLeave={onClose}
    >
      {/* Header du tooltip */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 pr-2">
          {project.title}
        </h4>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>

      {/* Corps du tooltip */}
      <div className="space-y-2">
        {/* Informations de base */}
        <div className="text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Country:</span>
            <span className="font-medium">{project.country}</span>
          </div>
          <div className="flex justify-between">
            <span>Page:</span>
            <span className="font-medium">{project.section}</span>
          </div>
        </div>

        {/* PÃ©riode */}
        <div className="text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Start:</span>
            <span className="font-medium">{formatDate(project.startDate)}</span>
          </div>
          <div className="flex justify-between">
            <span>End:</span>
            <span className="font-medium">{formatDate(project.endDate)}</span>
          </div>
          <div className="flex justify-between">
            <span>Duration:</span>
            <span className="font-medium">{getDurationInDays()} days</span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="pt-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-violet-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* FlÃ¨che du tooltip */}
      <div
        className="absolute w-3 h-3 bg-white border-l border-t border-gray-200 transform rotate-45"
        style={{
          left: '-6px',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)'
        }}
      />
    </div>
  )
} 