import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight, Edit2, X, Check } from 'lucide-react'
import { Project } from '@/hooks/useExperimentation'
import { updateExperimentationFields, fetchKPIs, fetchExperimentations } from '@/lib/airtable'
import { toast } from 'sonner'

interface TicketOverlayDataProps {
  project: Project
  expanded: boolean
  onToggleExpanded: () => void
  canEdit: boolean
  canView: boolean
  onDataRefresh?: () => Promise<void>
  onLocalRefresh?: () => Promise<void>
}

// Hook pour fermer les dropdowns au clic extérieur
function useOutsideClick(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ref, handler])
}

export function TicketOverlayData({ 
  project, 
  expanded, 
  onToggleExpanded, 
  canEdit, 
  onDataRefresh,
  onLocalRefresh
}: TicketOverlayDataProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedProject, setEditedProject] = useState(project)
  
  // États pour les options des dropdowns
  const [kpis, setKpis] = useState<{id: string, name: string}[]>([])
  const [kpisLoading, setKpisLoading] = useState(false)
  const [mdeOptions, setMdeOptions] = useState<string[]>([])
  const [trafficOptions, setTrafficOptions] = useState<string[]>([])
  const [optionsLoading, setOptionsLoading] = useState(false)
  
  // États pour les dropdowns
  const [showKpiDropdown, setShowKpiDropdown] = useState(false)
  const [showMdeDropdown, setShowMdeDropdown] = useState(false)
  const [showTrafficDropdown, setShowTrafficDropdown] = useState(false)
  
  // Refs pour les dropdowns
  const kpiDropdownRef = useRef<HTMLDivElement>(null)
  const mdeDropdownRef = useRef<HTMLDivElement>(null)
  const trafficDropdownRef = useRef<HTMLDivElement>(null)
  
  useOutsideClick(kpiDropdownRef, () => setShowKpiDropdown(false))
  useOutsideClick(mdeDropdownRef, () => setShowMdeDropdown(false))
  useOutsideClick(trafficDropdownRef, () => setShowTrafficDropdown(false))

  // Synchroniser editedProject avec project
  useEffect(() => {
    setEditedProject(project)
  }, [project])

  // Charger les options des dropdowns
  useEffect(() => {
    if (isEditing) {
      loadDropdownOptions()
    }
  }, [isEditing])

  const loadDropdownOptions = async () => {
    try {
      setKpisLoading(true)
      setOptionsLoading(true)
      
      // Charger les KPIs depuis la table dédiée
      const kpiData = await fetchKPIs()
      setKpis(kpiData)
      
      // Charger les options MDE depuis les expérimentations existantes
      const experiments = await fetchExperimentations()
      const mdeSet = new Set<string>()
      
      experiments.forEach(exp => {
        const mdeValue = exp.fields['MDE'] as string
        if (mdeValue && mdeValue.trim()) mdeSet.add(mdeValue.trim())
      })
      
      setMdeOptions(Array.from(mdeSet).sort())
      
      // Traffic Allocation : utiliser les options prédéfinies d'Airtable (sélection unique)
      setTrafficOptions(['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'])
      
    } catch (error) {
      console.error('Erreur lors du chargement des options:', error)
      // Valeurs de fallback
      setMdeOptions(['5%', '10%', '15%', '20%'])
      setTrafficOptions(['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%'])
    } finally {
      setKpisLoading(false)
      setOptionsLoading(false)
    }
  }

  const handleEdit = () => {
    if (!canEdit) return
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditedProject(project)
    setIsEditing(false)
    setShowKpiDropdown(false)
    setShowMdeDropdown(false)
    setShowTrafficDropdown(false)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const fieldsToUpdate: Record<string, unknown> = {}

      // Main KPI (lié)
      if (editedProject.mainKPI !== project.mainKPI) {
        const selectedKpi = kpis.find(k => k.name === editedProject.mainKPI)
        if (selectedKpi) {
          fieldsToUpdate['Main KPI'] = [selectedKpi.id]
        }
      }

      // MDE
      if (editedProject.mde !== project.mde) {
        fieldsToUpdate['MDE'] = editedProject.mde
      }

      // Traffic Allocation
      if (editedProject.trafficAllocation !== project.trafficAllocation) {
        fieldsToUpdate['Traffic Allocation'] = editedProject.trafficAllocation
      }

      // Audience (champ numérique) - convertir en nombre pour Airtable
      if ((editedProject.audience || '') !== (project.audience || '')) {
        const audienceValue = editedProject.audience?.trim()
        if (audienceValue) {
          const numericValue = Number(audienceValue)
          if (!Number.isNaN(numericValue)) {
            fieldsToUpdate['Audience'] = numericValue
          } else {
            toast.error('Audience doit être un nombre valide')
            return
          }
        } else {
          // Ne pas envoyer le champ si vide pour éviter les conflits avec Existing % Rate
        }
      }

      // Conversion (champ numérique) - convertir en nombre pour Airtable
      if ((editedProject.conversion || '') !== (project.conversion || '')) {
        const conversionValue = editedProject.conversion?.trim()
        if (conversionValue) {
          const numericValue = Number(conversionValue)
          if (!Number.isNaN(numericValue)) {
            fieldsToUpdate['Conversion'] = numericValue
          } else {
            toast.error('Conversion doit être un nombre valide')
            return
          }
        } else {
          // Ne pas envoyer le champ si vide pour éviter les conflits avec Existing % Rate
        }
      }



      if (Object.keys(fieldsToUpdate).length > 0) {
        await updateExperimentationFields(project.id, fieldsToUpdate)
        toast.success('Données mises à jour avec succès!')
        setIsEditing(false)
        if (onLocalRefresh) await onLocalRefresh()
        if (onDataRefresh) await onDataRefresh()
      } else {
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Detailed error:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        projectId: project.id,
        editedProject,
        originalProject: project
      })
      toast.error('Erreur lors de la mise à jour.')
    } finally {
      setIsSaving(false)
    }
  }

  // Flags pour les spinners
  const changedKpi = isEditing && editedProject.mainKPI !== project.mainKPI
  const changedMde = isEditing && editedProject.mde !== project.mde
  const changedTraffic = isEditing && editedProject.trafficAllocation !== project.trafficAllocation
  const changedAudience = isEditing && (editedProject.audience || '') !== (project.audience || '')
  const changedConversion = isEditing && (editedProject.conversion || '') !== (project.conversion || '')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button 
          onClick={onToggleExpanded}
          className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
        >
          Data
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        
        {expanded && canEdit && (
          !isEditing ? (
            <button
              onClick={handleEdit}
              className={`flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors ${isSaving ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}
              title="Edit"
              disabled={isSaving}
            >
              <Edit2 className="w-3 h-3" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className={`flex items-center gap-1 text-xs text-green-600 hover:text-green-800 transition-colors ${isSaving ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}
                title={isSaving ? 'Saving...' : 'Save'}
                disabled={isSaving}
              >
                {isSaving && (
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                )}
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={handleCancel}
                className={`flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition-colors ${isSaving ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                title="Cancel"
                disabled={isSaving}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )
        )}
      </div>
      
      {expanded && (
        <div className="space-y-4 pl-6">
                    {/* Première ligne : Main KPI, Audience, Conversion */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Main KPI</div>
              <div className="text-xs relative" ref={kpiDropdownRef}>
                {isEditing && canEdit ? (
                  <div>
                    <button
                      onClick={() => setShowKpiDropdown(v => !v)}
                      className="h-6 px-2 py-0.5 inline-flex items-center justify-between rounded border transition-all bg-white border-gray-300 hover:border-gray-400 cursor-pointer text-xs leading-none w-full"
                    >
                      <span className="text-xs truncate text-gray-900">{editedProject.mainKPI || 'Sélectionner...'}</span>
                      <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showKpiDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showKpiDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-full">
                        <div className="p-1 max-h-56 overflow-auto">
                          {kpisLoading ? (
                            <div className="px-3 py-2 text-xs text-gray-500">Chargement...</div>
                          ) : (
                            kpis.map(kpi => (
                               <button
                                 key={kpi.id}
                                 onClick={() => {
                                   setEditedProject({ ...editedProject, mainKPI: kpi.name })
                                   setShowKpiDropdown(false)
                                 }}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded cursor-pointer"
                                 >
                                   {kpi.name}
                                 </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-medium truncate block">
                    {project.mainKPI || '-'}
                  </span>
                )}
                {isSaving && changedKpi && (
                  <div className="absolute -right-5 top-1 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Audience</div>
              <div className="text-xs relative">
                {isEditing && canEdit ? (
                  <input
                    type="number"
                    step="any"
                    value={editedProject.audience || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, audience: e.target.value })}
                    className="h-6 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-900 bg-white w-full"
                    placeholder="Nombre (ex: 1000)"
                  />
                ) : (
                  <div className="text-xs text-gray-900 truncate">{project.audience || '-'}</div>
                )}
                {isSaving && changedAudience && (
                  <div className="absolute -right-5 top-1 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Conversion</div>
              <div className="text-xs relative">
                {isEditing && canEdit ? (
                  <input
                    type="number"
                    step="any"
                    value={editedProject.conversion || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, conversion: e.target.value })}
                    className="h-6 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-900 bg-white w-full"
                    placeholder="Nombre (ex: 366)"
                  />
                ) : (
                  <div className="text-xs text-gray-900 truncate">{project.conversion || '-'}</div>
                )}
                {isSaving && changedConversion && (
                  <div className="absolute -right-5 top-1 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>
          </div>

          {/* Deuxième ligne : MDE, Existing % Rate, Traffic Allocation */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">MDE</div>
              <div className="text-xs relative" ref={mdeDropdownRef}>
                {isEditing && canEdit ? (
                  <div>
                    <button
                      onClick={() => setShowMdeDropdown(v => !v)}
                      className="h-6 px-2 py-0.5 inline-flex items-center justify-between rounded border transition-all bg-white border-gray-300 hover:border-gray-400 cursor-pointer text-xs leading-none w-full"
                    >
                      <span className="text-xs truncate text-gray-900">{editedProject.mde || 'Sélectionner...'}</span>
                      <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showMdeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showMdeDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-full">
                        <div className="p-1 max-h-56 overflow-auto">
                          {optionsLoading ? (
                            <div className="px-3 py-2 text-xs text-gray-500">Chargement...</div>
                          ) : (
                            mdeOptions.map(mde => (
                              <button
                                key={mde}
                                onClick={() => {
                                  setEditedProject({ ...editedProject, mde })
                                  setShowMdeDropdown(false)
                                }}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded cursor-pointer"
                              >
                                {mde}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded font-medium truncate block">
                    {project.mde || '-'}
                  </span>
                )}
                {isSaving && changedMde && (
                  <div className="absolute -right-5 top-1 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Existing % Rate</div>
              <div className="text-xs text-gray-900 truncate opacity-60">
                {project.existingRate ? `${(parseFloat(project.existingRate) * 100).toFixed(1)}%` : '-'}
                <span className="text-[10px] text-gray-400 ml-1">(calculé)</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Traffic Allocation</div>
              <div className="text-xs relative" ref={trafficDropdownRef}>
                {isEditing && canEdit ? (
                  <div>
                    <button
                      onClick={() => setShowTrafficDropdown(v => !v)}
                      className="h-6 px-2 py-0.5 inline-flex items-center justify-between rounded border transition-all bg-white border-gray-300 hover:border-gray-400 cursor-pointer text-xs leading-none w-full"
                    >
                      <span className="text-xs truncate text-gray-900">{editedProject.trafficAllocation || 'Sélectionner...'}</span>
                      <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showTrafficDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showTrafficDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-full">
                        <div className="p-1 max-h-56 overflow-auto">
                          {optionsLoading ? (
                            <div className="px-3 py-2 text-xs text-gray-500">Chargement...</div>
                          ) : (
                            trafficOptions.map(traffic => (
                              <button
                                key={traffic}
                                onClick={() => {
                                  setEditedProject({ ...editedProject, trafficAllocation: traffic })
                                  setShowTrafficDropdown(false)
                                }}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded cursor-pointer"
                              >
                                {traffic}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs rounded font-medium truncate block">
                    {project.trafficAllocation || '-'}
                  </span>
                )}
                {isSaving && changedTraffic && (
                  <div className="absolute -right-5 top-1 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 