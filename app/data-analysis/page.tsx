'use client'

import React, { useState, useRef } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { DataAnalysis, type DataAnalysisRef } from '@/components/app-bar/data-analysis/data-analysis'
import { AnalysisStepper } from '@/components/app-bar/data-analysis/AnalysisStepper'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function DataAnalysisPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showDataImport, setShowDataImport] = useState(false)
  const [activeTab, setActiveTab] = useState('existing')
  const dataAnalysisRef = useRef<DataAnalysisRef>(null)

  const handleStepChange = (step: number) => {
    setCurrentStep(step)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            
            {!showDataImport && (
              <>
                {/* Show different breadcrumb content based on current step */}
                {currentStep === 5 ? (
                  // ResultsView: Show Back to analysis and Filter button
                  <div className="flex items-center justify-between w-full">
                    <button 
                      onClick={() => dataAnalysisRef.current?.handleBackStep?.()}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <ArrowLeft size={16} />
                      <span>Back to analysis</span>
                    </button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dataAnalysisRef.current?.handleFilterClick?.()}
                      className="relative text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-9 px-4 cursor-pointer transition-all duration-200 hover:scale-105"
                    >
                      Filter
                      {(dataAnalysisRef.current?.getActiveFiltersCount?.() || 0) > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-blue-600 text-white text-[10px] leading-none">
                          {dataAnalysisRef.current?.getActiveFiltersCount?.() || 0}
                        </span>
                      )}
                    </Button>
                  </div>
                ) : currentStep === 4 ? (
                  // RunScript: Empty breadcrumb
                  <div></div>
                ) : currentStep === 1 && !showDataImport ? (
                  // SelectAnalysis: Show tabs centered instead of breadcrumb
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl">
                      <button
                        className={`rounded-xl text-xs h-7 px-3 cursor-pointer transition-all ${
                          activeTab === 'existing'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        onClick={() => setActiveTab('existing')}
                      >
                        Existing Test
                      </button>
                      <button
                        className={`rounded-xl text-xs h-7 px-3 cursor-pointer transition-all ${
                          activeTab === 'scratch'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        onClick={() => setActiveTab('scratch')}
                      >
                        From Scratch
                      </button>
                    </div>
                  </div>
                ) : (
                  // Empty space for other steps - no breadcrumb
                  <div></div>
                )}
              </>
            )}
            
            {currentStep >= 2 && currentStep < 4 && (
              <div className="flex-1">
                <AnalysisStepper currentStep={currentStep} />
              </div>
            )}
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-2 p-2 pt-0 overflow-hidden bg-transparent max-h-[calc(100vh-4rem)]">
          <DataAnalysis 
            ref={dataAnalysisRef}
            onStepChange={handleStepChange}
            showDataImport={showDataImport}
            setShowDataImport={setShowDataImport}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}