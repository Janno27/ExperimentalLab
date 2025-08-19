'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

import { X, Settings as SettingsIcon, Bell, Clock, Link, Database, Shield, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GeneralSettings } from './general-settings'
import { NotificationsSettings } from './notifications-settings'
import { FormOptionsSettings } from './form-options-settings'
import { PersonalizationSettings } from './personalization-settings'
import { ConnectedAppsSettings } from './connected-apps-settings'
import { DataManagementSettings } from './data-management-settings'
import { SecuritySettings } from './security-settings'
import { AccountSettings } from './account-settings'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
}

const SETTINGS_SECTIONS = [
  {
    id: 'general',
    title: 'General',
    icon: SettingsIcon,
    description: 'General application settings'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Notification management'
  },
  {
    id: 'form-options',
    title: 'Form Options',
    icon: SettingsIcon,
    description: 'Manage form field options'
  },
  {
    id: 'personalization',
    title: 'Personalization',
    icon: Clock,
    description: 'Interface customization'
  },
  {
    id: 'connected-apps',
    title: 'Connected Apps',
    icon: Link,
    description: 'Integration management'
  },
  {
    id: 'data-management',
    title: 'Data Management',
    icon: Database,
    description: 'Data settings'
  },
  {
    id: 'security',
    title: 'Security',
    icon: Shield,
    description: 'Security settings'
  },
  {
    id: 'account',
    title: 'Account',
    icon: User,
    description: 'User account management'
  }
]

export function Settings({ isOpen, onClose }: SettingsProps) {
  const [activeSection, setActiveSection] = useState('general')

  const activeSectionData = SETTINGS_SECTIONS.find(section => section.id === activeSection)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="!w-[95vw] !max-w-[1000px] !h-[85vh] !max-h-[700px] !p-0 overflow-hidden flex" 
        style={{
          width: '95vw',
          maxWidth: '1000px',
          height: '85vh',
          maxHeight: '700px'
        }}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 z-50 p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>

        {/* Left Sidebar */}
        <div className="w-64 lg:w-72 border-r border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="p-4 lg:p-6 pt-12 lg:pt-16">
            <nav className="space-y-1 lg:space-y-2">
              {SETTINGS_SECTIONS.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 text-sm rounded-lg transition-colors cursor-pointer",
                      activeSection === section.id
                        ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{section.title}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 pt-12 lg:pt-16">
            {activeSectionData && (
              <div className="space-y-6 lg:space-y-8">
                <div>
                  <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">{activeSectionData.title}</h1>
                  <p className="text-sm text-gray-600 mt-1 lg:mt-2">{activeSectionData.description}</p>
                </div>
                
                {/* Render section content based on active section */}
                <SettingsContent section={activeSection} />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SettingsContent({ section }: { section: string }) {
  switch (section) {
    case 'general':
      return <GeneralSettings />
    case 'notifications':
      return <NotificationsSettings />
    case 'form-options':
      return <FormOptionsSettings />
    case 'personalization':
      return <PersonalizationSettings />
    case 'connected-apps':
      return <ConnectedAppsSettings />
    case 'data-management':
      return <DataManagementSettings />
    case 'security':
      return <SecuritySettings />
    case 'account':
      return <AccountSettings />
    default:
      return <div>Section not found</div>
  }
} 