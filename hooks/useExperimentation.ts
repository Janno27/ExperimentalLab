import { useState, useEffect } from "react"
import { fetchExperimentations, fetchMarkets, fetchPages, fetchOwners, fetchKPIs, fetchTestTypes, fetchProducts } from "@/lib/airtable"
import { airtableCache } from "@/lib/cache"

export interface AirtableRecord {
  id: string
  fields: Record<string, unknown>
}

export interface Project {
  id: string
  country: string
  section: string
  title: string
  status: "To be prioritized" | "Denied" | "Refinement" | "Design & Development" | "Setup" | "Running" | "Ready for Analysis" | "Analysing" | "Open" | "Done"
  startDate: Date
  endDate: Date
  progress: number
  owner: string
  analysisOwner: string
  mainKPI: string
  testType: string
  estimatedTime: number
  mde: string
  successCriteria1: string
  successCriteria2: string
  successCriteria3?: string
  // Nouveaux champs pour la timeline
  readyForAnalysisDate?: Date
  analysisStartDate?: Date
  analysisEndDate?: Date
  doneDate?: Date
  timeFromReadyToAnalysis?: number
  timeFromAnalysisToDone?: number
  tool?: string
  scope?: string
  region?: string // APAC | EMEA | AMER
  // Nouveaux champs pour la section Data
  audience?: string
  conversion?: string
  existingRate?: string
  trafficAllocation?: string
  // Nouveaux champs pour la section Audience
  page?: string
  product?: string
  devices?: string
  // Nouveaux champs pour la section Description
  hypothesis?: string
  description?: string
  context?: string
  // Nouveaux champs pour les images
  control?: any
  variation1?: any
  // Nouveaux champs pour les Met Threshold
  metThreshold1?: any
  metThreshold2?: any
  metThreshold3?: any
  // Nouveaux champs pour les résultats
  resultsDeepdive?: any
  learnings?: string
  nextSteps?: string
  conclusive?: string
  winLoss?: string
  // Nouveau champ pour le groupement par conclusive
  conclusiveGroup?: string
}

// Interface pour la compatibilité Kanban
export interface Experimentation {
  id: string
  name: string
  status: string
  market: { id: string; name: string }[]
  owner: { id: string; name: string }[]
  role?: string
  scope?: string
  startDate?: string
  endDate?: string
  Type?: string
  type?: string
  [key: string]: any
}

export interface MarketRef { id: string; name: string; region?: string }
export interface OwnerRef { id: string; name: string }

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

// Ordre des colonnes pour Kanban
export const COLUMN_ORDER = [
  'To be prioritized',
  'Denied',
  'Open',
  'Refinement',
  'Design & Development',
  'Setup',
  'Running',
  'Ready for Analysis',
  'Analysing',
  'Done',
]

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

// Helper pour formater une date au format DD/MM/YYYY
const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Helper pour parser une date optionnelle
const parseOptionalDate = (dateStr: string | undefined): Date | undefined => {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
    return undefined
  }
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? undefined : date
}

// Helper pour parser un nombre optionnel
const parseOptionalNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined
  }
  const num = Number(value)
  return isNaN(num) ? undefined : num
}

