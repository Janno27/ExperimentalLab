// contexts/TimelineContext.tsx
'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useTimelineData } from '@/components/timeline/hooks/useTimelineData'

interface TimelineContextValue {
  data: any
  state: any
  loading: boolean
  toggleCountry: (countryCode: string) => void
}

const TimelineContext = createContext<TimelineContextValue | null>(null)

interface TimelineProviderProps {
  children: ReactNode
}

export const TimelineProvider: React.FC<TimelineProviderProps> = ({
  children
}) => {
  // Données et état avec hook optimisé
  const {
    data,
    state,
    loading,
    toggleCountry
  } = useTimelineData()

  const contextValue: TimelineContextValue = {
    data,
    state,
    loading,
    toggleCountry
  }

  return (
    <TimelineContext.Provider value={contextValue}>
      {children}
    </TimelineContext.Provider>
  )
}

// Hook pour utiliser le contexte avec validation
export const useTimelineContext = (): TimelineContextValue => {
  const context = useContext(TimelineContext)
  
  if (!context) {
    throw new Error('useTimelineContext must be used within a TimelineProvider')
  }
  
  return context
}
