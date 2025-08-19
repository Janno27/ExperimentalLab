'use client'

import { useExperimentation } from '@/hooks/useExperimentation'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface StepAudienceProps {
  formData: {
    devices: string
    page: string
    product: string
    mainKPI: string
    kpi2: string
    kpi3: string
  }
  updateFormData: (field: string, value: unknown) => void
}

export function StepAudience({ formData, updateFormData }: StepAudienceProps) {
  const { pages = [], products = [], kpis = [] } = useExperimentation({ 
    useAirtable: true, 
    timelineMode: false 
  })

  return (
    <div className="space-y-6">
      <div className="text-left mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Audience</h2>
        <p className="text-gray-600 mt-1 text-sm">Define the target audience and scope of your experimentation</p>
      </div>

      <div className="space-y-6">
        {/* Devices | Page | Product */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="devices" className="text-xs font-medium">Devices</Label>
            <Select value={formData.devices || ''} onValueChange={(value) => updateFormData('devices', value)}>
              <SelectTrigger className="h-7 text-xs cursor-pointer">
                <SelectValue placeholder="Select devices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desktop" className="cursor-pointer text-xs">Desktop</SelectItem>
                <SelectItem value="mobile" className="cursor-pointer text-xs">Mobile</SelectItem>
                <SelectItem value="tablet" className="cursor-pointer text-xs">Tablet</SelectItem>
                <SelectItem value="all" className="cursor-pointer text-xs">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="page" className="text-xs font-medium">Page</Label>
            <Select value={formData.page || ''} onValueChange={(value) => updateFormData('page', value)}>
              <SelectTrigger className="h-7 text-xs cursor-pointer">
                <SelectValue placeholder="Select page" />
              </SelectTrigger>
              <SelectContent>
                {pages.map((page) => (
                  <SelectItem key={page.id} value={page.id} className="cursor-pointer text-xs">
                    {page.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="product" className="text-xs font-medium">Product</Label>
            <Select value={formData.product || ''} onValueChange={(value) => updateFormData('product', value)}>
              <SelectTrigger className="h-7 text-xs cursor-pointer">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id} className="cursor-pointer text-xs">
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPIs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-200"></div>
            <Label className="text-xs font-medium text-gray-500">KPIs</Label>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Main KPI</Label>
              <Select value={formData.mainKPI || ''} onValueChange={(value) => updateFormData('mainKPI', value)}>
                <SelectTrigger className="h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Select Main KPI" />
                </SelectTrigger>
                <SelectContent>
                  {kpis.map((kpi) => (
                    <SelectItem key={kpi.id} value={kpi.id} className="cursor-pointer text-xs">
                      {kpi.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">KPI #2</Label>
              <Select value={formData.kpi2 || ''} onValueChange={(value) => updateFormData('kpi2', value)}>
                <SelectTrigger className="h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Select KPI #2" />
                </SelectTrigger>
                <SelectContent>
                  {kpis.map((kpi) => (
                    <SelectItem key={kpi.id} value={kpi.id} className="cursor-pointer text-xs">
                      {kpi.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">KPI #3</Label>
              <Select value={formData.kpi3 || ''} onValueChange={(value) => updateFormData('kpi3', value)}>
                <SelectTrigger className="h-8 text-xs cursor-pointer">
                  <SelectValue placeholder="Select KPI #3" />
                </SelectTrigger>
                <SelectContent>
                  {kpis.map((kpi) => (
                    <SelectItem key={kpi.id} value={kpi.id} className="cursor-pointer text-xs">
                      {kpi.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 