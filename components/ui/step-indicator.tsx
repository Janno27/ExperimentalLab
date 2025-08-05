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
    <div className="flex justify-center space-x-2 mt-8">
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
  )
} 