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

  // Debug logs
  console.log('AuthGuard - user:', user?.id, 'loading:', loading, 'userStatus:', userStatus, 'pathname:', pathname, 'isStaticFile:', isStaticFile)

  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && !isStaticFile) {
      console.log('AuthGuard - Redirecting to login (no user)')
      router.push('/login')
    }
  }, [user, loading, router, pathname, isStaticFile])

  useEffect(() => {
    if (!loading && user && userStatus === 'not_member' && pathname !== '/login' && !isStaticFile) {
      console.log('AuthGuard - User is not member, redirecting to login')
      router.push('/login')
    }
  }, [user, loading, userStatus, router, pathname, isStaticFile])

  // Si c'est un fichier statique, ne pas appliquer l'AuthGuard
  if (isStaticFile) {
    console.log('AuthGuard - Static file, bypassing auth check')
    return <>{children}</>
  }

  // Afficher un loader pendant le chargement
  if (loading) {
    console.log('AuthGuard - Showing loader')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  // Rediriger vers login si pas connecté
  if (!user && pathname !== '/login') {
    console.log('AuthGuard - No user, returning null')
    return null
  }

  // Si on est sur la page login, afficher le contenu
  if (pathname === '/login') {
    console.log('AuthGuard - On login page, showing content')
    return <>{children}</>
  }

  // Afficher la page d'attente si l'utilisateur est pending
  if (user && userStatus === 'pending') {
    console.log('AuthGuard - User is pending, showing PendingApproval')
    return <PendingApproval />
  }

  // Afficher le contenu normal si tout est OK
  console.log('AuthGuard - User is approved, showing content')
  return <>{children}</>
} 