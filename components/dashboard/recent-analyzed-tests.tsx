'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown, FlaskConical, Sparkles, Wrench } from 'lucide-react'
import { fetchExperimentations, fetchMarkets, fetchOwners } from '@/lib/airtable'

interface RecentTest {
  id: string
  name: string
  doneDate: Date
  market: string
  owner: string
  conclusive?: string
  winLoss?: string
  type?: string
  learnings?: string
}

// Fonction pour obtenir l'icône selon le type avec couleur basée sur Win vs Loss
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

// Fonction pour obtenir le badge de résultat
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

export function RecentAnalyzedTests() {
  const [recentTests, setRecentTests] = useState<RecentTest[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const loadRecentTests = async () => {
      try {
        setLoading(true)
        
        const [experimentations, markets, owners] = await Promise.all([
          fetchExperimentations(),
          fetchMarkets(),
          fetchOwners()
        ])

        const getName = (id: string, arr: {id: string, name: string}[]) => 
          arr.find(x => x.id === id)?.name || id

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
              type: record.fields.Type as string,
              learnings: record.fields.Learnings as string || ""
            }
          })
          .sort((a, b) => b.doneDate.getTime() - a.doneDate.getTime())
          .slice(0, 8) // Prendre plus de tests pour l'effet d'empilement

        setRecentTests(doneTests)
      } catch (error) {
        console.error('Error loading recent tests:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRecentTests()
  }, [])

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.min(recentTests.length - 1, prev + 1))
  }

  const handleNext = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  // Gérer le mouvement de la souris pour orienter l'aura
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY
    
    setMousePosition({ x: mouseX / 4, y: mouseY / 4 }) // Diviser par 4 pour un effet subtil
  }

  // Fonction pour rendre le contenu selon l'état
  const renderContent = () => {
    if (loading) {
      return (
        <div className="w-96 h-96 flex flex-col items-center justify-center mx-auto">
        {/* Stack de cartes skeleton */}
        <div className="relative w-full h-72 flex items-center justify-center">
          {Array.from({ length: 3 }).map((_, stackIndex) => {
            const zIndex = 3 - stackIndex
            const translateX = stackIndex * 20
            const translateY = stackIndex * 12
            const scale = 1 - (stackIndex * 0.08)
            const opacity = stackIndex === 0 ? 1 : 0.6 - (stackIndex * 0.15)

            return (
              <div
                key={stackIndex}
                className="absolute bg-white rounded-xl shadow-lg border border-gray-100 p-5 flex flex-col animate-pulse"
                style={{
                  zIndex,
                  transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
                  opacity,
                  transformOrigin: 'center center',
                  width: '320px',
                  height: '220px'
                }}
              >
                {/* Header avec badges */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-gray-300 rounded" />
                      <div className="h-4 w-12 bg-gray-300 rounded" />
                    </div>
                    <div className="h-3 w-12 bg-gray-300 rounded" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 w-full bg-gray-300 rounded" />
                    <div className="h-3 w-3/4 bg-gray-300 rounded" />
                  </div>
                </div>

                {/* Learnings area */}
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
          })}
        </div>

        {/* Navigation skeleton */}
        <div className="flex items-center justify-center mt-4 gap-2">
          <div className="w-6 h-6 rounded bg-gray-200 animate-pulse" />
          <div className="w-6 h-6 rounded bg-gray-200 animate-pulse" />
        </div>
      </div>
    )
    }

    if (!recentTests.length) {
    return (
      <div className="w-96 h-96 flex flex-col items-center justify-center mx-auto">
        <div className="text-center text-gray-500">
          <FlaskConical className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-xs">No analyzed tests</p>
        </div>
      </div>
    )
    }

    return (
    <div className="w-96 h-96 flex flex-col items-center justify-center mx-auto">
      {/* Stack de cartes */}
      <div className="relative w-full h-72 flex items-center justify-center">
        {recentTests.slice(currentIndex, currentIndex + 3).map((test, stackIndex) => {
          const zIndex = 3 - stackIndex
          const translateX = stackIndex * 20 // Décalage ajusté pour les cartes plus grandes
          const translateY = stackIndex * 12 // Décalage vertical ajusté
          const scale = 1 - (stackIndex * 0.08) // Réduction maintenue
          const opacity = stackIndex === 0 ? 1 : 0.6 - (stackIndex * 0.15) // Opacité maintenue

          return (
            <div
              key={test.id}
              className="absolute bg-white rounded-xl shadow-lg border border-gray-100 p-5 cursor-default hover:cursor-pointer transition-all duration-200 flex flex-col"
              style={{
                zIndex,
                transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
                opacity,
                transformOrigin: 'center center',
                width: '320px',
                height: '220px'
              }}
            >
              {/* Header avec nom du test */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {typeIcon(test.type, test.winLoss)}
                    {getResultBadge(test.winLoss, test.conclusive)}
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

              {/* Learnings alignés à gauche et scrollables */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  {test.learnings ? (
                    <p className="text-xs text-gray-700 leading-relaxed text-left">
                      {test.learnings}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic text-left">
                      No learnings available
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
          )
        })}
      </div>

      {/* Navigation sous les cartes */}
      <div className="flex items-center justify-center mt-4 gap-3">
        <button
          onClick={handleNext}
          disabled={currentIndex === 0}
          className={`w-8 h-8 bg-white rounded-full border flex items-center justify-center transition-all duration-200 ${
            currentIndex === 0
              ? 'text-gray-300 border-gray-200 cursor-not-allowed' 
              : 'text-gray-600 border-gray-300 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 cursor-pointer'
          }`}
        >
          <ChevronUp size={14} className="-rotate-90" />
        </button>
        
        <button
          onClick={handlePrevious}
          disabled={currentIndex >= recentTests.length - 1}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 ${
            currentIndex >= recentTests.length - 1
              ? 'text-gray-300 border-gray-200 cursor-not-allowed' 
              : 'text-gray-600 border-gray-300 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 cursor-pointer'
          }`}
        >
          <ChevronDown size={14} className="-rotate-90" />
        </button>
      </div>
    </div>
    )
  }

  // Retourner le contenu avec le halo permanent
  return (
    <div 
      className="relative" 
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePosition({ x: 0, y: 0 })}
    >
      {/* Halo violet discret en arrière-plan permanent - réduit et interactif */}
      <div className="absolute inset-0 -m-1 rounded-full opacity-50 pointer-events-none transition-all duration-300">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-purple-200/50 via-purple-100/30 to-purple-200/50 rounded-full blur-xl transition-transform duration-300" 
          style={{ 
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` 
          }}
        />
        <div 
          className="absolute inset-3 bg-gradient-to-r from-purple-100/40 via-purple-50/20 to-purple-100/40 rounded-full blur-lg transition-transform duration-300" 
          style={{ 
            transform: `translate(${mousePosition.x * 0.7}px, ${mousePosition.y * 0.7}px)` 
          }}
        />
        <div 
          className="absolute inset-6 bg-gradient-to-r from-purple-50/30 via-transparent to-purple-50/30 rounded-full blur-md transition-transform duration-300" 
          style={{ 
            transform: `translate(${mousePosition.x * 0.4}px, ${mousePosition.y * 0.4}px)` 
          }}
        />
      </div>
      
      {/* Contenu relatif par-dessus le halo */}
      <div className="relative">
        {renderContent()}
      </div>
    </div>
  )
}
