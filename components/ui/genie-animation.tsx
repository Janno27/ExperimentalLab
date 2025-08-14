'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GenieAnimationProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  triggerPosition: { x: number; y: number }
  className?: string
  onAnimationComplete?: (state: 'entering' | 'entered' | 'exiting' | 'exited') => void
}

export function GenieAnimation({ 
  children, 
  isOpen, 
  onClose, 
  triggerPosition, 
  className = "", 
  onAnimationComplete 
}: GenieAnimationProps) {
  const [animationState, setAnimationState] = useState<'entering' | 'entered' | 'exiting' | 'exited'>('exited')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setAnimationState('entering')
    } else {
      setAnimationState('exiting')
    }
  }, [isOpen])

  const handleAnimationComplete = () => {
    if (animationState === 'entering') {
      setAnimationState('entered')
      onAnimationComplete?.('entered')
    } else if (animationState === 'exiting') {
      setAnimationState('exited')
      onAnimationComplete?.('exiting')
      // Appeler onClose seulement après l'animation de sortie
      onClose()
    }
  }

  // Animation d'entrée (effet d'aspiration depuis l'icône)
  const enterAnimation = {
    initial: {
      scale: 0,
      opacity: 0,
      borderRadius: '50%',
      // Utiliser transform pour l'effet d'aspiration
      transform: `translate(${triggerPosition.x}px, ${triggerPosition.y}px)`
    },
    animate: {
      scale: 1,
      opacity: 1,
      borderRadius: '8px',
      transform: 'translate(0px, 0px)',
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        duration: 0.6
      }
    }
  }

  // Animation de sortie (effet d'aspiration vers l'icône)
  const exitAnimation = {
    exit: {
      scale: 0,
      opacity: 0,
      borderRadius: '50%',
      transform: `translate(${triggerPosition.x}px, ${triggerPosition.y}px)`,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
        duration: 0.5
      }
    }
  }

  return (
    <AnimatePresence mode="wait" onExitComplete={handleAnimationComplete}>
      {isOpen && (
        <motion.div
          ref={contentRef}
          className={`fixed inset-0 z-[9999] pointer-events-none ${className}`}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={{
            initial: enterAnimation.initial,
            animate: enterAnimation.animate,
            exit: exitAnimation.exit
          }}
          onAnimationComplete={handleAnimationComplete}
        >
          {/* Le contenu enfant gère maintenant son propre positionnement */}
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
} 