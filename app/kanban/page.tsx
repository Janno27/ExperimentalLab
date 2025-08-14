'use client'

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import Kanban from "@/components/kanban"
import { MultiStepForm } from "@/components/multi-step-form"
import { useState } from "react"
import { SearchBar } from "@/components/ui/searchBar"
import { Button } from "@/components/ui/button"
import { FilterOverlay } from "@/components/ui/filter-overlay"
import { useFilters } from '@/contexts/FilterContext'
import { useExperimentation } from "@/hooks/useExperimentation"

export default function Page() {
  const [openForm, setOpenForm] = useState(false)
  const [isFilterOverlayOpen, setIsFilterOverlayOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const { appliedFilters } = useFilters()
  
  // Récupérer les données pour les filtres
  const { markets = [], scopes = [] } = useExperimentation({ 
    useAirtable: true, 
    timelineMode: false 
  })

  // Compter et vérifier les filtres actifs (uniquement ceux visibles dans Kanban)
  const getActiveFiltersCount = () => {
    let count = 0
    if (appliedFilters.status && appliedFilters.status.length > 0) count++
    if (appliedFilters.owner && appliedFilters.owner.length > 0) count++
    if (appliedFilters.market && appliedFilters.market.length > 0) count++
    if (appliedFilters.scope && appliedFilters.scope.length > 0) count++
    if (appliedFilters.region) count++
    // Note: Month n'est pas compté car il est masqué dans Kanban
    return count
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="max-w-full overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Kanban</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex-1 flex justify-end pr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpenForm(true)}
              className="relative text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-8 px-3 cursor-pointer transition-all duration-200 hover:scale-105"
              title="Create a new experimentation"
            >
              + New Experimentation
            </Button>
          </div>
        </header>
        
        {/* Barre de recherche et bouton Filter dans le corps de la page */}
        <div className="flex flex-col gap-2 p-2 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>
            <div className="flex-1 max-w-md">
              <SearchBar 
                placeholder="Search..."
                value={searchValue}
                onSearch={setSearchValue}
              />
            </div>
            <div className="flex-1 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFilterOverlayOpen(true)}
                className="relative text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-8 px-3 cursor-pointer transition-all duration-200 hover:scale-105"
              >
                Filter
                {getActiveFiltersCount() > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-purple-600 text-white text-[10px] leading-none">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        <MultiStepForm isOpen={openForm} setIsOpen={setOpenForm} />
        <div className="flex flex-1 flex-col gap-2 p-2 pt-0 overflow-hidden">
          <Kanban searchValue={searchValue} />
        </div>

        {/* Filter Overlay */}
        <FilterOverlay
          isOpen={isFilterOverlayOpen}
          onClose={() => setIsFilterOverlayOpen(false)}
          markets={markets}
          scopes={scopes}
          hideMonth={true}
          hideRegion={false}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
