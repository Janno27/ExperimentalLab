import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, User, Calendar, Clock, Settings, Target, FlaskConical, Sparkles, Wrench, Edit2, Check, X } from 'lucide-react'
import { Project } from '@/hooks/useExperimentation'
import { STATUS_COLORS } from '@/constants/timeline'
import { updateExperimentationFields, fetchOwners, fetchExperimentations } from '@/lib/airtable'
import { toast } from 'sonner'

interface TicketOverlayPropertiesProps {
  project: Project
  expanded: boolean
  onToggleExpanded: () => void
  canEdit: boolean
  canView: boolean
}

// Helper pour formater une date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}



// Helper pour obtenir l'icône du type de test
const getTestTypeIcon = (testType?: string) => {
  if (!testType) return null
  if (testType === 'A/B-Test') return <FlaskConical className="w-3 h-3 text-blue-500 flex-shrink-0" />
  if (testType === 'Personalization') return <Sparkles className="w-3 h-3 text-cyan-500 flex-shrink-0" />
  if (testType === 'Fix/Patch') return <Wrench className="w-3 h-3 text-teal-500 flex-shrink-0" />
  return null
}

// Liste des statuts autorisés (alignée avec Airtable et le type Project.status)
const STATUS_OPTIONS: Project['status'][] = [
  'To be prioritized',
  'Denied',
  'Refinement',
  'Design & Development',
  'Setup',
  'Running',
  'Ready for Analysis',
  'Analysing',
  'Open',
  'Done',
]

// Petit DatePicker enrichi (popup) minimaliste
function useOutsideClick(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onOutside])
}



function startOfMonthUTC(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)) }
function daysInMonthUTC(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate() }
function addMonthsUTC(d: Date, n: number) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1)) }
function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  if (isNaN(d.getTime())) return iso
  const out = new Date(d.getTime() + days * 24 * 60 * 60 * 1000)
  return out.toISOString().slice(0, 10)
}



