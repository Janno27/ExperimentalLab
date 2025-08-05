import { useState, useEffect } from "react"
import { fetchExperimentations, fetchMarkets, fetchPages } from "@/lib/airtable"

export interface AirtableRecord {
  id: string
  fields: Record<string, unknown>
}

export interface Project {
  id: string
  country: string
  section: string
  title: string
  status: "Refinement" | "Design & Development" | "Setup" | "Running" | "Ready for Analysis" | "Analysing" | "Open"
  startDate: Date
  endDate: Date
  progress: number
}

export interface TimelineData {
  projects: Project[]
  countries: string[]
  sections: string[]
  timeline: {
    months: Array<{ name: string, startDate: Date, endDate: Date }>
    days: Date[]
    dateRange: { start: Date, end: Date }
    todayIndex: number
  }
}

export interface TimelineState {
  expandedCountries: Set<string>
}

// Helper pour trouver le nom depuis l'id (linked record)
const getName = (id: string, arr: {id: string, name: string}[]) => arr.find(x => x.id === id)?.name || id

// Helper pour obtenir le nom du mois en anglais
const getMonthName = (date: Date): string => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  return months[date.getMonth()]
}

// Helper pour générer une plage de dates
const generateDateRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

// Helper pour obtenir les mois dans une plage de dates
const getMonthsInRange = (startDate: Date, endDate: Date) => {
  const months: Array<{ name: string, startDate: Date, endDate: Date }> = []
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  
  while (current <= endDate) {
    const monthStart = new Date(current)
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0)
    
    months.push({
      name: getMonthName(current),
      startDate: monthStart,
      endDate: monthEnd
    })
    
    current.setMonth(current.getMonth() + 1)
  }
  
  return months
}

// Helper pour obtenir la date du jour au format YYYY-MM-DD
const getTodayString = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

export function useTimelineData() {
  const [data, setData] = useState<TimelineData>({
    projects: [],
    countries: [],
    sections: [],
    timeline: {
      months: [],
      days: [],
      dateRange: { start: new Date(), end: new Date() },
      todayIndex: 0
    }
  })

  const [state, setState] = useState<TimelineState>({
    expandedCountries: new Set()
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // Récupérer les données d'Airtable
        const [experimentations, markets, pages] = await Promise.all([
          fetchExperimentations(),
          fetchMarkets(),
          fetchPages()
        ])

        // Filtrer les statuts valides pour la timeline
        const validStatuses = ["Refinement", "Design & Development", "Setup", "Running", "Ready for Analysis", "Analysing", "Open"]
        
        // Transformer les expérimentations en projets
        const projects: Project[] = experimentations
          .filter(record => {
            const status = record.fields.Status as string
            return validStatuses.includes(status)
          })
          .map(record => {
            // Récupérer les IDs des champs liés (Market et Page sont des arrays d'IDs)
            const marketIds = record.fields.Market as string[] || []
            const pageIds = record.fields.Page as string[] || []
            
            // Récupérer les noms depuis les tables liées
            const marketName = marketIds.length > 0 ? getName(marketIds[0], markets) : ""
            const pageName = pageIds.length > 0 ? getName(pageIds[0], pages) : ""
            
            const title = record.fields.Title as string || record.fields.Name as string || ""
            const status = record.fields.Status as string
            const startDateStr = record.fields['Start Date'] as string
            const endDateStr = record.fields['End Date'] as string
            
            // Parser les dates
            const startDate = startDateStr ? new Date(startDateStr) : new Date()
            const endDate = endDateStr ? new Date(endDateStr) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000) // +7 jours par défaut
            
            // Calculer la progression basée sur le statut
            let progress = 0
            switch (status) {
              case "Refinement":
                progress = 10
                break
              case "Design & Development":
                progress = 30
                break
              case "Setup":
                progress = 50
                break
              case "Running":
                progress = 70
                break
              case "Ready for Analysis":
                progress = 90
                break
              case "Analysing":
                progress = 95
                break
              case "Open":
                progress = 5
                break
            }

            return {
              id: record.id,
              country: marketName,
              section: pageName,
              title: title,
              status: status as Project['status'],
              startDate,
              endDate,
              progress
            }
          })
          .filter(p => p.country && p.section) // Filter out projects without valid country or section

        // Obtenir la date du jour
        const today = new Date()
        const todayString = getTodayString()
        
        // Calculer une plage de dates très étendue pour permettre un scroll illimité
        const daysBeforeToday = 365 // 1 an avant aujourd'hui
        const daysAfterToday = 365  // 1 an après aujourd'hui
        
        const timelineStart = new Date(today)
        timelineStart.setDate(today.getDate() - daysBeforeToday)
        
        const timelineEnd = new Date(today)
        timelineEnd.setDate(today.getDate() + daysAfterToday)

        // Générer la plage de jours
        const days = generateDateRange(timelineStart, timelineEnd)
        
        // Trouver l'index d'aujourd'hui dans la timeline
        const todayIndex = days.findIndex(day => day.toISOString().split('T')[0] === todayString)
        
        // Générer les mois
        const months = getMonthsInRange(timelineStart, timelineEnd)

        // Extraire les pays et sections uniques
        const countries = [...new Set(projects.map(p => p.country).filter(Boolean))].sort()
        const sections = [...new Set(projects.map(p => p.section).filter(Boolean))].sort()

        // Définir les pays expansés par défaut (ceux qui ont des projets)
        const expandedCountries = new Set(countries.slice(0, 3)) // Premiers 3 pays

        setData({
          projects,
          countries,
          sections,
          timeline: {
            months,
            days,
            dateRange: { start: timelineStart, end: timelineEnd },
            todayIndex: todayIndex >= 0 ? todayIndex : Math.floor(days.length / 2)
          }
        })

        setState({
          expandedCountries
        })

      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const toggleCountry = (countryCode: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedCountries)
      if (newExpanded.has(countryCode)) {
        newExpanded.delete(countryCode)
      } else {
        newExpanded.add(countryCode)
      }
      return { ...prev, expandedCountries: newExpanded }
    })
  }

  return {
    data,
    state,
    toggleCountry,
    loading
  }
} 