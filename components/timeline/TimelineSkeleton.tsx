'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function TimelineSkeleton() {
  return (
    <div className="flex h-full w-full bg-white rounded-lg border overflow-hidden">
      {/* Sidebar skeleton */}
      <div className="flex-shrink-0 w-48 border-r bg-gray-50 p-4">
        <div className="space-y-4">
          {/* Header skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 animate-pulse" />
            <Skeleton className="h-3 w-32 animate-pulse" />
          </div>
          
          {/* Countries skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20 animate-pulse" />
                  <Skeleton className="h-3 w-8 animate-pulse" />
                </div>
                <div className="space-y-1 pl-4">
                  {Array.from({ length: 3 }).map((_, subIndex) => (
                    <Skeleton key={subIndex} className="h-3 w-16 animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header skeleton */}
        <div className="flex-shrink-0 p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-32 animate-pulse" />
              <Skeleton className="h-4 w-24 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 animate-pulse" />
              <Skeleton className="h-8 w-20 animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Timeline content skeleton */}
        <div className="flex-1 p-4">
          <div className="space-y-6">
            {/* Timeline rows */}
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                {/* Country name */}
                <div className="w-32 flex-shrink-0">
                  <Skeleton className="h-4 w-24 animate-pulse" />
                </div>
                
                {/* Timeline bar */}
                <div className="flex-1 relative">
                  <div className="h-6 bg-gray-100 rounded-md relative overflow-hidden">
                    {/* Random project bars */}
                    {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, barIndex) => (
                      <div
                        key={barIndex}
                        className="absolute top-1 h-4 bg-gray-200 rounded animate-pulse"
                        style={{
                          left: `${Math.random() * 60}%`,
                          width: `${20 + Math.random() * 30}%`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 