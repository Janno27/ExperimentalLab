import { useState } from "react"

export interface FormData {
  // Step 1: INITIALIZING
  role: string
  owner: string
  market: string
  scope: string
  tool: string

  // Step 2: DEFINING
  shortName: string
  type: string
  hypothesis: string
  control: File | null
  target: File | null
  description: string
  mainKpi: string
  devices: string[]
  pages: string[]
  product: string

  // Step 3: TIMELINE
  startDate: string
  timeDuration: string
}

export interface FormDataProps {
  formData: FormData
  updateFormData: (field: keyof FormData, value: any) => void
}

const initialFormData: FormData = {
  role: "",
  owner: "",
  market: "",
  scope: "",
  tool: "",
  shortName: "",
  type: "",
  hypothesis: "",
  control: null,
  target: null,
  description: "",
  mainKpi: "",
  devices: [],
  pages: [],
  product: "",
  startDate: "",
  timeDuration: ""
}

export function useFormData() {
  const [formData, setFormData] = useState<FormData>(initialFormData)

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetFormData = () => {
    setFormData(initialFormData)
  }

  return {
    formData,
    updateFormData,
    resetFormData
  }
} 