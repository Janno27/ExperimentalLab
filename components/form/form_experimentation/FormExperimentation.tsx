'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { X, FlaskConical } from 'lucide-react'
import { useFormExperimentation } from '@/hooks/useFormExperimentation'
import { FormSidebar, FormContent } from './components'
import { Confetti } from '@/components/ui/confetti'
import { useState } from 'react'
import { createExperimentationRecord } from '@/lib/airtable'

interface FormExperimentationProps {
  isOpen: boolean
  onClose: () => void
}

const FORM_STEPS = [
  {
    id: 0,
    title: 'Properties',
    description: 'Basic information',
    icon: FlaskConical
  },
  {
    id: 1,
    title: 'Definition',
    description: 'Details and context',
    icon: FlaskConical
  },
  {
    id: 2,
    title: 'Timeline',
    description: 'Statistical parameters',
    icon: FlaskConical
  },
  {
    id: 3,
    title: 'Audience',
    description: 'Target and scope',
    icon: FlaskConical
  },
  {
    id: 4,
    title: 'Success Criteria',
    description: 'Success metrics',
    icon: FlaskConical
  },
  {
    id: 5,
    title: 'Review',
    description: 'Final review',
    icon: FlaskConical
  }
]

export function FormExperimentation({ isOpen, onClose }: FormExperimentationProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  const {
    currentStep,
    formData,
    updateFormData,
    handleNext,
    handlePrevious,
    isLastStep,
    isFirstStep,
  } = useFormExperimentation()

  const handleClose = () => {
    onClose()
  }

  const handleSubmitWithConfetti = async () => {
    try {
      // Déclencher les confettis
      setShowConfetti(true)
      
      // Afficher le message de succès
      setShowSuccessMessage(true)
      
      // Créer le record dans Airtable
      await createExperimentationRecord(formData)
      
      // Fermer la modale après un délai
      setTimeout(() => {
        setShowConfetti(false)
        setShowSuccessMessage(false)
        onClose()
      }, 3000)
    } catch (error) {
      console.error('Erreur lors de la création de l\'expérimentation:', error)
      // Gérer l'erreur si nécessaire
    }
  }

  const handleStepClick = (stepId: number) => {
    // TODO: Implement step navigation
    console.log('Navigate to step:', stepId)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="!w-[95vw] !max-w-[900px] !h-[85vh] !max-h-[700px] !p-0 overflow-hidden flex" 
        style={{
          width: '95vw',
          maxWidth: '900px',
          height: '85vh',
          maxHeight: '700px'
        }}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">New Experimentation</DialogTitle>
        
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 left-4 z-50 p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            >
          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>

        {/* Left Sidebar - Timeline */}
        <FormSidebar 
          steps={FORM_STEPS}
            currentStep={currentStep}
          onStepClick={handleStepClick}
        />

        {/* Right Content */}
        {showSuccessMessage ? (
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="flex-1 p-6 lg:p-8 pt-12 lg:pt-16 flex items-center justify-center">
              <div className="bg-white border border-green-200 rounded-lg shadow-lg p-6 max-w-md mx-4 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Experimentation created!</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Your experimentation has been successfully created and has joined the backlog pending prioritization.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <FormContent 
            currentStep={currentStep}
            formData={formData}
            updateFormData={updateFormData}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSubmit={handleSubmitWithConfetti}
          />
        )}
      </DialogContent>

      {/* Confetti Animation */}
      <Confetti 
        isActive={showConfetti} 
        onComplete={() => setShowConfetti(false)}
      />
    </Dialog>
  )
} 