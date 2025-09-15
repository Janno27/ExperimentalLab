'use client'

import { useState, useEffect, useCallback } from 'react'
import { FlaskConical, Sparkles, Wrench } from 'lucide-react'
import { fetchExperimentations, fetchMarkets, fetchOwners, fetchPages, fetchKPIs, fetchProducts } from '@/lib/airtable'
import { TicketOverlay } from '@/components/timeline/TicketOverlay'
import { Project } from '@/hooks/useExperimentation'

interface SearchResult {
  id: string
  name: string
  doneDate: Date
  market: string
  owner: string
  conclusive?: string
  winLoss?: string
  type?: string
  learnings?: string
  hypothesis?: string
  status?: string
  startDate?: Date
  endDate?: Date
}

interface SearchSystemProps {
  searchQuery: string
  isActive: boolean
}

// Fonctions utilitaires pour la recherche
function typeIcon(type?: string, winLoss?: string) {
  let colorClass = "text-gray-400"
  
  if (winLoss === "Win") {
    colorClass = "text-green-500"
  } else if (winLoss === "Loss") {
    colorClass = "text-red-500"
  } else if (winLoss === "Non Conclusive") {
    colorClass = "text-gray-500"
  }
  
  if (!type) return null
  if (type === 'A/B-Test') return <FlaskConical size={15} className={colorClass} />
  if (type === 'Personalization') return <Sparkles size={15} className={colorClass} />
  if (type === 'Fix/Patch') return <Wrench size={15} className={colorClass} />
  return null
}

function getResultBadge(winLoss?: string, conclusive?: string) {
  if (winLoss === "Win") {
    return <span className="bg-green-100 text-green-700 rounded px-2 py-0.5 text-[10px] font-medium">Win</span>
  } else if (winLoss === "Loss") {
    return <span className="bg-red-100 text-red-700 rounded px-2 py-0.5 text-[10px] font-medium">Loss</span>
  } else if (conclusive === "Non Conclusive") {
    return <span className="bg-gray-100 text-gray-700 rounded px-2 py-0.5 text-[10px] font-medium">Inconclusive</span>
  }
  return null
}

function getStatusBadge(status?: string) {
  if (!status) return null
  
  const statusColors = {
    'Running': 'bg-blue-100 text-blue-700',
    'Done': 'bg-green-100 text-green-700',
    'Paused': 'bg-yellow-100 text-yellow-700',
    'Draft': 'bg-gray-100 text-gray-700',
    'Analysis': 'bg-purple-100 text-purple-700'
  }
  
  const colorClass = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'
  
  return <span className={`${colorClass} rounded px-2 py-0.5 text-[10px] font-medium`}>{status}</span>
}

// Composant Skeleton pour les cartes
function CardSkeleton() {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col animate-pulse"
      style={{
        width: '280px',
        height: '220px'
      }}
    >
      {/* Header avec badges */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-300 rounded" />
            <div className="h-4 w-12 bg-gray-300 rounded" />
            <div className="h-4 w-16 bg-gray-300 rounded" />
          </div>
          <div className="h-3 w-12 bg-gray-300 rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-full bg-gray-300 rounded" />
          <div className="h-3 w-3/4 bg-gray-300 rounded" />
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 space-y-2">
        <div className="h-3 w-full bg-gray-300 rounded" />
        <div className="h-3 w-5/6 bg-gray-300 rounded" />
        <div className="h-3 w-4/5 bg-gray-300 rounded" />
        <div className="h-3 w-3/4 bg-gray-300 rounded" />
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 pt-3 mt-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-16 bg-gray-300 rounded" />
          <div className="h-3 w-20 bg-gray-300 rounded" />
        </div>
      </div>
    </div>
  )
}

