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
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { TimelineView, TimelineViewRef } from "@/components/timeline"
import { TimelineControls } from "@/components/timeline/TimelineControls"
import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { FilterOverlay } from "@/components/dashboard/filter-overlay"
import { useFilters } from '@/contexts/FilterContext'
import { useExperimentation } from "@/hooks/useExperimentation"

export default function Page() {
  const searchParams = useSearchParams()
  const [currentView, setCurrentView] = useState<'week' | 'month' | 'quarter' | 'year'>('year')
  const [activeTab, setActiveTab] = useState('live-test')
  const [activeView, setActiveView] = useState<'timeline' | 'table'>('timeline')
  const [searchValue, setSearchValue] = useState("")
  const [isFilterOverlayOpen, setIsFilterOverlayOpen] = useState(false)
  const timelineViewRef = useRef<TimelineViewRef | null>(null)
  const marketOverviewTimelineRef = useRef<TimelineViewRef | null>(null)
  const completedTestTimelineRef = useRef<TimelineViewRef | null>(null)
  
  // Récupérer les filtres appliqués et les données pour les filtres
  const { appliedFilters } = useFilters()
  const { markets = [], scopes = [] } = useExperimentation({ 
    useAirtable: true, 
    timelineMode: false 
  })

  // Compter et vérifier les filtres actifs (uniquement ceux visibles dans Timeline)
  const getActiveFiltersCount = () => {
    let count = 0
    if (appliedFilters.region) count++
    if (appliedFilters.market && appliedFilters.market.length > 0) count++
    if (appliedFilters.scope && appliedFilters.scope.length > 0) count++
    // Note: Month n'est pas compté car il est masqué dans Timeline
    return count
  }

  // Gérer les paramètres d'URL pour ouvrir directement le bon tab
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['live-test', 'market-overview', 'completed-test'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const handleViewChange = (view: 'week' | 'month' | 'quarter' | 'year') => {
    setCurrentView(view)
  }



  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Mettre à jour l'URL sans recharger la page
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.pushState({}, '', url.toString())
  }

  const handleViewTypeChange = (viewType: 'timeline' | 'table') => {
    setActiveView(viewType)
  }

  const handleSearch = (value: string) => {
    setSearchValue(value)
    // La recherche sera gérée par les composants TimelineView
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
                  <BreadcrumbPage>Timeline</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-hidden flex-1 flex flex-col">
            {/* Contrôles de la timeline */}
            <TimelineControls
              currentView={currentView}
              onViewChange={handleViewChange}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              activeView={activeView}
              onViewTypeChange={handleViewTypeChange}
              onSearch={handleSearch}
              onFilterClick={() => setIsFilterOverlayOpen(true)}
              activeFiltersCount={getActiveFiltersCount()}
            />
            
            <TabsContent value="live-test" className="mt-0 overflow-hidden flex-1 flex flex-col">
              <div className="w-full h-[80vh] overflow-hidden flex flex-col">
                <TimelineView 
                  ref={timelineViewRef} 
                  currentView={currentView} 
                  activeView={activeView} 
                  searchValue={searchValue}
                  region={appliedFilters.region as 'APAC' | 'EMEA' | 'AMER' | undefined}
                  market={appliedFilters.market}
                  scope={appliedFilters.scope}
                  markets={markets}
                />
              </div>
            </TabsContent>
            <TabsContent value="market-overview" className="mt-0 overflow-hidden flex-1 flex flex-col">
              <div className="w-full h-[80vh] overflow-hidden flex flex-col">
                <TimelineView 
                  ref={marketOverviewTimelineRef} 
                  currentView={currentView} 
                  activeView={activeView}
                  validStatuses={["Refinement", "Design & Development", "Setup", "Running", "Ready for Analysis", "Analysing", "Open", "Done"]}
                  searchValue={searchValue}
                  requireDoneDate={false}
                  region={appliedFilters.region as 'APAC' | 'EMEA' | 'AMER' | undefined}
                  market={appliedFilters.market}
                  scope={appliedFilters.scope}
                  markets={markets}
                />
              </div>
            </TabsContent>
            <TabsContent value="completed-test" className="mt-0 overflow-hidden flex-1 flex flex-col">
              <div className="w-full h-[80vh] overflow-hidden flex flex-col">
                <TimelineView 
                  ref={completedTestTimelineRef} 
                  currentView={currentView} 
                  activeView={activeView} 
                  validStatuses={["Done"]}
                  searchValue={searchValue}
                  groupBy="conclusive"
                  requireDoneDate={true}
                  region={appliedFilters.region as 'APAC' | 'EMEA' | 'AMER' | undefined}
                  market={appliedFilters.market}
                  scope={appliedFilters.scope}
                  markets={markets}
                />
              </div>
            </TabsContent>
          </Tabs>
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