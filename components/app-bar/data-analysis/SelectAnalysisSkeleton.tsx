'use client'

import React from 'react'

export function SelectAnalysisSkeleton() {
  // Générer 6-8 cartes de test pour simuler une liste réaliste
  const skeletonCards = Array.from({ length: 7 })

  return (
    <div className="space-y-3 pb-6 pr-2 px-1">
            {skeletonCards.map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-zinc-800 rounded-xl shadow p-3 text-xs border border-zinc-100 dark:border-zinc-700 relative"
              >
                {/* Header avec icône, status et scope */}
                <div className="flex items-center justify-between mb-1 min-h-[20px]">
                  <div className="flex items-center gap-2">
                    {/* Type icon */}
                    <div className="w-4 h-4 bg-blue-200 rounded animate-pulse" />
                    {/* Status badge */}
                    <div className="h-5 w-16 bg-green-200 rounded animate-pulse" />
                  </div>
                  {/* Scope badge */}
                  <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                
                {/* Titre du test */}
                <div className="font-medium text-xs break-words line-clamp-2 mb-2">
                  <div className="h-3 w-full bg-gray-300 rounded animate-pulse mb-1" />
                  <div className="h-3 w-3/4 bg-gray-300 rounded animate-pulse" />
                </div>
                
                {/* Tags owner et market */}
                <div className="flex items-center gap-1 flex-wrap mb-2">
                  <div className="h-6 w-20 bg-violet-200 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-blue-200 rounded animate-pulse" />
                </div>
                
                {/* Dates */}
                <div className="flex flex-wrap gap-2 text-[10px] mb-2">
                  <div className="h-3 w-24 bg-gray-300 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-300 rounded animate-pulse" />
                </div>
                
                {/* Détails KPI, Page, Product */}
                <div className="space-y-1 text-[10px]">
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-8 bg-gray-400 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-gray-300 rounded animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-10 bg-gray-400 rounded animate-pulse" />
                    <div className="h-3 w-28 bg-gray-300 rounded animate-pulse" />
                  </div>
                  {/* Ajouter Product seulement pour certaines cartes */}
                  {index % 3 === 0 && (
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-12 bg-gray-400 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-gray-300 rounded animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            ))}
    </div>
  )
}