function DatePicker({ value, onChange, disabled }: { value: string, onChange: (val: string) => void, disabled?: boolean }) {
  // Tout en UTC pour éviter les décalages
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(() => startOfMonthUTC(new Date(value + 'T00:00:00Z')))
  const ref = useRef<HTMLDivElement>(null)
  useOutsideClick(ref, () => setOpen(false))

  useEffect(() => {
    if (value) setCursor(startOfMonthUTC(new Date(value + 'T00:00:00Z')))
  }, [value])

  const handleSelect = (day: number) => {
    const utc = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), day))
    const iso = utc.toISOString().slice(0, 10)
    onChange(iso)
    setOpen(false)
  }

  const total = daysInMonthUTC(cursor)
  const firstDay = startOfMonthUTC(cursor).getUTCDay() // 0=Dimanche
  const weeks: Array<Array<number | null>> = []
  let week: Array<number | null> = new Array((firstDay + 6) % 7).fill(null) // Commencer Lundi
  for (let day = 1; day <= total; day++) {
    week.push(day)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week) }

  const monthLabel = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`h-6 px-2 py-0.5 inline-flex items-center justify-between rounded border transition-all bg-white ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} border-gray-300 hover:border-gray-400 text-xs leading-none min-w-[8.5rem] max-w-[9.5rem]`}
      >
        <span className="text-[11px] truncate text-gray-900">{value || '-'}</span>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2 w-[220px]">
          <div className="flex items-center justify-between mb-2">
            <button className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => setCursor(c => addMonthsUTC(c, -1))}>{'‹'}</button>
            <div className="text-xs font-medium text-gray-700 capitalize">{monthLabel}</div>
            <button className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => setCursor(c => addMonthsUTC(c, 1))}>{'›'}</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-gray-500 mb-1">
            {['L','M','M','J','V','S','D'].map((d, i) => (<div key={i} className="text-center">{d}</div>))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weeks.map((w, wi) => w.map((d, di) => (
              <button
                key={`${wi}-${di}-${d ?? 'x'}`}
                disabled={!d}
                onClick={() => d && handleSelect(d)}
                className={`h-7 text-[11px] rounded ${d ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-0 pointer-events-none'} ${value && d && new Date(value + 'T00:00:00Z').getUTCDate() === d && new Date(value + 'T00:00:00Z').getUTCMonth() === cursor.getUTCMonth() ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
              >
                {d || ''}
              </button>
            )))}
          </div>
        </div>
      )}
    </div>
  )
}

export function TicketOverlayProperties({ project, expanded, onToggleExpanded, canEdit }: TicketOverlayPropertiesProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProject, setEditedProject] = useState(project)
  const [isSaving, setIsSaving] = useState(false)

  // Owner data
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([])
  const [ownersLoading, setOwnersLoading] = useState(false)
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null)
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false)
  const ownerDropdownRef = useRef<HTMLDivElement>(null)

  // TestType / Tool / Scope options
  const [testTypes, setTestTypes] = useState<string[]>([])
  const [testTypesLoading, setTestTypesLoading] = useState(false)
  const [toolOptions, setToolOptions] = useState<string[]>([])
  const [scopeOptions, setScopeOptions] = useState<string[]>([])
  const [showTestTypeDropdown, setShowTestTypeDropdown] = useState(false)
  const [showToolDropdown, setShowToolDropdown] = useState(false)
  const [showScopeDropdown, setShowScopeDropdown] = useState(false)
  const testTypeDropdownRef = useRef<HTMLDivElement>(null)
  const toolDropdownRef = useRef<HTMLDivElement>(null)
  const scopeDropdownRef = useRef<HTMLDivElement>(null)

  // Dates + estimated time
  const [startDateStr, setStartDateStr] = useState<string>(project.startDate.toISOString().slice(0, 10))

  const [estimatedTimeStr, setEstimatedTimeStr] = useState<string>(String(project.estimatedTime ?? ''))

  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const statusDropdownRef = useRef<HTMLDivElement>(null)

  // Réinitialiser l'état quand le projet change
  useEffect(() => {
    setEditedProject(project)
    setStartDateStr(project.startDate.toISOString().slice(0, 10))
    setEstimatedTimeStr(String(project.estimatedTime ?? ''))
    setIsEditing(false) // Sortir du mode édition si on était en train d'éditer
    setSelectedOwnerId(null) // Réinitialiser la sélection d'owner
  }, [project.id]) // Se déclenche quand l'ID du projet change

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(target)) setShowStatusDropdown(false)
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(target)) setShowOwnerDropdown(false)
      if (testTypeDropdownRef.current && !testTypeDropdownRef.current.contains(target)) setShowTestTypeDropdown(false)
      if (toolDropdownRef.current && !toolDropdownRef.current.contains(target)) setShowToolDropdown(false)
      if (scopeDropdownRef.current && !scopeDropdownRef.current.contains(target)) setShowScopeDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Charger les listes au passage en édition
  useEffect(() => {
    const loadAuxData = async () => {
      if (!isEditing) return
      try {
        setOwnersLoading(true)
        const ownersList = await fetchOwners()
        setOwners(ownersList)
        const current = ownersList.find(o => o.name === project.owner)
        setSelectedOwnerId(current?.id || null)
      } catch {}
      finally { setOwnersLoading(false) }

      try {
        setTestTypesLoading(true)
        // Extraire les valeurs uniques depuis la colonne 'Type' des expérimentations
        const records = await fetchExperimentations()
        const types = Array.from(new Set(records.map(r => (r.fields['Type'] as string) || '').filter(Boolean)))
        setTestTypes(types.length > 0 ? types : ['A/B-Test', 'Personalization', 'Fix/Patch'])
      } catch {
        setTestTypes(['A/B-Test', 'Personalization', 'Fix/Patch'])
      } finally { setTestTypesLoading(false) }

      try {
        const records = await fetchExperimentations()
        const tools = Array.from(new Set(records.map(r => (r.fields['Tool:'] as string) || '').filter(Boolean)))
        const scopes = Array.from(new Set(records.map(r => (r.fields['Scope'] as string) || '').filter(Boolean)))
        setToolOptions(tools)
        setScopeOptions(scopes)
      } catch {}
    }
    loadAuxData()
  }, [isEditing, project.owner, project.testType])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const fieldsToUpdate: Record<string, unknown> = {}

      // Status
      if (editedProject.status !== project.status) fieldsToUpdate['Status'] = editedProject.status
      // Tool / Scope
      if (editedProject.tool !== project.tool) fieldsToUpdate['Tool:'] = editedProject.tool
      if (editedProject.scope !== project.scope) fieldsToUpdate['Scope'] = editedProject.scope
      // Owner (linked record)
      if (selectedOwnerId && project.owner !== owners.find(o => o.id === selectedOwnerId)?.name) {
        fieldsToUpdate['Owner'] = [selectedOwnerId]
      }
      // Dates/Estimated Time (gérés ensemble)
      const startChanged = startDateStr !== project.startDate.toISOString().slice(0, 10)
      const estNum = Number(estimatedTimeStr)
      const estimatedChanged = !Number.isNaN(estNum) && estNum !== (project.estimatedTime ?? 0)
      if (startChanged || estimatedChanged) {
        const validStart = !isNaN(new Date(startDateStr + 'T00:00:00Z').getTime())
        if (!validStart) {
          toast.error('Date de début invalide')
          return
        }
        if (Number.isNaN(estNum) || estNum < 0) {
          toast.error('Estimated Time invalide')
          return
        }
        // Ne pas envoyer End Date, elle est dérivée côté Airtable
        fieldsToUpdate['Start Date'] = startDateStr
        fieldsToUpdate['Estimated Time'] = estNum
      }
      // Test Type
      if (editedProject.testType !== project.testType && editedProject.testType) fieldsToUpdate['Type'] = editedProject.testType

      if (Object.keys(fieldsToUpdate).length > 0) {
        await updateExperimentationFields(project.id, fieldsToUpdate)
        
        // Mise à jour immédiate de l'état local (stratégie de synchronisation)
        // L'état editedProject est déjà à jour, donc pas besoin de mise à jour locale
        
        toast.success('Project updated successfully!')
        setIsEditing(false)
        
        // Pas de rafraîchissement automatique pour éviter d'écraser l'état local
        // if (onLocalRefresh) await onLocalRefresh()
        // if (onDataRefresh) await onDataRefresh()
      }
    } catch (error) {
      toast.error('Failed to update project.')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedProject(project)
    setStartDateStr(project.startDate.toISOString().slice(0, 10))

    setEstimatedTimeStr(String(project.estimatedTime ?? ''))
    setIsEditing(false)
  }

  const displayedStatus: Project['status'] = isEditing ? editedProject.status : (isSaving ? editedProject.status : project.status)

  // Flags spinners
  const changedStatus = isEditing && editedProject.status !== project.status
  const changedOwner = isEditing && !!selectedOwnerId && project.owner !== owners.find(o => o.id === selectedOwnerId)?.name
  const changedStart = isEditing && (startDateStr !== project.startDate.toISOString().slice(0, 10))
  const changedEstimated = isEditing && Number(estimatedTimeStr) !== (project.estimatedTime ?? 0)
  const changedDates = changedStart || changedEstimated
  const changedTestType = isEditing && editedProject.testType !== project.testType
  const changedTool = isEditing && (editedProject.tool || '') !== (project.tool || '')
  const changedScope = isEditing && (editedProject.scope || '') !== (project.scope || '')

  // End date affichée (lecture seule) basée sur Start + Estimated (fallback: project.endDate)
  const previewEndISO = (() => {
    const est = Number(estimatedTimeStr)
    if (!Number.isNaN(est)) return addDaysISO(startDateStr, est)
    return project.endDate.toISOString().slice(0, 10)
  })()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button 
          onClick={onToggleExpanded}
          className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
        >
          Properties
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {expanded && canEdit && (
          !isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
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
          {/* Status */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-600 w-28 flex-shrink-0">Status:</span>
            <div className="flex items-center gap-2 min-w-0 relative" ref={statusDropdownRef}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[displayedStatus]?.bg || 'bg-gray-400'}`}></div>
              {isEditing && canEdit ? (
                <>
                  <button
                    onClick={() => setShowStatusDropdown(v => !v)}
                    className="h-6 px-2 py-0.5 inline-flex items-center justify-between rounded border transition-all bg-white border-gray-300 hover:border-gray-400 cursor-pointer text-xs leading-none min-w-[9.5rem] max-w-[11rem]"
                  >
                    <span className="text-xs truncate text-gray-900">{editedProject.status}</span>
                    <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showStatusDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[9.5rem] max-w-[12rem]">
                      <div className="p-1 max-h-56 overflow-auto">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => { setEditedProject({ ...editedProject, status: s }); setShowStatusDropdown(false) }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded flex items-center gap-2 cursor-pointer"
                          >
                            <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[s]?.bg || 'bg-gray-400'}`}></div>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-gray-900 truncate">{editedProject.status}</span>
              )}
              {isSaving && changedStatus && (
                <div className="ml-2 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" aria-label="Saving" />
              )}
            </div>
          </div>

          {/* Owner */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-600 w-28 flex-shrink-0">Owner:</span>
            <div className="flex items-center gap-2 min-w-0 relative" ref={ownerDropdownRef}>
              <User className="w-3 h-3 text-gray-500 flex-shrink-0" />
              {isEditing && canEdit ? (
                <>
                  <button
                    onClick={() => setShowOwnerDropdown(v => !v)}
                    disabled={ownersLoading}
                    className={`h-6 px-2 py-0.5 inline-flex items-center justify-between rounded border transition-all bg-white ${ownersLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} border-gray-300 hover:border-gray-400 text-xs leading-none min-w-[9.5rem] max-w-[12rem]`}
                  >
                    <span className="text-xs truncate text-gray-900">
                      {owners.find(o => o.id === selectedOwnerId)?.name || project.owner || 'Select...'}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showOwnerDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showOwnerDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[9.5rem] max-w-[12rem]">
                      <div className="p-1 max-h-56 overflow-auto">
                        {owners.map(o => (
                          <button
                            key={o.id}
                            onClick={() => { setSelectedOwnerId(o.id); setShowOwnerDropdown(false) }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded flex items-center gap-2 cursor-pointer"
                          >
                            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                            {o.name}
                          </button>
                        ))}
                        {owners.length === 0 && (
                          <div className="text-[11px] text-gray-500 px-3 py-2">No owners</div>
                        )}
            </div>
          </div>
                  )}
                </>
              ) : (
                <span className="text-gray-900 truncate">{owners.find(o => o.id === selectedOwnerId)?.name || project.owner || '-'}</span>
              )}
              {isSaving && changedOwner && (
                <div className="ml-2 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-600 w-28 flex-shrink-0">Dates:</span>
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-3 h-3 text-gray-500 flex-shrink-0" />
              {isEditing && canEdit ? (
                <div className="flex items-center gap-2">
                  <DatePicker value={startDateStr} onChange={setStartDateStr} />
                  <span className="text-gray-500">→</span>
                  <button type="button" disabled className="h-6 px-2 py-0.5 inline-flex items-center justify-between rounded border bg-gray-50 border-gray-200 text-[11px] leading-none min-w-[8.5rem] max-w-[9.5rem] text-gray-500 cursor-not-allowed">
                    {previewEndISO}
                  </button>
                </div>
              ) : (
              <span className="text-gray-900 truncate">
                {formatDate(new Date(startDateStr + 'T00:00:00Z'))} → {formatDate(new Date(previewEndISO + 'T00:00:00Z'))}
              </span>
              )}
              {isSaving && changedDates && (
                <div className="ml-2 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-600 w-28 flex-shrink-0">Estimated Time:</span>
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
              {isEditing && canEdit ? (
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={estimatedTimeStr}
                  onChange={(e) => setEstimatedTimeStr(e.target.value)}
                  className="h-6 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-900 bg-white w-20"
                />
              ) : (
              <span className="text-gray-900 truncate">{estimatedTimeStr || project.estimatedTime} days</span>
              )}
              {isSaving && changedEstimated && (
                <div className="ml-2 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>

          {/* Test Type */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-600 w-28 flex-shrink-0">Test Type:</span>
            <div className="flex items-center gap-2 min-w-0 relative" ref={testTypeDropdownRef}>
              {getTestTypeIcon(editedProject.testType)}
              {isEditing && canEdit ? (
                <>
                  <button
                    onClick={() => setShowTestTypeDropdown(v => !v)}
                    disabled={testTypesLoading}
                    className={`h-6 px-2 py-0.5 inline-flex items-center justify-between rounded border transition-all bg-white ${testTypesLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} border-gray-300 hover:border-gray-400 text-xs leading-none min-w-[9.5rem] max-w-[12rem]`}
                  >
                    <span className="text-xs truncate text-gray-900">{editedProject.testType || 'Select...'}</span>
                    <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showTestTypeDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showTestTypeDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[9.5rem] max-w-[12rem]">
                      <div className="p-1 max-h-56 overflow-auto">
                        {testTypes.map(t => (
                          <button
                            key={t}
                            onClick={() => { setEditedProject({ ...editedProject, testType: t }); setShowTestTypeDropdown(false) }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded flex items-center gap-2 cursor-pointer"
                          >
                            {getTestTypeIcon(t)}
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
              <span className="text-gray-900 truncate">{editedProject.testType || '-'}</span>
              )}
              {isSaving && changedTestType && (
                <div className="ml-2 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>

          {/* Tool */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-600 w-28 flex-shrink-0">Tool:</span>
            <div className="flex items-center gap-2 min-w-0 relative" ref={toolDropdownRef}>
              <Settings className="w-3 h-3 text-gray-500 flex-shrink-0" />
              {isEditing && canEdit ? (
                <>
                  <button
                    onClick={() => setShowToolDropdown(v => !v)}
                    className="h-6 px-2 py-0.5 inline-flex items-center justify-between rounded border transition-all bg-white border-gray-300 hover:border-gray-400 cursor-pointer text-xs leading-none min-w-[9.5rem] max-w-[12rem]"
                  >
                    <span className="text-xs truncate text-gray-900">{editedProject.tool || 'Select or type...'}</span>
                    <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showToolDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showToolDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[9.5rem] max-w-[12rem]">
                      <div className="p-1 max-h-56 overflow-auto">
                        {toolOptions.map(t => (
                          <button
                            key={t}
                            onClick={() => { setEditedProject({ ...editedProject, tool: t }); setShowToolDropdown(false) }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded flex items-center gap-2 cursor-pointer"
                          >
                            <Settings className="w-3 h-3 text-gray-500" />
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
              <span className="text-gray-900 truncate">{editedProject.tool || '-'}</span>
              )}
              {isSaving && changedTool && (
                <div className="ml-2 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>

          {/* Scope */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-600 w-28 flex-shrink-0">Scope:</span>
            <div className="flex items-center gap-2 min-w-0 relative" ref={scopeDropdownRef}>
              <Target className="w-3 h-3 text-gray-500 flex-shrink-0" />
              {isEditing && canEdit ? (
                <>
                  <button
                    onClick={() => setShowScopeDropdown(v => !v)}
                    className="h-6 px-2 py-0.5 inline-flex items-center justify-between rounded border transition-all bg-white border-gray-300 hover:border-gray-400 cursor-pointer text-xs leading-none min-w-[9.5rem] max-w-[12rem]"
                  >
                    <span className="text-xs truncate text-gray-900">{editedProject.scope || 'Select or type...'}</span>
                    <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showScopeDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showScopeDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[9.5rem] max-w-[12rem]">
                      <div className="p-1 max-h-56 overflow-auto">
                        {scopeOptions.map(s => (
                          <button
                            key={s}
                            onClick={() => { setEditedProject({ ...editedProject, scope: s }); setShowScopeDropdown(false) }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded flex items-center gap-2 cursor-pointer"
                          >
                            <Target className="w-3 h-3 text-gray-500" />
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
              <span className="text-gray-900 truncate">{editedProject.scope || '-'}</span>
              )}
              {isSaving && changedScope && (
                <div className="ml-2 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
} 