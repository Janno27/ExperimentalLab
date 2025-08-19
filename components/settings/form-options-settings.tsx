'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Plus, X, Edit2, Save, Trash2 } from 'lucide-react'

interface FormOption {
  id: string
  name: string
  color?: string
}

export function FormOptionsSettings() {
  const [roleOptions, setRoleOptions] = useState<FormOption[]>([
    { id: '1', name: 'Checkout Core' },
    { id: '2', name: 'Country Team' },
    { id: '3', name: 'CRM' },
    { id: '4', name: 'CRO' },
    { id: '5', name: 'E-Commerce' },
    { id: '6', name: 'Product Success' },
    { id: '7', name: 'Shopping Journey' },
    { id: '8', name: 'Webshop Foundations' }
  ])

  const [toolOptions, setToolOptions] = useState<FormOption[]>([
    { id: '1', name: 'A/B Tasty' },
    { id: '2', name: 'Trbo' },
    { id: '3', name: 'Insider' },
    { id: '4', name: 'Paid Search' }
  ])

  const [testTypeOptions, setTestTypeOptions] = useState<FormOption[]>([
    { id: '1', name: 'A/B-Test' },
    { id: '2', name: 'Personalization' },
    { id: '3', name: 'Fix/Patch' }
  ])

  const [scopeOptions, setScopeOptions] = useState<FormOption[]>([
    { id: '1', name: 'Market Specificity' },
    { id: '2', name: 'Global Initiative' }
  ])

  const [editingOption, setEditingOption] = useState<{ id: string, field: string, value: string } | null>(null)
  const [newOption, setNewOption] = useState<{ field: string, value: string } | null>(null)

  const handleEdit = (id: string, field: string, currentValue: string) => {
    setEditingOption({ id, field, value: currentValue })
  }

  const handleSave = (field: string) => {
    if (editingOption) {
      const updateFunction = getUpdateFunction(field)
      updateFunction(prev => prev.map(option => 
        option.id === editingOption.id 
          ? { ...option, name: editingOption.value }
          : option
      ))
      setEditingOption(null)
    }
  }

  const handleAdd = (field: string) => {
    if (newOption && newOption.field === field && newOption.value.trim()) {
      const updateFunction = getUpdateFunction(field)
      updateFunction(prev => [...prev, { 
        id: Date.now().toString(), 
        name: newOption.value.trim() 
      }])
      setNewOption(null)
    }
  }

  const handleDelete = (id: string, field: string) => {
    const updateFunction = getUpdateFunction(field)
    updateFunction(prev => prev.filter(option => option.id !== id))
  }

  const getUpdateFunction = (field: string) => {
    switch (field) {
      case 'role': return setRoleOptions
      case 'tool': return setToolOptions
      case 'testType': return setTestTypeOptions
      case 'scope': return setScopeOptions
      default: return setRoleOptions
    }
  }

  const getOptions = (field: string) => {
    switch (field) {
      case 'role': return roleOptions
      case 'tool': return toolOptions
      case 'testType': return testTypeOptions
      case 'scope': return scopeOptions
      default: return roleOptions
    }
  }

  const renderOptionList = (field: string, title: string) => {
    const options = getOptions(field)
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-900">{title}</h3>
          <Button
            size="sm"
            onClick={() => setNewOption({ field, value: '' })}
            className="cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Option
          </Button>
        </div>

        <div className="space-y-2">
          {options.map((option) => (
            <div key={option.id} className="flex items-center justify-between p-2 lg:p-3 border border-gray-200 rounded-lg">
              {editingOption?.id === option.id && editingOption.field === field ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editingOption.value}
                    onChange={(e) => setEditingOption({ ...editingOption, value: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSave(field)}
                    className="cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingOption(null)}
                    className="cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-gray-700">{option.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(option.id, field, option.name)}
                      className="cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(option.id, field)}
                      className="cursor-pointer text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {newOption?.field === field && (
            <div className="flex items-center gap-2 p-2 lg:p-3 border border-gray-200 rounded-lg">
              <Input
                placeholder="Enter new option..."
                value={newOption.value}
                onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => handleAdd(field)}
                className="cursor-pointer"
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNewOption(null)}
                className="cursor-pointer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderOptionList('role', 'Role Options')}
        {renderOptionList('tool', 'Tool Options')}
        {renderOptionList('testType', 'Test Type Options')}
        {renderOptionList('scope', 'Scope Options')}
      </div>
    </div>
  )
} 