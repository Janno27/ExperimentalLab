"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import { useState, useEffect } from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {


  
  // État local pour gérer l'ouverture/fermeture des sous-menus
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

  // Initialiser l'état au chargement
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-menu-state')
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        setOpenMenus(parsedState)
      } catch (error) {
        console.error('Error parsing saved menu state:', error)
      }
    } else {
      // État initial par défaut
      const initialState: Record<string, boolean> = {}
      items.forEach(item => {
        if (item.title === "Timeline") {
          initialState[item.title] = true // Timeline ouvert par défaut
        } else {
          initialState[item.title] = item.isActive || false
        }
      })
      setOpenMenus(initialState)
      localStorage.setItem('sidebar-menu-state', JSON.stringify(initialState))
    }
  }, [items])

  // Sauvegarder l'état quand il change
  const handleMenuToggle = (title: string, isOpen: boolean) => {
    const newState = { ...openMenus, [title]: isOpen }
    setOpenMenus(newState)
    localStorage.setItem('sidebar-menu-state', JSON.stringify(newState))
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible 
            key={item.title} 
            asChild 
            open={openMenus[item.title]}
            onOpenChange={(isOpen) => handleMenuToggle(item.title, isOpen)}
          >
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
