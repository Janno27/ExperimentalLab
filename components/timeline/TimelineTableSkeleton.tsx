'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function TimelineTableSkeleton() {
  return (
    <div className="w-full h-full bg-white rounded-lg border overflow-hidden">
      {/* Table header skeleton */}
      <div className="border-b bg-gray-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32 animate-pulse" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 animate-pulse" />
              <Skeleton className="h-8 w-20 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Table content skeleton */}
      <div className="overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-20 animate-pulse" />
              </th>
              <th className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-16 animate-pulse" />
              </th>
              <th className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-24 animate-pulse" />
              </th>
              <th className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-20 animate-pulse" />
              </th>
              <th className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-16 animate-pulse" />
              </th>
              <th className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-20 animate-pulse" />
              </th>
              <th className="px-6 py-3 text-left">
                <Skeleton className="h-4 w-16 animate-pulse" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.from({ length: 12 }).map((_, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 animate-pulse" />
                    <Skeleton className="h-4 w-32 animate-pulse" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-20 animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-28 animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-24 animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-16 animate-pulse" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 rounded-full animate-pulse" />
                    <Skeleton className="h-4 w-16 animate-pulse" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-20 animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 