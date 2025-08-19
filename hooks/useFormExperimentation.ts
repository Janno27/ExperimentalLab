import { useState, useCallback } from 'react'

export interface FormData {
  // Properties
  role: string
  owner: string
  market: string
  scope: string
  tool: string
  testType: string[]
  
  // Definition
  shortName: string
  type: string
  hypothesis: string
  context: string
  description: string
  control: File | null
  variation1: File | null
  
  // Timeline
  audience: string
  conversion: string
  conversionRate: string
  mde: string
  mdeCustom: string
  trafficAllocation: string
  expectedLaunch: string
  endDate: string
  statisticalConfidence: string
  power: string
  
  // Audience
  devices: string
  page: string
  product: string
  mainKPI: string
  kpi2: string
  kpi3: string
  
  // Success Criteria
  successCriteria1: string
  successCriteria2: string
  successCriteria3: string
}

const STEPS = [
  { id: 0, name: 'Properties', description: 'Basic information' },
  { id: 1, name: 'Timeline', description: 'Dates and duration' },
  { id: 2, name: 'Description', description: 'Details and context' },
  { id: 3, name: 'Audience', description: 'Target and scope' },
  { id: 4, name: 'Data', description: 'Metrics and allocation' },
  { id: 5, name: 'Results', description: 'Outcomes and learnings' }
]

export function useFormExperimentation() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    // Properties
    role: '',
    owner: '',
    market: '',
    scope: '',
    tool: '',
    testType: [],
    
    // Definition
    shortName: '',
    type: '',
    hypothesis: '',
    context: '',
    description: '',
    control: null,
    variation1: null,
    
    // Timeline
    audience: '',
    conversion: '',
    conversionRate: '',
    mde: '',
    mdeCustom: '',
    trafficAllocation: '100',
    expectedLaunch: '',
    endDate: '',
    statisticalConfidence: '85',
    power: '80',
    
    // Audience
    devices: '',
    page: '',
    product: '',
    mainKPI: '',
    kpi2: '',
    kpi3: '',
    
    // Success Criteria
    successCriteria1: '',
    successCriteria2: '',
    successCriteria3: ''
  })

  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep])

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const handleSubmit = useCallback(() => {
    // TODO: Submit form data
    console.log('Form data:', formData)
  }, [formData])

  const resetForm = useCallback(() => {
    setCurrentStep(0)
    setFormData({
      role: '',
      owner: '',
      market: '',
      scope: '',
      tool: '',
      testType: [],
      shortName: '',
      type: '',
      hypothesis: '',
      context: '',
      description: '',
      control: null,
      variation1: null,
      audience: '',
      conversion: '',
      conversionRate: '',
      mde: '',
      mdeCustom: '',
      trafficAllocation: '100',
      expectedLaunch: '',
      endDate: '',
      statisticalConfidence: '85',
      power: '80',
      devices: '',
      page: '',
      product: '',
      mainKPI: '',
      kpi2: '',
      kpi3: '',
      successCriteria1: '',
      successCriteria2: '',
      successCriteria3: ''
    })
  }, [])

  const isLastStep = currentStep === STEPS.length - 1
  const isFirstStep = currentStep === 0

  return {
    currentStep,
    formData,
    updateFormData,
    handleNext,
    handlePrevious,
    handleSubmit,
    resetForm,
    isLastStep,
    isFirstStep,
    STEPS
  }
} 