'use client'

import React from 'react'
import { CheckCircle, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: number
  title: string
  description: string
  status: 'completed' | 'active' | 'pending'
}

interface AnalysisStepperProps {
  currentStep: number
}

export function AnalysisStepper({ currentStep }: AnalysisStepperProps) {
  // Étapes du processus d'analyse
  const steps: Step[] = [
    {
      id: 1,
      title: 'Select test',
      description: 'Choose test to analyze',
      status: currentStep >= 1 ? 'completed' : 'pending'
    },
    {
      id: 2,
      title: 'Import data',
      description: 'Upload or connect data source',
      status: currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : 'pending'
    },
    {
      id: 3,
      title: 'Configure analysis',
      description: 'Set up analysis parameters',
      status: currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : 'pending'
    },
    {
      id: 4,
      title: 'Run script',
      description: 'Execute analysis script',
      status: currentStep === 4 ? 'active' : currentStep > 4 ? 'completed' : 'pending'
    },
    {
      id: 5,
      title: 'View results',
      description: 'View results and insights',
      status: currentStep === 5 ? 'active' : currentStep > 5 ? 'completed' : 'pending'
    }
  ]

  return (
    <div className="flex items-center justify-center w-full">
      <div className="flex items-center gap-4">
        {steps.map((step) => {
          return (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                "flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg transition-colors relative z-10",
                step.status === 'active' 
                  ? "bg-purple-50 text-purple-700 border border-purple-200" 
                  : ""
              )}>
                <div className="flex items-center justify-center w-3 h-3 relative">
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-2.5 h-2.5 text-green-600" />
                  ) : (
                    <Circle className={cn(
                      "w-2.5 h-2.5",
                      step.status === 'active' ? "text-purple-600" : "text-gray-400"
                    )} />
                  )}
                </div>
                <div className="text-left">
                  <div className={cn(
                    "text-[10px] font-medium",
                    step.status === 'active' ? "text-purple-700" : 
                    step.status === 'completed' ? "text-green-600" : "text-gray-500"
                  )}>
                    {step.title}
                  </div>
                  <div className={cn(
                    "text-[10px] leading-tight",
                    step.status === 'active' ? "text-purple-600" : 
                    step.status === 'completed' ? "text-green-500" : "text-gray-400"
                  )}>
                    {step.description}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 