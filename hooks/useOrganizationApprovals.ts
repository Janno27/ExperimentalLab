'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useOrganizationApprovals() {
  const [approvalCount, setApprovalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchApprovalCount = async () => {
    try {
      setLoading(true)
      
      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setApprovalCount(0)
        setLoading(false)
        return
      }

      // Récupérer le profil pour obtenir l'organisation principale
      const { data: profileData } = await supabase
        .from('profiles')
        .select('main_organization_id')
        .eq('id', user.id)
        .single()

      if (!profileData?.main_organization_id) {
        setApprovalCount(0)
        setLoading(false)
        return
      }

      // Vérifier le rôle de l'utilisateur dans l'organisation
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', profileData.main_organization_id)
        .eq('user_id', user.id)
        .single()

      // Seuls les admin et super_admin peuvent voir les demandes d'approbation
      if (!memberData || !['admin', 'super_admin'].includes(memberData.role)) {
        setApprovalCount(0)
        setLoading(false)
        return
      }

      // Compter les demandes d'approbation en attente
      const { data: pendingApprovals, count } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profileData.main_organization_id)
        .eq('role', 'pending')

      setApprovalCount(count || 0)
      setLoading(false)
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes d\'approbation:', error)
      setApprovalCount(0)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApprovalCount()

    // Écouter les changements d'organisation
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'organization_changed') {
        fetchApprovalCount()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Fonction pour rafraîchir le count (utile après approbation/refus)
  const refreshApprovalCount = () => {
    fetchApprovalCount()
  }

  return {
    approvalCount,
    loading,
    refreshApprovalCount
  }
}
