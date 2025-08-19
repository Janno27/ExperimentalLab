'use client'

import { Button } from '@/components/ui/button'
import { StepProperties, StepDefinition, StepAudience, StepTimeline, StepSuccessCriteria, StepReview } from '../steps'
import { cn } from '@/lib/utils'
import type { FormData } from '@/hooks/useFormExperimentation'

interface FormContentProps {
  currentStep: number
  formData: FormData
  updateFormData: (field: string, value: unknown) => void
  isFirstStep: boolean
  isLastStep: boolean
  onNext: () => void
  onPrevious: () => void
  onSubmit: () => void
}

export function FormContent({ 
  currentStep, 
  formData, 
  updateFormData, 
  isFirstStep, 
  isLastStep, 
  onNext, 
  onPrevious, 
  onSubmit 
}: FormContentProps) {
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepProperties
            formData={formData}
            updateFormData={updateFormData}
          />
        )
      case 1:
        return (
          <StepDefinition
            formData={formData}
            updateFormData={updateFormData}
          />
        )
      case 2:
        return (
          <StepTimeline
            formData={formData}
            updateFormData={updateFormData}
          />
        )
      case 3:
        return (
          <StepAudience
            formData={formData}
            updateFormData={updateFormData}
          />
        )
      case 4:
        return (
          <StepSuccessCriteria
            formData={formData}
            updateFormData={updateFormData}
          />
        )
      case 5:
        return (
          <StepReview
            formData={formData}
            updateFormData={updateFormData}
          />
        )
      default:
        return null
    }
  }

  // Fonction pour vérifier si tous les champs de l'étape actuelle sont remplis
  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Properties
        return (
          formData.role && 
          formData.owner && 
          formData.market && formData.market.length > 0 &&
          formData.scope && formData.scope.length > 0 &&
          formData.tool &&
          formData.testType && formData.testType.length > 0
        )
      case 1: // Definition
        return (
          formData.shortName &&
          formData.type &&
          formData.hypothesis &&
          formData.context &&
          formData.description
        )
                    case 2: // Timeline
                return (
                  formData.audience &&
                  formData.conversion &&
                  (formData.mde || (formData.mde === 'custom' && formData.mdeCustom)) &&
                  formData.trafficAllocation &&
                  formData.statisticalConfidence &&
                  formData.power
                )
                    case 3: // Audience
                return (
                  formData.devices &&
                  formData.page &&
                  formData.product &&
                  formData.mainKPI
                )
                    case 4: // Success Criteria
                return (
                  formData.successCriteria1
                )
      case 5: // Review
        return true // Toujours valide car c'est juste un review
      default:
        return true
    }
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="flex-1 p-6 lg:p-8 pt-12 lg:pt-16 space-y-8">
        <div className="transition-all duration-300 ease-in-out transform">
          {renderCurrentStep()}
        </div>
      </div>
      
      {/* Footer with navigation buttons */}
      <div className="flex-shrink-0 p-6 lg:p-8 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstStep}
            className="cursor-pointer"
          >
            Previous
          </Button>
          
          {isLastStep ? (
            <Button 
              onClick={onSubmit} 
              disabled={!isStepValid()}
              className={cn(
                "cursor-pointer transition-all duration-300",
                isStepValid() 
                  ? "opacity-100" 
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              Create Experimentation
            </Button>
          ) : (
            <Button 
              onClick={onNext} 
              disabled={!isStepValid()}
              className={cn(
                "cursor-pointer transition-all duration-300",
                isStepValid() 
                  ? "opacity-100" 
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 