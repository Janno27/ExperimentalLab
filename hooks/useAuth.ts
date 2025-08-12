import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'owner' | 'super_admin' | 'admin' | 'member' | 'view' | null

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userStatus, setUserStatus] = useState<'approved' | 'pending' | 'not_member' | null>(null)
  const [userRole, setUserRole] = useState<UserRole>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Si l'utilisateur existe, vérifier son statut
      if (session?.user) {
        checkUserOrganizationStatus(session.user.id)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Si l'utilisateur existe, vérifier son statut
      if (session?.user) {
        checkUserOrganizationStatus(session.user.id)
      } else {
        setUserStatus(null)
        setUserRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUserOrganizationStatus = async (userId: string) => {
    try {
      // Vérifier le statut de l'utilisateur dans l'organisation
      const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', userId)
        .limit(1)

      if (error) {
        console.error('Query error:', error)
        setUserStatus('not_member')
        setUserRole(null)
        return
      }

      if (data && data.length > 0) {
        const status = data[0].role === 'pending' ? 'pending' : 'approved'
        setUserStatus(status)
        setUserRole(data[0].role as UserRole)
      } else {
        setUserStatus('not_member')
        setUserRole(null)
      }
    } catch (error) {
      console.error('Exception in checkUserOrganizationStatus:', error)
      setUserStatus('not_member')
      setUserRole(null)
    }
  }

  // Fonction pour vérifier si l'utilisateur peut modifier les données
  const canEdit = (): boolean => {
    if (!userRole) return false
    return ['owner', 'super_admin', 'admin', 'member'].includes(userRole)
  }

  // Fonction pour vérifier si l'utilisateur peut seulement consulter
  const canView = (): boolean => {
    if (!userRole) return false
    return ['owner', 'super_admin', 'admin', 'member', 'view'].includes(userRole)
  }

  const signUp = async (email: string, password: string, fullName: string, orgMetadata?: { name: string, id?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          org_metadata: orgMetadata
        }
      }
    })
    
    // Si l'inscription réussit et qu'on a des métadonnées d'organisation
    if (data.user && !error && orgMetadata?.id) {
      try {
        // Ajouter l'utilisateur à l'organisation
        const { error: orgError } = await supabase
          .from('organization_members')
          .insert({
            user_id: data.user.id,
            organization_id: orgMetadata.id,
            role: 'pending'
          })
        
        if (orgError) {
          console.error('Error adding user to organization:', orgError)
        }
        
        // Mettre à jour le profil avec l'organisation principale
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ main_organization_id: orgMetadata.id })
          .eq('id', data.user.id)
        
        if (profileError) {
          console.error('Error updating profile:', profileError)
        }
        
      } catch (err) {
        console.error('Error in organization setup:', err)
      }
    }
    
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    user,
    loading,
    userStatus,
    userRole,
    canEdit,
    canView,
    signUp,
    signIn,
    signOut
  }
} 