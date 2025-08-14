'use client'

import { useMemo } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { XCircle } from 'lucide-react'
import { useDashboardContext } from '@/contexts/DashboardContext'

interface MonthlyStat {
  monthIndex: number
  monthLabel: string
  count: number
  titles: string[]
}

export function ThisYear() {
  const { filteredExperimentations, loading, error } = useDashboardContext()

  const statsAll: MonthlyStat[] = useMemo(() => {
    if (!filteredExperimentations) return []

    // Pour ThisYear, on utilise toujours l'année actuelle
    const year = new Date().getFullYear()
    const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    const results: MonthlyStat[] = Array.from({ length: 12 }, (_, idx) => ({
      monthIndex: idx,
      monthLabel: monthLabels[idx],
      count: 0,
      titles: []
    }))

    const getDate = (value: string | Date | undefined): Date | null => {
      if (!value) return null
      const d = new Date(value)
      return isNaN(d.getTime()) ? null : d
    }

    for (const record of filteredExperimentations) {
      const dateDoneStr = record.fields['Date - Done']
      const endDateStr = record.fields['End Date']
      const status = record.fields.Status

      for (let m = 0; m < 12; m++) {
        const monthStart = new Date(year, m, 1)
        const monthEnd = new Date(year, m + 1, 0)

        let effective: Date | null = null
        if (m <= 6) {
          const e = getDate(endDateStr)
          if (status === 'Done' && e && e >= monthStart && e <= monthEnd) {
            effective = e
          }
        } else {
          const d = getDate(dateDoneStr)
          if (d && d >= monthStart && d <= monthEnd) {
            effective = d
          }
        }

        if (effective) {
          results[m].count += 1
          const title = record.fields.Name || record.fields.Title || 'Untitled'
          results[m].titles.push(String(title))
        }
      }
    }

    return results
  }, [filteredExperimentations])

  // Masquer les mois futurs (toujours basé sur l'année actuelle)
  const displayedStats = useMemo(() => {
    const year = new Date().getFullYear()
    const now = new Date()
    if (year < now.getFullYear()) return statsAll
    if (year > now.getFullYear()) return []
    return statsAll.slice(0, now.getMonth() + 1)
  }, [statsAll])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 py-2 w-full h-[90%] flex flex-col">
        <div className="px-4 flex-1 flex flex-col">
          {/* Skeleton pour les labels */}
          <div className="grid mb-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(40px, 1fr))' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div className="h-2 w-6 bg-gray-200 rounded animate-pulse" />
                <div className="h-2 w-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Skeleton pour la courbe - prend l'espace restant */}
          <div className="relative w-full flex-1">
            <div className="w-full h-full bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 py-2 w-full h-full flex flex-col">
        <div className="flex items-center justify-center flex-1 text-gray-500">
          <div className="text-center">
            <XCircle className="w-5 h-5 mx-auto mb-1 text-gray-300" />
            <p className="text-[10px]">Erreur de chargement</p>
            <p className="text-[8px] text-gray-400 mt-0.5">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const maxCount = Math.max(1, ...displayedStats.map(s => s.count))

  // Dimensions SVG de base; sera étiré en hauteur (stroke constant via vector-effect)
  const svgWidth = 240
  const svgHeight = 100
  const n = Math.max(2, displayedStats.length)
  const colWidth = svgWidth / n

  // Marges internes pour éviter le rognage en haut/bas
  const topPadding = 8
  const bottomPadding = 2

  // Points centrés par colonne pour aligner avec les labels
  const points = displayedStats.map((s, i) => {
    const ratio = maxCount === 0 ? 0 : s.count / maxCount
    const usableHeight = svgHeight - topPadding - bottomPadding
    const y = topPadding + (1 - ratio) * usableHeight
    const x = (i + 0.5) * colWidth
    return { x, y }
  })

  // Courbe arrondie (Catmull-Rom -> Bezier)
  const getSmoothPath = (pts: {x:number, y:number}[]) => {
    if (pts.length <= 1) return ''
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[i + 2] || p2
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }
    return d
  }

  const pathD = getSmoothPath(points)

  return (
    <TooltipProvider delayDuration={0}>
      <div className="bg-white rounded-lg border border-gray-200 py-2 w-full h-[90%] flex flex-col">
        <div className="px-4 flex-1 flex flex-col">
          {/* Labels et valeurs au-dessus, alignés et proches de la courbe */}
          <div className="grid mb-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(40px, 1fr))` }}>
            {displayedStats.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] text-gray-600 leading-none">{s.monthLabel}</span>
                <span className="text-[10px] text-gray-900 font-medium leading-none">{s.count}</span>
              </div>
            ))}
          </div>

          {/* Courbe utilise toute la hauteur disponible sans être coupée */}
          <div className="relative w-full flex-1">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full"
            >
              <path d={pathD} stroke="#7c3aed" strokeWidth="1.75" fill="none" vectorEffect="non-scaling-stroke" />
            </svg>

            {points.map((p, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div
                    className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-600 bg-white"
                    style={{ left: `${(p.x / svgWidth) * 100}%`, top: `${(p.y / svgHeight) * 100}%` }}
                    aria-label={`${displayedStats[i].monthLabel}: ${displayedStats[i].count}`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="p-0 border-0 shadow-lg bg-transparent">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
                    <h4 className="text-xs font-semibold text-gray-900 mb-2">{displayedStats[i].monthLabel} — {displayedStats[i].count} Done</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {displayedStats[i].titles.length > 0 ? (
                        displayedStats[i].titles.map((t, idx) => (
                          <div key={idx} className="text-xs text-gray-600 truncate">• {t}</div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-500">No tests</div>
                      )}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
} 