'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface StepSuccessCriteriaProps {
  formData: {
    successCriteria1: string
    successCriteria2: string
    successCriteria3: string
  }
  updateFormData: (field: string, value: unknown) => void
}

export function StepSuccessCriteria({ formData, updateFormData }: StepSuccessCriteriaProps) {
  return (
    <div className="space-y-4">
      <div className="text-left mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Success Criteria</h2>
        <p className="text-gray-600 mt-1 text-sm">Define the success criteria for your experimentation</p>
      </div>

      <div className="space-y-4">
        {/* Success Criteria 1 */}
        <div className="space-y-1">
          <Label htmlFor="successCriteria1" className="text-xs font-medium">Success Criteria #1 *</Label>
          <Textarea
            id="successCriteria1"
            value={formData.successCriteria1 || ''}
            onChange={(e) => updateFormData('successCriteria1', e.target.value)}
            placeholder="Example: Comparison Table Usage Rate increase by +10% relative (significant)"
            className="min-h-[60px] resize-none text-xs"
          />
        </div>

        {/* Success Criteria 2 */}
        <div className="space-y-1">
          <Label htmlFor="successCriteria2" className="text-xs font-medium">Success Criteria #2</Label>
          <Textarea
            id="successCriteria2"
            value={formData.successCriteria2 || ''}
            onChange={(e) => updateFormData('successCriteria2', e.target.value)}
            placeholder="Example: Product Finder Usage Rate expected to decrease due to lower position (monitored, not gated for success)"
            className="min-h-[60px] resize-none text-xs"
          />
        </div>

        {/* Success Criteria 3 */}
        <div className="space-y-1">
          <Label htmlFor="successCriteria3" className="text-xs font-medium">Success Criteria #3</Label>
          <Textarea
            id="successCriteria3"
            value={formData.successCriteria3 || ''}
            onChange={(e) => updateFormData('successCriteria3', e.target.value)}
            placeholder="Example: If Comparison Table Usage uplift is between +5% and +10%, requires: Positive or stable Transaction Rate"
            className="min-h-[60px] resize-none text-xs"
          />
        </div>
      </div>
    </div>
  )
} 