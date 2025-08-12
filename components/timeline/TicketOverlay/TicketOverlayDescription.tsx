import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Edit2, Check, X } from 'lucide-react'
import Image from 'next/image'
import { Project } from '@/hooks/useExperimentation'
import { updateExperimentationFields } from '@/lib/airtable'
import { toast } from 'sonner'

interface TicketOverlayDescriptionProps {
  project: Project
  expanded: boolean
  onToggleExpanded: () => void
  canEdit: boolean
  canView: boolean
  onDataRefresh?: () => Promise<void>
  onLocalRefresh?: () => Promise<void> | void
}

// Helper pour extraire l'URL d'un champ d'attachement Airtable
const getAttachmentUrl = (field: unknown): string | null => {
  if (Array.isArray(field) && field.length > 0 && field[0]?.url) {
    return field[0].url
  }
  return null
}

// Composant Image avec skeleton
function ImageWithSkeleton({ src, alt, width, height, className }: { src: string, alt: string, width: number, height: number, className?: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return <div className="text-xs text-gray-500 mt-1">Image non disponible</div>
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} bg-gray-200 animate-pulse rounded`} style={{ width, height }} />
      )}
      <Image 
        src={src} 
        alt={alt} 
        width={width}
        height={height}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
    </div>
  )
}

export function TicketOverlayDescription({ project, expanded, onToggleExpanded, canEdit, onDataRefresh, onLocalRefresh }: TicketOverlayDescriptionProps) {
  const [contextExpanded, setContextExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedProject, setEditedProject] = useState<Project>(project)

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const fieldsToUpdate: Record<string, unknown> = {}

      // Hypothesis
      if (editedProject.hypothesis !== project.hypothesis) {
        fieldsToUpdate['Hypothesis'] = editedProject.hypothesis || ''
      }
      
      // Description
      if (editedProject.description !== project.description) {
        fieldsToUpdate['Description'] = editedProject.description || ''
      }
      
      // Context
      if (editedProject.context !== project.context) {
        fieldsToUpdate['Context'] = editedProject.context || ''
      }

      if (Object.keys(fieldsToUpdate).length > 0) {
        await updateExperimentationFields(project.id, fieldsToUpdate)
        toast.success('Description updated successfully!')
        setIsEditing(false)
        if (onLocalRefresh) await onLocalRefresh()
        if (onDataRefresh) await onDataRefresh()
      }
    } catch (error) {
      toast.error('Failed to update description.')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedProject(project)
    setIsEditing(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button 
          onClick={onToggleExpanded}
          className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
        >
          Description
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
          {/* Hypothesis */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">Hypothesis</div>
            {isEditing ? (
              <textarea
                value={editedProject.hypothesis || ''}
                onChange={(e) => setEditedProject(prev => ({ ...prev, hypothesis: e.target.value }))}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Enter hypothesis..."
                disabled={isSaving}
              />
            ) : (
              <div className="text-xs text-gray-900 italic">
                {project.hypothesis || '-'}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">Description</div>
            {isEditing ? (
              <textarea
                value={editedProject.description || ''}
                onChange={(e) => setEditedProject(prev => ({ ...prev, description: e.target.value }))}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                rows={4}
                placeholder="Enter description..."
                disabled={isSaving}
              />
            ) : (
              <div className="text-xs text-gray-900">
                {project.description || '-'}
              </div>
            )}
          </div>

          {/* Context (collapsible) */}
          <div className="space-y-2">
            <button 
              onClick={() => setContextExpanded(!contextExpanded)}
              className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Context
              {contextExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {contextExpanded && (
              <div className="pl-6">
                {isEditing ? (
                  <textarea
                    value={editedProject.context || ''}
                    onChange={(e) => setEditedProject(prev => ({ ...prev, context: e.target.value }))}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    rows={4}
                    placeholder="Enter context..."
                    disabled={isSaving}
                  />
                ) : (
                  <div className="text-xs text-gray-900">
                    {project.context || '-'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Images Control et Variation 1 */}
          {(project.control || project.variation1) && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                {project.control && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-600">Control</div>
                    {(() => {
                      const controlUrl = getAttachmentUrl(project.control)
                      return controlUrl ? (
                        <ImageWithSkeleton 
                          src={controlUrl} 
                          alt="Control" 
                          width={150}
                          height={100}
                          className="rounded max-h-24 object-contain" 
                        />
                      ) : (
                        <div className="text-xs text-gray-500">Aucune image</div>
                      )
                    })()}
                  </div>
                )}
                {project.variation1 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-600">Variation 1</div>
                    {(() => {
                      const variationUrl = getAttachmentUrl(project.variation1)
                      return variationUrl ? (
                        <ImageWithSkeleton 
                          src={variationUrl} 
                          alt="Variation 1" 
                          width={150}
                          height={100}
                          className="rounded max-h-24 object-contain" 
                        />
                      ) : (
                        <div className="text-xs text-gray-500">Aucune image</div>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 