import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormDataProps } from "@/hooks/use-form-data"

export function Step1Initializing({ formData, updateFormData }: FormDataProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="role" className="text-sm font-medium text-gray-300">
              Role
            </Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('role', e.target.value)}
              placeholder="Enter your role"
              className="bg-zinc-800 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600 focus:ring-gray-600"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="owner" className="text-sm font-medium text-gray-300">
              Owner
            </Label>
            <Input
              id="owner"
              value={formData.owner}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('owner', e.target.value)}
              placeholder="Project owner"
              className="bg-zinc-800 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600 focus:ring-gray-600"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="market" className="text-sm font-medium text-gray-300">
              Market
            </Label>
            <Input
              id="market"
              value={formData.market}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('market', e.target.value)}
              placeholder="Target market"
              className="bg-zinc-800 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600 focus:ring-gray-600"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="scope" className="text-sm font-medium text-gray-300">
              Scope
            </Label>
            <Input
              id="scope"
              value={formData.scope}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('scope', e.target.value)}
              placeholder="Project scope"
              className="bg-zinc-800 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600 focus:ring-gray-600"
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label htmlFor="tool" className="text-sm font-medium text-gray-300">
              Tool
            </Label>
            <Input
              id="tool"
              value={formData.tool}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('tool', e.target.value)}
              placeholder="Primary tool or technology"
              className="bg-zinc-800 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600 focus:ring-gray-600"
            />
          </div>
        </div>
      </div>
    </div>
  )
} 