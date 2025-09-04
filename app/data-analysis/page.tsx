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
import { DataAnalysis } from "@/components/app-bar/data-analysis/index"
import { AnalysisStepper } from "@/components/app-bar/data-analysis/AnalysisStepper"
import { ChevronLeft } from "lucide-react"
import { useState } from "react"

export default function Page() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showDataImport, setShowDataImport] = useState(false)

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      if (showDataImport) {
        setShowDataImport(false)
      }
    }
  }

  const handleStepChange = (step: number) => {
    setCurrentStep(step)
    if (step === 2) {
      setShowDataImport(true)
    } else {
      setShowDataImport(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="max-w-full overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4 flex-1">
            {currentStep > 1 && (
              <button 
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors cursor-pointer mr-4"
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>
            )}
            
            {currentStep === 1 && (
              <>
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
                      <BreadcrumbPage>Data Analysis</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </>
            )}
            
            {currentStep >= 2 && currentStep < 6 && (
              <div className="flex-1">
                <AnalysisStepper currentStep={currentStep} />
              </div>
            )}
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-2 p-2 pt-0 overflow-hidden bg-transparent max-h-[calc(100vh-4rem)]">
          <DataAnalysis 
            onStepChange={handleStepChange}
            showDataImport={showDataImport}
            setShowDataImport={setShowDataImport}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 