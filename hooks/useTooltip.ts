import { useState, useCallback } from 'react'
import { Project } from '@/types/timeline'

interface TooltipState {
  isVisible: boolean
  project: Project | null
  position: { x: number; y: number }
}

export function useTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>({
    isVisible: false,
    project: null,
    position: { x: 0, y: 0 }
  })

  const showTooltip = useCallback((project: Project, x: number, y: number) => {
    setTooltip({
      isVisible: true,
      project,
      position: { x, y }
    })
  }, [])

  const hideTooltip = useCallback(() => {
    setTooltip(prev => ({
      ...prev,
      isVisible: false
    }))
  }, [])

  return {
    tooltip,
    showTooltip,
    hideTooltip
  }
} 