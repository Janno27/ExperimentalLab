'use client'

import { useExperimentation } from '@/hooks/useExperimentation'
import { Label } from '@/components/ui/label'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ROLE_OPTIONS, TOOL_OPTIONS, SCOPE_OPTIONS } from '@/constants/form-options'
import { cn } from '@/lib/utils'

interface StepPropertiesProps {
  formData: {
    role: string
    owner: string
    market: string
    scope: string
    tool: string
    testType: string[]
  }
  updateFormData: (field: string, value: unknown) => void
}

export function StepProperties({ formData, updateFormData }: StepPropertiesProps) {
  const { markets = [], owners = [], kpis = [], pages = [], products = [], testTypes = [] } = useExperimentation({ 
    useAirtable: true, 
    timelineMode: false 
  })

  return (
    <div className="space-y-6">
      <div className="text-left mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
        <p className="text-gray-600 mt-1 text-sm">Define the basic information for your experimentation</p>
      </div>

      <div className="space-y-4">
        {/* Ligne 1: Role | Owner */}
        <div className="grid grid-cols-2 gap-4">
          {/* Role */}
          <div className="space-y-1">
            <Label htmlFor="role" className="text-xs font-medium">Role</Label>
            <Select value={formData.role} onValueChange={(value) => updateFormData('role', value)}>
              <SelectTrigger className="h-7 text-xs cursor-pointer">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role} className="cursor-pointer text-xs">
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Owner */}
          <div className="space-y-1">
            <Label htmlFor="owner" className="text-xs font-medium">Owner</Label>
            <Select value={formData.owner} onValueChange={(value) => updateFormData('owner', value)}>
              <SelectTrigger className="h-7 text-xs cursor-pointer">
                <SelectValue placeholder="Select an owner" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.name} className="cursor-pointer text-xs">
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ligne 2: Test Type | Scope */}
        <div className="grid grid-cols-2 gap-4">
          {/* Test Type */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Test Type</Label>
            <div className="max-h-20 overflow-y-auto border border-gray-200 rounded-md p-2">
              <div className="flex flex-wrap gap-1">
                {testTypes.slice(0, 5).map((type) => {
                  const selected = (formData.testType || []).includes(type.id)
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        const currentTypes = formData.testType || []
                        const newTypes = selected
                          ? currentTypes.filter(t => t !== type.id)
                          : [...currentTypes, type.id]
                        updateFormData('testType', newTypes)
                      }}
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
                {testTypes.length > 5 && (
                  <div className="text-xs text-gray-500 mt-1 w-full">
                    +{testTypes.length - 5} more options available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scope */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Scope</Label>
            <div className="flex flex-wrap gap-1">
              {SCOPE_OPTIONS.map((scope) => {
                const selected = formData.scope === scope
                return (
                  <button
                    key={scope}
                    onClick={() => updateFormData('scope', selected ? '' : scope)}
                    className={cn(
                      "px-2 py-1 text-xs rounded border transition-colors cursor-pointer",
                      selected 
                        ? 'bg-purple-100 text-purple-700 border-purple-200' 
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    {scope}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Ligne 3: Market | Tool */}
        <div className="grid grid-cols-2 gap-4">
          {/* Market */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Market</Label>
            <div className="flex flex-wrap gap-1">
              {markets.map((market) => {
                const selected = formData.market === market.id
                return (
                  <button
                    key={market.id}
                    onClick={() => updateFormData('market', selected ? '' : market.id)}
                    className={cn(
                      "px-2 py-1 text-xs rounded border transition-colors cursor-pointer",
                      selected 
                        ? 'bg-purple-100 text-purple-700 border-purple-200' 
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    {market.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tool */}
          <div className="space-y-1">
            <Label htmlFor="tool" className="text-xs font-medium">Tool</Label>
            <Select value={formData.tool} onValueChange={(value) => updateFormData('tool', value)}>
              <SelectTrigger className="h-7 text-xs cursor-pointer">
                <SelectValue placeholder="Select a tool" />
              </SelectTrigger>
              <SelectContent>
                {TOOL_OPTIONS.map((tool) => (
                  <SelectItem key={tool} value={tool} className="cursor-pointer text-xs">
                    {tool}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
} 