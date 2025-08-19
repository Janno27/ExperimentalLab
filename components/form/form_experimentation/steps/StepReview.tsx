'use client'

import { useState } from 'react'
import { useExperimentation } from '@/hooks/useExperimentation'
import { Label } from '@/components/ui/label'
import { ChevronDown, ChevronRight, Settings, FileText, Users, TrendingUp, CheckCircle } from 'lucide-react'

import type { FormData } from '@/hooks/useFormExperimentation'

interface StepReviewProps {
  formData: FormData
  updateFormData: (field: string, value: unknown) => void
}

// Composant de section collapsible inspiré de TicketOverlay
function ReviewSection({ 
  title, 
  icon: Icon, 
  children, 
  expanded = true, 
  onToggleExpanded 
}: { 
  title: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  children: React.ReactNode
  expanded?: boolean
  onToggleExpanded?: () => void
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header de la section */}
      <button
        onClick={onToggleExpanded}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Contenu de la section */}
      {expanded && (
        <div className="p-4 bg-white">
          <div className="space-y-3">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

// Composant pour afficher un champ
function ReviewField({ label, value, type = 'text' }: { label: string; value: unknown; type?: 'text' | 'file' }) {
  return (
    <div className="flex justify-between items-start py-1">
      <Label className="text-xs font-medium text-gray-600 min-w-[140px] flex-shrink-0">{label}</Label>
      <div className="text-xs text-gray-900 flex-1 text-right">
        {type === 'file' && value && typeof value === 'object' && 'name' in value ? (
          <span className="text-green-600 flex items-center gap-1 justify-end">
            <CheckCircle className="w-3 h-3" />
            {(value as File).name}
          </span>
        ) : value ? (
          <span className="text-gray-900">{String(value)}</span>
        ) : (
          <span className="text-gray-400 italic">Not specified</span>
        )}
      </div>
    </div>
  )
}

export function StepReview({ formData }: StepReviewProps) {
  const { markets = [], owners = [], testTypes = [], kpis = [], pages = [], products = [] } = useExperimentation({ 
    useAirtable: true, 
    timelineMode: false 
  })

  // États pour les sections collapsibles
  const [propertiesExpanded, setPropertiesExpanded] = useState(true)
  const [definitionExpanded, setDefinitionExpanded] = useState(true)
  const [audienceExpanded, setAudienceExpanded] = useState(true)
  const [timelineExpanded, setTimelineExpanded] = useState(true)
  const [successCriteriaExpanded, setSuccessCriteriaExpanded] = useState(true)

  // Helper functions to get names from IDs
  const getMarketName = (id: string) => markets.find(m => m.id === id)?.name || id
  const getOwnerName = (id: string) => owners.find(o => o.id === id)?.name || id
  const getTypeName = (id: string) => testTypes.find(t => t.id === id)?.name || id
  const getKPIName = (id: string) => kpis.find(k => k.id === id)?.name || id
  const getPageName = (id: string) => pages.find(p => p.id === id)?.name || id
  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id

  return (
    <div className="space-y-6">
      <div className="text-left mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Review</h2>
        <p className="text-gray-600 mt-1 text-sm">Review all information before creating your experimentation</p>
      </div>

      <div className="space-y-4">
        {/* Properties Section */}
        <ReviewSection 
          title="Properties" 
          icon={Settings}
          expanded={propertiesExpanded}
          onToggleExpanded={() => setPropertiesExpanded(!propertiesExpanded)}
        >
          <ReviewField label="Role" value={formData.role} />
          <ReviewField label="Owner" value={getOwnerName(formData.owner)} />
          <ReviewField label="Market" value={getMarketName(formData.market)} />
          <ReviewField label="Scope" value={formData.scope} />
          <ReviewField label="Tool" value={formData.tool} />
          <ReviewField 
            label="Test Type" 
            value={formData.testType?.map((id: string) => testTypes.find(t => t.id === id)?.name).join(', ')} 
          />
        </ReviewSection>

        {/* Definition Section */}
        <ReviewSection 
          title="Definition" 
          icon={FileText}
          expanded={definitionExpanded}
          onToggleExpanded={() => setDefinitionExpanded(!definitionExpanded)}
        >
          <ReviewField label="Short Name" value={formData.shortName} />
          <ReviewField label="Type" value={getTypeName(formData.type)} />
          <ReviewField label="Hypothesis" value={formData.hypothesis} />
          <ReviewField label="Context" value={formData.context} />
          <ReviewField label="Description" value={formData.description} />
          <ReviewField label="Control" value={formData.control} type="file" />
          <ReviewField label="Variation 1" value={formData.variation1} type="file" />
        </ReviewSection>

        {/* Audience Section */}
        <ReviewSection 
          title="Audience" 
          icon={Users}
          expanded={audienceExpanded}
          onToggleExpanded={() => setAudienceExpanded(!audienceExpanded)}
        >
          <ReviewField label="Devices" value={formData.devices} />
          <ReviewField label="Page" value={getPageName(formData.page)} />
          <ReviewField label="Product" value={getProductName(formData.product)} />
        </ReviewSection>

        {/* Timeline Section */}
        <ReviewSection 
          title="Timeline" 
          icon={TrendingUp}
          expanded={timelineExpanded}
          onToggleExpanded={() => setTimelineExpanded(!timelineExpanded)}
        >
          <ReviewField label="Audience" value={formData.audience} />
          <ReviewField label="Conversion" value={formData.conversion} />
          <ReviewField label="Conversion Rate" value={formData.conversionRate ? `${formData.conversionRate}%` : ''} />
          <ReviewField label="MDE" value={formData.mde === 'custom' ? formData.mdeCustom : formData.mde} />
          <ReviewField label="Traffic Allocation" value={formData.trafficAllocation ? `${formData.trafficAllocation}%` : ''} />
                            <ReviewField label="Expected Launch" value={formData.expectedLaunch} />
                  <ReviewField label="End Date" value={formData.endDate} />
                  <ReviewField label="Statistical Confidence" value={formData.statisticalConfidence ? `${formData.statisticalConfidence}%` : ''} />
          <ReviewField label="Main KPI" value={getKPIName(formData.mainKPI)} />
          <ReviewField label="KPI #2" value={getKPIName(formData.kpi2)} />
          <ReviewField label="KPI #3" value={getKPIName(formData.kpi3)} />
        </ReviewSection>

        {/* Success Criteria Section */}
        <ReviewSection 
          title="Success Criteria" 
          icon={CheckCircle}
          expanded={successCriteriaExpanded}
          onToggleExpanded={() => setSuccessCriteriaExpanded(!successCriteriaExpanded)}
        >
          <ReviewField label="Criteria #1" value={formData.successCriteria1} />
          <ReviewField label="Criteria #2" value={formData.successCriteria2} />
          <ReviewField label="Criteria #3" value={formData.successCriteria3} />
        </ReviewSection>
      </div>
    </div>
  )
} 