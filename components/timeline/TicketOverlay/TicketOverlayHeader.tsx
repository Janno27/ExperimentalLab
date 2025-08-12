import React from 'react'
import { Heart, X, FlaskConical, Sparkles, Wrench } from 'lucide-react'
import { Project } from '@/hooks/useExperimentation'

interface TicketOverlayHeaderProps {
  project: Project
  onClose: () => void
}

function typeIcon(type?: string) {
  if (!type) return null
  if (type === 'A/B-Test') return <span className="flex items-center"><FlaskConical size={15} className="text-blue-500" /><span className="sr-only">A/B-Test</span></span>
  if (type === 'Personalization') return <span className="flex items-center"><Sparkles size={15} className="text-cyan-500" /><span className="sr-only">Personalization</span></span>
  if (type === 'Fix/Patch') return <span className="flex items-center"><Wrench size={15} className="text-teal-500" /><span className="sr-only">Fix/Patch</span></span>
  return null
}

export function TicketOverlayHeader({ project, onClose }: TicketOverlayHeaderProps) {
  return (
    <div className="flex items-center gap-2 p-4 border-b border-gray-200">
      {typeIcon(project.testType)}
      <h2 
        className="text-xs font-medium text-gray-900 truncate flex-1" 
        title={project.title}
      >
        {project.title}
      </h2>
      <div className="flex items-center gap-1">
        <button className="p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer">
          <Heart className="w-3 h-3 text-gray-400 hover:text-red-500" />
        </button>
        <button 
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
        </button>
      </div>
    </div>
  )
} 