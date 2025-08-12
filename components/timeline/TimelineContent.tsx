'use client'

import { useState } from 'react'
import { TimelineData, Project } from "@/hooks/useExperimentation"
import { ProjectBar } from "./ProjectBar"

interface TimelineContentProps {
  data: TimelineData
  currentView?: 'week' | 'month' | 'quarter' | 'year'
  onProjectClick?: (project: Project) => void
  groupBy?: 'country' | 'conclusive'
}

interface ProjectRow {
  projects: Project[]
  height: number
}

export function TimelineContent({ data, currentView = 'month', onProjectClick, groupBy = 'country' }: TimelineContentProps) {
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

  // Fonction pour détecter si deux projets se chevauchent
  const doProjectsOverlap = (project1: Project, project2: Project, timelineStart: Date) => {
    const getDaysFromStart = (date: Date) => {
      const diffTime = date.getTime() - timelineStart.getTime()
      return Math.floor(diffTime / (1000 * 60 * 60 * 24))
    }

    const start1 = getDaysFromStart(project1.startDate)
    const end1 = getDaysFromStart(project1.endDate)
    const start2 = getDaysFromStart(project2.startDate)
    const end2 = getDaysFromStart(project2.endDate)

    // Vérifier si les projets se chevauchent (même un jour de chevauchement)
    return !(end1 < start2 || end2 < start1)
  }

  // Fonction pour organiser les projets en lignes multiples
  const organizeProjectsInRows = (projects: Project[], timelineStart: Date): ProjectRow[] => {
    if (projects.length === 0) return []

    const rows: ProjectRow[] = []
    const projectHeight = 24 // Hauteur d'une barre de projet en pixels
    const projectSpacing = 28 // Espacement entre les barres superposées
    const topMargin = 8 // Marge en haut pour centrage (augmentée)
    const bottomMargin = 8 // Marge en bas pour éviter d'être collé à la bordure

    projects.forEach(project => {
      let placed = false
      
      // Essayer de placer le projet dans une ligne existante
      for (let i = 0; i < rows.length; i++) {
        const canPlaceInRow = !rows[i].projects.some(existingProject => 
          doProjectsOverlap(project, existingProject, timelineStart)
        )
        
        if (canPlaceInRow) {
          rows[i].projects.push(project)
          placed = true
          break
        }
      }
      
      // Si le projet ne peut pas être placé dans une ligne existante, créer une nouvelle ligne
      if (!placed) {
        rows.push({
          projects: [project],
          height: projectHeight + topMargin + bottomMargin
        })
      }
    })

    // Calculer la hauteur totale de chaque ligne en fonction du nombre de projets superposés
    rows.forEach(row => {
      if (row.projects.length > 1) {
        // Si plusieurs projets sur la même ligne, calculer la hauteur nécessaire
        // Chaque projet supplémentaire ajoute projectSpacing pixels
        const totalHeight = topMargin + projectHeight + ((row.projects.length - 1) * projectSpacing) + bottomMargin
        row.height = totalHeight
      } else {
        // Si un seul projet, utiliser la hauteur standard
        row.height = projectHeight + topMargin + bottomMargin
      }
    })

    return rows
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

  // Grouper les projets selon le mode de groupement
  const groupedProjects = data.projects.reduce((acc, project) => {
    if (groupBy === 'conclusive') {
      // Groupement par conclusive (sans sous-groupes)
      const conclusiveGroup = project.conclusiveGroup || 'Non Conclusive'
      if (!acc[conclusiveGroup]) {
        acc[conclusiveGroup] = []
      }
      acc[conclusiveGroup].push(project)
    } else {
      // Groupement par pays et par page (comportement par défaut)
      if (!acc[project.country]) {
        acc[project.country] = {}
      }
      
      if (!acc[project.country][project.section]) {
        acc[project.country][project.section] = []
      }
      
      acc[project.country][project.section].push(project)
    }
    return acc
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as any)

  // Créer une structure plate de toutes les lignes selon le mode de groupement
  const getAllRows = () => {
    if (groupBy === 'conclusive') {
      // Mode conclusive : structure simple
      return Object.keys(groupedProjects).map(groupKey => ({
        type: 'conclusive' as const,
        groupKey
      }))
    } else {
      // Mode pays/page : structure hiérarchique
      const rows: Array<{ type: 'country' | 'page', country: string, page?: string }> = []
      
      Object.entries(groupedProjects).forEach(([country, countryData]) => {
        // Ajouter la ligne du pays
        rows.push({ type: 'country', country })
        
        // Ajouter les lignes de page
        Object.keys(countryData as Record<string, Project[]>).forEach(page => {
          rows.push({ type: 'page', country, page })
        })
      })
      
      return rows
    }
  }

  const getProjectsByGroup = (groupKey: string): Project[] => {
    if (groupBy === 'conclusive') {
      return groupedProjects[groupKey] as Project[]
    } else {
      return data.projects.filter(project => 
        project.country === groupKey
      )
    }
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
            <div key={`row-${index}-${row.country}-country`} className={`border-b border-gray-100 bg-gray-50 flex-shrink-0 relative ${getRowHeight()}`}>
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
        } else if (row.type === 'page') {
          // Ligne de page avec projets
          const pageProjects = getProjectsByPage(row.country, row.page!)
          const projectRows = organizeProjectsInRows(pageProjects, data.timeline.dateRange.start)
          
          // Calculer la hauteur totale nécessaire pour cette page
          const totalHeight = projectRows.reduce((sum, row) => sum + row.height, 0)
          const minHeight = 40 // Hauteur minimale d'une ligne (24px + 8px + 8px de marges)
          const dynamicHeight = Math.max(minHeight, totalHeight)
          
          return (
            <div 
              key={`row-${index}-${row.country}-${row.page}`} 
              className="border-b border-gray-50 bg-white flex-shrink-0 relative"
              style={{ height: `${dynamicHeight}px` }}
            >
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
              
              {/* Lignes multiples de projets */}
              {projectRows.map((projectRow, rowIndex) => (
                <div key={`project-row-${rowIndex}`} className="relative" style={{ height: `${projectRow.height}px` }}>
                  {projectRow.projects.map((project, projectIndex) => (
                    <div
                      key={project.id}
                      style={{ 
                        position: 'absolute',
                        top: `${8 + (projectIndex * 28)}px`, // Position verticale différente pour chaque projet (ajustée avec la nouvelle marge)
                        left: 0,
                        right: 0,
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: projectIndex + 1 // Z-index croissant pour que les projets plus récents soient au-dessus
                      }}
                    >
                      <div style={{ width: '100%', height: '100%' }}>
                        <ProjectBar
                          project={project}
                          dayWidth={dayWidth}
                          timelineStart={data.timeline.dateRange.start}
                          timelineDays={data.timeline.days}
                          onProjectClick={onProjectClick}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )
        } else if (row.type === 'conclusive') {
          // Ligne de conclusive avec projets
          const conclusiveProjects = getProjectsByGroup(row.groupKey)
          const projectRows = organizeProjectsInRows(conclusiveProjects, data.timeline.dateRange.start)
          
          // Calculer la hauteur totale nécessaire pour ce groupe
          const totalHeight = projectRows.reduce((sum, row) => sum + row.height, 0)
          const minHeight = 40 // Hauteur minimale d'une ligne (24px + 8px + 8px de marges)
          const dynamicHeight = Math.max(minHeight, totalHeight)
          
          return (
            <div 
              key={`row-${index}-${row.groupKey}-conclusive`} 
              className="border-b border-gray-50 bg-white flex-shrink-0 relative"
              style={{ height: `${dynamicHeight}px` }}
            >
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
              
              {/* Lignes multiples de projets */}
              {projectRows.map((projectRow, rowIndex) => (
                <div key={`project-row-${rowIndex}`} className="relative" style={{ height: `${projectRow.height}px` }}>
                  {projectRow.projects.map((project, projectIndex) => (
                    <div
                      key={project.id}
                      style={{ 
                        position: 'absolute',
                        top: `${8 + (projectIndex * 28)}px`, // Position verticale différente pour chaque projet (ajustée avec la nouvelle marge)
                        left: 0,
                        right: 0,
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: projectIndex + 1 // Z-index croissant pour que les projets plus récents soient au-dessus
                      }}
                    >
                      <div style={{ width: '100%', height: '100%' }}>
                        <ProjectBar
                          project={project}
                          dayWidth={dayWidth}
                          timelineStart={data.timeline.dateRange.start}
                          timelineDays={data.timeline.days}
                          onProjectClick={onProjectClick}
                        />
                      </div>
                    </div>
                  ))}
                </div>
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