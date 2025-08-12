import React, { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Edit2, Check, X } from 'lucide-react'
import { Project } from '@/hooks/useExperimentation'
import { fetchPages, fetchProducts, fetchDevices, updateExperimentationFields } from '@/lib/airtable'
import { toast } from 'sonner'

interface TicketOverlayAudienceProps {
  project: Project
  expanded: boolean
  onToggleExpanded: () => void
  canEdit: boolean
  canView: boolean
  onDataRefresh?: () => Promise<void>
  onLocalRefresh?: () => Promise<void> | void
}

export function TicketOverlayAudience({ project, expanded, onToggleExpanded, canEdit, onDataRefresh, onLocalRefresh }: TicketOverlayAudienceProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedProject, setEditedProject] = useState<Project>(project)
  
  // États pour les options des champs
  const [pages, setPages] = useState<{id: string, name: string}[]>([])
  const [products, setProducts] = useState<{id: string, name: string}[]>([])
  const [devices, setDevices] = useState<string[]>([])
  const [pagesLoading, setPagesLoading] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)
  const [devicesLoading, setDevicesLoading] = useState(false)

  // États pour les IDs sélectionnés (pour les champs de liaison)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  // Charger les données auxiliaires quand on entre en mode édition
  useEffect(() => {
    const loadAuxData = async () => {
      if (!isEditing) return
      
      try {
        setPagesLoading(true)
        const pagesList = await fetchPages()
        setPages(pagesList)
        // Trouver l'ID de la page actuelle
        const currentPage = pagesList.find(p => p.name === project.page)
        setSelectedPageId(currentPage?.id || null)
      } catch {
        setPages([])
      } finally { 
        setPagesLoading(false) 
      }

      try {
        setProductsLoading(true)
        const productsList = await fetchProducts()
        setProducts(productsList)
        // Trouver l'ID du product actuel
        const currentProduct = productsList.find(p => p.name === project.product)
        setSelectedProductId(currentProduct?.id || null)
      } catch {
        setProducts([])
      } finally { 
        setProductsLoading(false) 
      }

      try {
        setDevicesLoading(true)
        const devicesList = await fetchDevices()
        setDevices(devicesList)
      } catch {
        setDevices([])
      } finally { 
        setDevicesLoading(false) 
      }
    }
    loadAuxData()
  }, [isEditing, project.page, project.product])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const fieldsToUpdate: Record<string, unknown> = {}

      // Page (champ de liaison)
      if (selectedPageId && project.page !== pages.find(p => p.id === selectedPageId)?.name) {
        fieldsToUpdate['Page'] = [selectedPageId]
      } else if (!selectedPageId && project.page) {
        // Si on supprime la sélection
        fieldsToUpdate['Page'] = []
      }
      
      // Product (champ de liaison)
      if (selectedProductId && project.product !== products.find(p => p.id === selectedProductId)?.name) {
        fieldsToUpdate['Product'] = [selectedProductId]
      } else if (!selectedProductId && project.product) {
        // Si on supprime la sélection
        fieldsToUpdate['Product'] = []
      }
      
      // Devices (champ de sélection unique)
      if (editedProject.devices !== project.devices) {
        fieldsToUpdate['Devices'] = editedProject.devices || ''
      }

      if (Object.keys(fieldsToUpdate).length > 0) {
        await updateExperimentationFields(project.id, fieldsToUpdate)
        toast.success('Audience updated successfully!')
        setIsEditing(false)
        if (onLocalRefresh) await onLocalRefresh()
        if (onDataRefresh) await onDataRefresh()
      }
    } catch (error) {
      toast.error('Failed to update audience.')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedProject(project)
    // Réinitialiser les IDs sélectionnés
    const currentPage = pages.find(p => p.name === project.page)
    const currentProduct = products.find(p => p.name === project.product)
    setSelectedPageId(currentPage?.id || null)
    setSelectedProductId(currentProduct?.id || null)
    setIsEditing(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button 
          onClick={onToggleExpanded}
          className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
        >
          Audience
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
          {/* Ligne : Page, Product, Devices */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Page</div>
              {isEditing ? (
                <select
                  value={selectedPageId || ''}
                  onChange={(e) => setSelectedPageId(e.target.value || null)}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={pagesLoading || isSaving}
                >
                  <option value="">-</option>
                  {pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs">
                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 text-xs rounded font-medium truncate block">
                    {project.page || '-'}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Product</div>
              {isEditing ? (
                <select
                  value={selectedProductId || ''}
                  onChange={(e) => setSelectedProductId(e.target.value || null)}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={productsLoading || isSaving}
                >
                  <option value="">-</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs">
                  <span className="px-1.5 py-0.5 bg-pink-100 text-pink-800 text-xs rounded font-medium truncate block">
                    {project.product || '-'}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Devices</div>
              {isEditing ? (
                <select
                  value={editedProject.devices || ''}
                  onChange={(e) => setEditedProject(prev => ({ ...prev, devices: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={devicesLoading || isSaving}
                >
                  <option value="">-</option>
                  {devices.map((device) => (
                    <option key={device} value={device}>
                      {device}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs">
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-medium truncate block">
                    {project.devices || '-'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 