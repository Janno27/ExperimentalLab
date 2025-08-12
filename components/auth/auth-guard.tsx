'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { PendingApproval } from './pending-approval'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, userStatus } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Ignorer les fichiers statiques et les assets
  const isStaticFile = pathname.includes('.') || 
                      pathname.startsWith('/_next/') || 
                      pathname.startsWith('/api/') ||
                      pathname.includes('favicon') ||
                      pathname.includes('placeholder')

  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && !isStaticFile) {
      router.push('/login')
    }
  }, [user, loading, router, pathname, isStaticFile])

  useEffect(() => {
    if (!loading && user && userStatus === 'not_member' && pathname !== '/login' && !isStaticFile) {
      router.push('/login')
    }
  }, [user, loading, userStatus, router, pathname, isStaticFile])

  // Si c'est un fichier statique, ne pas appliquer l'AuthGuard
  if (isStaticFile) {
    return <>{children}</>
  }

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  // Rediriger vers login si pas connecté
  if (!user && pathname !== '/login') {
    return null
  }

  // Si on est sur la page login, afficher le contenu
  if (pathname === '/login') {
    return <>{children}</>
  }

  // Afficher la page d'attente si l'utilisateur est pending
  if (user && userStatus === 'pending') {
    return <PendingApproval />
  }

  // Afficher le contenu normal si tout est OK
  return <>{children}</>
} 