export function SearchSystem({ searchQuery, isActive }: SearchSystemProps) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [allTests, setAllTests] = useState<SearchResult[]>([])
  const [allRawData, setAllRawData] = useState<{id: string, fields: Record<string, unknown>}[]>([]) // Stocker les données brutes d'Airtable
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isTicketOverlayOpen, setIsTicketOverlayOpen] = useState(false)
  const [referenceData, setReferenceData] = useState<{
    markets: {id: string, name: string}[], 
    owners: {id: string, name: string}[], 
    pages: {id: string, name: string}[], 
    kpis: {id: string, name: string}[], 
    products: {id: string, name: string}[]
  }>({
    markets: [], 
    owners: [], 
    pages: [], 
    kpis: [], 
    products: []
  })

  // Charger toutes les données
  useEffect(() => {
    const loadAllTests = async () => {
      if (!isActive) return
      
      try {
        setInitialLoading(true)
        
        const [experimentations, markets, owners, pages, kpis, products] = await Promise.all([
          fetchExperimentations(),
          fetchMarkets(),
          fetchOwners(),
          fetchPages(),
          fetchKPIs(),
          fetchProducts()
        ])

        // Stocker les données de référence et les données brutes
        setReferenceData({ markets, owners, pages, kpis, products })
        setAllRawData(experimentations)

        const getName = (id: string, arr: {id: string, name: string}[]) => 
          arr.find(x => x.id === id)?.name || id

        const allTestsData = experimentations.map(record => {
          const marketIds = record.fields.Market as string[] || []
          const ownerIds = record.fields.Owner as string[] || []
          const conclusiveArray = record.fields['Conclusive vs Non Conclusive'] as string[] || []
          const winLossArray = record.fields['Win vs Loss'] as string[] || []
          
          const marketName = marketIds.length > 0 ? getName(marketIds[0], markets) : ""
          const ownerName = ownerIds.length > 0 ? getName(ownerIds[0], owners) : ""
          
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
            doneDate: record.fields['Date - Done'] ? new Date(record.fields['Date - Done'] as string) : new Date(),
            startDate: record.fields['Start Date'] ? new Date(record.fields['Start Date'] as string) : undefined,
            endDate: record.fields['End Date'] ? new Date(record.fields['End Date'] as string) : undefined,
            market: marketName,
            owner: ownerName,
            conclusive,
            winLoss,
            type: record.fields.Type as string,
            learnings: record.fields.Learnings as string || "",
            hypothesis: record.fields.Hypothesis as string || "",
            status: record.fields.Status as string || ""
          }
        })

        setAllTests(allTestsData)
        if (searchQuery) {
          performSearch(searchQuery, allTestsData)
        }
      } catch (error) {
        console.error('Error loading tests:', error)
      } finally {
        setInitialLoading(false)
      }
    }

    loadAllTests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  // Fonction de recherche avec filtres améliorée
  const performSearch = useCallback((query: string, testsData: SearchResult[] = allTests) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    
    // Nettoyer et préparer la recherche
    const searchTerm = query.toLowerCase().trim()
    
    // Fonction pour normaliser le texte pour la recherche
    const normalizeForSearch = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[#\-_\s]+/g, ' ') // Remplacer #, -, _, espaces par des espaces simples
        .replace(/\s+/g, ' ') // Remplacer plusieurs espaces par un seul
        .trim()
    }
    
    // Fonction pour vérifier si une recherche correspond
    const matchesSearch = (text: string, searchTerm: string) => {
      if (!text) return false
      
      const normalizedText = normalizeForSearch(text)
      const normalizedSearch = normalizeForSearch(searchTerm)
      
      // Recherche exacte
      if (normalizedText.includes(normalizedSearch)) {
        return true
      }
      
      // Recherche par mots séparés (pour "fr 35" -> "FR #35")
      const searchWords = normalizedSearch.split(' ').filter(word => word.length > 0)
      if (searchWords.length > 1) {
        return searchWords.every(word => normalizedText.includes(word))
      }
      
      return false
    }
    
    // Recherche dans plusieurs champs
    let results = testsData.filter((test: SearchResult) => {
      return (
        matchesSearch(test.name || '', searchTerm) ||
        matchesSearch(test.market || '', searchTerm) ||
        matchesSearch(test.owner || '', searchTerm) ||
        matchesSearch(test.learnings || '', searchTerm) ||
        matchesSearch(test.hypothesis || '', searchTerm) ||
        matchesSearch(test.type || '', searchTerm) ||
        matchesSearch(test.status || '', searchTerm) ||
        matchesSearch(test.conclusive || '', searchTerm) ||
        matchesSearch(test.winLoss || '', searchTerm)
      )
    })

    // Appliquer les filtres actifs (logique ET pour permettre le croisement)
    if (activeFilters.length > 0) {
      results = results.filter((test: SearchResult) => {
        return activeFilters.every(filter => {
          switch (filter) {
            case 'Running':
              return test.status === 'Running'
            case 'Done':
              return test.status === 'Done'
            case 'Conclusive':
              return test.conclusive === 'Conclusive'
            case 'Win':
              return test.winLoss === 'Win'
            default:
              return false
          }
        })
      })
    }

    // Trier par pertinence améliorée
    results.sort((a: SearchResult, b: SearchResult) => {
      const normalizedSearch = normalizeForSearch(searchTerm)
      
      // Vérifier les correspondances exactes dans le nom
      const aExactNameMatch = normalizeForSearch(a.name || '').includes(normalizedSearch)
      const bExactNameMatch = normalizeForSearch(b.name || '').includes(normalizedSearch)
      
      // Vérifier les correspondances par mots dans le nom
      const searchWords = normalizedSearch.split(' ').filter(word => word.length > 0)
      const aWordsNameMatch = searchWords.length > 1 && searchWords.every(word => normalizeForSearch(a.name || '').includes(word))
      const bWordsNameMatch = searchWords.length > 1 && searchWords.every(word => normalizeForSearch(b.name || '').includes(word))
      
      // Priorité 1: Correspondance exacte dans le nom
      if (aExactNameMatch && !bExactNameMatch) return -1
      if (!aExactNameMatch && bExactNameMatch) return 1
      
      // Priorité 2: Correspondance par mots dans le nom
      if (aWordsNameMatch && !bWordsNameMatch) return -1
      if (!aWordsNameMatch && bWordsNameMatch) return 1
      
      // Priorité 3: Correspondance dans le nom (général)
      const aNameMatch = matchesSearch(a.name || '', searchTerm)
      const bNameMatch = matchesSearch(b.name || '', searchTerm)
      
      if (aNameMatch && !bNameMatch) return -1
      if (!aNameMatch && bNameMatch) return 1
      
      // Si même pertinence, trier par date (plus récent en premier)
      return b.doneDate.getTime() - a.doneDate.getTime()
    })

    setSearchResults(results)
    setLoading(false)
  }, [allTests, activeFilters])

  // Effectuer la recherche quand la query change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchQuery, performSearch])

  // Effectuer la recherche immédiatement quand les filtres changent
  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery)
    }
  }, [activeFilters, searchQuery, performSearch])

  // Fonction pour convertir les données brutes Airtable en Project complet
  const convertRawDataToProject = (testId: string): Project | null => {
    const record = allRawData.find(r => r.id === testId)
    if (!record) return null

    const { markets, owners, pages, kpis, products } = referenceData
    const getName = (id: string, arr: {id: string, name: string}[]) => 
      arr.find(x => x.id === id)?.name || id

    // Helper pour parser les dates
    const parseOptionalDate = (dateStr: string | undefined): Date | undefined => {
      if (!dateStr) return undefined
      const date = new Date(dateStr)
      return isNaN(date.getTime()) ? undefined : date
    }

    // Helper pour parser les nombres
    const parseOptionalNumber = (value: unknown): number | undefined => {
      if (value === null || value === undefined || value === '') return undefined
      const num = Number(value)
      return isNaN(num) ? undefined : num
    }

    // Récupérer les IDs des champs liés
    const marketIds = record.fields.Market as string[] || []
    const pageIds = record.fields.Page as string[] || []
    const ownerIds = record.fields.Owner as string[] || []
    const analysisOwnerIds = record.fields["Analysis' Owner"] as string[] || []
    const kpiIds = record.fields['Main KPI'] as string[] || []
    const productIds = record.fields.Product as string[] || []

    // Récupérer les noms depuis les tables liées
    const marketName = marketIds.length > 0 ? getName(marketIds[0], markets) : ""
    const pageName = pageIds.length > 0 ? getName(pageIds[0], pages) : ""
    const ownerName = ownerIds.length > 0 ? getName(ownerIds[0], owners) : ""
    const analysisOwnerName = analysisOwnerIds.length > 0 ? getName(analysisOwnerIds[0], owners) : ""
    const kpiName = kpiIds.length > 0 ? getName(kpiIds[0], kpis) : ""
    const productName = productIds.length > 0 ? getName(productIds[0], products) : ""

    // Récupérer les valeurs des champs
    const conclusiveArray = record.fields['Conclusive vs Non Conclusive'] as string[] || []
    const winLossArray = record.fields['Win vs Loss'] as string[] || []
    const conclusiveRaw = conclusiveArray.length > 0 ? conclusiveArray[0] : ""
    const winLossRaw = winLossArray.length > 0 ? winLossArray[0] : ""

    return {
      id: record.id,
      country: marketName,
      section: pageName,
      title: record.fields.Title as string || record.fields.Name as string || "",
      status: (record.fields.Status as "To be prioritized" | "Denied" | "Open" | "Refinement" | "Design & Development" | "Setup" | "Running" | "Ready for Analysis" | "Analysing" | "Done") || "Done",
      startDate: record.fields['Start Date'] ? new Date(record.fields['Start Date'] as string) : new Date(),
      endDate: record.fields['End Date'] ? new Date(record.fields['End Date'] as string) : new Date(),
      progress: 100,
      owner: ownerName,
      analysisOwner: analysisOwnerName,
      mainKPI: kpiName,
      testType: record.fields.Type as string || "",
      estimatedTime: record.fields['Estimated Time'] as number || 0,
      mde: record.fields.MDE as string || "",
      successCriteria1: record.fields['Success Criteria #1'] as string || "",
      successCriteria2: record.fields['Success Criteria #2'] as string || "",
      successCriteria3: record.fields['Success Criteria #3'] as string || "",
      
      // Champs de timeline
      readyForAnalysisDate: parseOptionalDate(record.fields['Date - Ready for Analysis'] as string),
      analysisStartDate: parseOptionalDate(record.fields['Date - Analysis'] as string),
      analysisEndDate: parseOptionalDate(record.fields['Date - Analysis End'] as string),
      doneDate: parseOptionalDate(record.fields['Date - Done'] as string),
      timeFromReadyToAnalysis: parseOptionalNumber(record.fields['Days from Waiting for Analysis to Analysing']),
      timeFromAnalysisToDone: parseOptionalNumber(record.fields['Days from Analysing to Done']),
      tool: record.fields['Tool:'] as string || "",
      scope: record.fields['Scope'] as string || "",
      
      // Champs pour la section Data
      audience: record.fields['Audience'] as string || "",
      conversion: record.fields['Conversion'] as string || "",
      existingRate: record.fields['Existing % Rate'] as string || "",
      trafficAllocation: record.fields['Traffic Allocation'] as string || "",
      
      // Champs pour la section Audience
      page: pageName,
      product: productName,
      devices: record.fields.Devices as string || "",
      
      // Champs pour la section Description
      hypothesis: record.fields.Hypothesis as string || "",
      description: record.fields.Description as string || "",
      context: record.fields.Context as string || "",
      
      // Champs pour les images
      control: record.fields.Control,
      variation1: record.fields['Variation 1'],
      
      // Champs pour les Met Threshold
      metThreshold1: record.fields['Met Threshold - Success Criteria #1'],
      metThreshold2: record.fields['Met Threshold - Success Criteria #2'],
      metThreshold3: record.fields['Met Threshold - Success Criteria #3'],
      
      // Champs pour les résultats
      learnings: record.fields['Learnings'] as string || "",
      nextSteps: record.fields['Next Steps'] as string || "",
      conclusive: conclusiveRaw,
      winLoss: winLossRaw,
    }
  }

  // Gérer le clic sur une carte
  const handleCardClick = (test: SearchResult) => {
    const project = convertRawDataToProject(test.id)
    if (project) {
      setSelectedProject(project)
      setIsTicketOverlayOpen(true)
    }
  }

  // Fermer le ticket overlay
  const handleCloseTicketOverlay = () => {
    setIsTicketOverlayOpen(false)
    setSelectedProject(null)
  }

  if (!isActive) return null

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in-0 slide-in-from-top-4 duration-300">
      {/* Header avec filtres */}
      <div className="mb-6 mt-6 flex-shrink-0 animate-in fade-in-0 slide-in-from-top-2 duration-500 delay-100">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {['Running', 'Done', 'Conclusive', 'Win'].map((filter, index) => {
            // Logique d'exclusion mutuelle pour Done/Running
            const isDoneRunningConflict = (
              (filter === 'Done' && activeFilters.includes('Running')) ||
              (filter === 'Running' && activeFilters.includes('Done'))
            )
            
            return (
              <button
                key={filter}
                onClick={() => {
                  if (isDoneRunningConflict) return // Empêcher le clic si conflit
                  
                  setActiveFilters(prev => {
                    if (prev.includes(filter)) {
                      return prev.filter(f => f !== filter)
                    } else {
                      // Si on active Done, retirer Running et vice versa
                      if (filter === 'Done') {
                        return [...prev.filter(f => f !== 'Running'), filter]
                      } else if (filter === 'Running') {
                        return [...prev.filter(f => f !== 'Done'), filter]
                      } else {
                        return [...prev, filter]
                      }
                    }
                  })
                }}
                disabled={isDoneRunningConflict}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 animate-in fade-in-0 slide-in-from-top-1 ${
                  isDoneRunningConflict
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    : activeFilters.includes(filter)
                      ? 'bg-purple-600 text-white shadow-md cursor-pointer'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                }`}
                style={{ animationDelay: `${200 + index * 50}ms` }}
              >
                {filter}
              </button>
            )
          })}
        </div>
      </div>

      {/* Zone de contenu scrollable avec hauteur fixe */}
      <div className="flex-1 overflow-y-auto animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200" style={{ maxHeight: 'calc(100vh - 11rem)' }}>
        {initialLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardSkeleton />
              </div>
            ))}
          </div>
        ) : !searchQuery ? (
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <div className="text-center text-gray-500 animate-in fade-in-0 zoom-in-50 duration-500">
              <FlaskConical className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Search Tests</p>
              <p className="text-sm">Start typing to search through all your tests</p>
            </div>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardSkeleton />
              </div>
            ))}
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <div className="text-center text-gray-500 animate-in fade-in-0 zoom-in-50 duration-500">
              <FlaskConical className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No results found</p>
              <p className="text-sm">Try adjusting your search terms</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {searchResults.map((test: SearchResult, index) => (
              <div
                key={test.id}
                onClick={() => handleCardClick(test)}
                className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer transition-all duration-200 flex flex-col hover:border-gray-300 hover:shadow-sm animate-in fade-in-0 slide-in-from-bottom-2"
                style={{
                  width: '280px',
                  height: '220px',
                  animationDelay: `${index * 50}ms`,
                  animationDuration: '400ms'
                }}
              >
                {/* Header avec nom du test */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {typeIcon(test.type, test.winLoss)}
                      {getResultBadge(test.winLoss, test.conclusive)}
                      {getStatusBadge(test.status)}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {test.doneDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                  <div className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight">
                    {test.name}
                  </div>
                </div>

                {/* Learnings ou Hypothesis alignés à gauche et scrollables */}
                <div className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {test.learnings ? (
                      <p className="text-xs text-gray-700 leading-relaxed text-left">
                        {test.learnings}
                      </p>
                    ) : test.hypothesis ? (
                      <p className="text-xs text-gray-600 leading-relaxed text-left italic">
                        {test.hypothesis}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic text-left">
                        No content available
                      </p>
                    )}
                  </div>
                </div>

                {/* Market en bas */}
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {test.market && (
                        <span className="bg-blue-100 text-blue-700 rounded px-2 py-1 text-xs font-medium">
                          {test.market}
                        </span>
                      )}
                    </div>
                    {test.owner && (
                      <span className="text-xs text-gray-500 truncate max-w-[100px]">
                        {test.owner}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TicketOverlay */}
      <TicketOverlay
        project={selectedProject}
        isOpen={isTicketOverlayOpen}
        onClose={handleCloseTicketOverlay}
      />
    </div>
  )
}