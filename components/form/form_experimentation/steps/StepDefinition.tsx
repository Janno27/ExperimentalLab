'use client'

import { useExperimentation } from '@/hooks/useExperimentation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { cn } from '@/lib/utils'

interface StepDefinitionProps {
  formData: {
    shortName: string
    type: string
    hypothesis: string
    context: string
    description: string
    control: File | null
    variation1: File | null
  }
  updateFormData: (field: string, value: unknown) => void
}

export function StepDefinition({ formData, updateFormData }: StepDefinitionProps) {
  const { types = [] } = useExperimentation({ 
    useAirtable: true, 
    timelineMode: false 
  })

  const handleFileUpload = (field: string, file: File | null) => {
    updateFormData(field, file)
  }

  return (
    <div className="space-y-4">
      <div className="text-left mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Definition</h2>
        <p className="text-gray-600 mt-1 text-sm">Define the details and context of your experimentation</p>
      </div>

      <div className="space-y-4">
        {/* Short Name */}
        <div className="space-y-1">
          <Label htmlFor="shortName" className="text-xs font-medium">Short Name</Label>
          <Input
            id="shortName"
            value={formData.shortName || ''}
            onChange={(e) => updateFormData('shortName', e.target.value)}
            placeholder="Enter a short name for your experimentation"
            className="h-8 text-xs"
          />
        </div>

        {/* Type */}
        <div className="space-y-1">
          <Label className="text-xs font-medium">Type</Label>
          <div className="flex flex-wrap gap-1">
            {types.map((type) => {
              const selected = formData.type === type.id
              return (
                <button
                  key={type.id}
                  onClick={() => updateFormData('type', selected ? '' : type.id)}
                  className={cn(
                    "px-2 py-1 text-xs rounded border transition-colors cursor-pointer",
                    selected 
                      ? 'bg-purple-100 text-purple-700 border-purple-200' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  {type.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Hypothesis */}
        <div className="space-y-1">
          <Label htmlFor="hypothesis" className="text-xs font-medium">Hypothesis</Label>
          <Textarea
            id="hypothesis"
            value={formData.hypothesis || ''}
            onChange={(e) => updateFormData('hypothesis', e.target.value)}
            placeholder="What do you expect to happen?"
            className="min-h-[60px] resize-none text-xs"
          />
        </div>

        {/* Context */}
        <div className="space-y-1">
          <Label htmlFor="context" className="text-xs font-medium">Context</Label>
          <Textarea
            id="context"
            value={formData.context || ''}
            onChange={(e) => updateFormData('context', e.target.value)}
            placeholder="Provide context for this experimentation"
            className="min-h-[60px] resize-none text-xs"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <Label htmlFor="description" className="text-xs font-medium">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => updateFormData('description', e.target.value)}
            placeholder="Describe your experimentation in detail"
            className="min-h-[80px] resize-none text-xs"
          />
        </div>

        {/* Control et Variation 1 sur la même ligne */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Control</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('control', e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {formData.control ? (
                <div className="text-xs text-green-600">
                  ✓ {formData.control.name}
                </div>
              ) : (
                <p className="text-gray-500 text-xs">Click to upload image</p>
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs font-medium">Variation 1</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('variation1', e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {formData.variation1 ? (
                <div className="text-xs text-green-600">
                  ✓ {formData.variation1.name}
                </div>
              ) : (
                <p className="text-gray-500 text-xs">Click to upload image</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 