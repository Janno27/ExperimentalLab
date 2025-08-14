'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useDashboardData, DashboardDataOptions } from '@/hooks/useDashboardData'

interface DashboardContextType {
  experimentations: any[]
  owners: any[]
  filteredExperimentations: any[]
  loading: boolean
  error: string | null
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

interface DashboardProviderProps {
  children: ReactNode
  filters: DashboardDataOptions
}

export function DashboardProvider({ children, filters }: DashboardProviderProps) {
  const dashboardData = useDashboardData(filters)

  return (
    <DashboardContext.Provider value={dashboardData}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboardContext() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider')
  }
  return context
} 