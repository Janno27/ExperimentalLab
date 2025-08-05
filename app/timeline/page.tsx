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
import { Button } from "@/components/ui/button"
import { useState, useRef } from "react"

export default function Page() {
  const [currentView, setCurrentView] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [activeTab, setActiveTab] = useState('live-test')
  const timelineViewRef = useRef<TimelineViewRef | null>(null)

  const handleViewChange = (view: 'week' | 'month' | 'quarter' | 'year') => {
    setCurrentView(view)
  }

  const handleScrollToToday = () => {
    if (timelineViewRef.current) {
      timelineViewRef.current.scrollToToday()
    }
  }

  return (
    <SidebarProvider defaultOpen={false}>
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
          <div className="flex-1 flex justify-end pr-4">
            <div className="flex items-center gap-0.5 bg-gray-200 rounded-2xl p-0.5">
              <Button
                variant={activeTab === 'live-test' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('live-test')}
                className={`rounded-xl text-xs h-7 px-3 cursor-pointer ${activeTab !== 'live-test' ? 'hover:bg-gray-100' : ''}`}
              >
                Live Test
              </Button>
              <Button
                variant={activeTab === 'market-overview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('market-overview')}
                className={`rounded-xl text-xs h-7 px-3 cursor-pointer ${activeTab !== 'market-overview' ? 'hover:bg-gray-100' : ''}`}
              >
                Market Overview
              </Button>
              <Button
                variant={activeTab === 'completed-test' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('completed-test')}
                className={`rounded-xl text-xs h-7 px-3 cursor-pointer ${activeTab !== 'completed-test' ? 'hover:bg-gray-100' : ''}`}
              >
                Completed Test
              </Button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-hidden flex-1 flex flex-col">
            {/* Contrôles de la timeline */}
            <TimelineControls
              currentView={currentView}
              onViewChange={handleViewChange}
              onScrollToToday={handleScrollToToday}
            />
            
            <TabsContent value="live-test" className="mt-0 overflow-hidden flex-1 flex flex-col">
              <div className="w-full h-[80vh] overflow-hidden flex flex-col">
                <TimelineView ref={timelineViewRef} currentView={currentView} />
              </div>
            </TabsContent>
            <TabsContent value="market-overview" className="mt-0">
              {/* Contenu vide pour Market Overview */}
            </TabsContent>
            <TabsContent value="completed-test" className="mt-0 overflow-hidden flex-1 flex flex-col bg-white">
              <div className="w-full overflow-hidden flex-1 flex flex-col">
                {/* Timeline principale pour Completed Test */}
                <TimelineView ref={timelineViewRef} currentView={currentView} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 