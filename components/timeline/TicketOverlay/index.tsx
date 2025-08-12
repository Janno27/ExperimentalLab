'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Project } from '@/hooks/useExperimentation'
import { TicketOverlayHeader } from './TicketOverlayHeader'
import { TicketOverlayProperties } from './TicketOverlayProperties'
import { TicketOverlayTimeline } from './TicketOverlayTimeline'
import { TicketOverlayData } from './TicketOverlayData'
import { TicketOverlayAudience } from './TicketOverlayAudience'
import { TicketOverlayDescription } from './TicketOverlayDescription'
import { TicketOverlayResults } from './TicketOverlayResults'
import { Confetti } from '@/components/ui/confetti'
import { updateExperimentationFields, fetchExperimentations, fetchMarkets, fetchPages, fetchOwners, fetchKPIs, fetchProducts } from '@/lib/airtable'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

interface TicketOverlayProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onDataRefresh?: () => Promise<void>
}

export function TicketOverlay({ project, isOpen, onClose, onDataRefresh }: TicketOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [propertiesExpanded, setPropertiesExpanded] = useState(true)
  const [timelineExpanded, setTimelineExpanded] = useState(true)
  const [dataExpanded, setDataExpanded] = useState(false)
  const [audienceExpanded, setAudienceExpanded] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(true)
  const [resultsExpanded, setResultsExpanded] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [currentProject, setCurrentProject] = useState<Project | null>(project)
  
  const { canEdit, canView } = useAuth()

  // Fonction pour charger la dernière version des données depuis Airtable
  const loadLatestProjectData = useCallback(async (projectId: string) => {
    try {
      // Récupérer toutes les données nécessaires depuis Airtable
      const [experimentations, markets, pages, owners, kpis, products] = await Promise.all([
        fetchExperimentations(),
        fetchMarkets(),
        fetchPages(),
        fetchOwners(),
        fetchKPIs(),
        fetchProducts()
      ])

      // Trouver le projet spécifique
      const projectRecord = experimentations.find(record => record.id === projectId)
      if (!projectRecord) return

      // Helper pour trouver le nom depuis l'id (linked record)
      const getName = (id: string, arr: {id: string, name: string}[]) => arr.find(x => x.id === id)?.name || id

      // Récupérer les IDs des champs liés
      const marketIds = projectRecord.fields.Market as string[] || []
      const pageIds = projectRecord.fields.Page as string[] || []
      const ownerIds = projectRecord.fields.Owner as string[] || []
      const analysisOwnerIds = projectRecord.fields["Analysis' Owner"] as string[] || []
      const kpiIds = projectRecord.fields['Main KPI'] as string[] || []
      const productIds = projectRecord.fields.Product as string[] || []

      // Récupérer les noms depuis les tables liées
      const marketName = marketIds.length > 0 ? getName(marketIds[0], markets) : ""
      const pageName = pageIds.length > 0 ? getName(pageIds[0], pages) : ""
      const ownerName = ownerIds.length > 0 ? getName(ownerIds[0], owners) : ""
      const analysisOwnerName = analysisOwnerIds.length > 0 ? getName(analysisOwnerIds[0], owners) : ""
      const kpiName = kpiIds.length > 0 ? getName(kpiIds[0], kpis) : ""
      const productName = productIds.length > 0 ? getName(productIds[0], products) : ""

      // Récupérer le test type depuis le champ Type (comme dans useTimelineData.ts)
      const testTypeName = projectRecord.fields.Type as string || ""

      // Helper pour parser les dates
      const parseOptionalDate = (dateStr: string | undefined): Date | undefined => {
        if (!dateStr) return undefined
        const date = new Date(dateStr)
        return isNaN(date.getTime()) ? undefined : date
      }

      // Helper pour parser les nombres
      const parseOptionalNumber = (value: unknown): number | undefined => {
        if (value === null || value === undefined || value === '') return undefined
        const num = Number(value)
        return isNaN(num) ? undefined : num
      }

      // Créer le projet mis à jour avec toutes les données
      const updatedProject: Project = {
        id: projectRecord.id,
        country: marketName,
        section: projectRecord.fields.Section as string || "",
        title: projectRecord.fields.Title as string || projectRecord.fields.Name as string || "",
        status: projectRecord.fields.Status as "To be prioritized" | "Denied" | "Refinement" | "Design & Development" | "Setup" | "Running" | "Ready for Analysis" | "Analysing" | "Open" | "Done",
        startDate: new Date(projectRecord.fields['Start Date'] as string),
        endDate: new Date(projectRecord.fields['End Date'] as string),
        progress: 0, // Calculé dynamiquement
        owner: ownerName,
        analysisOwner: analysisOwnerName,
        mainKPI: kpiName,
        testType: testTypeName,
        estimatedTime: projectRecord.fields['Estimated Time'] as number || 0,
        mde: projectRecord.fields.MDE as string || "",
        successCriteria1: projectRecord.fields['Success Criteria #1'] as string || "",
        successCriteria2: projectRecord.fields['Success Criteria #2'] as string || "",
        successCriteria3: projectRecord.fields['Success Criteria #3'] as string || "",
        
        // Champs de timeline
        readyForAnalysisDate: parseOptionalDate(projectRecord.fields['Date - Ready for Analysis'] as string),
        analysisStartDate: parseOptionalDate(projectRecord.fields['Date - Analysis'] as string),
        analysisEndDate: parseOptionalDate(projectRecord.fields['Date - Analysis'] as string),
        doneDate: parseOptionalDate(projectRecord.fields['Date - Done'] as string),
        timeFromReadyToAnalysis: parseOptionalNumber(projectRecord.fields['Days from Waiting for Analysis to Analysing']),
        timeFromAnalysisToDone: parseOptionalNumber(projectRecord.fields['Days from Analysing to Done']),
        tool: projectRecord.fields['Tool:'] as string || "",
        scope: projectRecord.fields['Scope'] as string || "",
        
        // Champs pour la section Data
        audience: projectRecord.fields['Audience'] as string || "",
        conversion: projectRecord.fields['Conversion'] as string || "",
        existingRate: projectRecord.fields['Existing % Rate'] as string || "",
        trafficAllocation: projectRecord.fields['Traffic Allocation'] as string || "",
        
        // Champs pour la section Audience
        page: pageName,
        product: productName,
        devices: projectRecord.fields.Devices as string || "",
        
        // Champs pour la section Description
        hypothesis: projectRecord.fields.Hypothesis as string || "",
        description: projectRecord.fields.Description as string || "",
        context: projectRecord.fields.Context as string || "",
        
        // Champs pour les images
        control: projectRecord.fields.Control,
        variation1: projectRecord.fields['Variation 1'],
        
        // Champs pour les Met Threshold
        metThreshold1: projectRecord.fields['Met Threshold - Success Criteria #1'],
        metThreshold2: projectRecord.fields['Met Threshold - Success Criteria #2'],
        metThreshold3: projectRecord.fields['Met Threshold - Success Criteria #3'],
        
        // Champs pour les résultats
        learnings: projectRecord.fields['Learnings'] as string || "",
        nextSteps: projectRecord.fields['Next Steps'] as string || "",
        conclusive: projectRecord.fields['Conclusive vs Non Conclusive'] as string || "",
        winLoss: projectRecord.fields['Win vs Loss'] as string || "",
      }

      setCurrentProject(updatedProject)
      
      // Appliquer les conditions d'affichage basées sur le nouveau statut
      updateSectionStates(updatedProject.status)
    } catch (error) {
      console.error('Error loading latest project data:', error)
      // En cas d'erreur, on garde les données actuelles
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleConfetti = () => {
    setShowConfetti(true)
  }

  const handleConfettiComplete = () => {
    setShowConfetti(false)
  }

  // Vérifier si toutes les conditions sont remplies pour marquer comme "Done"
  const canMarkAsDone = () => {
    if (!currentProject) return false
    
    // Vérifier que les deux dropdowns ont des valeurs
    const hasConclusive = currentProject.conclusive && currentProject.conclusive.trim() !== ''
    const hasWinLoss = currentProject.winLoss && currentProject.winLoss.trim() !== ''
    
    // Vérifier que les champs Learnings et Next Steps ont des valeurs
    const hasLearnings = currentProject.learnings && currentProject.learnings.trim() !== ''
    const hasNextSteps = currentProject.nextSteps && currentProject.nextSteps.trim() !== ''
    
    // Vérifier que le statut actuel permet le changement
    const canUpdateStatus = ['Analysing', 'Done'].includes(currentProject.status)
    
    return hasConclusive && hasWinLoss && hasLearnings && hasNextSteps && canUpdateStatus
  }

  const handleMarkAsDone = async () => {
    if (!currentProject || !canMarkAsDone()) return
    
    setIsUpdatingStatus(true)
    try {
      await updateExperimentationFields(currentProject.id, {
        'Status': 'Done'
      })
      toast.success('Status updated to Done!')
      
      // Appliquer les conditions d'affichage pour le nouveau statut
      updateSectionStates('Done')
      
      // Rafraîchir les données de la timeline
      if (onDataRefresh) {
        await onDataRefresh()
      }
      
      // Fermer l'overlay après la mise à jour
      onClose()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Error updating status')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Fonction pour gérer automatiquement l'état des sections basé sur le statut
  const updateSectionStates = (projectStatus: string) => {
    const runningStatuses = ['Running', 'Ready for Analysis', 'Analysing', 'Done']
    
    if (runningStatuses.includes(projectStatus)) {
      // Fermer Description et ouvrir Results
      setDescriptionExpanded(false)
      setResultsExpanded(true)
    } else {
      // Pour tous les autres statuts : fermer Data, Audience, Results et ouvrir Description, Properties
      setDataExpanded(false)
      setAudienceExpanded(false)
      setResultsExpanded(false)
      setDescriptionExpanded(true)
      setPropertiesExpanded(true)
    }
  }

  // Charger les données mises à jour quand l'overlay s'ouvre
  useEffect(() => {
    if (isOpen && project) {
      loadLatestProjectData(project.id)
    }
  }, [isOpen, project, loadLatestProjectData])

  // Mettre à jour currentProject quand project change
  useEffect(() => {
    setCurrentProject(project)
  }, [project, currentProject])

  // Mettre à jour automatiquement les sections quand le statut change
  useEffect(() => {
    if (currentProject) {
      updateSectionStates(currentProject.status)
    }
  }, [currentProject])

  if (!isOpen || !currentProject) return null

  return (
    <>
      <div className="absolute inset-0 z-[9999] pointer-events-none">
        {/* Fenêtre qui couvre la zone du cadre rouge */}
        <div 
          ref={overlayRef}
          className="absolute top-5 right-5 w-[420px] h-[calc(100%-2.5rem)] bg-white shadow-xs border border-gray-200 rounded-md pointer-events-auto flex flex-col"
        >
          {/* Header */}
          <TicketOverlayHeader 
            project={currentProject} 
            onClose={onClose} 
          />

          {/* Contenu avec scroll */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Section Properties */}
              <TicketOverlayProperties 
                project={currentProject}
                expanded={propertiesExpanded}
                onToggleExpanded={() => setPropertiesExpanded(!propertiesExpanded)}
                canEdit={canEdit()}
                canView={canView()}
              />

              {/* Section Timeline */}
              <TicketOverlayTimeline 
                project={currentProject}
                expanded={timelineExpanded}
                onToggleExpanded={() => setTimelineExpanded(!timelineExpanded)}
              />

              {/* Section Data */}
              <TicketOverlayData 
                project={currentProject}
                expanded={dataExpanded}
                onToggleExpanded={() => setDataExpanded(!dataExpanded)}
                canEdit={canEdit()}
                canView={canView()}
                onDataRefresh={onDataRefresh}
                onLocalRefresh={async () => {
                  if (currentProject) {
                    await loadLatestProjectData(currentProject.id)
                  }
                }}
              />

              {/* Section Audience */}
              <TicketOverlayAudience 
                project={currentProject}
                expanded={audienceExpanded}
                onToggleExpanded={() => setAudienceExpanded(!audienceExpanded)}
                canEdit={canEdit()}
                canView={canView()}
                onDataRefresh={onDataRefresh}
                onLocalRefresh={async () => {
                  if (currentProject) {
                    await loadLatestProjectData(currentProject.id)
                  }
                }}
              />

              {/* Section Description */}
              <TicketOverlayDescription 
                project={currentProject}
                expanded={descriptionExpanded}
                onToggleExpanded={() => setDescriptionExpanded(!descriptionExpanded)}
                canEdit={canEdit()}
                canView={canView()}
              />

              {/* Section Results */}
              <TicketOverlayResults 
                project={currentProject}
                expanded={resultsExpanded}
                onToggleExpanded={() => setResultsExpanded(!resultsExpanded)}
                onConfetti={handleConfetti}
                onDataRefresh={onDataRefresh}
                canEdit={canEdit()}
                canView={canView()}
              />

              {/* CTA discret pour marquer comme Done */}
              {canMarkAsDone() && (
                <div className="pt-3 border-t border-gray-100">
                  <button
                    onClick={handleMarkAsDone}
                    disabled={isUpdatingStatus}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-all duration-200 border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isUpdatingStatus ? (
                      <>
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating status...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Mark as Done</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Animation de confettis */}
      <Confetti 
        isActive={showConfetti} 
        onComplete={handleConfettiComplete}
      />
    </>
  )
} 