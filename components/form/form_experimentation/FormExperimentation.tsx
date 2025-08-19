'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { X, FlaskConical } from 'lucide-react'
import { useFormExperimentation } from '@/hooks/useFormExperimentation'
import { FormSidebar, FormContent } from './components'

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
  const {
    currentStep,
    formData,
    updateFormData,
    handleNext,
    handlePrevious,
    handleSubmit,
    isLastStep,
    isFirstStep,
  } = useFormExperimentation()

  const handleClose = () => {
    onClose()
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
        <FormContent 
          currentStep={currentStep}
          formData={formData}
          updateFormData={updateFormData}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  )
} 