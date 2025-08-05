"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SearchBar } from "@/components/ui/searchBar"
import { MultiStepForm } from "@/components/multi-step-form"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { NotificationPopover } from "@/components/notification/notification-popover"

export default function Page() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  const [firstName, setFirstName] = useState('')

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
    <SidebarProvider defaultOpen={false}>
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
          {/* Icône notification à droite */}
          <div className="flex items-center gap-2 pr-4">
            <NotificationPopover />
          </div>
        </header>
        
        {/* Message d'accueil centré */}
        <div className="flex flex-col items-center pt-8 pb-4">
          <p className="text-sm text-gray-500 mb-2 font-light">
            {currentDate}
          </p>
          <h1 className="text-4xl font-light tracking-wide text-gray-700">
            {firstName ? `Hello, ${firstName} 👋` : 'Hello! 👋'}
          </h1>
        </div>
        
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div>
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
        </div>

        {/* Multi-step form modal */}
        <MultiStepForm />
      </SidebarInset>
    </SidebarProvider>
  )
}
