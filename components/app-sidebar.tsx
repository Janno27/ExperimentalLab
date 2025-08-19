"use client"

import * as React from "react"
import {
  BookOpen,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  LayoutDashboard,
  Kanban,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Settings } from "@/components/settings"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react"
import { supabase } from '@/lib/supabase'
import { ChevronDown, Building2, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Kanban",
      url: "/kanban",
      icon: Kanban,
    },
    {
      title: "Timeline",
      url: "/timeline",
      icon: BookOpen,
      items: [
        {
          title: "Live Test",
          url: "/timeline?tab=live-test",
        },
        {
          title: "Market Overview",
          url: "/timeline?tab=market-overview",
        },
        {
          title: "Completed Test",
          url: "/timeline?tab=completed-test",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [profile, setProfile] = useState<{ name?: string, email?: string, avatar?: string }>({})
  const [organization, setOrganization] = useState<{ id: string, name: string, avatar_url?: string } | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<Array<{ id: string, name: string, avatar_url?: string }>>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Récupérer le profil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email, avatar_url, main_organization_id')
          .eq('id', user.id)
          .single()
        
        setProfile({
          name: profileData?.full_name || '',
          email: profileData?.email || user.email || '',
          avatar: profileData?.avatar_url || undefined,
        })

        // Récupérer toutes les organisations où l'utilisateur est membre
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('role, organization_id, organizations(id, name, avatar_url)')
          .eq('user_id', user.id)

        if (memberData && memberData.length > 0) {
          // Trouver le rôle le plus élevé (super_admin > admin > member)
          const roles = ['super_admin', 'admin', 'member']
          const highestRole = memberData.reduce((highest, member) => {
            const currentRoleIndex = roles.indexOf(member.role)
            const highestRoleIndex = roles.indexOf(highest.role)
            return currentRoleIndex < highestRoleIndex ? member : highest
          })
          
          setUserRole(highestRole.role)

          // Si super admin, récupérer toutes les organisations
          if (highestRole.role === 'super_admin') {
            const { data: allOrgs } = await supabase
              .from('organizations')
              .select('id, name, avatar_url')
            
            if (allOrgs) {
              setOrganizations(allOrgs)
            }
          }

          // Récupérer l'organisation principale (soit depuis le profil, soit la première)
          let mainOrgId = profileData?.main_organization_id
          
          if (!mainOrgId && memberData.length > 0) {
            // Si pas d'organisation principale définie, utiliser la première
            mainOrgId = memberData[0].organization_id
          }

          if (mainOrgId) {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('id, name, avatar_url')
              .eq('id', mainOrgId)
              .single()
            
            if (orgData) {
              setOrganization(orgData)
            }
          }
        }
      }
    }
    fetchData()
  }, [])

  const handleOrganizationSwitch = async (orgId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Mettre à jour le profil avec la nouvelle organisation principale
      const { error } = await supabase
        .from('profiles')
        .update({ main_organization_id: orgId })
        .eq('id', user.id)
      
      if (error) {
        console.error('Error updating profile:', error)
        return
      }
      
      // Notifier les autres composants du changement d'organisation
      localStorage.setItem('organization_changed', Date.now().toString())
      
      // Recharger la page pour mettre à jour l'interface
      window.location.reload()
    }
  }

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {userRole === 'super_admin' && organizations.length > 1 ? (
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                      {organization?.avatar_url ? (
                        <Image 
                          src={organization.avatar_url} 
                          alt={organization.name}
                          width={24}
                          height={24}
                        />
                      ) : (
                        <Building2 className="size-4" />
                      )}
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{organization?.name || 'Loading...'}</span>
                      <span className="truncate text-xs">Organization</span>
                    </div>
                    <ChevronDown className="size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="start">
                  <div className="p-2">
                    <div className="text-sm font-medium mb-2">Switch Organization</div>
                    <div className="space-y-1">
                      {organizations.map((org) => (
                        <DropdownMenuItem key={org.id} asChild>
                          <button
                            className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-100 cursor-pointer text-left"
                            onClick={() => {
                              setDropdownOpen(false)
                              handleOrganizationSwitch(org.id)
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                {org.avatar_url ? (
                                  <Image 
                                    src={org.avatar_url} 
                                    alt={org.name}
                                    width={24}
                                    height={24}
                                  />
                                ) : (
                                  <Building2 className="w-4 h-4 text-gray-600" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{org.name}</span>
                                <span className="text-xs text-gray-500">Organization</span>
                              </div>
                            </div>
                            {organization?.id === org.id && (
                              <Check className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton size="lg">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  {organization?.avatar_url ? (
                    <Image 
                      src={organization.avatar_url} 
                      alt={organization.name}
                      width={24}
                      height={24}
                    />
                  ) : (
                    <Building2 className="size-4" />
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{organization?.name || 'Loading...'}</span>
                  <span className="truncate text-xs">Organization</span>
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects />
        <NavSecondary 
          items={data.navSecondary} 
          className="mt-auto" 
          onSettingsOpen={() => setSettingsOpen(true)}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={profile} />
      </SidebarFooter>
      
      {/* Settings Modal */}
      <Settings 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </Sidebar>
  )
}
