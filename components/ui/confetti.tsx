import React, { useEffect, useState, useCallback } from 'react'

interface ConfettiProps {
  isActive: boolean
  onComplete?: () => void
}

interface ConfettiPiece {
  id: number
  x: number
  y: number
  rotation: number
  scale: number
  color: string
  velocity: {
    x: number
    y: number
    rotation: number
  }
}

export function Confetti({ isActive, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  const handleComplete = useCallback(() => {
    onComplete?.()
  }, [onComplete])

  useEffect(() => {
    if (!isActive) {
      setPieces([])
      return
    }

    // Créer les confettis
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
    const newPieces: ConfettiPiece[] = []
    
    for (let i = 0; i < 50; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocity: {
          x: (Math.random() - 0.5) * 8,
          y: Math.random() * 3 + 2,
          rotation: (Math.random() - 0.5) * 10
        }
      })
    }

    setPieces(newPieces)

    // Animation
    const interval = setInterval(() => {
      setPieces(prevPieces => {
        const updatedPieces = prevPieces.map(piece => ({
          ...piece,
          x: piece.x + piece.velocity.x,
          y: piece.y + piece.velocity.y,
          rotation: piece.rotation + piece.velocity.rotation,
          velocity: {
            ...piece.velocity,
            y: piece.velocity.y + 0.1 // Gravité
          }
        }))

        // Vérifier si tous les confettis sont sortis de l'écran
        const allOutOfScreen = updatedPieces.every(piece => piece.y > window.innerHeight + 50)
        
        if (allOutOfScreen) {
          clearInterval(interval)
          // Utiliser setTimeout pour éviter l'erreur de setState pendant le rendu
          setTimeout(() => {
            handleComplete()
          }, 0)
          return []
        }

        return updatedPieces
      })
    }, 16) // ~60fps

    return () => clearInterval(interval)
  }, [isActive, handleComplete])

  if (!isActive || pieces.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            left: piece.x,
            top: piece.y,
            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
            backgroundColor: piece.color,
            boxShadow: `0 0 4px ${piece.color}`
          }}
        />
      ))}
    </div>
  )
} 