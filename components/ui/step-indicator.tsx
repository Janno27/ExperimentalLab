interface Step {
  id: number
  name: string
  description: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex justify-center space-x-2">
      {steps.map((step) => (
        <div
          key={step.id}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            step.id === currentStep
              ? 'bg-purple-500 scale-110' 
              : step.id < currentStep
              ? 'bg-purple-300'
              : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  )
} 