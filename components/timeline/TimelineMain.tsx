'use client'

import { useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from "react"
import { TimelineData, Project } from "@/hooks/useExperimentation"
import { TimelineHeader } from "./TimelineHeader"
import { TimelineContent } from "./TimelineContent"

interface TimelineMainProps {
  data: TimelineData
  currentView: 'week' | 'month' | 'quarter' | 'year'
  onScrollChange?: (scrollTop: number) => void
  onProjectClick?: (project: Project) => void
  groupBy?: 'country' | 'conclusive'
}

export interface TimelineMainRef {
  scrollToToday: () => void
  scrollToVertical: (scrollTop: number) => void
}

export const TimelineMain = forwardRef<TimelineMainRef, TimelineMainProps>(
  ({ data, currentView, onScrollChange, onProjectClick, groupBy = 'country' }, ref) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const headerScrollRef = useRef<HTMLDivElement>(null)
    const lastScrollPositionRef = useRef<number>(0)
    const lastDayIndexRef = useRef<number>(0)
    
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

    // NOUVELLE FONCTION scrollToToday complètement refaite
    const scrollToToday = useCallback(() => {
      if (data.timeline.todayIndex >= 0 && data.timeline.days.length > 0) {
        const scrollContainer = scrollContainerRef.current
        const headerScroll = headerScrollRef.current
        
        if (scrollContainer && headerScroll) {
          // Calculer la position exacte de la date du jour
          const todayPosition = data.timeline.todayIndex * dayWidth
          
          // Obtenir les dimensions du conteneur
          const containerWidth = scrollContainer.clientWidth
          const sidebarWidth = 192 // Largeur de la sidebar (w-48)
          const availableWidth = containerWidth - sidebarWidth
          
          // Calculer la position de scroll pour centrer parfaitement la date du jour
          const scrollPosition = Math.max(0, todayPosition - (availableWidth / 2))
          
          // Appliquer le scroll avec animation fluide aux deux conteneurs
          scrollContainer.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
          })
          headerScroll.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
          })
          
          // Sauvegarder la position pour les changements de vue
          lastScrollPositionRef.current = scrollPosition
          lastDayIndexRef.current = data.timeline.todayIndex
        }
      }
    }, [data.timeline.todayIndex, data.timeline.days.length, dayWidth])

    // Fonction pour maintenir la position lors des changements de vue
    const maintainScrollPosition = useCallback(() => {
      const scrollContainer = scrollContainerRef.current
      const headerScroll = headerScrollRef.current
      
      if (scrollContainer && headerScroll && lastDayIndexRef.current > 0) {
        // Utiliser l'index du jour pour calculer la nouvelle position
        const targetDayIndex = lastDayIndexRef.current
        const newPosition = targetDayIndex * dayWidth
        
        // Appliquer la nouvelle position sans animation pour éviter les sauts
        scrollContainer.scrollLeft = newPosition
        headerScroll.scrollLeft = newPosition
        
        // Mettre à jour la position sauvegardée
        lastScrollPositionRef.current = newPosition
      }
    }, [dayWidth])

    // Gérer le scroll horizontal du contenu pour synchroniser avec le header
    const handleContentScroll = () => {
      if (scrollContainerRef.current && headerScrollRef.current) {
        const scrollLeft = scrollContainerRef.current.scrollLeft
        headerScrollRef.current.scrollLeft = scrollLeft
        lastScrollPositionRef.current = scrollLeft
        
        // Calculer et sauvegarder l'index du jour actuel
        const currentDayIndex = Math.floor(scrollLeft / dayWidth)
        lastDayIndexRef.current = currentDayIndex
      }
    }

    // Gérer le scroll vertical pour synchroniser avec la sidebar
    const handleVerticalScroll = () => {
      if (scrollContainerRef.current && onScrollChange) {
        onScrollChange(scrollContainerRef.current.scrollTop)
      }
    }

    // Gérer le scroll horizontal du header pour synchroniser avec le contenu
    const handleHeaderScroll = () => {
      if (headerScrollRef.current && scrollContainerRef.current) {
        const scrollLeft = headerScrollRef.current.scrollLeft
        scrollContainerRef.current.scrollLeft = scrollLeft
        lastScrollPositionRef.current = scrollLeft
        
        // Calculer et sauvegarder l'index du jour actuel
        const currentDayIndex = Math.floor(scrollLeft / dayWidth)
        lastDayIndexRef.current = currentDayIndex
      }
    }

    // Exposer la fonction scrollToToday via ref
    useImperativeHandle(ref, () => ({
      scrollToToday,
      scrollToVertical: (scrollTop: number) => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollTop
        }
      }
    }))

    // Effet pour le scroll initial vers aujourd'hui
    useEffect(() => {
      if (data.timeline.todayIndex >= 0) {
        scrollToToday()
      }
    }, [scrollToToday, data.timeline.todayIndex])

    // Effet pour maintenir la position lors des changements de vue
    useEffect(() => {
      maintainScrollPosition()
    }, [maintainScrollPosition])

    return (
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header sticky en haut */}
        <div className="flex-shrink-0 bg-white z-10">
          <div 
            ref={headerScrollRef}
            className="overflow-x-auto overflow-y-hidden" 
            onScroll={handleHeaderScroll}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div style={{ width: `${data.timeline.days.length * dayWidth}px` }}>
              <TimelineHeader 
                data={data} 
                currentView={currentView}
              />
            </div>
          </div>
        </div>
        
        {/* Contenu scrollable (horizontal et vertical) */}
        <div 
          className="flex-1 overflow-auto" 
          ref={scrollContainerRef}
          onScroll={() => {
            handleContentScroll()
            handleVerticalScroll()
          }}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {/* Contenu avec largeur fixe */}
          <div style={{ width: `${data.timeline.days.length * dayWidth}px` }}>
            <TimelineContent
              data={data}
              currentView={currentView}
              onProjectClick={onProjectClick}
              groupBy={groupBy}
            />
          </div>
        </div>
      </div>
    )
  }
)

TimelineMain.displayName = 'TimelineMain' 