import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userStatus, setUserStatus] = useState<'approved' | 'pending' | 'not_member' | null>(null)

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
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUserOrganizationStatus = async (userId: string) => {
    console.log('checkUserOrganizationStatus - Checking status for user:', userId)

    try {
      // Vérifier le statut de l'utilisateur dans l'organisation
      const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', userId)
        .limit(1)

      console.log('checkUserOrganizationStatus - Query result:', { data, error })

      if (error) {
        console.error('Query error:', error)
        setUserStatus('not_member')
        return
      }

      if (data && data.length > 0) {
        const status = data[0].role === 'pending' ? 'pending' : 'approved'
        console.log('checkUserOrganizationStatus - Setting status to:', status)
        setUserStatus(status)
      } else {
        console.log('checkUserOrganizationStatus - No membership found')
        setUserStatus('not_member')
      }
    } catch (error) {
      console.error('Exception in checkUserOrganizationStatus:', error)
      setUserStatus('not_member')
    }
  }

  const signUp = async (email: string, password: string, fullName: string, orgMetadata?: { name: string, id?: string }) => {
    console.log('signUp - Starting registration with:', { email, fullName, orgMetadata })
    
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
    
    console.log('signUp - Result:', { data, error })
    
    // Si l'inscription réussit et qu'on a des métadonnées d'organisation
    if (data.user && !error && orgMetadata?.id) {
      try {
        console.log('Adding user to organization:', orgMetadata.id)
        
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
        } else {
          console.log('User successfully added to organization')
        }
        
        // Mettre à jour le profil avec l'organisation principale
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ main_organization_id: orgMetadata.id })
          .eq('id', data.user.id)
        
        if (profileError) {
          console.error('Error updating profile:', profileError)
        } else {
          console.log('Profile successfully updated with organization')
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
    signUp,
    signIn,
    signOut
  }
} 