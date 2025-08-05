import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Upload, Plus } from "lucide-react"
import { FormDataProps } from "@/hooks/use-form-data"

export function Step2Defining({ formData, updateFormData }: FormDataProps) {
  const [newDevice, setNewDevice] = useState("")
  const [newPage, setNewPage] = useState("")

  const handleArrayChange = (field: 'devices' | 'pages', value: string) => {
    if (value.trim()) {
      updateFormData(field, [...formData[field], value.trim()])
    }
  }

  const removeArrayItem = (field: 'devices' | 'pages', index: number) => {
    updateFormData(field, formData[field].filter((_, i) => i !== index))
  }

  const handleFileUpload = (field: 'control' | 'target', file: File | null) => {
    updateFormData(field, file)
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="shortName" className="text-sm font-medium text-gray-300">
            Short Name
          </Label>
          <Input
            id="shortName"
            value={formData.shortName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('shortName', e.target.value)}
            placeholder="Project short name"
            className="bg-zinc-800 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600 focus:ring-gray-600"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="type" className="text-sm font-medium text-gray-300">
            Type
          </Label>
          <Select value={formData.type} onValueChange={(value: string) => updateFormData('type', value)}>
            <SelectTrigger className="bg-zinc-800 border-gray-700 text-white focus:border-gray-600 focus:ring-gray-600">
              <SelectValue placeholder="Select project type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="ab-test" className="text-white hover:bg-gray-700">A/B Test</SelectItem>
              <SelectItem value="feature-test" className="text-white hover:bg-gray-700">Feature Test</SelectItem>
              <SelectItem value="conversion-test" className="text-white hover:bg-gray-700">Conversion Test</SelectItem>
              <SelectItem value="other" className="text-white hover:bg-gray-700">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 md:col-span-2">
          <Label htmlFor="hypothesis" className="text-sm font-medium text-gray-300">
            Hypothesis
          </Label>
          <Textarea
            id="hypothesis"
            value={formData.hypothesis}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('hypothesis', e.target.value)}
            placeholder="What do you want to test?"
            rows={3}
            className="bg-zinc-800 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600 focus:ring-gray-600"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="control" className="text-sm font-medium text-gray-300">
            Control Image
          </Label>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
            <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
            <input
              type="file"
              id="control"
              accept="image/*"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload('control', e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="control" className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
              Click to upload
            </label>
            {formData.control && (
              <p className="text-xs text-green-400 mt-1">{formData.control.name}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="target" className="text-sm font-medium text-gray-300">
            Target Image
          </Label>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
            <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
            <input
              type="file"
              id="target"
              accept="image/*"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload('target', e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="target" className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
              Click to upload
            </label>
            {formData.target && (
              <p className="text-xs text-green-400 mt-1">{formData.target.name}</p>
            )}
          </div>
        </div>

        <div className="space-y-3 md:col-span-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-300">
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('description', e.target.value)}
            placeholder="Project description"
            rows={3}
            className="bg-zinc-800 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600 focus:ring-gray-600"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="mainKpi" className="text-sm font-medium text-gray-300">
            Main KPI
          </Label>
          <Input
            id="mainKpi"
            value={formData.mainKpi}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('mainKpi', e.target.value)}
            placeholder="Primary KPI"
            className="bg-zinc-800 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600 focus:ring-gray-600"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="product" className="text-sm font-medium text-gray-300">
            Product
          </Label>
          <Input
            id="product"
            value={formData.product}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('product', e.target.value)}
            placeholder="Product name"
            className="bg-zinc-800 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600 focus:ring-gray-600"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-300">Devices</Label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newDevice}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDevice(e.target.value)}
                placeholder="Add device"
                className="bg-zinc-800 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600 focus:ring-gray-600"
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    handleArrayChange('devices', newDevice)
                    setNewDevice("")
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  handleArrayChange('devices', newDevice)
                  setNewDevice("")
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.devices.map((device, index) => (
                <span
                  key={index}
                  className="bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2 text-white"
                >
                  {device}
                  <button
                    onClick={() => removeArrayItem('devices', index)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-300">Pages</Label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newPage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPage(e.target.value)}
                placeholder="Add page"
                className="bg-zinc-800 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600 focus:ring-gray-600"
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    handleArrayChange('pages', newPage)
                    setNewPage("")
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  handleArrayChange('pages', newPage)
                  setNewPage("")
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.pages.map((page, index) => (
                <span
                  key={index}
                  className="bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2 text-white"
                >
                  {page}
                  <button
                    onClick={() => removeArrayItem('pages', index)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 