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

export default function Page() {
  const [openForm, setOpenForm] = useState(false)
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
            <button
              onClick={() => setOpenForm(true)}
              className="rounded-md px-3 py-1 text-sm text-zinc-500 hover:text-violet-700 transition-colors duration-200 hover:cursor-pointer"
              title="Create a new experimentation"
            >
              + New Experimentation
            </button>
          </div>
        </header>
        <MultiStepForm isOpen={openForm} setIsOpen={setOpenForm} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Kanban />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
