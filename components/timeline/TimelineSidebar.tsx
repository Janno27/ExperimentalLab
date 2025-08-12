'use client'

import { forwardRef } from "react"
import { TimelineData, TimelineState, Project } from "@/hooks/useExperimentation"

interface TimelineSidebarProps {
  data: TimelineData
  state: TimelineState
  onToggleCountry: (countryCode: string) => void
  currentView?: 'week' | 'month' | 'quarter' | 'year'
  onScrollChange?: (scrollTop: number) => void
  groupBy?: 'country' | 'conclusive'
}

// Fonction pour détecter si deux projets se chevauchent (même logique que dans TimelineContent)
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

// Fonction pour calculer la hauteur nécessaire pour une page
const calculatePageHeight = (projects: Project[], timelineStart: Date) => {
  if (projects.length === 0) return 40 // Hauteur minimale

  const projectHeight = 24 // Hauteur d'une barre de projet en pixels
  const projectSpacing = 28 // Espacement entre les barres superposées
  const topMargin = 8 // Marge en haut pour centrage (augmentée)
  const bottomMargin = 8 // Marge en bas pour éviter d'être collé à la bordure
  const rows: Project[][] = []

  projects.forEach(project => {
    let placed = false
    
    // Essayer de placer le projet dans une ligne existante
    for (let i = 0; i < rows.length; i++) {
      const canPlaceInRow = !rows[i].some(existingProject => 
        doProjectsOverlap(project, existingProject, timelineStart)
      )
      
      if (canPlaceInRow) {
        rows[i].push(project)
        placed = true
        break
      }
    }
    
    // Si le projet ne peut pas être placé dans une ligne existante, créer une nouvelle ligne
    if (!placed) {
      rows.push([project])
    }
  })

  // Calculer la hauteur totale avec la même logique que TimelineContent
  const totalHeight = rows.reduce((sum, row) => {
    if (row.length > 1) {
      // Si plusieurs projets sur la même ligne, calculer la hauteur nécessaire
      // Chaque projet supplémentaire ajoute projectSpacing pixels
      const totalHeight = topMargin + projectHeight + ((row.length - 1) * projectSpacing) + bottomMargin
      return sum + totalHeight
    } else {
      // Si un seul projet, utiliser la hauteur standard
      return sum + projectHeight + topMargin + bottomMargin
    }
  }, 0)
  
  return Math.max(40, totalHeight) // Hauteur minimale de 40px
}

export const TimelineSidebar = forwardRef<HTMLDivElement, TimelineSidebarProps>(
  ({ data, currentView = 'month', onScrollChange, groupBy = 'country' }, ref) => {
    // Note: state et onToggleCountry sont requis par l'interface mais pas utilisés dans cette implémentation
    
    // Grouper les projets selon le mode de groupement
    let groupedProjects: Record<string, Project[]> | Record<string, Record<string, Project[]>>
    
    if (groupBy === 'conclusive') {
      // Groupement par conclusive (sans sous-groupes)
      groupedProjects = data.projects.reduce((acc, project) => {
        const conclusiveGroup = project.conclusiveGroup || 'Others'
        if (!acc[conclusiveGroup]) {
          acc[conclusiveGroup] = []
        }
        acc[conclusiveGroup].push(project)
        return acc
      }, {} as Record<string, Project[]>)
    } else {
      // Groupement par pays et page (comportement par défaut)
      groupedProjects = data.projects.reduce((acc, project) => {
        if (!acc[project.country]) {
          acc[project.country] = {}
        }
        
        if (!acc[project.country][project.section]) {
          acc[project.country][project.section] = []
        }
        
        acc[project.country][project.section].push(project)
        return acc
      }, {} as Record<string, Record<string, Project[]>>)
    }

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

    // Calculer la hauteur du header selon la vue (proportionnelle à TimelineHeader)
    const getHeaderHeight = () => {
      switch (currentView) {
        case 'week':
          return 'h-20.5' // Plus grand header pour la vue week
        case 'month':
          return 'h-18.5' // Taille standard
        case 'quarter':
          return 'h-16.5' // Plus petit
        case 'year':
          return 'h-15.5' // Très petit
        default:
          return 'h-20'
      }
    }

    // Gérer le scroll de la sidebar
    const handleSidebarScroll = () => {
      if (ref && 'current' in ref && ref.current && onScrollChange) {
        onScrollChange(ref.current.scrollTop)
      }
    }

    return (
      <div className="w-48 bg-gray-50 border-r border-gray-200 flex-shrink-0 flex flex-col h-full">
        {/* Header sticky pour aligner avec le header de la timeline */}
        <div className={`flex-shrink-0 bg-white border-b border-gray-200 z-10 ${getHeaderHeight()}`}></div>

        {/* Liste des groupes avec scroll synchronisé */}
        <div 
          ref={ref}
          className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={handleSidebarScroll}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="flex flex-col">
            {Object.entries(groupedProjects).map(([groupKey, groupData]) => {
              if (groupBy === 'conclusive') {
                // Mode conclusive : groupData est un array de projets
                const projects = groupData as Project[]
                const groupHeight = calculatePageHeight(projects, data.timeline.dateRange.start)
                return (
                  <div 
                    key={groupKey} 
                    className="border-b border-gray-100 flex items-center px-3 flex-shrink-0 bg-white"
                    style={{ height: `${groupHeight}px` }}
                  >
                    <div className="text-xs font-medium text-gray-600 truncate">
                      {groupKey === "C" ? "Conclusive" : groupKey === "N" ? "Non Conclusive" : groupKey}
                    </div>
                  </div>
                )
              } else {
                // Mode pays/page : groupData est un objet avec des sous-groupes
                const countryData = groupData as Record<string, Project[]>
                return (
                  <div key={groupKey}>
                    {/* Pays */}
                    <div className={`border-b border-gray-100 flex items-center px-3 bg-gray-50 flex-shrink-0 ${getRowHeight()}`}>
                      <div className="text-xs font-medium text-gray-700 truncate">
                        {groupKey}
                      </div>
                    </div>
                    
                    {/* Pages pour ce pays */}
                    {Object.entries(countryData).map(([page, projects]) => {
                      const pageHeight = calculatePageHeight(projects, data.timeline.dateRange.start)
                      return (
                        <div 
                          key={`${groupKey}-${page}`} 
                          className="border-b border-gray-100 flex items-center px-3 pl-6 flex-shrink-0 bg-white"
                          style={{ height: `${pageHeight}px` }}
                        >
                          <div className="text-xs font-medium text-gray-600 truncate">
                            {page}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              }
            })}
          </div>
        </div>
      </div>
    )
  }
)

TimelineSidebar.displayName = 'TimelineSidebar' 