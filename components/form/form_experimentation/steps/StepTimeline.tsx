'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon, Play } from 'lucide-react'
import { ABTestCalculator } from '@/components/calculator/calculator'
import { useAuth } from '@/hooks/useAuth'
import { estimateABTestDuration, type ABTestResult } from '@/lib/ab-test-calculator'

interface StepTimelineProps {
  formData: {
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
  }
  updateFormData: (field: string, value: unknown) => void
}

// Composant Slider personnalisé
function Slider({ 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1, 
  className = '' 
}: { 
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <span className="text-xs font-medium text-gray-700 min-w-[3rem] text-right">
        {value}%
      </span>
    </div>
  )
}

// Composant DatePicker avec sélection de jour
function DatePicker({ 
  value, 
  onChange 
}: { 
  value: string
  onChange: (date: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())

  const selectedDate = value ? new Date(value) : new Date()

  const handleSelect = (year: number, month: number, day: number) => {
    const newDate = new Date(year, month, day, 12, 0, 0) // Ajouter midi pour éviter les problèmes de timezone
    onChange(newDate.toISOString().split('T')[0])
    setIsOpen(false)
  }



  const isSelectedDate = (year: number, month: number, day: number) => {
    return year === selectedDate.getFullYear() && 
           month === selectedDate.getMonth() && 
           day === selectedDate.getDate()
  }

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const months = [
    { name: 'Jan', value: 0 }, { name: 'Feb', value: 1 }, { name: 'Mar', value: 2 },
    { name: 'Apr', value: 3 }, { name: 'May', value: 4 }, { name: 'Jun', value: 5 },
    { name: 'Jul', value: 6 }, { name: 'Aug', value: 7 }, { name: 'Sep', value: 8 },
    { name: 'Oct', value: 9 }, { name: 'Nov', value: 10 }, { name: 'Dec', value: 11 }
  ]

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const days = []

    // Ajouter les jours vides au début
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-6"></div>)
    }

    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <button
          key={day}
          onClick={() => handleSelect(currentYear, currentMonth, day)}
          className={`h-6 w-6 text-xs rounded transition-colors ${
            isSelectedDate(currentYear, currentMonth, day)
              ? 'bg-purple-50 text-purple-700'
              : 'hover:bg-gray-50 text-gray-600'
          }`}
        >
          {day}
        </button>
      )
    }

    return days
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-6 text-xs border border-gray-300 rounded-md px-2 text-left bg-white hover:bg-gray-50 transition-colors cursor-pointer"
      >
        {value ? selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Select date'}
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-56">
          {/* Navigation année */}
          <div className="flex items-center justify-between p-2 border-b">
            <button 
              className="p-1 rounded hover:bg-gray-50 transition-colors" 
              onClick={() => setCurrentYear(currentYear - 1)}
            >
              <ChevronLeft className="w-3 h-3 text-gray-500" />
            </button>
            <div className="text-sm font-medium text-gray-700">{currentYear}</div>
            <button 
              className="p-1 rounded hover:bg-gray-50 transition-colors" 
              onClick={() => setCurrentYear(currentYear + 1)}
            >
              <ChevronRight className="w-3 h-3 text-gray-500" />
            </button>
          </div>
          
          {/* Navigation mois */}
          <div className="flex items-center justify-between p-2 border-b">
            <button 
              className="p-1 rounded hover:bg-gray-50 transition-colors" 
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11)
                  setCurrentYear(currentYear - 1)
                } else {
                  setCurrentMonth(currentMonth - 1)
                }
              }}
            >
              <ChevronLeft className="w-3 h-3 text-gray-500" />
            </button>
            <div className="text-sm font-medium text-gray-700">{months[currentMonth].name}</div>
            <button 
              className="p-1 rounded hover:bg-gray-50 transition-colors" 
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0)
                  setCurrentYear(currentYear + 1)
                } else {
                  setCurrentMonth(currentMonth + 1)
                }
              }}
            >
              <ChevronRight className="w-3 h-3 text-gray-500" />
            </button>
          </div>
          
          {/* Calendrier */}
          <div className="p-2">
            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {daysOfWeek.map(day => (
                <div key={day} className="h-6 text-xs text-gray-500 text-center flex items-center justify-center">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Grille des jours */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function StepTimeline({ formData, updateFormData }: StepTimelineProps) {

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [calculatorPosition, setCalculatorPosition] = useState({ x: 0, y: 0 })
  const [estimationResult, setEstimationResult] = useState<ABTestResult | null>(null)

  // Calcul automatique du conversion rate
  useEffect(() => {
    if (formData.audience && formData.conversion) {
      const audience = parseFloat(formData.audience)
      const conversion = parseFloat(formData.conversion)
      if (audience > 0) {
        const rate = ((conversion / audience) * 100).toFixed(2)
        updateFormData('conversionRate', rate)
      }
    }
  }, [formData.audience, formData.conversion, updateFormData])

  // Initialiser Traffic Allocation à 100% et Statistical Confidence à 85% si vides
  useEffect(() => {
    if (!formData.trafficAllocation) {
      updateFormData('trafficAllocation', '100')
    }
    if (!formData.statisticalConfidence) {
      updateFormData('statisticalConfidence', '85')
    }
  }, [formData.trafficAllocation, formData.statisticalConfidence, updateFormData])

  // Calcul du conversion rate cible basé sur MDE (uplift relatif)
  const getTargetConversionRate = () => {
    if (!formData.conversionRate || !formData.mde) return null
    
    const currentRate = parseFloat(formData.conversionRate)
    const mdeValue = formData.mde === 'custom' ? 
      parseFloat(formData.mdeCustom?.replace(/[^0-9.]/g, '') || '0') :
      parseFloat(formData.mde.replace(/[^0-9.]/g, '') || '0')
    
    if (isNaN(currentRate) || isNaN(mdeValue)) return null
    
    // Calcul de l'uplift relatif : currentRate * (1 + mdeValue/100)
    const targetRate = currentRate * (1 + mdeValue / 100)
    return targetRate.toFixed(2)
  }

  // Calculer l'estimation en jours entre Expected Launch et End Date
  const getEstimatedDays = () => {
    if (!formData.expectedLaunch || !formData.endDate) return null
    
    const startDate = new Date(formData.expectedLaunch)
    const endDate = new Date(formData.endDate)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleCalculatorClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCalculatorPosition({ x: e.clientX, y: e.clientY })
    setIsCalculatorOpen(true)
  }

  const handleRunEstimation = () => {
    if (!formData.audience || !formData.conversion || !formData.mde || !formData.trafficAllocation) {
      return
    }

    const audiencePerDay = parseFloat(formData.audience)
    const conversionsPerDay = parseFloat(formData.conversion)
    const mdeValue = formData.mde === 'custom' ? 
      parseFloat(formData.mdeCustom?.replace(/[^0-9.]/g, '') || '0') / 100 :
      parseFloat(formData.mde.replace(/[^0-9.]/g, '') || '0') / 100
    const trafficExposed = parseFloat(formData.trafficAllocation) / 100
    const alpha = 1 - (parseFloat(formData.statisticalConfidence) / 100)
    const power = parseFloat(formData.power || '80') / 100

    try {
      const result = estimateABTestDuration({
        audiencePerDay,
        conversionsPerDay,
        mde: mdeValue,
        trafficExposed,
        alpha,
        power
      })

      setEstimationResult(result)

      // Mettre à jour la durée estimée dans le formulaire
      if (formData.expectedLaunch) {
        const startDate = new Date(formData.expectedLaunch)
        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + result.durationDays)
        updateFormData('endDate', endDate.toISOString().split('T')[0])
      }
    } catch (error) {
      console.error('Erreur lors du calcul:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-left mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
              <p className="text-gray-600 mt-1 text-sm">Define the timeline and statistical parameters for your experimentation</p>
            </div>
            <button
              onClick={handleCalculatorClick}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 transition-colors cursor-pointer group"
            >
              <span>Calculator</span>
              <ChevronRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Audience | Conversion */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="audience" className="text-xs font-medium">Audience *</Label>
            <Input
              id="audience"
              value={formData.audience || ''}
              onChange={(e) => updateFormData('audience', e.target.value)}
              placeholder="e.g. 1000"
              className="h-9 text-sm"
            />
            {/* Conversion Rate affiché conditionnellement */}
            {formData.audience && formData.conversion && formData.conversionRate && (
              <div className="text-xs text-gray-500">
                Conversion Rate: {formData.conversionRate}%
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversion" className="text-xs font-medium">Conversion *</Label>
            <Input
              id="conversion"
              value={formData.conversion || ''}
              onChange={(e) => updateFormData('conversion', e.target.value)}
              placeholder="e.g. 100"
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* MDE | Traffic Allocation sur la même ligne */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-xs font-medium">Minimum Detectable Effect *</Label>
            <div className="flex gap-2">
              <Select 
                value={formData.mde || ''} 
                onValueChange={(value) => {
                  updateFormData('mde', value)
                  if (value !== 'custom') {
                    updateFormData('mdeCustom', '')
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs cursor-pointer flex-1">
                  <SelectValue placeholder="Select MDE" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+ 1%" className="cursor-pointer text-xs">+ 1%</SelectItem>
                  <SelectItem value="+ 2%" className="cursor-pointer text-xs">+ 2%</SelectItem>
                  <SelectItem value="+ 3%" className="cursor-pointer text-xs">+ 3%</SelectItem>
                  <SelectItem value="+ 4%" className="cursor-pointer text-xs">+ 4%</SelectItem>
                  <SelectItem value="+ 5%" className="cursor-pointer text-xs">+ 5%</SelectItem>
                  <SelectItem value="+ 6%" className="cursor-pointer text-xs">+ 6%</SelectItem>
                  <SelectItem value="+ 7%" className="cursor-pointer text-xs">+ 7%</SelectItem>
                  <SelectItem value="+ 8%" className="cursor-pointer text-xs">+ 8%</SelectItem>
                  <SelectItem value="+ 9%" className="cursor-pointer text-xs">+ 9%</SelectItem>
                  <SelectItem value="+ 10%" className="cursor-pointer text-xs">+ 10%</SelectItem>
                  <SelectItem value="custom" className="cursor-pointer text-xs">Custom</SelectItem>
                </SelectContent>
              </Select>
              
              {formData.mde === 'custom' && (
                <Input
                  value={formData.mdeCustom || ''}
                  onChange={(e) => updateFormData('mdeCustom', e.target.value)}
                  placeholder="e.g., + 15%"
                  className="h-8 text-xs flex-1"
                />
              )}
            </div>
            {/* Conversion Rate Target */}
            {getTargetConversionRate() && (
              <div className="text-xs text-gray-500">
                Target Conversion Rate: {getTargetConversionRate()}%
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium">Traffic Allocation *</Label>
            <Slider
              value={parseInt(formData.trafficAllocation) || 100}
              onChange={(value) => updateFormData('trafficAllocation', value.toString())}
              min={0}
              max={100}
              step={5}
            />
          </div>
        </div>

        {/* Timeline avec DatePickers */}
        <div className="space-y-4">
          {/* Timeline avec estimation en jours */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Expected Launch</span>
            </div>
            <div className="flex-1 h-px bg-gray-200 relative">
              {formData.expectedLaunch && formData.endDate && getEstimatedDays() && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-[10px] text-gray-500">{getEstimatedDays()}d</div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">End Date</span>
            </div>
          </div>

          {/* DatePickers sous la timeline */}
          <div className="grid grid-cols-2 gap-6">
            <DatePicker
              value={formData.expectedLaunch || ''}
              onChange={(date) => updateFormData('expectedLaunch', date)}
            />
            <DatePicker
              value={formData.endDate || ''}
              onChange={(date) => updateFormData('endDate', date)}
            />
          </div>

          {/* CTA Run Estimation */}
          <div className="flex justify-center">
            <button
              onClick={handleRunEstimation}
              disabled={!formData.audience || !formData.conversion || !formData.mde || !formData.trafficAllocation}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-purple-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-3 h-3" />
              <span>Run Estimation</span>
            </button>
          </div>

          {/* Résultats de l'estimation */}
          {estimationResult && (
            <div className="text-xs text-gray-600 space-y-1">
              <div>Estimated Duration: {estimationResult.durationDays} days</div>
              <div>Sample per Group: {estimationResult.samplePerGroup.toLocaleString()}</div>
              <div>Total Sample: {estimationResult.totalSample.toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* Advanced Dropdown */}
        <div className="space-y-3">
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Advanced
            {isAdvancedOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
          
          {isAdvancedOpen && (
            <div className="pl-4 space-y-3">
              <div className="space-y-3">
                <Label className="text-xs font-medium">Statistical Confidence *</Label>
                <Slider
                  value={parseInt(formData.statisticalConfidence) || 85}
                  onChange={(value) => updateFormData('statisticalConfidence', value.toString())}
                  min={80}
                  max={99}
                  step={5}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-medium">Power *</Label>
                <Slider
                  value={parseInt(formData.power) || 80}
                  onChange={(value) => updateFormData('power', value.toString())}
                  min={70}
                  max={95}
                  step={5}
                />
              </div>
            </div>
          )}
        </div>


      </div>

      {/* Calculator Modal */}
      <ABTestCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        triggerPosition={calculatorPosition}
      />

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none !important;
          height: 16px !important;
          width: 16px !important;
          border-radius: 50% !important;
          background: #8b5cf6 !important;
          cursor: pointer !important;
          border: none !important;
        }
        .slider::-moz-range-thumb {
          height: 16px !important;
          width: 16px !important;
          border-radius: 50% !important;
          background: #8b5cf6 !important;
          cursor: pointer !important;
          border: none !important;
        }
        .slider::-webkit-slider-track {
          background: #e5e7eb !important;
          border-radius: 8px !important;
          height: 8px !important;
        }
        .slider::-moz-range-track {
          background: #e5e7eb !important;
          border-radius: 8px !important;
          height: 8px !important;
          border: none !important;
        }
      `}</style>
    </div>
  )
} 