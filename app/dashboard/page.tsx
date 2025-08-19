"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SearchBar } from "@/components/ui/searchBar"
import { DashboardProvider } from "@/contexts/DashboardContext"
import { ThisMonth } from "@/components/dashboard/this-month"
import { TopCroOwners } from "@/components/dashboard/top-cro-owners"

import { FilterOverlay } from "@/components/ui/filter-overlay"
import { Switch } from "@/components/ui/switch"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { NotificationPopover } from "@/components/notification/notification-popover"
import { useFilters } from '@/contexts/FilterContext'

import { Button } from "@/components/ui/button"

import { ThisYear } from "@/components/dashboard/this-year"
import { FilteredBadge } from "@/components/ui/filtered-badge"

export default function Page() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  const { appliedFilters } = useFilters()
  const [firstName, setFirstName] = useState('')
  const [showComparison, setShowComparison] = useState(false)
  const [isFilterOverlayOpen, setIsFilterOverlayOpen] = useState(false)

  // Compter et vérifier les filtres actifs
  const getActiveFiltersCount = () => {
    const defaultMonth = new Date()
    const isDefaultMonth = appliedFilters.selectedMonth.getMonth() === defaultMonth.getMonth() &&
      appliedFilters.selectedMonth.getFullYear() === defaultMonth.getFullYear()

    let count = 0
    if (!isDefaultMonth) count++
    if (appliedFilters.status && appliedFilters.status.length > 0) count++
    if (appliedFilters.owner && appliedFilters.owner.length > 0) count++
    if (appliedFilters.market && appliedFilters.market.length > 0) count++
    if (appliedFilters.region) count++

    return count
  }

  const hasActiveFilters = () => getActiveFiltersCount() > 0

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()
        if (data && data.full_name) {
          setFirstName(data.full_name.split(' ')[0])
        }
      }
    }
    fetchProfile()
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            {/* SearchBar centrée dans le header */}
            <div className="flex-1 flex justify-center">
              <SearchBar 
                placeholder="Search..."
                onSearch={(value) => console.log('Search:', value)}
              />
            </div>
          </div>
          {/* Bouton Filters et icône notification à droite */}
          <div className="flex items-center gap-2 pr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterOverlayOpen(true)}
              className="relative text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-6 px-2 cursor-pointer transition-all duration-200 hover:scale-105"
            >
              Filter
              {getActiveFiltersCount() > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-purple-600 text-white text-[10px] leading-none">
                  {getActiveFiltersCount()}
                </span>
              )}
            </Button>
            <NotificationPopover />
          </div>
        </header>
        
        {/* Message d'accueil centré avec MonthPicker */}
        <div className="flex flex-col items-center pt-8 pb-14">
          <p className="text-sm text-gray-500 mb-2 font-light">
            {currentDate}
          </p>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-light tracking-wide text-gray-700">
              {firstName ? `Hello, ${firstName} 👋` : 'Hello! 👋'}
            </h1>

          </div>
        </div>
        
        {/* Grille dashboard simple */}
        <div className="flex flex-1 flex-col p-4 pt-0 h-full">
          <div className="flex flex-col h-full space-y-4">
            <DashboardProvider filters={{
              region: appliedFilters.region as 'APAC' | 'EMEA' | 'AMER' | undefined,
              status: appliedFilters.status,
              owner: appliedFilters.owner,
              market: appliedFilters.market,
              selectedMonth: appliedFilters.selectedMonth
            }}>
              {/* This Month et Top CRO owners côte à côte */}
              <div className="flex flex-col lg:flex-row gap-4">
                {/* This Month */}
                <div className="w-full lg:w-1/3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-medium text-gray-500">This month</h3>
                      {hasActiveFilters() && (
                        <FilteredBadge filters={{
                          status: appliedFilters.status,
                          owner: appliedFilters.owner,
                          market: appliedFilters.market,
                          region: appliedFilters.region as 'APAC' | 'EMEA' | 'AMER' | undefined,
                          selectedMonth: appliedFilters.selectedMonth
                        }} />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">Compare</span>
                      <Switch
                        checked={showComparison}
                        onCheckedChange={setShowComparison}
                        className="scale-75"
                      />
                    </div>
                  </div>
                  <ThisMonth 
                    showComparison={showComparison} 
                    selectedMonth={appliedFilters.selectedMonth} 
                  />
                </div>

                {/* Placeholder pour le troisième composant */}
                <div className="w-full lg:w-1/3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-medium text-gray-500">Coming soon</h3>
                    </div>
                    <span className="text-[10px] text-gray-400">Placeholder</span>
                  </div>
                  <div className="w-full h-[120px] bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-lg">+</span>
                      </div>
                      <p className="text-sm">Nouveau composant</p>
                    </div>
                  </div>
                </div>

                                {/* Top Cro Owners */}
                <div className="w-full lg:w-1/3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-medium text-gray-500">Top performers</h3>
                      {hasActiveFilters() && (
                        <FilteredBadge filters={{
                          status: appliedFilters.status,
                          owner: appliedFilters.owner,
                          market: appliedFilters.market,
                          region: appliedFilters.region as 'APAC' | 'EMEA' | 'AMER' | undefined,
                          selectedMonth: appliedFilters.selectedMonth
                        }} />
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400">This Month</span>
                  </div>
                  <TopCroOwners 
                    selectedMonth={appliedFilters.selectedMonth}
                    showComparison={showComparison}
                  />
                </div>
              </div>

              {/* This Year - Prend la hauteur restante et la moitié de la largeur */}
              <div className="flex-1 flex flex-col lg:flex-row gap-4">
                <div className="w-full lg:w-1/2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-medium text-gray-500">This year</h3>
                      {(() => {
                        const hasActiveFilters = (appliedFilters.status && appliedFilters.status.length > 0) || 
                                              (appliedFilters.owner && appliedFilters.owner.length > 0) || 
                                              (appliedFilters.market && appliedFilters.market.length > 0) || 
                                              appliedFilters.region
                        return hasActiveFilters && (
                          <FilteredBadge 
                            filters={{
                              status: appliedFilters.status,
                              owner: appliedFilters.owner,
                              market: appliedFilters.market,
                              region: appliedFilters.region as 'APAC' | 'EMEA' | 'AMER' | undefined,
                              selectedMonth: appliedFilters.selectedMonth
                            }}
                            excludeMonth={true}
                          />
                        )
                      })()}
                    </div>
                    <span className="text-[10px] text-gray-400">Done per month</span>
                  </div>
                  <div className="h-full">
                    <ThisYear />
                  </div>
                </div>
                
                {/* Espace vide pour la moitié droite */}
                <div className="w-full lg:w-1/2"></div>
              </div>
            </DashboardProvider>
          </div>
        </div>


        
        {/* Filter Overlay */}
        <FilterOverlay
          isOpen={isFilterOverlayOpen}
          onClose={() => setIsFilterOverlayOpen(false)}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
