'use client'

import { useState } from 'react'
import { TimelineData } from "@/hooks/useExperimentation"

interface TimelineHeaderProps {
  data: TimelineData
  currentView?: 'week' | 'month' | 'quarter' | 'year'
}

export function TimelineHeader({ data, currentView = 'month' }: TimelineHeaderProps) {
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

  // Helper pour obtenir le nom du mois en anglais
  const getMonthName = (date: Date): string => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]
    return months[date.getMonth()]
  }

  // Helper pour obtenir la date du jour au format YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Fonction pour calculer les mois et leurs positions exactes
  const getMonthRanges = () => {
    const monthRanges: Array<{
      name: string
      startIndex: number
      endIndex: number
      days: number
    }> = []

    let currentMonth = -1
    let currentYear = -1
    let startIndex = 0

    data.timeline.days.forEach((day, index) => {
      const dayMonth = day.getMonth()
      const dayYear = day.getFullYear()

      // Si on change de mois ou d'année
      if (dayMonth !== currentMonth || dayYear !== currentYear) {
        // Sauvegarder le mois précédent s'il existe
        if (currentMonth !== -1) {
          monthRanges.push({
            name: getMonthName(new Date(currentYear, currentMonth, 1)),
            startIndex,
            endIndex: index - 1,
            days: index - startIndex
          })
        }

        // Commencer un nouveau mois
        currentMonth = dayMonth
        currentYear = dayYear
        startIndex = index
      }
    })

    // Ajouter le dernier mois
    if (currentMonth !== -1) {
      monthRanges.push({
        name: getMonthName(new Date(currentYear, currentMonth, 1)),
        startIndex,
        endIndex: data.timeline.days.length - 1,
        days: data.timeline.days.length - startIndex
      })
    }

    return monthRanges
  }

  // Déterminer si un jour doit être visible selon la vue - NOUVELLE LOGIQUE COHÉRENTE
  const isDayVisible = (day: Date) => {
    const dayOfMonth = day.getDate()
    const todayString = getTodayString()
    const isToday = day.toISOString().split('T')[0] === todayString
    
    // TOUJOURS afficher le jour J, peu importe la vue
    if (isToday) {
      return true
    }
    
    switch (currentView) {
      case 'week':
        // Plus de granularité pour la vue week - tous les 2-3 jours
        return dayOfMonth === 1 || dayOfMonth === 3 || dayOfMonth === 6 || dayOfMonth === 9 || 
               dayOfMonth === 12 || dayOfMonth === 15 || dayOfMonth === 18 || dayOfMonth === 21 || 
               dayOfMonth === 24 || dayOfMonth === 27 || dayOfMonth === 30
      case 'month':
        // Plus de granularité pour la vue month - tous les 3-4 jours
        return dayOfMonth === 1 || dayOfMonth === 5 || dayOfMonth === 8 || dayOfMonth === 12 || 
               dayOfMonth === 15 || dayOfMonth === 18 || dayOfMonth === 22 || dayOfMonth === 25 || 
               dayOfMonth === 28 || dayOfMonth === 30
      case 'quarter':
        // Granularité moyenne pour la vue quarter - tous les 4-5 jours
        return dayOfMonth === 1 || dayOfMonth === 6 || dayOfMonth === 11 || dayOfMonth === 16 || 
               dayOfMonth === 21 || dayOfMonth === 26 || dayOfMonth === 30
      case 'year':
        // Granularité fine pour la vue year - tous les 2-3 jours
        return dayOfMonth === 1 || dayOfMonth === 3 || dayOfMonth === 6 || dayOfMonth === 9 || 
               dayOfMonth === 12 || dayOfMonth === 15 || dayOfMonth === 18 || dayOfMonth === 21 || 
               dayOfMonth === 24 || dayOfMonth === 27 || dayOfMonth === 30
      default:
        return true
    }
  }

  // Déterminer la taille des jours selon la vue
  const getDaySize = () => {
    switch (currentView) {
      case 'week':
        return 'w-10 h-10 text-sm' // Plus grand
      case 'month':
        return 'w-8 h-8 text-xs' // Taille standard
      case 'quarter':
        return 'w-6 h-6 text-xs' // Plus petit
      case 'year':
        return 'w-5 h-5 text-xs' // Très petit
      default:
        return 'w-8 h-8 text-xs'
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

  const monthRanges = getMonthRanges()
  const todayString = getTodayString()

  return (
    <div className="bg-white border-b border-gray-200 transition-all duration-300 ease-in-out">
      {/* En-tête des mois */}
      <div className="flex border-b border-gray-100" style={{ width: `${data.timeline.days.length * dayWidth}px` }}>
        {monthRanges.map((month) => (
          <div
            key={`${month.name}-${month.startIndex}`}
            className="p-3 text-center border-r border-gray-100 last:border-r-0 bg-white"
            style={{ width: `${month.days * dayWidth}px` }}
          >
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {month.name}
            </div>
          </div>
        ))}
      </div>

      {/* En-tête des jours avec filtrage et highlight discret */}
      <div 
        className="flex relative" 
        style={{ width: `${data.timeline.days.length * dayWidth}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {data.timeline.days.map((day) => {
          // Vérifier si ce jour doit être visible selon la vue
          const isVisible = isDayVisible(day)
          
          if (!isVisible) {
            return (
              <div
                key={day.toISOString()}
                className=""
                style={{ width: `${dayWidth}px` }}
              />
            )
          }

          const isFirstDayOfMonth = day.getDate() === 1
          const isToday = day.toISOString().split('T')[0] === todayString
          
          return (
            <div
              key={day.toISOString()}
              className={`flex items-center justify-center font-medium transition-all duration-200 cursor-pointer relative ${
                isToday 
                  ? 'text-blue-600 font-bold' 
                  : isFirstDayOfMonth
                    ? 'text-gray-700' 
                    : 'text-gray-500 hover:text-gray-700'
              } ${getDaySize()}`}
              style={{ width: `${dayWidth}px` }}
            >
              {day.getDate()}
            </div>
          )
        })}
        
        {/* Barre de hover très discrète */}
        {hoveredDate && hoveredPosition && (
          <>
            {/* Barre verticale sur toute la hauteur */}
            <div 
              className="absolute w-px bg-violet-300 opacity-30 z-10"
              style={{ 
                left: `${hoveredPosition.x}px`,
                transform: 'translateX(-50%)',
                top: '0px',
                height: '100%'
              }}
            />
            {/* Chiffre très discret - positionné correctement */}
            <div 
              className="absolute flex items-center justify-center font-bold text-violet-700 bg-white border border-violet-200 rounded shadow-lg z-30 px-2 py-1"
              style={{ 
                left: `${hoveredPosition.x}px`,
                transform: 'translateX(-50%)',
                top: '50%',
                marginTop: '-50%',
                minWidth: '28px',
                minHeight: '28px',
                fontSize: '14px'
              }}
            >
              {hoveredDate.getDate()}
            </div>
          </>
        )}
      </div>
    </div>
  )
} 