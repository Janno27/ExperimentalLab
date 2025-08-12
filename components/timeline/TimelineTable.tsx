'use client'

import { Project } from "@/hooks/useExperimentation"
import { STATUS_COLORS } from "@/constants/timeline"
import { ChevronUp, ChevronDown } from "lucide-react"
import { useState } from "react"

interface TimelineTableProps {
  projects: Project[]
  onProjectClick?: (project: Project) => void
}

export function TimelineTable({ projects, onProjectClick }: TimelineTableProps) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Ordre spécifique des statuts
  const statusOrder = [
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

  const getStatusColor = (status: Project['status']) => {
    const colorConfig = STATUS_COLORS[status] || STATUS_COLORS['Open']
    return colorConfig.bg
  }

  const getStatusTextColor = (status: Project['status']) => {
    const colorConfig = STATUS_COLORS[status] || STATUS_COLORS['Open']
    return colorConfig.text
  }

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const handleSortByStatus = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  const sortedProjects = [...projects].sort((a, b) => {
    const indexA = statusOrder.indexOf(a.status)
    const indexB = statusOrder.indexOf(b.status)
    
    // Si les statuts ne sont pas dans la liste, les mettre à la fin
    const orderA = indexA === -1 ? statusOrder.length : indexA
    const orderB = indexB === -1 ? statusOrder.length : indexB
    
    if (sortOrder === 'asc') {
      return orderA - orderB
    } else {
      return orderB - orderA
    }
  })

  return (
    <div className="w-full h-full bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[1400px]">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                Market
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                <button 
                  onClick={handleSortByStatus}
                  className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors duration-150"
                >
                  Status
                  {sortOrder === 'asc' ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                Owner
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                Analysis owner
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                Page
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                Main kpi
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                Test type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                Start date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                End date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                Estimated time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                Mde
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                Success criteria #1
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap">
                Success criteria #2
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProjects.map((project) => (
              <tr 
                key={project.id} 
                className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                onClick={() => onProjectClick?.(project)}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {project.country}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {project.title}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)} ${getStatusTextColor(project.status)}`}
                  >
                    {project.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {project.owner || "-"}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {project.analysisOwner || "-"}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {project.section}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {project.mainKPI || "-"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {project.testType ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {project.testType}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(project.startDate)}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(project.endDate)}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {project.estimatedTime || "-"}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {project.mde ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {project.mde}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {project.successCriteria1 || ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {project.successCriteria2 || ""}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 