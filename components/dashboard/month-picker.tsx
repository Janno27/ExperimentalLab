'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthPickerProps {
  value: Date
  onChange: (date: Date) => void
  className?: string
}

export function MonthPicker({ value, onChange, className = '' }: MonthPickerProps) {
  const [currentYear, setCurrentYear] = useState(value.getFullYear())

  const handleSelect = (year: number, month: number) => {
    const newDate = new Date(year, month, 1)
    onChange(newDate)
  }

  const isCurrentMonth = (year: number, month: number) => {
    const now = new Date()
    return year === now.getFullYear() && month === now.getMonth()
  }

  const isSelectedMonth = (year: number, month: number) => {
    return year === value.getFullYear() && month === value.getMonth()
  }

  const goToCurrentMonth = () => {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    onChange(now)
  }

  // Générer les mois
  const months = [
    { name: 'Jan', value: 0 },
    { name: 'Feb', value: 1 },
    { name: 'Mar', value: 2 },
    { name: 'Apr', value: 3 },
    { name: 'May', value: 4 },
    { name: 'Jun', value: 5 },
    { name: 'Jul', value: 6 },
    { name: 'Aug', value: 7 },
    { name: 'Sep', value: 8 },
    { name: 'Oct', value: 9 },
    { name: 'Nov', value: 10 },
    { name: 'Dec', value: 11 }
  ]

  return (
    <div className={`${className}`}>
      {/* Navigation année */}
      <div className="flex items-center justify-between p-2">
        <button 
          className="p-1 rounded hover:bg-gray-50 transition-colors" 
          onClick={() => setCurrentYear(currentYear - 1)}
        >
          <ChevronLeft className="w-3 h-3 text-gray-500" />
        </button>
        <div className="text-sm font-medium text-gray-700 text-center w-full pl-2">{currentYear}</div>
        <button 
          className="p-1 rounded hover:bg-gray-50 transition-colors" 
          onClick={() => setCurrentYear(currentYear + 1)}
        >
          <ChevronRight className="w-3 h-3 text-gray-500" />
        </button>
      </div>
      
      {/* Grille des mois */}
      <div className="p-2">
        <div className="grid grid-cols-3 gap-0.5">
          {months.map((month) => (
            <button
              key={month.value}
              onClick={() => handleSelect(currentYear, month.value)}
              className={`h-7 text-xs rounded transition-colors text-center px-2 ${
                isSelectedMonth(currentYear, month.value)
                  ? 'bg-purple-50 text-purple-700'
                  : isCurrentMonth(currentYear, month.value)
                  ? 'bg-gray-50 text-gray-600'
                  : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              {month.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Bouton pour revenir au mois actuel */}
      <div className="p-2">
        <button
          onClick={goToCurrentMonth}
          className="w-full text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded px-2 py-1 transition-colors text-center"
        >
          Current Month
        </button>
      </div>
    </div>
  )
} 