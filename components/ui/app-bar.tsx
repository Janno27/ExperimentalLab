"use client"
import * as React from "react"
import { useState, useEffect } from "react"
import { Calculator } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ABTestCalculator } from '@/components/calculator'
import { usePathname } from 'next/navigation'

type AppBarProps = {
  children?: React.ReactNode
  open?: boolean
  setOpen?: (open: boolean) => void
  onCalculatorStateChange?: (isOpen: boolean) => void
}

export function AppBar({ children, open: controlledOpen, setOpen: controlledSetOpen, onCalculatorStateChange }: AppBarProps) {
  const pathname = usePathname()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [calculatorTriggerPosition, setCalculatorTriggerPosition] = useState({ x: 0, y: 0 })
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = controlledSetOpen || setUncontrolledOpen
  
  // Désactiver l'app-bar sur la page de login
  const isLoginPage = pathname === '/login'
  
  // L'app-bar reste ouvert si le calculateur est ouvert
  const shouldStayOpen = open || calculatorOpen

  // Notifier l'app-layout-client des changements d'état du calculateur
  useEffect(() => {
    if (onCalculatorStateChange) {
      onCalculatorStateChange(calculatorOpen)
    }
  }, [calculatorOpen, onCalculatorStateChange])

  // Si c'est la page de login, ne pas afficher l'app-bar
  if (isLoginPage) {
    return null
  }

  // Animation classes pour fade + slide
  const iconAnim = `transition-all duration-300 ease-in-out ${shouldStayOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`
  const iconBtn = `rounded-xl p-2 flex items-center justify-center mx-auto cursor-pointer hover:bg-violet-100 hover:scale-105 hover:shadow-sm focus-visible:bg-violet-100 focus-visible:scale-105 focus-visible:shadow-sm transition-all`;

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={`fixed right-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out ${shouldStayOpen ? 'w-12' : 'w-6'} pointer-events-none`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => {
          // Ne pas fermer si le calculateur est ouvert
          if (!calculatorOpen) {
            setOpen(false)
          }
        }}
      >
        {/* Zone de détection du hover */}
        <div className="absolute left-0 top-0 h-full w-8 cursor-pointer" style={{ zIndex: 1 }} />
        
        {/* Calculator Tool - Première position */}
        <div className={`flex flex-col items-center py-4 gap-4 pointer-events-auto w-full`} style={{ zIndex: 2 }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                className={`${iconBtn} ${iconAnim} ${calculatorOpen ? 'bg-violet-100 scale-110 shadow-md' : ''}`} 
                tabIndex={shouldStayOpen ? 0 : -1} 
                style={{ background: calculatorOpen ? 'rgb(243 232 255)' : 'transparent' }}
                onClick={(e) => {
                  if (calculatorOpen) {
                    // Si la fenêtre est ouverte, la fermer
                    setCalculatorOpen(false)
                    setOpen(false)
                  } else {
                    // Si la fenêtre est fermée, l'ouvrir à côté de l'icône
                    const rect = e.currentTarget.getBoundingClientRect()
                    const windowWidth = 420 // Largeur de la fenêtre calculator
                    const spacing = 20 // Espace entre l'icône et la fenêtre
                    
                    // Calculer la position pour que la fenêtre soit à droite de l'icône
                    let x = rect.right + spacing
                    
                    // Vérifier que la fenêtre ne sorte pas de l'écran
                    if (x + windowWidth > window.innerWidth) {
                      // Si elle sort à droite, la positionner à gauche de l'icône
                      x = rect.left - windowWidth - spacing
                    }
                    
                    setCalculatorTriggerPosition({
                      x: x,
                      y: rect.top
                    })
                    setCalculatorOpen(true)
                  }
                }}
              >
                <Calculator className={`w-4 h-4 ${calculatorOpen ? 'text-violet-800' : 'text-violet-700'}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" align="center">
              {calculatorOpen ? 'Fermer A/B Test Calculator' : 'A/B Test Calculator'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Content (actions ou widgets) */}
        <div className={`flex-1 flex flex-col items-center justify-center gap-6 pointer-events-auto w-full`} style={{ zIndex: 2 }}>
          {children && (
            <div className={iconAnim}>{children}</div>
          )}
        </div>
      </aside>
      
      {/* Calculator Modal */}
      <ABTestCalculator 
        isOpen={calculatorOpen} 
        onClose={() => {
          setCalculatorOpen(false)
          // Fermer aussi l'app-bar quand le calculateur se ferme
          setOpen(false)
        }}
        triggerPosition={calculatorTriggerPosition}
      />
    </TooltipProvider>
  )
} 