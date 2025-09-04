import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronRight, Check, CheckCircle, Edit2, X, Eye, EyeOff, Upload, Trash2 } from 'lucide-react'
import { Project } from '@/hooks/useExperimentation'
import { updateExperimentationFields, updateAnalysisFile, deleteAnalysisFile } from '@/lib/airtable'
import { toast } from 'sonner'
import { PDFViewer } from '@/components/ui/pdf-viewer'
import { uploadAnalysisFile } from '@/lib/supabase'

interface TicketOverlayResultsProps {
  project: Project
  expanded: boolean
  onToggleExpanded: () => void
  onConfetti?: () => void
  onDataRefresh?: () => Promise<void>
  canEdit: boolean
  canView: boolean
  hideCompleteProject?: boolean
}

export function TicketOverlayResults({ project, expanded, onToggleExpanded, onConfetti, onDataRefresh, canEdit, hideCompleteProject = false }: TicketOverlayResultsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // États pour les champs éditables
  const [editedSuccessCriteria1, setEditedSuccessCriteria1] = useState(project.successCriteria1 || '')
  const [editedSuccessCriteria2, setEditedSuccessCriteria2] = useState(project.successCriteria2 || '')
  const [editedSuccessCriteria3, setEditedSuccessCriteria3] = useState(project.successCriteria3 || '')
  const [editedLearnings, setEditedLearnings] = useState(project.learnings || '')
  const [editedNextSteps, setEditedNextSteps] = useState(project.nextSteps || '')

  // États pour les Met Thresholds (en lecture seule en mode édition)
  const [metThreshold1, setMetThreshold1] = useState(false)
  const [metThreshold2, setMetThreshold2] = useState(false)
  const [metThreshold3, setMetThreshold3] = useState(false)
  const [loading1, setLoading1] = useState(false)
  const [loading2, setLoading2] = useState(false)
  const [loading3, setLoading3] = useState(false)
  
  // États pour les champs OUTCOMES (modifiables par défaut)
  const [resultsDeepdive, setResultsDeepdive] = useState(project.resultsDeepdive || null)
  const [learnings, setLearnings] = useState(project.learnings || '')
  const [nextSteps, setNextSteps] = useState(project.nextSteps || '')

  const [conclusive, setConclusive] = useState(project.conclusive || '')
  const [conclusiveLoading, setConclusiveLoading] = useState(false)
  const [winLoss, setWinLoss] = useState(project.winLoss || '')
  const [winLossLoading, setWinLossLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<'conclusive' | 'winLoss' | null>(null)
  const [markAsDoneLoading, setMarkAsDoneLoading] = useState(false)
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [previewExpanded, setPreviewExpanded] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const conclusiveDropdownRef = useRef<HTMLDivElement>(null)
  const winLossDropdownRef = useRef<HTMLDivElement>(null)

  // Helper pour extraire la valeur des champs Met Threshold depuis Airtable
  const getMetThresholdValue = (field: unknown): boolean => {
    if (field === null || field === undefined) return false
    if (typeof field === 'boolean') return field
    if (Array.isArray(field) && field.length > 0) {
      return field[0] === 'Checked' || field[0] === true
    }
    return field === 'Checked' || field === true
  }

  // Conditions pour l'affichage
  const canShowCheckboxes = ['Running', 'Ready for Analysis', 'Analysing', 'Done'].includes(project.status)
  const canShowLearningsAndNextSteps = ['Analysing', 'Done'].includes(project.status)
  const canShowConclusive = ['Analysing', 'Done'].includes(project.status)

  // Conditions pour "Mark as Done"
  const hasSuccessCriteria = Boolean(project.successCriteria1 || project.successCriteria2 || project.successCriteria3)
  const hasMetThresholds = hasSuccessCriteria && (metThreshold1 || metThreshold2 || metThreshold3)
  const hasLearnings = Boolean(learnings.trim())
  const hasNextSteps = Boolean(nextSteps.trim())
  const hasConclusive = Boolean(conclusive)
  const hasWinLoss = Boolean(winLoss)
  
  const canMarkAsDone = hasMetThresholds && hasLearnings && hasNextSteps && hasConclusive && hasWinLoss
  const isDone = project.status === 'Done'

  // Initialiser les états depuis les données Airtable
  React.useEffect(() => {
    setMetThreshold1(getMetThresholdValue(project.metThreshold1))
    setMetThreshold2(getMetThresholdValue(project.metThreshold2))
    setMetThreshold3(getMetThresholdValue(project.metThreshold3))
    
    // Gérer les données d'analyse avec le bon format
    if (project.resultsDeepdive) {
      if (Array.isArray(project.resultsDeepdive) && project.resultsDeepdive.length > 0) {
        // Format Airtable : tableau d'objets avec url et filename
        const analysisData = project.resultsDeepdive[0]
        setResultsDeepdive([{
          url: analysisData.url,
          name: analysisData.filename || analysisData.name || 'Analysis Document',
          type: analysisData.type || 'application/pdf',
          size: analysisData.size
        }])
      } else {
        // Format direct : objet simple
        setResultsDeepdive([project.resultsDeepdive])
      }
    } else {
      setResultsDeepdive(null)
    }
    
    setLearnings(project.learnings || '')
    setNextSteps(project.nextSteps || '')
    setConclusive(project.conclusive || '')
    setWinLoss(project.winLoss || '')
    
    // Initialiser les champs éditables
    setEditedSuccessCriteria1(project.successCriteria1 || '')
    setEditedSuccessCriteria2(project.successCriteria2 || '')
    setEditedSuccessCriteria3(project.successCriteria3 || '')
    setEditedLearnings(project.learnings || '')
    setEditedNextSteps(project.nextSteps || '')
  }, [project]) // Se déclencher quand le projet entier change



  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        // Upload vers Supabase Storage
        const result = await uploadAnalysisFile(file, project.title)
        
        if (result.success && result.url) {
          // Mettre à jour Airtable avec l'URL
          await updateAnalysisFile(project.id, result.url, result.fileName || file.name)
          
          // Mettre à jour l'état local avec le bon format
          const newAnalysisFile = {
            url: result.url,
            name: result.fileName || file.name,
            type: file.type,
            size: file.size
          }
          setResultsDeepdive([newAnalysisFile])
          
          toast.success('Analysis uploaded successfully!')
        } else {
          toast.error(result.error || 'Upload failed')
        }
      } catch (error) {
        console.error('Error uploading file:', error)
        toast.error(error instanceof Error ? error.message : 'Upload failed')
      }
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteAnalysis = async () => {
    if (!canEdit) return
    
    setIsDeleting(true)
    try {
      await deleteAnalysisFile(project.id)
      
      // Mettre à jour l'état local
      setResultsDeepdive(null)
      setShowDeleteConfirm(false)
      
      toast.success('Analysis deleted successfully!')
    } catch (error) {
      console.error('Error deleting analysis:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete analysis')
    } finally {
      setIsDeleting(false)
    }
  }

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isOutsideConclusive = conclusiveDropdownRef.current && !conclusiveDropdownRef.current.contains(target)
      const isOutsideWinLoss = winLossDropdownRef.current && !winLossDropdownRef.current.contains(target)
      
      if (isOutsideConclusive && isOutsideWinLoss) {
        setShowDropdown(false)
        setActiveDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const fieldsToUpdate: Record<string, unknown> = {}

      // Success Criteria
      if (editedSuccessCriteria1 !== project.successCriteria1) {
        fieldsToUpdate['Success Criteria #1'] = editedSuccessCriteria1 || ''
      }
      if (editedSuccessCriteria2 !== project.successCriteria2) {
        fieldsToUpdate['Success Criteria #2'] = editedSuccessCriteria2 || ''
      }
      if (editedSuccessCriteria3 !== project.successCriteria3) {
        fieldsToUpdate['Success Criteria #3'] = editedSuccessCriteria3 || ''
      }
      
      // Learnings et Next Steps (en mode édition)
      if (editedLearnings !== project.learnings) {
        fieldsToUpdate['Learnings'] = editedLearnings || ''
      }
      if (editedNextSteps !== project.nextSteps) {
        fieldsToUpdate['Next Steps'] = editedNextSteps || ''
      }

      if (Object.keys(fieldsToUpdate).length > 0) {
        await updateExperimentationFields(project.id, fieldsToUpdate)
        
        // Mise à jour immédiate de l'état local (stratégie de synchronisation)
        // Les critères de succès sont déjà affichés depuis editedSuccessCriteria*, donc pas besoin de mise à jour locale
        if (editedLearnings !== project.learnings) {
          setLearnings(editedLearnings || '')
        }
        if (editedNextSteps !== project.nextSteps) {
          setNextSteps(editedNextSteps || '')
        }
        
        toast.success('Results updated successfully!')
        setIsEditing(false)
        
        // Pas de rafraîchissement automatique pour éviter d'écraser l'état local
        // if (onLocalRefresh) await onLocalRefresh()
        // if (onDataRefresh) await onDataRefresh()
      }
    } catch (error) {
      toast.error('Failed to update results.')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedSuccessCriteria1(project.successCriteria1 || '')
    setEditedSuccessCriteria2(project.successCriteria2 || '')
    setEditedSuccessCriteria3(project.successCriteria3 || '')
    setEditedLearnings(project.learnings || '')
    setEditedNextSteps(project.nextSteps || '')
    setIsEditing(false)
  }

  const handleToggleThreshold = async (thresholdNumber: number, currentValue: boolean) => {
    if (!canEdit || isEditing) return
    
    const newValue = !currentValue
    // Utiliser les noms exacts des champs comme dans useTimelineData.ts
    const fieldName = `Met Threshold - Success Criteria #${thresholdNumber}`
    const setLoading = thresholdNumber === 1 ? setLoading1 : thresholdNumber === 2 ? setLoading2 : setLoading3
    const setMetThreshold = thresholdNumber === 1 ? setMetThreshold1 : thresholdNumber === 2 ? setMetThreshold2 : setMetThreshold3



    setLoading(true)
    try {
      // Essayer avec un format de valeur différent
      await updateExperimentationFields(project.id, {
        [fieldName]: newValue
      })
      
      setMetThreshold(newValue)
      toast.success(`Criteria ${thresholdNumber} ${newValue ? 'validated' : 'invalidated'}`)
      
      // Rafraîchir les données de la timeline
      if (onDataRefresh) {
        await onDataRefresh()
      }
    } catch (error) {
      console.error('Error details:', error)
      toast.error('Error updating criteria')
      console.error('Error updating threshold:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConclusiveChange = async (value: string) => {
    if (!canEdit || isEditing) return
    
    setConclusive(value)
    setConclusiveLoading(true)
    setShowDropdown(false)
    setActiveDropdown(null)
    try {
      // Normaliser la valeur avant envoi (assurer qu'on envoie toujours la valeur complète)
      const normalizedValue = value === "C" || value === "Conclusive" ? "Conclusive" : 
                             value === "N" || value === "Non Conclusive" ? "Non Conclusive" : 
                             value
      await updateExperimentationFields(project.id, {
        'Conclusive vs Non Conclusive': normalizedValue
      })
      toast.success('Conclusion updated')
      
      // Rafraîchir les données de la timeline
      if (onDataRefresh) {
        await onDataRefresh()
      }
      
      // Déclencher l'animation de confettis si les deux sont sélectionnés
      if (value === 'Conclusive' && winLoss === 'Win') {
        onConfetti?.()
      }
    } catch (error) {
      console.error('Error updating conclusive:', error)
      toast.error('Error updating conclusion')
    } finally {
      setConclusiveLoading(false)
    }
  }

  const handleWinLossChange = async (value: string) => {
    if (!canEdit || isEditing) return
    
    setWinLoss(value)
    setWinLossLoading(true)
    setShowDropdown(false)
    setActiveDropdown(null)
    try {
      // Normaliser la valeur avant envoi (assurer qu'on envoie toujours la valeur complète)
      const normalizedValue = value === "W" || value === "Win" ? "Win" : 
                             value === "L" || value === "Loss" ? "Loss" : 
                             value
      await updateExperimentationFields(project.id, {
        'Win vs Loss': normalizedValue
      })
      toast.success('Win/Loss updated')
      
      // Rafraîchir les données de la timeline
      if (onDataRefresh) {
        await onDataRefresh()
      }
      
      // Déclencher l'animation de confettis si les deux sont sélectionnés
      if (value === 'Win' && conclusive === 'Conclusive') {
        onConfetti?.()
      }
    } catch (error) {
      console.error('Error updating win/loss:', error)
      toast.error('Error updating win/loss')
    } finally {
      setWinLossLoading(false)
    }
  }



  const getChipColor = (value: string, type: 'conclusive' | 'winLoss') => {
    if (type === 'conclusive') {
      return value === 'Conclusive' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
    } else {
      return value === 'Win' ? 'bg-blue-100 text-blue-800 border-blue-200' : value === 'Loss' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const toggleDropdown = (type: 'conclusive' | 'winLoss') => {
    if (activeDropdown === type) {
      setShowDropdown(false)
      setActiveDropdown(null)
    } else {
      setShowDropdown(true)
      setActiveDropdown(type)
    }
  }

  const handleMarkAsDone = async () => {
    if (!canMarkAsDone || isDone) return
    
    setMarkAsDoneLoading(true)
    try {
      await updateExperimentationFields(project.id, {
        'Status': 'Done'
      })
      toast.success('Project marked as done!')
      
      // Rafraîchir les données de la timeline
      if (onDataRefresh) {
        await onDataRefresh()
      }
    } catch (error) {
      console.error('Error marking as done:', error)
      toast.error('Error marking project as done')
    } finally {
      setMarkAsDoneLoading(false)
    }
  }

  const getMarkAsDoneTooltip = () => {
    if (isDone) return 'Project is already marked as done'
    
    const missingConditions = []
    if (!hasMetThresholds) missingConditions.push('At least one success criteria must be met')
    if (!hasLearnings) missingConditions.push('Learnings must be filled')
    if (!hasNextSteps) missingConditions.push('Next steps must be filled')
    if (!hasConclusive) missingConditions.push('Conclusion must be selected')
    if (!hasWinLoss) missingConditions.push('Results must be selected')
    
    return missingConditions.length > 0 
      ? `To mark as done, you need to complete: ${missingConditions.join(', ')}`
      : 'All conditions met! Click to mark as done'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button 
          onClick={onToggleExpanded}
          className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
        >
          Results
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
        <div className="space-y-4 pl-2">
          {/* Success Criteria Section */}
          <div className="space-y-3">
            {/* Critère 1 */}
            {(project.successCriteria1 || isEditing) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`text-xs font-medium ${metThreshold1 ? 'text-green-600' : 'text-gray-700'}`}>
                    Success Criteria #1
                  </div>
                  {canShowCheckboxes && !isEditing && (
                    <button
                      onClick={() => handleToggleThreshold(1, metThreshold1)}
                      disabled={loading1 || !canEdit}
                      className={`w-4 h-4 border rounded transition-colors ${
                        metThreshold1 
                          ? 'bg-green-500 border-green-500' 
                          : 'bg-white border-gray-300 hover:border-gray-400'
                      } ${(loading1 || !canEdit) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {metThreshold1 && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    value={editedSuccessCriteria1}
                    onChange={(e) => setEditedSuccessCriteria1(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    rows={2}
                    placeholder="Enter success criteria..."
                    disabled={isSaving}
                  />
                ) : (
                  <div className={`text-xs pl-1 ${metThreshold1 ? 'text-green-600' : 'text-gray-600'}`}>
                    {editedSuccessCriteria1 || '-'}
                  </div>
                )}
              </div>
            )}

            {/* Critère 2 */}
            {(project.successCriteria2 || isEditing) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`text-xs font-medium ${metThreshold2 ? 'text-green-600' : 'text-gray-700'}`}>
                    Success Criteria #2
                  </div>
                  {canShowCheckboxes && !isEditing && (
                    <button
                      onClick={() => handleToggleThreshold(2, metThreshold2)}
                      disabled={loading2 || !canEdit}
                      className={`w-4 h-4 border rounded transition-colors ${
                        metThreshold2 
                          ? 'bg-green-500 border-green-500' 
                          : 'bg-white border-gray-300 hover:border-gray-400'
                      } ${(loading2 || !canEdit) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {metThreshold2 && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    value={editedSuccessCriteria2}
                    onChange={(e) => setEditedSuccessCriteria2(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    rows={2}
                    placeholder="Enter success criteria..."
                    disabled={isSaving}
                  />
                ) : (
                  <div className={`text-xs pl-1 ${metThreshold2 ? 'text-green-600' : 'text-gray-600'}`}>
                    {editedSuccessCriteria2 || '-'}
                  </div>
                )}
              </div>
            )}

            {/* Critère 3 */}
            {(project.successCriteria3 || isEditing) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`text-xs font-medium ${metThreshold3 ? 'text-green-600' : 'text-gray-700'}`}>
                    Success Criteria #3
                  </div>
                  {canShowCheckboxes && !isEditing && (
                    <button
                      onClick={() => handleToggleThreshold(3, metThreshold3)}
                      disabled={loading3 || !canEdit}
                      className={`w-4 h-4 border rounded transition-colors ${
                        metThreshold3 
                          ? 'bg-green-500 border-green-500' 
                          : 'bg-white border-gray-300 hover:border-gray-400'
                      } ${(loading3 || !canEdit) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {metThreshold3 && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    value={editedSuccessCriteria3}
                    onChange={(e) => setEditedSuccessCriteria3(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    rows={2}
                    placeholder="Enter success criteria..."
                    disabled={isSaving}
                  />
                ) : (
                  <div className={`text-xs pl-1 ${metThreshold3 ? 'text-green-600' : 'text-gray-600'}`}>
                    {editedSuccessCriteria3 || '-'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Separator - only show if we have both checkboxes and learnings/next steps */}
          {canShowCheckboxes && canShowLearningsAndNextSteps && (
            <div className="border-t border-gray-200 my-4"></div>
          )}

          {/* ANALYSIS FILE */}
          {canShowLearningsAndNextSteps && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-gray-700">ANALYSIS</div>
                {resultsDeepdive ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewExpanded(!previewExpanded)}
                      className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
                    >
                      {previewExpanded ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          Hide Preview
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          Show Preview
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setPdfViewerOpen(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open Full
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isDeleting}
                        className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    )}
                  </div>
                ) : canEdit && (
                  <button
                    onClick={triggerFileSelect}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    Upload Analysis
                  </button>
                )}
              </div>
              
              {resultsDeepdive && Array.isArray(resultsDeepdive) && resultsDeepdive.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  {previewExpanded ? (
                    /* Aperçu PDF déployé */
                    <div className="space-y-2">
                      <div className="relative">
                        <iframe
                          src={`${resultsDeepdive[0].url}#page=1&toolbar=0&navpanes=0&scrollbar=0`}
                          className="w-full aspect-square border border-gray-200 rounded"
                          title="PDF Preview"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Miniature compacte */
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-900">
                          Deepdive Analysis Document
                        </div>
                        <div className="text-xs text-gray-500">
                          Click &quot;Show Preview&quot; to view the document
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Message when no analysis */}
              {(!resultsDeepdive || (Array.isArray(resultsDeepdive) && resultsDeepdive.length === 0)) && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500">
                    {canEdit 
                      ? 'No analysis uploaded. Click &quot;Upload Analysis&quot; to add a file.'
                      : 'No analysis available for this project.'
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Separator - only show if we have results deepdive and learnings */}
          {canShowLearningsAndNextSteps && resultsDeepdive && (
            <div className="border-t border-gray-200 my-4"></div>
          )}

          {/* LEARNINGS */}
          {canShowLearningsAndNextSteps && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">LEARNINGS</div>
              {isEditing && (
                <div className="text-xs text-gray-600 mb-2">
                  Add 2 or 3 bullet points that include the main learnings from this test.
                </div>
              )}
              {isEditing ? (
                <textarea
                  value={editedLearnings}
                  onChange={(e) => setEditedLearnings(e.target.value)}
                  disabled={isSaving}
                  placeholder="• Learning point 1&#10;• Learning point 2&#10;• Learning point 3"
                  className="w-full text-xs p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={4}
                />
              ) : (
                <div className="text-xs text-gray-900 whitespace-pre-wrap">
                  {learnings || '-'}
                </div>
              )}
            </div>
          )}

          {/* Separator - only show if we have both learnings and next steps */}
          {canShowLearningsAndNextSteps && (
            <div className="border-t border-gray-200 my-4"></div>
          )}

          {/* NEXT STEPS */}
          {canShowLearningsAndNextSteps && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">NEXT STEPS</div>
              {isEditing && (
                <div className="text-xs text-gray-600 mb-2">
                  Add 2 or 3 bullet points about the planned next steps.
                </div>
              )}
              {isEditing ? (
                <textarea
                  value={editedNextSteps}
                  onChange={(e) => setEditedNextSteps(e.target.value)}
                  disabled={isSaving}
                  placeholder="• Next step 1&#10;• Next step 2&#10;• Next step 3"
                  className="w-full text-xs p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={4}
                />
              ) : (
                <div className="text-xs text-gray-900 whitespace-pre-wrap">
                  {nextSteps || '-'}
                </div>
              )}
            </div>
          )}

          {/* Separator - only show if we have next steps and outcomes */}
          {canShowLearningsAndNextSteps && canShowConclusive && (
            <div className="border-t border-gray-200 my-4"></div>
          )}

          {/* OUTCOMES - Section discrète (modifiable par défaut) */}
          {canShowConclusive && (
            <div className="space-y-3">
              <div className="text-xs font-medium text-gray-700">OUTCOMES</div>
              
              {/* Conclusive et Win/Loss côte à côte */}
              <div className="grid grid-cols-2 gap-3">
                {/* Conclusive */}
                <div className="space-y-1">
                  <div className="text-xs text-gray-600">Conclusion</div>
                  <div className="relative" ref={conclusiveDropdownRef}>
                    <button
                      onClick={() => toggleDropdown('conclusive')}
                      disabled={conclusiveLoading || !canEdit || isEditing}
                      className={`w-full flex items-center justify-between p-2 rounded border transition-all ${
                        conclusive 
                          ? getChipColor(conclusive, 'conclusive')
                          : 'bg-white border-gray-300 hover:border-gray-400'
                      } ${(conclusiveLoading || !canEdit || isEditing) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="text-xs">
                        {conclusive || 'Select...'}
                      </span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${activeDropdown === 'conclusive' ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown */}
                    {showDropdown && activeDropdown === 'conclusive' && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto">
                        <div className="p-1">
                          <button
                            onClick={() => handleConclusiveChange('Conclusive')}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded flex items-center gap-2 cursor-pointer"
                          >
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            Conclusive
                          </button>
                          <button
                            onClick={() => handleConclusiveChange('Non Conclusive')}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded flex items-center gap-2 cursor-pointer"
                          >
                            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                            Non Conclusive
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Win/Loss */}
                <div className="space-y-1">
                  <div className="text-xs text-gray-600">Results</div>
                  <div className="relative" ref={winLossDropdownRef}>
                    <button
                      onClick={() => toggleDropdown('winLoss')}
                      disabled={winLossLoading || !canEdit || isEditing}
                      className={`w-full flex items-center justify-between p-2 rounded border transition-all ${
                        winLoss 
                          ? getChipColor(winLoss, 'winLoss')
                          : 'bg-white border-gray-300 hover:border-gray-400'
                      } ${(winLossLoading || !canEdit || isEditing) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="text-xs">
                        {winLoss || 'Select...'}
                      </span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${activeDropdown === 'winLoss' ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown */}
                    {showDropdown && activeDropdown === 'winLoss' && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-32 overflow-y-auto">
                        <div className="p-1">
                          <button
                            onClick={() => handleWinLossChange('Win')}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded flex items-center gap-2 cursor-pointer"
                          >
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            Win
                          </button>
                          <button
                            onClick={() => handleWinLossChange('Loss')}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded flex items-center gap-2 cursor-pointer"
                          >
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            Loss
                          </button>
                          <button
                            onClick={() => handleWinLossChange('Non Conclusive')}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded flex items-center gap-2 cursor-pointer"
                          >
                            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                            Non Conclusive
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MARK AS DONE CTA - Hidden if hideCompleteProject is true */}
          {!hideCompleteProject && (
            <>
              <div className="border-t border-gray-200 my-4"></div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">COMPLETE PROJECT</div>
                <div className="relative group">
                  <button
                    onClick={handleMarkAsDone}
                    disabled={!canMarkAsDone || isDone || markAsDoneLoading || !canEdit || isEditing}
                    className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                      canMarkAsDone && !isDone && canEdit && !isEditing
                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 cursor-pointer'
                        : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                    } ${markAsDoneLoading ? 'opacity-50' : ''}`}
                    title={getMarkAsDoneTooltip()}
                  >
                    {markAsDoneLoading ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle className={`w-4 h-4 ${canMarkAsDone && !isDone && !isEditing ? 'text-green-600' : 'text-gray-400'}`} />
                    )}
                    <span className="text-xs font-medium">
                      {isDone ? 'Project Completed' : 'Mark as Done'}
                    </span>
                  </button>
                  
                  {/* Tooltip au hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[9999] max-w-sm break-words">
                    {getMarkAsDoneTooltip()}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* PDF Viewer Overlay */}
      {Array.isArray(resultsDeepdive) && resultsDeepdive.length > 0 && resultsDeepdive[0].url && (
        <PDFViewer
          isOpen={pdfViewerOpen}
          onClose={() => setPdfViewerOpen(false)}
          pdfUrl={resultsDeepdive[0].url}
          title="Deepdive Analysis Document"
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Analysis
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this analysis file? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAnalysis}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 