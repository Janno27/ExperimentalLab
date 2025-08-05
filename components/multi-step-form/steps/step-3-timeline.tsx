import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormDataProps } from "@/hooks/use-form-data"

export function Step3Timeline({ formData, updateFormData }: FormDataProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="startDate" className="text-sm font-medium text-gray-300">
            Start Date
          </Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('startDate', e.target.value)}
            className="bg-zinc-800 border-gray-700 text-white focus:border-gray-600 focus:ring-gray-600"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="timeDuration" className="text-sm font-medium text-gray-300">
            Time Duration
          </Label>
          <Select value={formData.timeDuration} onValueChange={(value: string) => updateFormData('timeDuration', value)}>
            <SelectTrigger className="bg-zinc-800 border-gray-700 text-white focus:border-gray-600 focus:ring-gray-600">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="1-week" className="text-white hover:bg-gray-700">1 Week</SelectItem>
              <SelectItem value="2-weeks" className="text-white hover:bg-gray-700">2 Weeks</SelectItem>
              <SelectItem value="1-month" className="text-white hover:bg-gray-700">1 Month</SelectItem>
              <SelectItem value="2-months" className="text-white hover:bg-gray-700">2 Months</SelectItem>
              <SelectItem value="3-months" className="text-white hover:bg-gray-700">3 Months</SelectItem>
              <SelectItem value="custom" className="text-white hover:bg-gray-700">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
} 