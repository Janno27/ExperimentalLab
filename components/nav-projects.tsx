"use client"

import { useState, useEffect } from "react"
import {
  Folder,
  MoreHorizontal,
  Share,
  TrendingUp,
  FlaskConical,
  Sparkles,
  Wrench,
} from "lucide-react"
import { fetchExperimentations, fetchMarkets, fetchOwners } from "@/lib/airtable"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface RecentTest {
  id: string
  name: string
  doneDate: Date
  market: string
  owner: string
  conclusive?: string
  winLoss?: string
  type?: string
}

// Fonction pour obtenir l'icône selon le type avec couleur basée sur Win vs Loss
function typeIcon(type?: string, winLoss?: string) {
  // Déterminer la couleur basée sur Win vs Loss
  let colorClass = "text-gray-400" // Couleur par défaut
  
  if (winLoss === "Win") {
    colorClass = "text-green-500"
  } else if (winLoss === "Loss") {
    colorClass = "text-red-500"
  } else if (winLoss === "Non Conclusive") {
    colorClass = "text-gray-500"
  }
  
  // Retourner l'icône avec la couleur appropriée
  if (!type) return null
  if (type === 'A/B-Test') return <span className="flex items-center"><FlaskConical size={15} className={colorClass} /><span className="sr-only">A/B-Test</span></span>
  if (type === 'Personalization') return <span className="flex items-center"><Sparkles size={15} className={colorClass} /><span className="sr-only">Personalization</span></span>
  if (type === 'Fix/Patch') return <span className="flex items-center"><Wrench size={15} className={colorClass} /><span className="sr-only">Fix/Patch</span></span>
  return null
}

export function NavProjects() {
  const { isMobile } = useSidebar()
  const [recentTests, setRecentTests] = useState<RecentTest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRecentTests = async () => {
      try {
        setLoading(true)
        
        // Récupérer les données d'Airtable
        const [experimentations, markets, owners] = await Promise.all([
          fetchExperimentations(),
          fetchMarkets(),
          fetchOwners()
        ])

        // Helper pour trouver le nom depuis l'id
        const getName = (id: string, arr: {id: string, name: string}[]) => 
          arr.find(x => x.id === id)?.name || id

        // Filtrer les tests avec status "Done" et une date de fin
        const doneTests = experimentations
          .filter(record => {
            const status = record.fields.Status as string
            const doneDate = record.fields['Date - Done'] as string
            return status === "Done" && doneDate && doneDate.trim() !== ""
          })
          .map(record => {
            const marketIds = record.fields.Market as string[] || []
            const ownerIds = record.fields.Owner as string[] || []
            const conclusiveArray = record.fields['Conclusive vs Non Conclusive'] as string[] || []
            const winLossArray = record.fields['Win vs Loss'] as string[] || []
            
            const marketName = marketIds.length > 0 ? getName(marketIds[0], markets) : ""
            const ownerName = ownerIds.length > 0 ? getName(ownerIds[0], owners) : ""
            
            // Extraire les valeurs de conclusive et winLoss
            const conclusiveRaw = conclusiveArray.length > 0 ? conclusiveArray[0] : ""
            const winLossRaw = winLossArray.length > 0 ? winLossArray[0] : ""
            
            const conclusive = conclusiveRaw === "C" || conclusiveRaw === "Conclusive" ? "Conclusive" : 
                              conclusiveRaw === "N" || conclusiveRaw === "Non Conclusive" ? "Non Conclusive" : 
                              conclusiveRaw
            const winLoss = winLossRaw === "W" || winLossRaw === "Win" ? "Win" : 
                           winLossRaw === "L" || winLossRaw === "Loss" ? "Loss" : 
                           winLossRaw

            return {
              id: record.id,
              name: record.fields.Title as string || record.fields.Name as string || "Untitled",
              doneDate: new Date(record.fields['Date - Done'] as string),
              market: marketName,
              owner: ownerName,
              conclusive,
              winLoss,
              type: record.fields.Type as string
            }
          })
          .sort((a, b) => b.doneDate.getTime() - a.doneDate.getTime()) // Trier par date décroissante
          .slice(0, 5) // Prendre les 5 plus récents

        setRecentTests(doneTests)
      } catch (error) {
        console.error('Error loading recent tests:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRecentTests()
  }, [])

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Recent Tests</SidebarGroupLabel>
      <SidebarMenu>
        {loading ? (
          // Skeleton loading
          Array.from({ length: 5 }).map((_, index) => (
            <SidebarMenuItem key={`loading-${index}`}>
              <SidebarMenuButton disabled>
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded animate-pulse mb-1" />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))
        ) : recentTests.length > 0 ? (
          recentTests.map((test) => (
            <SidebarMenuItem key={test.id}>
              <SidebarMenuButton asChild tooltip={`${test.name} - ${test.market}`}>
                <a href={`/timeline?tab=completed-test`}>
                  {typeIcon(test.type, test.winLoss)}
                  <span className="truncate text-sm">{test.name}</span>
                </a>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem>
                    <Folder className="text-muted-foreground" />
                    <span>View Details</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share className="text-muted-foreground" />
                    <span>Share Results</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <TrendingUp className="text-muted-foreground" />
                    <span>View Timeline</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))
        ) : (
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <Folder className="text-muted-foreground" />
              <span className="text-muted-foreground">No completed tests</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <a href="/timeline?tab=completed-test">
              <MoreHorizontal />
              <span>View All</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
