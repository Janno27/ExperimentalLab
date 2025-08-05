"use client"
import React, { useState, useRef } from "react"
import { AppBar } from './app-bar'

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const [appBarOpen, setAppBarOpen] = useState(false)
  const [showPadding, setShowPadding] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Gère le padding avec un délai à la fermeture
  React.useEffect(() => {
    if (appBarOpen) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setShowPadding(true)
    } else {
      // Délai pour laisser le temps aux icônes de disparaître
      timeoutRef.current = setTimeout(() => setShowPadding(false), 180)
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [appBarOpen])

  return (
    <div
      className={`relative min-h-screen transition-[padding-right] duration-300 ease-in-out`}
      style={{ paddingRight: showPadding ? 48 : 0 }}
    >
      {children}
      <AppBar open={appBarOpen} setOpen={setAppBarOpen} />
    </div>
  )
} 