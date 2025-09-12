'use client'

import React from 'react'

export function ResultsViewSkeleton() {
  // Générer 2-3 métriques pour simuler un rapport d'analyse typique
  const skeletonMetrics = Array.from({ length: 3 })
  
  return (
    <div className="flex h-full w-full">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto py-6 px-4">
            <div className="space-y-6">
              
              {/* Header with Test Information Skeleton */}
              <div className="text-center pb-4">
                {/* Titre du test */}
                <div className="h-7 w-96 mx-auto bg-gray-300 rounded animate-pulse mb-4" />
                
                {/* Tags d'information */}
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  {/* Owner */}
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-12 bg-gray-400 rounded animate-pulse" />
                    <div className="h-6 w-20 bg-violet-200 rounded animate-pulse" />
                  </div>
                  
                  {/* Market */}
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-12 bg-gray-400 rounded animate-pulse" />
                    <div className="h-6 w-16 bg-blue-200 rounded animate-pulse" />
                  </div>
                  
                  {/* Type */}
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-8 bg-gray-400 rounded animate-pulse" />
                    <div className="flex items-center gap-1 h-6 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                  
                  {/* Users */}
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-10 bg-gray-400 rounded animate-pulse" />
                    <div className="h-6 w-20 bg-green-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Metrics Results Skeletons */}
              <div className="space-y-6">
                {skeletonMetrics.map((_, metricIndex) => (
                  <div key={metricIndex} className="space-y-2">
                    
                    {/* Metric name and badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Metric name */}
                        <div className="h-5 w-48 bg-gray-400 rounded animate-pulse" />
                        
                        {/* Transaction data badge (pour certaines métriques) */}
                        {metricIndex === 1 && (
                          <div className="flex items-center gap-1 h-6 w-32 bg-green-200 rounded animate-pulse" />
                        )}
                        
                        {/* Upload CTA (pour d'autres métriques) */}
                        {metricIndex === 2 && (
                          <div className="flex items-center gap-1 h-6 w-40 bg-blue-200 rounded animate-pulse" />
                        )}
                      </div>
                      
                      {/* Significance badge */}
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-24 bg-green-200 rounded animate-pulse" />
                      </div>
                    </div>

                    {/* Table skeleton */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        
                        {/* Table header */}
                        <div className="bg-gray-50 border-b border-gray-200">
                          <div className="flex">
                              {/* Headers selon le type de métrique */}
                            {metricIndex === 0 ? (
                              // Conversion metric headers
                              <>
                                <div className="px-6 py-3 flex-1">
                                  <div className="h-3 w-16 bg-gray-400 rounded animate-pulse" />
                                </div>
                                <div className="px-6 py-3 flex-1">
                                  <div className="h-3 w-12 bg-gray-400 rounded animate-pulse" />
                                </div>
                                <div className="px-6 py-3 flex-1">
                                  <div className="h-3 w-20 bg-gray-400 rounded animate-pulse" />
                                </div>
                                <div className="px-6 py-3 flex-1">
                                  <div className="h-3 w-24 bg-gray-400 rounded animate-pulse" />
                                </div>
                                <div className="px-6 py-3 flex-1">
                                  <div className="h-3 w-12 bg-gray-400 rounded animate-pulse" />
                                </div>
                                <div className="px-6 py-3 flex-1">
                                  <div className="h-3 w-28 bg-gray-400 rounded animate-pulse" />
                                </div>
                                <div className="px-6 py-3 flex-1">
                                  <div className="h-3 w-32 bg-gray-400 rounded animate-pulse" />
                                </div>
                              </>
                            ) : (
                              // Revenue metric headers
                              <>
                                <div className="px-6 py-3 flex-1">
                                  <div className="h-3 w-16 bg-gray-400 rounded animate-pulse" />
                                </div>
                                <div className="px-6 py-3 flex-1">
                                  <div className="h-3 w-12 bg-gray-400 rounded animate-pulse" />
                                </div>
                                <div className="px-6 py-3 flex-1">
                                  <div className="h-3 w-24 bg-gray-400 rounded animate-pulse" />
                                </div>
                                <div className="px-6 py-3 flex-1">
                                  <div className="h-3 w-8 bg-gray-400 rounded animate-pulse" />
                                </div>
                                <div className="px-6 py-3 flex-1">
                                  <div className="h-3 w-12 bg-gray-400 rounded animate-pulse" />
                                </div>
                                {metricIndex === 1 && (
                                  <>
                                    <div className="px-6 py-3 flex-1">
                                      <div className="h-3 w-28 bg-gray-400 rounded animate-pulse" />
                                    </div>
                                    <div className="px-6 py-3 flex-1">
                                      <div className="h-3 w-32 bg-gray-400 rounded animate-pulse" />
                                    </div>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Table body */}
                        <div className="bg-white divide-y divide-gray-200">
                          {/* Control row */}
                          <div className="bg-purple-50">
                            <div className="flex">
                              <div className="px-6 py-4 flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="h-4 w-16 bg-gray-400 rounded animate-pulse" />
                                  <div className="h-5 w-14 bg-purple-200 rounded animate-pulse" />
                                </div>
                              </div>
                              <div className="px-6 py-4 flex-1">
                                <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
                              </div>
                              <div className="px-6 py-4 flex-1">
                                <div className="h-4 w-20 bg-gray-300 rounded animate-pulse" />
                              </div>
                              <div className="px-6 py-4 flex-1">
                                <div className="h-4 w-12 bg-gray-300 rounded animate-pulse" />
                              </div>
                              <div className="px-6 py-4 flex-1">
                                <div className="h-4 w-8 bg-gray-400 rounded animate-pulse" />
                              </div>
                              {metricIndex === 1 && (
                                <>
                                  <div className="px-6 py-4 flex-1">
                                    <div className="h-4 w-20 bg-gray-300 rounded animate-pulse" />
                                  </div>
                                  <div className="px-6 py-4 flex-1">
                                    <div className="h-4 w-24 bg-gray-300 rounded animate-pulse" />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Treatment rows */}
                          {Array.from({ length: 2 }).map((_, treatmentIndex) => (
                            <div key={treatmentIndex} className={treatmentIndex === 0 ? "bg-green-50" : "hover:bg-gray-50"}>
                              <div className="flex">
                                <div className="px-6 py-4 flex-1">
                                  <div className="h-4 w-20 bg-gray-400 rounded animate-pulse" />
                                </div>
                                <div className="px-6 py-4 flex-1">
                                  <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
                                </div>
                                <div className="px-6 py-4 flex-1">
                                  <div className="h-4 w-20 bg-gray-300 rounded animate-pulse" />
                                </div>
                                <div className="px-6 py-4 flex-1">
                                  <div className="h-4 w-12 bg-gray-300 rounded animate-pulse" />
                                </div>
                                <div className="px-6 py-4 flex-1">
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-green-300 rounded animate-pulse" />
                                    <div className="h-4 w-12 bg-green-300 rounded animate-pulse" />
                                  </div>
                                </div>
                                {metricIndex === 1 && (
                                  <>
                                    <div className="px-6 py-4 flex-1">
                                      <div className="h-5 w-20 bg-green-200 rounded animate-pulse" />
                                    </div>
                                    <div className="px-6 py-4 flex-1">
                                      <div className="h-4 w-24 bg-gray-300 rounded animate-pulse" />
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
