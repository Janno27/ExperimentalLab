import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Step {
  id: number
  name: string
  description: string
}

interface NavigationButtonsProps {
  currentStep: number
  totalSteps: number
  steps: Step[]
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
}

export function NavigationButtons({
  currentStep,
  totalSteps,
  steps,
  onPrevious,
  onNext,
  onSubmit
}: NavigationButtonsProps) {
  return (
    <div className="grid grid-cols-3 items-center mt-8">
      <div className="flex justify-start">
        <Button
          variant="ghost"
          onClick={onPrevious}
          disabled={currentStep === 1}
          className="text-gray-400 hover:text-white disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Dots au centre */}
      <div className="flex justify-center space-x-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentStep >= step.id 
                ? 'bg-white' 
                : 'bg-gray-600'
            }`}
          />
        ))}
      </div>

      <div className="flex justify-end">
        {currentStep < totalSteps ? (
          <Button 
            onClick={onNext}
            className="bg-white text-black hover:bg-gray-200 px-8"
          >
            Continue
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={onSubmit}
            className="bg-white text-black hover:bg-gray-200 px-8"
          >
            Create Project
          </Button>
        )}
      </div>
    </div>
  )
} 