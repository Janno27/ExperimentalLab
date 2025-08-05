'use client'

import { useState } from 'react'
import { TimelineData, Project } from "./hooks/useTimelineData"
import { ProjectBar } from "./ProjectBar"

interface TimelineContentProps {
  data: TimelineData
  currentView?: 'week' | 'month' | 'quarter' | 'year'
}

export function TimelineContent({ data, currentView = 'month' }: TimelineContentProps) {
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; dayIndex: number } | null>(null)

  // Déterminer la largeur des jours selon la vue
  const getDayWidth = () => {
    switch (currentView) {
      case 'week':
        return 40 // Plus large pour la vue week
      case 'month':
        return 30 // Taille standard
      case 'quarter':
        return 20 // Plus petit
      case 'year':
        return 15 // Très petit
      default:
        return 30
    }
  }

  const dayWidth = getDayWidth()

  // Déterminer la hauteur des lignes selon la vue
  const getRowHeight = () => {
    switch (currentView) {
      case 'week':
        return 'h-12' // Plus grand pour la vue week
      case 'month':
        return 'h-10' // Taille standard
      case 'quarter':
        return 'h-8' // Plus petit
      case 'year':
        return 'h-6' // Très petit
      default:
        return 'h-10'
    }
  }

  // Gestion du hover
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const dayIndex = Math.floor(x / dayWidth)
    
    if (dayIndex >= 0 && dayIndex < data.timeline.days.length) {
      const hoveredDay = data.timeline.days[dayIndex]
      setHoveredPosition({ x: x, dayIndex })
      setHoveredDate(hoveredDay)
    }
  }

  const handleMouseLeave = () => {
    setHoveredDate(null)
    setHoveredPosition(null)
  }

  // Grouper les projets par pays et par page
  const groupedProjects = data.projects.reduce((acc, project) => {
    if (!acc[project.country]) {
      acc[project.country] = {}
    }
    
    if (!acc[project.country][project.section]) {
      acc[project.country][project.section] = []
    }
    
    acc[project.country][project.section].push(project)
    return acc
  }, {} as Record<string, Record<string, Project[]>>)

  // Créer une structure plate de toutes les lignes (pays + pages)
  const getAllRows = () => {
    const rows: Array<{ type: 'country' | 'page', country: string, page?: string }> = []
    
    Object.entries(groupedProjects).forEach(([country, countryData]) => {
      // Ajouter la ligne du pays
      rows.push({ type: 'country', country })
      
      // Ajouter les lignes de page
      Object.keys(countryData).forEach(page => {
        rows.push({ type: 'page', country, page })
      })
    })
    
    return rows
  }

  const getProjectsByPage = (countryCode: string, page: string): Project[] => {
    return data.projects.filter(project => 
      project.country === countryCode && project.section === page
    )
  }

  const allRows = getAllRows()

  return (
    <div 
      className="flex-1 flex flex-col transition-all duration-300 ease-in-out relative" 
      style={{ 
        width: `${data.timeline.days.length * dayWidth}px`
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {allRows.map((row, index) => {
        if (row.type === 'country') {
          // Ligne du pays (vide)
          return (
            <div key={`row-${index}-${row.country}-country`} className={`border-b border-gray-100 bg-white flex-shrink-0 relative ${getRowHeight()}`}>
              {/* Ligne verticale pour aujourd'hui */}
              {data.timeline.days.map((day, dayIndex) => {
                const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
                if (isToday) {
                  return (
                    <div
                      key={`today-line-${dayIndex}`}
                      className="absolute top-0 bottom-0 w-px bg-blue-600 z-20"
                      style={{ left: `${dayIndex * dayWidth + dayWidth / 2 - 1}px` }}
                    />
                  )
                }
                return null
              })}
            </div>
          )
        } else {
          // Ligne de page avec projets
          const pageProjects = getProjectsByPage(row.country, row.page!)
          
          return (
            <div key={`row-${index}-${row.country}-${row.page}`} className={`border-b border-gray-50 bg-white flex-shrink-0 relative ${getRowHeight()}`}>
              {/* Ligne verticale pour aujourd'hui */}
              {data.timeline.days.map((day, dayIndex) => {
                const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
                if (isToday) {
                  return (
                    <div
                      key={`today-line-${dayIndex}`}
                      className="absolute top-0 bottom-0 w-px bg-blue-600 z-20"
                      style={{ left: `${dayIndex * dayWidth + dayWidth / 2 - 1}px` }}
                    />
                  )
                }
                return null
              })}
              
              {/* Barres des projets de cette page */}
              {pageProjects.map(project => (
                <ProjectBar
                  key={project.id}
                  project={project}
                  dayWidth={dayWidth}
                  timelineStart={data.timeline.dateRange.start}
                />
              ))}
            </div>
          )
        }
      })}
      
      {/* Barre de hover très discrète */}
      {hoveredDate && hoveredPosition && (
        <div 
          className="absolute w-px bg-violet-300 opacity-30 z-30 pointer-events-none"
          style={{ 
            left: `${hoveredPosition.x}px`,
            transform: 'translateX(-50%)',
            top: '0px',
            height: '100%'
          }}
        />
      )}
    </div>
  )
} 