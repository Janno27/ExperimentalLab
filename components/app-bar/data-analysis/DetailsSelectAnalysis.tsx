'use client'

import React, { useState } from 'react'
import { Project } from '@/hooks/useExperimentation'
import { TicketOverlayProperties } from '@/components/timeline/TicketOverlay/TicketOverlayProperties'
import { TicketOverlayAudience } from '@/components/timeline/TicketOverlay/TicketOverlayAudience'
import { TicketOverlayDescription } from '@/components/timeline/TicketOverlay/TicketOverlayDescription'
import { TicketOverlayResults } from '@/components/timeline/TicketOverlay/TicketOverlayResults'
import { ArrowRight } from 'lucide-react'

interface DetailsSelectAnalysisProps {
  project: Project
  onDataRefresh?: () => Promise<void>
  onStartAnalysis?: () => void
}

export function DetailsSelectAnalysis({ project, onDataRefresh, onStartAnalysis }: DetailsSelectAnalysisProps) {
  const [expandedSections, setExpandedSections] = useState({
    properties: true,
    audience: false,
    description: false,
    results: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div className="flex flex-col h-full w-full max-h-[calc(90vh-5rem)]">
      {/* Header avec le titre du projet */}
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900">
            {project.title}
          </h2>
          <button 
            onClick={onStartAnalysis}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-105 cursor-pointer"
          >
            <span>Start the analysis</span>
            <ArrowRight size={12} />
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
            project.status === 'Ready for Analysis' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {project.status}
          </span>
          <span>•</span>
          <span>{project.testType}</span>
          <span>•</span>
          <span>{project.owner}</span>
        </div>
      </div>

      {/* Contenu scrollable avec les sections */}
      <div className="flex-1 min-h-0 overflow-hidden max-h-[calc(100vh-10rem)]">
        <div className="h-full overflow-y-auto pr-2">
          <div className="p-6 space-y-6 pb-6">
            {/* Properties Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <TicketOverlayProperties
                project={project}
                expanded={expandedSections.properties}
                onToggleExpanded={() => toggleSection('properties')}
                canEdit={false}
                canView={true}
              />
            </div>

            {/* Audience Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <TicketOverlayAudience
                project={project}
                expanded={expandedSections.audience}
                onToggleExpanded={() => toggleSection('audience')}
                canEdit={false}
                canView={true}
                onDataRefresh={onDataRefresh}
              />
            </div>

            {/* Description Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <TicketOverlayDescription
                project={project}
                expanded={expandedSections.description}
                onToggleExpanded={() => toggleSection('description')}
                canEdit={false}
                canView={true}
              />
            </div>

            {/* Results Section (sans la partie "Complete Project") */}
            <div className="border border-gray-200 rounded-lg p-4">
              <TicketOverlayResults
                project={project}
                expanded={expandedSections.results}
                onToggleExpanded={() => toggleSection('results')}
                canEdit={false}
                canView={true}
                onDataRefresh={onDataRefresh}
                hideCompleteProject={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 