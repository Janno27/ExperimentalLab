"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { SettingOrganization } from '@/components/setting/setting-organization'
import { useOrganizationApprovals } from '@/hooks/useOrganizationApprovals'

export function NavUser({
  user,
}: {
  user: {
    name?: string
    email?: string
    avatar?: string
  }
}) {
  const { isMobile } = useSidebar()
  const { signOut } = useAuth()
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'US'
  const [showOrgSettings, setShowOrgSettings] = useState(false)
  const { approvalCount } = useOrganizationApprovals()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="relative">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar || ''} alt={user.name || 'User'} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                {/* Indicateur de notification sur l'avatar */}
                {approvalCount > 0 && (
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-violet-500 rounded-full border border-white shadow-sm" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name ? user.name : 'No name'}</span>
                <span className="truncate text-xs">{user.email ? user.email : 'No email'}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={`w-[min(420px,90vw)] min-w-56 rounded-lg ${showOrgSettings ? 'max-w-xl' : ''}`}
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {showOrgSettings ? (
              <div className="py-2 px-1">
                <button onClick={() => setShowOrgSettings(false)} className="mb-2 text-xs text-gray-500 hover:underline">← Back</button>
                <SettingOrganization />
              </div>
            ) : (
              <>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <div className="relative">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={user.avatar || ''} alt={user.name || 'User'} />
                        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                      </Avatar>
                      {/* Indicateur de notification sur l'avatar dans le dropdown */}
                      {approvalCount > 0 && (
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-violet-500 rounded-full border border-white shadow-sm" />
                      )}
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.name || 'User'}</span>
                      <span className="truncate text-xs">{user.email || ''}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); setShowOrgSettings(true); }} className="relative">
                  <BadgeCheck />
                  Manage organization
                  {/* Indicateur de notification avec nombre */}
                  {approvalCount > 0 && (
                    <span className="ml-auto min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-medium bg-violet-100 text-violet-700 rounded-full">
                      {approvalCount > 9 ? '9+' : approvalCount}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Sparkles />
                    Upgrade to Pro
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <BadgeCheck />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
