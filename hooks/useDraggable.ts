import { useState, useRef, useEffect, useCallback } from 'react'

interface UseDraggableOptions {
  initialPosition?: { x: number; y: number }
  windowSize: { width: number; height: number }
  isOpen: boolean
}

interface UseDraggableReturn {
  position: { x: number; y: number }
  isDragging: boolean
  dragRef: React.RefObject<HTMLDivElement | null>
  handleMouseDown: (e: React.MouseEvent) => void
}

export function useDraggable({ 
  initialPosition = { x: 0, y: 0 }, 
  windowSize, 
  isOpen 
}: UseDraggableOptions): UseDraggableReturn {
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    // Empêcher la sélection de texte
    e.preventDefault()
    
    if (e.target === dragRef.current || (e.target as Element).closest('.drag-handle')) {
      setIsDragging(true)
      const rect = dragRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && dragRef.current) {
      e.preventDefault() // Empêcher la sélection pendant le drag
      
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      
      // Limiter la position aux bords de l'écran
      const maxX = window.innerWidth - windowSize.width
      const maxY = window.innerHeight - windowSize.height
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Event listeners pour le drag and drop
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false })
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isOpen, isDragging, dragOffset])

  // Détecter quand nous sommes côté client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fonction mémorisée pour calculer la position initiale
  const calculateInitialPosition = useCallback(() => {
    if (isClient) {
      // Positionner au centre de l'écran par défaut
      const centerX = Math.max(0, (window.innerWidth - windowSize.width) / 2)
      const centerY = Math.max(20, (window.innerHeight - windowSize.height) / 2)
      
      return {
        x: initialPosition.x === 0 ? centerX : initialPosition.x,
        y: initialPosition.y === 0 ? centerY : initialPosition.y
      }
    }
    return initialPosition
  }, [isClient, initialPosition.x, initialPosition.y, windowSize.width, windowSize.height])

  // Réinitialiser la position seulement une fois au premier rendu
  useEffect(() => {
    if (isOpen && isClient && !hasInitialized) {
      const calculatedPosition = calculateInitialPosition()
      setPosition(calculatedPosition)
      setHasInitialized(true)
    }
  }, [isOpen, isClient, hasInitialized, calculateInitialPosition])

  // Empêcher la sélection de texte sur tout le document pendant le drag
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none'
      ;(document.body.style as any).webkitUserSelect = 'none'
      ;(document.body.style as any).mozUserSelect = 'none'
      ;(document.body.style as any).msUserSelect = 'none'
    } else {
      document.body.style.userSelect = ''
      ;(document.body.style as any).webkitUserSelect = ''
      ;(document.body.style as any).mozUserSelect = ''
      ;(document.body.style as any).msUserSelect = ''
    }

    return () => {
      document.body.style.userSelect = ''
      ;(document.body.style as any).webkitUserSelect = ''
      ;(document.body.style as any).mozUserSelect = ''
      ;(document.body.style as any).msUserSelect = ''
    }
  }, [isDragging])

  return {
    position,
    isDragging,
    dragRef,
    handleMouseDown
  }
} 