export function useExperimentation(options: { 
  useAirtable?: boolean
  timelineMode?: boolean
  validStatuses?: string[]
  requireDoneDate?: boolean
  region?: 'APAC' | 'EMEA' | 'AMER'
} = {}) {
  const { useAirtable = true, timelineMode = false, validStatuses, requireDoneDate = false, region } = options

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

  const [cards, setCards] = useState<Experimentation[]>([])
  const [markets, setMarkets] = useState<MarketRef[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [scopes, setScopes] = useState<string[]>([])
  const [kpis, setKpis] = useState<{id: string, name: string}[]>([])
  const [pages, setPages] = useState<{id: string, name: string}[]>([])
  const [products, setProducts] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fonction helper pour traiter les données
  const processData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      
      // Récupérer les données d'Airtable
      const [experimentations, markets, pages, owners, kpis, testTypes, products] = await Promise.all([
        fetchExperimentations(),
        fetchMarkets(),
        fetchPages(),
        fetchOwners(),
        fetchKPIs(),
        fetchTestTypes(),
        fetchProducts()
      ])

      // Définir les statuts valides selon le mode
      const defaultValidStatuses = timelineMode 
        ? ["Refinement", "Design & Development", "Setup", "Running", "Ready for Analysis", "Analysing", "Open"]
        : COLUMN_ORDER
      
      const statusesToUse = validStatuses || defaultValidStatuses
      
      // Transformer les expérimentations en projets
      const projects: Project[] = experimentations
        .filter(record => {
          const status = record.fields.Status as string
          const startDate = record.fields['Start Date'] as string
          const endDate = record.fields['End Date'] as string
          const estimatedTime = record.fields['Estimated Time']
          
          // Vérifier que le statut est valide
          if (!statusesToUse.includes(status)) {
            return false
          }
          
          // En mode timeline, vérifier les dates
          if (timelineMode) {
            if (!startDate || (typeof startDate === 'string' && startDate.trim() === '')) {
              return false
            }
            if (!endDate || (typeof endDate === 'string' && endDate.trim() === '')) {
              return false
            }
            if (estimatedTime === null || estimatedTime === undefined || estimatedTime === '') {
              return false
            }
          }
          
          return true
        })
        .map(record => {
          // Récupérer les IDs des champs liés
          const marketIds = record.fields.Market as string[] || []
          const pageIds = record.fields.Page as string[] || []
          const ownerIds = record.fields.Owner as string[] || []
          const analysisOwnerIds = record.fields["Analysis' Owner"] as string[] || []
          const kpiIds = record.fields['Main KPI'] as string[] || []
          const testTypeIds = record.fields['Test Type'] as string[] || []
          const productIds = record.fields.Product as string[] || []
          
          // Récupérer les noms depuis les tables liées
          const marketName = marketIds.length > 0 ? getName(marketIds[0], markets) : ""
          const pageName = pageIds.length > 0 ? getName(pageIds[0], pages) : ""
          const ownerName = ownerIds.length > 0 ? getName(ownerIds[0], owners) : ""
          const analysisOwnerName = analysisOwnerIds.length > 0 ? getName(analysisOwnerIds[0], owners) : ""
          const kpiName = kpiIds.length > 0 ? getName(kpiIds[0], kpis) : ""
          const testTypeName = testTypeIds.length > 0 ? getName(testTypeIds[0], testTypes) : ""
          const productName = productIds.length > 0 ? getName(productIds[0], products) : ""
          
          // Gérer le champ Region qui est un lookup vers la table Market
          let region = ""
          const regionField = record.fields.Region
          if (regionField) {
            if (Array.isArray(regionField)) {
              // Airtable retourne directement les valeurs résolues du lookup
              region = regionField[0] || ""
            }
            // Cas de valeur directe (string)
            else if (typeof regionField === 'string') {
              region = regionField
            }
          }
          
          const title = record.fields.Title as string || record.fields.Name as string || ""
          const status = record.fields.Status as string
          const startDateStr = record.fields['Start Date'] as string
          const endDateStr = record.fields['End Date'] as string
          const estimatedTime = record.fields['Estimated Time'] as number || 0
          const mde = record.fields.MDE as string || ""
          const successCriteria1 = record.fields['Success Criteria #1'] as string || ""
          const successCriteria2 = record.fields['Success Criteria #2'] as string || ""
          const successCriteria3 = record.fields['Success Criteria #3'] as string || ""
          const type = record.fields.Type as string || ""
          
          // Nouveaux champs de timeline
          const readyForAnalysisDateStr = record.fields['Date - Ready for Analysis'] as string
          const analysisStartDateStr = record.fields['Date - Analysis'] as string
          const analysisEndDateStr = record.fields['Date - Analysis End'] as string
          const doneDateStr = record.fields['Date - Done'] as string
          const timeFromReadyToAnalysis = parseOptionalNumber(record.fields['Days from Waiting for Analysis to Analysing'])
          const timeFromAnalysisToDone = parseOptionalNumber(record.fields['Days from Analysing to Done'])
          const tool = record.fields['Tool:'] as string || ""
          const scope = record.fields['Scope'] as string || ""
          const regionName = region // Utiliser le nom de la région extrait
          
          // Nouveaux champs pour la section Data
          const audience = record.fields['Audience'] as string || ""
          const conversion = record.fields['Conversion'] as string || ""
          const existingRate = record.fields['Existing % Rate'] as string || ""
          const trafficAllocation = record.fields['Traffic Allocation'] as string || ""
          
          // Nouveaux champs pour la section Audience
          const page = pageName || ""
          const product = productName || ""
          const devices = record.fields['Devices'] as string || ""
          
          // Nouveaux champs pour la section Description
          const hypothesis = record.fields['Hypothesis'] as string || ""
          const description = record.fields['Description'] as string || ""
          const context = record.fields['Context'] as string || ""
          
          // Nouveaux champs pour les images
          const control = record.fields['Control'] || null
          const variation1 = record.fields['Variation 1'] || null
          
          // Nouveaux champs pour les Met Threshold
          const metThreshold1 = record.fields['Met Threshold - Success Criteria #1'] || null
          const metThreshold2 = record.fields['Met Threshold - Success Criteria #2'] || null
          const metThreshold3 = record.fields['Met Threshold - Success Criteria #3'] || null
          
          // Nouveaux champs pour les résultats
          const resultsDeepdive = record.fields['Results - Deepdive'] || null
          const learnings = record.fields['Learnings'] as string || ""
          const nextSteps = record.fields['Next Steps'] as string || ""
          
          // Recherche robuste des champs Win vs Loss et Conclusive
          const possibleWinLossFields = ['Win vs Loss', 'Win/Loss', 'WinLoss', 'Win_Loss', 'Win Loss']
          const possibleConclusiveFields = ['Conclusive vs Non Conclusive', 'Conclusive/Non Conclusive', 'Conclusive', 'Conclusive vs Non-Conclusive']
          
          let conclusiveArray: string[] = []
          let winLossArray: string[] = []
          
          // Chercher le champ Win vs Loss
          for (const fieldName of possibleWinLossFields) {
            if (record.fields[fieldName]) {
              winLossArray = Array.isArray(record.fields[fieldName]) ? record.fields[fieldName] as string[] : [record.fields[fieldName] as string]
              break
            }
          }
          
          // Chercher le champ Conclusive
          for (const fieldName of possibleConclusiveFields) {
            if (record.fields[fieldName]) {
              conclusiveArray = Array.isArray(record.fields[fieldName]) ? record.fields[fieldName] as string[] : [record.fields[fieldName] as string]
              break
            }
          }
          
          // Extraire la première valeur des tableaux de sélection unique
          const conclusiveRaw = conclusiveArray.length > 0 ? conclusiveArray[0] : ""
          const winLossRaw = winLossArray.length > 0 ? winLossArray[0] : ""
          
          // Utiliser directement les valeurs d'Airtable (Win, Loss, Non Conclusive)
          const conclusive = conclusiveRaw || ""
          const winLoss = winLossRaw || ""
          
          // Parser les dates
          const startDate = startDateStr ? new Date(startDateStr) : new Date()
          const endDate = endDateStr ? new Date(endDateStr) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          
          // Parser les dates de timeline
          const readyForAnalysisDate = parseOptionalDate(readyForAnalysisDateStr)
          const analysisStartDate = parseOptionalDate(analysisStartDateStr)
          const analysisEndDate = parseOptionalDate(analysisEndDateStr)
          const doneDate = parseOptionalDate(doneDateStr)
          
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
            progress,
            owner: ownerName,
            analysisOwner: analysisOwnerName,
            mainKPI: kpiName,
            testType: type,
            estimatedTime,
            mde,
            successCriteria1,
            successCriteria2,
            successCriteria3,
            readyForAnalysisDate,
            analysisStartDate,
            analysisEndDate,
            doneDate,
            timeFromReadyToAnalysis,
            timeFromAnalysisToDone,
            tool,
            scope,
            region, // Ajouter la région
            audience,
            conversion,
            existingRate,
            trafficAllocation,
            page,
            product,
            devices,
            hypothesis,
            description,
            context,
            control,
            variation1,
            metThreshold1,
            metThreshold2,
            metThreshold3,
            resultsDeepdive,
            learnings,
            nextSteps,
            conclusive,
            winLoss,
            conclusiveGroup: conclusive || "Non Conclusive" // Utiliser le champ Conclusive vs Non Conclusive pour le groupement
          }
        })
        .filter(p => {
          // En mode timeline, filtrer par pays/section
          if (timelineMode && (!p.country || !p.section)) {
            return false
          }
          
          // Pour les projets "Done", vérifier qu'ils ont une Date - Done (seulement si requireDoneDate est true)
          if (requireDoneDate && p.status === "Done" && !p.doneDate) {
            return false
          }
          
          return true
        })

      // Traitement spécifique pour Kanban
      if (!timelineMode) {
        const marketMap = Object.fromEntries(markets.map((m: MarketRef) => [m.id, m.name]))
        const ownerMap = Object.fromEntries(owners.map((o: OwnerRef) => [o.id, o.name]))
        
        const kanbanCardsAll = experimentations
          .filter(record => statusesToUse.includes(record.fields.Status as string))
          .map((r: any) => ({
            id: r.id,
            name: r.fields.Name || r.fields["Short Name"] || 'Untitled',
            status: r.fields.Status || '',
            market: Array.isArray(r.fields.Market)
              ? r.fields.Market.map((id: string) => ({ id, name: marketMap[id] || id }))
              : [],
            owner: Array.isArray(r.fields.Owner)
              ? r.fields.Owner.map((id: string) => ({ id, name: ownerMap[id] || id }))
              : [],
            role: r.fields.Role || '',
            scope: r.fields.Scope || r.fields.Scole || '',
            startDate: r.fields["Start Date"] || '',
            endDate: r.fields["End Date"] || '',
            Type: r.fields.Type || '',
            type: r.fields.Type || '',
            ...r.fields,
          }))

        // Appliquer le filtre de région s'il est fourni
        const kanbanCards = region
          ? kanbanCardsAll.filter((c: any) => {
              const raw = c.Region
              if (!raw) return false
              if (Array.isArray(raw)) return raw.includes(region)
              return String(raw) === region
            })
          : kanbanCardsAll

        setCards(kanbanCards)
        setMarkets(markets)
        
        // Extraire les rôles uniques
        const uniqueRoles = Array.from(new Set(
          kanbanCards.map((c: Experimentation) => c.role).filter((v): v is string => Boolean(v))
        ))
        setRoles(uniqueRoles)
        
        // Extraire les scopes uniques
        const uniqueScopes = Array.from(new Set(
          kanbanCards.map((c: Experimentation) => c.scope).filter((v): v is string => Boolean(v))
        ))
        setScopes(uniqueScopes)
        
        setKpis(kpis)
        setPages(pages)
        setProducts(products)
      }

      // Traitement spécifique pour Timeline
      if (timelineMode) {
        // Appliquer le filtre de région s'il est fourni
        const filteredProjects = region
          ? projects.filter((p: Project) => {
              // Filtrer par la région du projet
              return p.region === region
            })
          : projects
        
        // Obtenir la date du jour
        const today = new Date()
        const todayString = getTodayString()
        
        // Calculer une plage de dates très étendue pour permettre un scroll illimité
        const daysBeforeToday = 365
        const daysAfterToday = 365
        
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
        const countries = [...new Set(filteredProjects.map(p => p.country).filter(Boolean))].sort()
        const sections = [...new Set(filteredProjects.map(p => p.section).filter(Boolean))].sort()

        // Définir les pays expansés par défaut
        const expandedCountries = new Set(countries.slice(0, 3))

        setData({
          projects: filteredProjects.sort((a, b) => {
            const countryComparison = a.country.localeCompare(b.country)
            if (countryComparison !== 0) {
              return countryComparison
            }
            return a.section.localeCompare(b.section)
          }),
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
      }

    } catch (error) {
      console.error('Error processing data:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  // Fonction pour charger les données
  const loadData = async () => {
    await processData(true)
  }

  useEffect(() => {
    if (!useAirtable) return
    loadData()
  }, [useAirtable, timelineMode, validStatuses, region])

  // Fonction de rafraîchissement des données
  const refreshData = async () => {
    await loadData()
  }

  // Fonction de rafraîchissement silencieux (sans spinner)
  const refreshDataSilent = async () => {
    await processData(false)
  }

  // Fonction pour forcer la synchronisation du cache
  const forceCacheSync = async () => {
    airtableCache.invalidateAll()
    await processData(true)
  }

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

  // Retourner les données selon le mode
  if (timelineMode) {
    return {
      data,
      state,
      toggleCountry,
      loading,
      error,
      refreshData,
      refreshDataSilent,
      forceCacheSync
    }
  } else {
    return {
      columns: COLUMN_ORDER,
      cards,
      markets,
      roles,
      scopes,
      kpis,
      pages,
      products,
      loading,
      error,
      forceCacheSync
    }
  }
} 
