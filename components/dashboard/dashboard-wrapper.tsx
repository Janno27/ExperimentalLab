'use client'

import { DashboardProvider } from '@/contexts/DashboardContext'
import { ThisMonth } from './this-month'
import { TopCroOwners } from './top-cro-owners'
import { ThisYear } from './this-year'

interface DashboardWrapperProps {
  filters: {
    region?: 'APAC' | 'EMEA' | 'AMER'
    status?: string[]
    owner?: string[]
    market?: string[]
    selectedMonth?: Date
  }
  showComparison?: boolean
}

export function DashboardWrapper({ filters, showComparison = false }: DashboardWrapperProps) {
  return (
    <DashboardProvider filters={filters}>
      <div className="grid grid-cols-3 gap-4">
        {/* This Month - Occupe 1 colonne */}
        <div className="col-span-1">
          <ThisMonth 
            showComparison={showComparison}
            selectedMonth={filters.selectedMonth}
          />
        </div>

        {/* Top CRO Owners - Occupe 1 colonne */}
        <div className="col-span-1">
          <TopCroOwners 
            showComparison={showComparison}
            selectedMonth={filters.selectedMonth}
          />
        </div>

        {/* This Year - Occupe 1 colonne */}
        <div className="col-span-1">
          <ThisYear />
        </div>
      </div>
    </DashboardProvider>
  )
} 