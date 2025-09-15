'use client'

import { useState } from 'react'
import { useDraggable } from '@/hooks'
import { GenieAnimation } from '@/components/ui'
import { Calculator, X, Settings, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DurationEstimator } from '@/components/ui/duration-estimator'

interface CalculatorProps {
  isOpen: boolean
  onClose: () => void
  triggerPosition: { x: number; y: number }
}

export function ABTestCalculator({ isOpen, onClose, triggerPosition }: CalculatorProps) {
  const [activeTab, setActiveTab] = useState('conversion-rate')
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [formData, setFormData] = useState({
    audience: '',
    conversion: '',
    mde: '',
    mdeCustom: '',
    trafficAllocation: '100',
    statisticalConfidence: '85',
    power: '80'
  })
  
  // Utilisation du hook useDraggable avec position initiale sécurisée
  const { position, isDragging, dragRef, handleMouseDown } = useDraggable({
    initialPosition: { x: 0, y: 20 }, // Position par défaut sécurisée
    windowSize: { width: 420, height: 600 },
    isOpen
  })

  const handleClose = () => {
    // Déclencher l'animation de sortie en fermant d'abord
    onClose()
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Calcul du conversion rate automatique
  const conversionRate = formData.audience && formData.conversion ? 
    ((parseFloat(formData.conversion) / parseFloat(formData.audience)) * 100).toFixed(2) : ''

  // Calcul de la conversion rate target basé sur MDE
  const getTargetConversionRate = () => {
    if (!conversionRate || !formData.mde) return null
    
    const currentRate = parseFloat(conversionRate)
    const mdeValue = formData.mde === 'custom' ? 
      parseFloat(formData.mdeCustom?.replace(/[^0-9.]/g, '') || '0') :
      parseFloat(formData.mde.replace(/[^0-9.]/g, '') || '0')
    
    if (isNaN(currentRate) || isNaN(mdeValue)) return null
    
    // Calcul de l'uplift relatif : currentRate * (1 + mdeValue/100)
    const targetRate = currentRate * (1 + mdeValue / 100)
    return targetRate.toFixed(2)
  }

  if (!isOpen) return null;

  return (
    <GenieAnimation
      isOpen={isOpen}
      onClose={onClose}
      triggerPosition={triggerPosition}
    >
      <div
        ref={dragRef}
        className={`w-[420px] h-[600px] bg-gray-100 shadow-xs border border-gray-300 rounded-md pointer-events-auto flex flex-col select-none draggable-element ${isDragging ? 'dragging' : ''}`}
        style={{
          cursor: isDragging ? 'grabbing' : 'default',
          position: 'absolute',
          left: position.x,
          top: position.y,
          zIndex: 1000,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Header - Zone de drag */}
        <div
          className="flex items-center justify-between p-2 border-b border-gray-300 bg-gray-200 rounded-t-md drag-handle"
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-3 h-3 text-gray-500" />
            <h2 className="text-[11px] font-medium text-gray-900">A/B Test Calculator</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Tabs personnalisés comme dans TimelineControls */}
        <div className="p-3 bg-gray-100">
          <div className="flex justify-center">
            <div className="flex items-center gap-0.5 bg-gray-200 rounded-2xl p-0.5">
              <Button
                variant={activeTab === 'conversion-rate' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('conversion-rate')}
                className={`rounded-xl text-[11px] h-6 px-2 cursor-pointer ${activeTab !== 'conversion-rate' ? 'hover:bg-gray-100' : ''}`}
              >
                Conversion Rate
              </Button>
              <Button
                variant={activeTab === 'revenue' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('revenue')}
                className={`rounded-xl text-[11px] h-6 px-2 cursor-pointer ${activeTab !== 'revenue' ? 'hover:bg-gray-100' : ''}`}
              >
                Revenue
              </Button>
            </div>
          </div>
        </div>

        {/* Contenu des tabs */}
        <div className="flex-1 overflow-y-auto no-drag bg-gray-100 rounded-b-md" onMouseDown={(e) => e.stopPropagation()}>
          <div className="p-4 space-y-4">
            {activeTab === 'conversion-rate' ? (
              <>
                {/* Audience | Conversion */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="audience" className="text-xs font-medium">Audience *</Label>
                    <Input
                      id="audience"
                      type="number"
                      placeholder="e.g. 1000"
                      value={formData.audience}
                      onChange={(e) => updateFormData('audience', e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="h-8 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200 hover:border-primary/60 hover:bg-accent/50 focus-visible:ring-violet-500/30"
                    />
                    {conversionRate && (
                      <div className="text-[10px] text-gray-500">
                        Conversion Rate: {conversionRate}%
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conversion" className="text-xs font-medium">Conversion *</Label>
                    <Input
                      id="conversion"
                      type="number"
                      placeholder="e.g. 100"
                      value={formData.conversion}
                      onChange={(e) => updateFormData('conversion', e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="h-8 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200 hover:border-primary/60 hover:bg-accent/50 focus-visible:ring-violet-500/30"
                    />
                  </div>
                </div>

                {/* MDE */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Minimum Detectable Effect *</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={formData.mde} 
                      onValueChange={(value) => {
                        updateFormData('mde', value)
                        if (value !== 'custom') {
                          updateFormData('mdeCustom', '')
                        }
                      }}
                    >
                      <SelectTrigger 
                        className="h-8 text-xs rounded-xl cursor-pointer flex-1 bg-white"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue placeholder="Select MDE" />
                      </SelectTrigger>
                      <SelectContent 
                        className="z-[9999]"
                        onCloseAutoFocus={(e) => e.preventDefault()}
                      >
                        <SelectItem value="+ 1%" className="cursor-pointer text-xs">+ 1%</SelectItem>
                        <SelectItem value="+ 2%" className="cursor-pointer text-xs">+ 2%</SelectItem>
                        <SelectItem value="+ 3%" className="cursor-pointer text-xs">+ 3%</SelectItem>
                        <SelectItem value="+ 5%" className="cursor-pointer text-xs">+ 5%</SelectItem>
                        <SelectItem value="+ 10%" className="cursor-pointer text-xs">+ 10%</SelectItem>
                        <SelectItem value="custom" className="cursor-pointer text-xs">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {formData.mde === 'custom' && (
                      <Input
                        value={formData.mdeCustom}
                        onChange={(e) => updateFormData('mdeCustom', e.target.value)}
                        placeholder="e.g., + 15%"
                        onMouseDown={(e) => e.stopPropagation()}
                        className="h-9 text-xs rounded-xl flex-1 bg-white"
                      />
                    )}
                  </div>
                  {/* Target Conversion Rate */}
                  {getTargetConversionRate() && (
                    <div className="text-[10px] text-gray-500">
                      Target Conversion Rate: {getTargetConversionRate()}%
                    </div>
                  )}
                </div>

                {/* Traffic Allocation */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Traffic Allocation</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={parseInt(formData.trafficAllocation) || 100}
                      onChange={(e) => updateFormData('trafficAllocation', e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="flex-1 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-xs font-medium text-gray-700 min-w-[3rem] text-right">
                      {formData.trafficAllocation}%
                    </span>
                  </div>
                </div>

                {/* Advanced Dropdown */}
                <div className="space-y-2">
                  <button
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-[10px] font-normal text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    <Settings className="w-2.5 h-2.5" />
                    Advanced
                    {isAdvancedOpen ? (
                      <ChevronDown className="w-2.5 h-2.5" />
                    ) : (
                      <ChevronRight className="w-2.5 h-2.5" />
                    )}
                  </button>
                  
                  {isAdvancedOpen && (
                    <div className="pl-4 space-y-3">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-normal text-gray-500">Statistical Confidence *</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="80"
                            max="99"
                            step="5"
                            value={parseInt(formData.statisticalConfidence) || 85}
                            onChange={(e) => updateFormData('statisticalConfidence', e.target.value)}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="flex-1 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <span className="text-[10px] font-normal text-gray-500 min-w-[3rem] text-right">
                            {formData.statisticalConfidence}%
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-normal text-gray-500">Power *</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="70"
                            max="95"
                            step="5"
                            value={parseInt(formData.power) || 80}
                            onChange={(e) => updateFormData('power', e.target.value)}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="flex-1 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <span className="text-[10px] font-normal text-gray-500 min-w-[3rem] text-right">
                            {formData.power}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Duration Estimator */}
                <div className="pt-3 border-t border-gray-100">
                  <DurationEstimator
                    audience={formData.audience}
                    conversion={formData.conversion}
                    mde={formData.mde}
                    mdeCustom={formData.mdeCustom}
                    trafficAllocation={formData.trafficAllocation}
                    statisticalConfidence={formData.statisticalConfidence}
                    power={formData.power}
                    size="sm"
                  />
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-xs">Revenue calculator coming soon...</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .no-drag {
          pointer-events: auto !important;
        }
        .no-drag * {
          pointer-events: auto !important;
        }
        .slider::-webkit-slider-thumb {
          appearance: none !important;
          height: 14px !important;
          width: 14px !important;
          border-radius: 50% !important;
          background: #8b5cf6 !important;
          cursor: pointer !important;
          border: none !important;
        }
        .slider::-moz-range-thumb {
          height: 14px !important;
          width: 14px !important;
          border-radius: 50% !important;
          background: #8b5cf6 !important;
          cursor: pointer !important;
          border: none !important;
        }
        .slider::-webkit-slider-track {
          background: #e5e7eb !important;
          border-radius: 6px !important;
          height: 6px !important;
        }
        .slider::-moz-range-track {
          background: #e5e7eb !important;
          border-radius: 6px !important;
          height: 6px !important;
          border: none !important;
        }
      `}</style>
    </GenieAnimation>
  )
} 