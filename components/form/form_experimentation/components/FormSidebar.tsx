'use client'

import { FlaskConical, CheckCircle, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormStep {
  id: number
  title: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

interface FormSidebarProps {
  steps: FormStep[]
  currentStep: number
  onStepClick: (stepId: number) => void
}

export function FormSidebar({ steps, currentStep, onStepClick }: FormSidebarProps) {
  return (
    <div className="w-64 lg:w-72 border-r border-gray-200 bg-gray-50 flex-shrink-0">
      <div className="p-4 lg:p-6 pt-12 lg:pt-16">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical size={16} className="text-purple-500" />
            <h2 className="text-sm font-medium text-gray-900">
              New Experimentation
            </h2>
          </div>
          <p className="text-xs text-gray-600">Complete all steps to create your experimentation</p>
        </div>
        
        <nav className="space-y-0">
                            {steps.map((step, index) => {
                    const isCompleted = currentStep > step.id
                    const isActive = currentStep === step.id
                    const isLastStep = index === steps.length - 1
                    const isClickable = isCompleted || isActive
            
            return (
              <div key={step.id} className="relative">
                <button
                  onClick={() => isClickable ? onStepClick(step.id) : null}
                  disabled={!isClickable}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors relative z-10",
                    isActive
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : isClickable 
                      ? "cursor-pointer" 
                      : "cursor-not-allowed opacity-60"
                  )}
                >
                  <div className="flex items-center justify-center w-6 h-6 relative">
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                                          <Circle className={cn(
                      "w-4 h-4",
                      isActive ? "text-purple-600" : "text-gray-400"
                    )} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                                      <div className={cn(
                    "font-medium",
                    isActive ? "text-purple-700" : isCompleted ? "text-green-500" : "text-gray-500"
                  )}>
                    {step.title}
                  </div>
                  <div className={cn(
                    "text-xs",
                    isActive ? "text-purple-600" : isCompleted ? "text-green-500" : "text-gray-400"
                  )}>
                    {step.description}
                  </div>
                  </div>
                </button>
                
                {/* Ligne de connexion entre les étapes - du centre du cercle actuel au centre du cercle suivant */}
                {!isLastStep && (
                  <div className={cn(
                    "absolute left-[23px] top-[32px] w-0.5 h-[40px] z-0 pointer-events-none",
                    isCompleted ? "bg-green-300" : "bg-gray-300"
                  )} />
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </div>
  )
} 