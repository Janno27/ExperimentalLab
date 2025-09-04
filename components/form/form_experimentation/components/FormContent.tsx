'use client'

import { Button } from '@/components/ui/button'
import { StepProperties, StepDefinition, StepAudience, StepTimeline, StepSuccessCriteria, StepReview } from '../steps'
import { cn } from '@/lib/utils'
import type { FormData } from '@/hooks/useFormExperimentation'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
                  formData.power &&
                  formData.expectedLaunch &&
                  formData.endDate &&
                  (() => {
                    // Vérifier que la durée estimée est inférieure à 50 jours
                    if (!formData.expectedLaunch || !formData.endDate) return false;
                    const startDate = new Date(formData.expectedLaunch);
                    const endDate = new Date(formData.endDate);
                    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 50;
                  })()
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

  // Fonction pour obtenir le message d'erreur de validation
  const getValidationMessage = () => {
    switch (currentStep) {
      case 0: // Properties
        if (!formData.role) return "Veuillez sélectionner un rôle"
        if (!formData.owner) return "Veuillez sélectionner un propriétaire"
        if (!formData.market) return "Veuillez sélectionner un marché"
        if (!formData.scope) return "Veuillez sélectionner un scope"
        if (!formData.tool) return "Veuillez sélectionner un outil"
        if (!formData.testType || formData.testType.length === 0) return "Veuillez sélectionner au moins un type de test"
        return ""
      case 1: // Definition
        if (!formData.shortName) return "Veuillez saisir un nom court"
        if (!formData.type) return "Veuillez sélectionner un type"
        if (!formData.hypothesis) return "Veuillez saisir une hypothèse"
        if (!formData.context) return "Veuillez saisir un contexte"
        if (!formData.description) return "Veuillez saisir une description"
        return ""
      case 2: // Timeline
        if (!formData.audience) return "Veuillez saisir l'audience"
        if (!formData.conversion) return "Veuillez saisir les conversions"
        if (!formData.mde && !formData.mdeCustom) return "Veuillez sélectionner ou saisir un MDE"
        if (!formData.trafficAllocation) return "Veuillez définir l'allocation de trafic"
        if (!formData.statisticalConfidence) return "Veuillez définir la confiance statistique"
        if (!formData.power) return "Veuillez définir la puissance"
        if (!formData.expectedLaunch) return "Veuillez sélectionner une date de lancement"
        if (!formData.endDate) return "Veuillez sélectionner une date de fin"
        if (formData.expectedLaunch && formData.endDate) {
          const startDate = new Date(formData.expectedLaunch);
          const endDate = new Date(formData.endDate);
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 50) return "La durée estimée doit être inférieure à 50 jours"
        }
        return ""
      case 3: // Audience
        if (!formData.devices) return "Veuillez sélectionner les appareils"
        if (!formData.page) return "Veuillez sélectionner une page"
        if (!formData.product) return "Veuillez sélectionner un produit"
        if (!formData.mainKPI) return "Veuillez sélectionner un KPI principal"
        return ""
      case 4: // Success Criteria
        if (!formData.successCriteria1) return "Veuillez saisir au moins un critère de succès"
        return ""
      default:
        return ""
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
          
          <TooltipProvider>
            {isLastStep ? (
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                {!isStepValid() && (
                  <TooltipContent>
                    <p>{getValidationMessage()}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                {!isStepValid() && (
                  <TooltipContent>
                    <p>{getValidationMessage()}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
} 