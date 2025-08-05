"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NavigationButtons } from "@/components/ui/navigation-buttons"
import { Step1Initializing } from "./steps/step-1-initializing"
import { Step2Defining } from "./steps/step-2-defining"
import { Step3Timeline } from "./steps/step-3-timeline"
import { useFormData } from "@/hooks/use-form-data"
import { AnimatePresence, motion } from "framer-motion"

const steps = [
  { id: 1, name: "INITIALIZING", description: "Basic project information" },
  { id: 2, name: "DEFINING", description: "Project details and specifications" },
  { id: 3, name: "TIMELINE", description: "Project timeline and duration" }
]

export function MultiStepForm({ isOpen: isOpenProp, setIsOpen: setIsOpenProp }: { isOpen?: boolean, setIsOpen?: (open: boolean) => void } = {}) {
  const [isOpenState, setIsOpenState] = useState(false)
  const isOpen = isOpenProp !== undefined ? isOpenProp : isOpenState
  const setIsOpen = setIsOpenProp !== undefined ? setIsOpenProp : setIsOpenState
  const [currentStep, setCurrentStep] = useState(1)
  const { formData, updateFormData, resetFormData } = useFormData()

  // Keyboard shortcut to open modal (Ctrl/Cmd + Shift + N)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'N') {
        event.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setIsOpen])

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    console.log("Form submitted:", formData)
    setIsOpen(false)
    setCurrentStep(1)
    resetFormData()
  }

  const handleClose = () => {
    setIsOpen(false)
    setCurrentStep(1)
    resetFormData()
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Initializing formData={formData} updateFormData={updateFormData} />
      case 2:
        return <Step2Defining formData={formData} updateFormData={updateFormData} />
      case 3:
        return <Step3Timeline formData={formData} updateFormData={updateFormData} />
      default:
        return <Step1Initializing formData={formData} updateFormData={updateFormData} />
    }
  }

  const currentStepData = steps.find(step => step.id === currentStep)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-zinc-900 border-gray-800 text-white">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-light text-white">
            {currentStepData?.name
              ? currentStepData.name.charAt(0).toUpperCase() + currentStepData.name.slice(1).toLowerCase()
              : "Projet"}
          </DialogTitle>
        </DialogHeader>

        {/* Form content avec transition Framer Motion */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {renderCurrentStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons with integrated step indicators */}
        <NavigationButtons
          currentStep={currentStep}
          totalSteps={steps.length}
          steps={steps}
          onPrevious={prevStep}
          onNext={nextStep}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  )
} 