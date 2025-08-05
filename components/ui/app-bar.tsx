"use client"
import * as React from "react"
import { useState } from "react"
import { Bell, Settings2, User2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type AppBarProps = {
  children?: React.ReactNode
  open?: boolean
  setOpen?: (open: boolean) => void
}

export function AppBar({ children, open: controlledOpen, setOpen: controlledSetOpen }: AppBarProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = controlledSetOpen || setUncontrolledOpen

  // Animation classes pour fade + slide
  const iconAnim = `transition-all duration-300 ease-in-out ${open ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`
  const iconBtn = `rounded-xl p-2 flex items-center justify-center mx-auto cursor-pointer hover:bg-violet-100 hover:scale-105 hover:shadow-sm focus-visible:bg-violet-100 focus-visible:scale-105 focus-visible:shadow-sm transition-all`;
  const iconBtnGray = `rounded-xl p-2 flex items-center justify-center mx-auto cursor-pointer hover:bg-gray-100 hover:scale-105 hover:shadow-sm focus-visible:bg-gray-100 focus-visible:scale-105 focus-visible:shadow-sm transition-all`;

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={`fixed right-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out ${open ? 'w-12' : 'w-6'} pointer-events-none`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {/* Zone de détection du hover */}
        <div className="absolute left-0 top-0 h-full w-8 cursor-pointer" style={{ zIndex: 1 }} />
        {/* Header */}
        <div className={`flex flex-col items-center py-4 gap-4 pointer-events-auto w-full`} style={{ zIndex: 2 }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`${iconBtn} ${iconAnim}`} tabIndex={open ? 0 : -1} style={{ background: 'transparent' }}>
                <Bell className="w-4 h-4 text-violet-700" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" align="center">Notifications</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`${iconBtnGray} ${iconAnim}`} tabIndex={open ? 0 : -1} style={{ background: 'transparent' }}>
                <Settings2 className="w-4 h-4 text-gray-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" align="center">Settings</TooltipContent>
          </Tooltip>
        </div>
        {/* Content (actions ou widgets) */}
        <div className={`flex-1 flex flex-col items-center justify-center gap-6 pointer-events-auto w-full`} style={{ zIndex: 2 }}>
          {children && (
            <div className={iconAnim}>{children}</div>
          )}
        </div>
        {/* Footer (profil) */}
        <div className={`flex flex-col items-center py-4 pointer-events-auto w-full`} style={{ zIndex: 2 }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`${iconBtnGray} ${iconAnim}`} tabIndex={open ? 0 : -1} style={{ background: 'transparent' }}>
                <User2 className="w-4 h-4 text-gray-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" align="center">Profile</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
} 