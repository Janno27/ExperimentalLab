'use client'

import React from 'react'

export function DetailsSelectAnalysisSkeleton() {
  return (
    <div className="flex flex-col h-full w-full max-h-[calc(90vh-5rem)]">
      {/* Header skeleton */}
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          {/* Project title */}
          <div className="h-5 w-80 bg-gray-400 rounded animate-pulse" />
          {/* Start analysis button */}
          <div className="flex items-center gap-1">
            <div className="h-4 w-24 bg-blue-200 rounded animate-pulse" />
            <div className="w-3 h-3 bg-blue-200 rounded animate-pulse" />
          </div>
        </div>
        
        {/* Status and metadata */}
        <div className="flex items-center gap-2 text-xs">
          {/* Status badge */}
          <div className="h-6 w-28 bg-green-200 rounded animate-pulse" />
          {/* Separator */}
          <div className="w-1 h-1 bg-gray-300 rounded-full animate-pulse" />
          {/* Test type */}
          <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
          {/* Separator */}
          <div className="w-1 h-1 bg-gray-300 rounded-full animate-pulse" />
          {/* Owner */}
          <div className="h-4 w-20 bg-gray-300 rounded animate-pulse" />
        </div>
      </div>

      {/* Scrollable content skeleton */}
      <div className="flex-1 min-h-0 overflow-hidden max-h-[calc(100vh-10rem)]">
        <div className="h-full overflow-y-auto pr-2">
          <div className="p-6 space-y-6 pb-6">
            
            {/* Properties Section Skeleton */}
            <div className="border border-gray-200 rounded-lg p-4">
              {/* Section header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-400 rounded animate-pulse" />
                </div>
                <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
              </div>
              
              {/* Properties content */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="h-3 w-16 bg-gray-400 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-300 rounded animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 w-20 bg-gray-400 rounded animate-pulse" />
                    <div className="h-4 w-28 bg-gray-300 rounded animate-pulse" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="h-3 w-12 bg-gray-400 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-300 rounded animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 w-18 bg-gray-400 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-gray-300 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Audience Section Skeleton */}
            <div className="border border-gray-200 rounded-lg p-4">
              {/* Section header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-400 rounded animate-pulse" />
                </div>
                <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
              </div>
              
              {/* Audience content (collapsed) */}
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-300 rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-gray-300 rounded animate-pulse" />
              </div>
            </div>

            {/* Description Section Skeleton */}
            <div className="border border-gray-200 rounded-lg p-4">
              {/* Section header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-400 rounded animate-pulse" />
                </div>
                <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
              </div>
              
              {/* Description content (collapsed) */}
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-300 rounded animate-pulse" />
                <div className="h-3 w-5/6 bg-gray-300 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-gray-300 rounded animate-pulse" />
              </div>
            </div>

            {/* Results Section Skeleton */}
            <div className="border border-gray-200 rounded-lg p-4">
              {/* Section header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
                  <div className="h-4 w-14 bg-gray-400 rounded animate-pulse" />
                </div>
                <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
              </div>
              
              {/* Results content (collapsed) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 bg-gray-400 rounded animate-pulse" />
                  <div className="h-5 w-20 bg-green-200 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-300 rounded animate-pulse" />
                  <div className="h-3 w-4/5 bg-gray-300 rounded animate-pulse" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
