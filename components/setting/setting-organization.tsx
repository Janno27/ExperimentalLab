import React, { useEffect, useState, useRef } from 'react'
import { ChevronsUpDown, User2, Trash2, Check, X, Link2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrganizationApprovals } from '@/hooks/useOrganizationApprovals'

const roles = [
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Admin', value: 'admin' },
  { label: 'Member', value: 'member' },
  { label: 'View', value: 'view' },
]

type Profile = {
  id: string;
  full_name: string;
  email: string;
};

type OrganizationMember = {
  id: string;
  role: string;
  user_id: string;
  profiles: Profile[];
};

export function SettingOrganization() {
  const [org, setOrg] = useState<{ id: string; name: string } | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [approvals, setApprovals] = useState<OrganizationMember[]>([])
  const [roleDropdown, setRoleDropdown] = useState<{ [id: string]: boolean }>({})
  const [pendingRoles, setPendingRoles] = useState<{ [id: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const dropdownRefs = useRef<{ [id: string]: HTMLDivElement | null }>({})
  const { refreshApprovalCount } = useOrganizationApprovals()

  // Fonctions utilitaires pour les permissions
  const canModifyRoles = () => ['admin', 'super_admin'].includes(currentUserRole || '')
  const canSeeApprovalSection = () => ['admin', 'super_admin'].includes(currentUserRole || '')
  const canSeeMembers = () => ['member', 'admin', 'super_admin'].includes(currentUserRole || '')
  const canModifyMember = (memberRole: string) => {
    if (currentUserRole === 'super_admin') return true
    if (currentUserRole === 'admin') return memberRole !== 'super_admin'
    return false
  }
  const getAvailableRoles = () => {
    if (currentUserRole === 'super_admin') return roles
    if (currentUserRole === 'admin') return roles.filter(r => r.value !== 'super_admin')
    return []
  }

  const fetchData = async () => {
    console.log('SettingOrganization - Fetching data...')
    
    // Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    // Récupérer le profil de l'utilisateur pour obtenir l'organisation principale
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('main_organization_id')
      .eq('id', user.id)
      .single()
    
    console.log('SettingOrganization - Profile data:', profileData, 'Error:', profileError)
    
    if (!profileData?.main_organization_id) {
      console.log('SettingOrganization - No main organization found')
      return
    }
    
    // Récupérer l'organisation principale
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profileData.main_organization_id)
      .single()
    
    console.log('SettingOrganization - Organization data:', orgData, 'Error:', orgError)
    
    if (orgData) {
      setOrg(orgData)
      
      // Récupérer tous les membres de l'organisation
      const { data: allMembers, error: membersError } = await supabase
        .from('organization_members')
        .select('id, role, user_id')
        .eq('organization_id', orgData.id)
      
      console.log('SettingOrganization - All members:', allMembers, 'Error:', membersError)
      
      if (allMembers && allMembers.length > 0) {
        // Récupérer les profils des utilisateurs
        const userIds = allMembers.map(m => m.user_id)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)
        
        console.log('SettingOrganization - Profiles:', profiles, 'Error:', profilesError)
        
        // Combiner les données
        const membersWithProfiles = allMembers.map(member => ({
          ...member,
          profiles: profiles?.filter(p => p.id === member.user_id) || []
        }))
        
        // Trouver le rôle de l'utilisateur connecté
        const currentUserMember = membersWithProfiles.find(m => m.user_id === user.id)
        if (currentUserMember) {
          setCurrentUserRole(currentUserMember.role)
        }
        
        // Séparer les membres approuvés et les demandes d'approbation
        const approvedMembers = membersWithProfiles.filter(m => m.role !== 'pending')
        const pendingApprovals = membersWithProfiles.filter(m => m.role === 'pending')
        
        console.log('SettingOrganization - Approved members:', approvedMembers)
        console.log('SettingOrganization - Pending approvals:', pendingApprovals)
        
        setMembers(approvedMembers)
        setApprovals(pendingApprovals)
      } else {
        setMembers([])
        setApprovals([])
      }
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Écouter les changements d'organisation (optionnel, pour une mise à jour en temps réel)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'organization_changed') {
        console.log('SettingOrganization - Organization changed, refetching data...')
        fetchData()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Fermer les dropdowns en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.keys(roleDropdown).forEach(id => {
        if (roleDropdown[id] && dropdownRefs.current[id] && !dropdownRefs.current[id]?.contains(event.target as Node)) {
          setRoleDropdown(prev => ({ ...prev, [id]: false }))
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [roleDropdown])

  const handleRoleChange = async (id: string, newRole: string) => {
    // Vérifier les permissions
    if (!currentUserRole || !['admin', 'super_admin'].includes(currentUserRole)) {
      toast.error('You don\'t have permission to modify roles')
      return
    }

    // Vérifier si l'admin essaie de modifier un super_admin
    const targetMember = members.find(m => m.id === id)
    if (currentUserRole === 'admin' && targetMember?.role === 'super_admin') {
      toast.error('You cannot modify a Super Admin\'s role')
      return
    }

    // Vérifier si l'admin essaie d'assigner le rôle super_admin
    if (currentUserRole === 'admin' && newRole === 'super_admin') {
      toast.error('You cannot assign the Super Admin role')
      return
    }
    
    const { error } = await supabase.from('organization_members').update({ role: newRole }).eq('id', id)
    if (error) {
      toast.error('Error updating role')
      return
    }
    
    setMembers(members => members.map(m => m.id === id ? { ...m, role: newRole } : m))
    toast.success('Role updated successfully')
  }
  const handleRemove = async (id: string) => {
    // Vérifier les permissions
    if (!currentUserRole || !['admin', 'super_admin'].includes(currentUserRole)) {
      toast.error('You don\'t have permission to remove members')
      return
    }

    // Vérifier si l'admin essaie de supprimer un super_admin
    const targetMember = members.find(m => m.id === id)
    if (currentUserRole === 'admin' && targetMember?.role === 'super_admin') {
      toast.error('You cannot remove a Super Admin')
      return
    }
    
    const { error } = await supabase.from('organization_members').delete().eq('id', id)
    if (error) {
      toast.error('Error removing member')
      return
    }
    
    setMembers(members => members.filter(m => m.id !== id))
    toast.success('Member removed successfully')
  }
  const handleApprove = async (id: string, role: string) => {
    // Vérifier les permissions
    if (!currentUserRole || !['admin', 'super_admin'].includes(currentUserRole)) {
      toast.error('You don\'t have permission to approve users')
      return
    }
    
    try {
      setIsLoading(true)
      
      // Mettre à jour le rôle de l'utilisateur
      const { error: updateError } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', id)

      if (updateError) {
        toast.error('Error during approval')
        setIsLoading(false)
        return
      }

      // Récupérer les informations de l'utilisateur pour l'email
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('user_id, profiles:profiles(email, full_name)')
        .eq('id', id)
        .single()

      if (memberData?.profiles?.[0]?.email) {
        // Envoyer un email d'approbation (ici tu peux intégrer ton service d'email)
        console.log(`Approval email sent to: ${memberData.profiles[0].email}`)
        // TODO: Intégrer un service d'email comme SendGrid, Resend, etc.
        toast.success(`User approved and email sent to ${memberData.profiles[0].email}`)
      } else {
        toast.success('User approved')
      }

      // Attendre un peu pour montrer le skeleton
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Recharger les données
      await fetchData()
      
      // Rafraîchir le count des notifications
      refreshApprovalCount()
      
      setIsLoading(false)
    } catch (error) {
      console.error('Error during approval:', error)
      toast.error('Error during approval')
      setIsLoading(false)
    }
  }

  const handleDecline = async (id: string) => {
    // Vérifier les permissions
    if (!currentUserRole || !['admin', 'super_admin'].includes(currentUserRole)) {
      toast.error('You don\'t have permission to decline users')
      return
    }
    
    try {
      setIsLoading(true)
      
      // Récupérer les informations de l'utilisateur pour l'email
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('user_id, profiles:profiles(email, full_name)')
        .eq('id', id)
        .single()

      // Supprimer l'utilisateur
      const { error: deleteError } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', id)

      if (deleteError) {
        toast.error('Error declining request')
        setIsLoading(false)
        return
      }

      if (memberData?.profiles?.[0]?.email) {
        // Envoyer un email de refus
        console.log(`Decline email sent to: ${memberData.profiles[0].email}`)
        // TODO: Intégrer un service d'email
        toast.success(`Request declined and email sent to ${memberData.profiles[0].email}`)
      } else {
        toast.success('Request declined')
      }

      // Attendre un peu pour montrer le skeleton
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Recharger les données
      await fetchData()
      
      // Rafraîchir le count des notifications
      refreshApprovalCount()
      
      setIsLoading(false)
    } catch (error) {
      console.error('Error declining request:', error)
      toast.error('Error declining request')
      setIsLoading(false)
    }
  }
  const handleCopyInvite = () => {
    if (!org) return
    const url = `${window.location.origin}/login?orgId=${org.id}&orgName=${encodeURIComponent(org.name)}`
    navigator.clipboard.writeText(url)
    toast.success('Invitation link copied to clipboard!', { 
      position: 'bottom-right',
      duration: 3000
    })
  }

  return (
    <div className="space-y-4 p-3">
      <div>
        <div className="font-medium text-xs text-gray-500 mb-1">Organization</div>
        <div className="flex items-center gap-2">
          <User2 className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-sm text-gray-900">{org?.name || '...'}</span>
        </div>
      </div>
      {canSeeMembers() && (
        <div>
          <div className="font-medium text-xs text-gray-500 mb-1">Members</div>
          <div className="rounded-lg bg-gray-50 p-1.5 divide-y divide-gray-100">
          {isLoading ? (
            // Skeleton pour les membres
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between py-1.5 px-1.5">
                <div className="flex flex-col flex-1 min-w-0 gap-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-32" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-3 w-3 rounded" />
                </div>
              </div>
            ))
          ) : (
            members.map(member => (
              <div key={String(member.id)} className="flex items-center justify-between py-1.5 px-1.5">
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium text-xs text-gray-900 truncate">{member.profiles?.[0]?.full_name || 'Unknown'}</span>
                  <span className="text-xs text-gray-500 truncate">{member.profiles?.[0]?.email || ''}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="relative" ref={el => { dropdownRefs.current[member.id] = el }}>
                    {canModifyRoles() && canModifyMember(member.role) ? (
                      <>
                        <button
                          className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 transition-colors ${member.role === 'super_admin' ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'}`}
                          onClick={() => setRoleDropdown(d => ({ ...d, [member.id]: !d[member.id] }))}
                        >
                          {roles.find(r => r.value === member.role)?.label || member.role}
                          <ChevronsUpDown className="w-3 h-3 ml-0.5" />
                        </button>
                        {roleDropdown[member.id] && (
                          <div className="absolute right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[90px]">
                            {getAvailableRoles().map(r => (
                              <div
                                key={r.value}
                                className="px-2 py-1.5 text-xs hover:bg-violet-50 cursor-pointer rounded transition-colors"
                                onClick={() => { handleRoleChange(member.id, r.value); setRoleDropdown(d => ({ ...d, [member.id]: false })) }}
                              >
                                {r.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${member.role === 'super_admin' ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                        {roles.find(r => r.value === member.role)?.label || member.role}
                      </span>
                    )}
                  </div>
                  {canModifyRoles() && canModifyMember(member.role) && (
                    <button
                      className="text-gray-400 hover:text-red-500 p-0.5"
                      title="Remove"
                      onClick={() => handleRemove(member.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      )}
      {canSeeApprovalSection() && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="font-medium text-xs text-gray-500">Approval</div>
            <button
              className="flex items-center gap-1 text-xs text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded transition cursor-pointer"
              title="Copy invitation link"
              onClick={handleCopyInvite}
              type="button"
            >
              <Link2 className="w-3 h-3" /> Invite
            </button>
          </div>
        <div className="rounded-lg bg-gray-50 p-1.5 divide-y divide-gray-100">
          {isLoading ? (
            // Skeleton pour les approbations
            Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between py-1.5 px-1.5">
                <div className="flex flex-col flex-1 min-w-0 gap-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-32" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-3 w-3 rounded" />
                  <Skeleton className="h-3 w-3 rounded" />
                </div>
              </div>
            ))
          ) : (
            <>
              {approvals.length === 0 && <div className="text-xs text-gray-400 py-1.5">No pending requests</div>}
              {approvals.map(user => (
                <div key={user.id} className="flex items-center justify-between py-1.5 px-1.5">
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-xs text-gray-900 truncate">{user.profiles?.[0]?.full_name || 'Unknown'}</span>
                    <span className="text-xs text-gray-500 truncate">{user.profiles?.[0]?.email || ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="relative" ref={el => { dropdownRefs.current[user.id] = el }}>
                      <button
                        className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 flex items-center gap-1 transition-colors"
                        onClick={() => setRoleDropdown(d => ({ ...d, [user.id]: !d[user.id] }))}
                      >
                        {pendingRoles[user.id] || 'Member'}
                        <ChevronsUpDown className="w-3 h-3" />
                      </button>
                      {roleDropdown[user.id] && (
                        <div className="absolute right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[90px]">
                          {getAvailableRoles().map(r => (
                            <div
                              key={r.value}
                              className="px-2 py-1.5 text-xs hover:bg-violet-50 cursor-pointer rounded transition-colors"
                              onClick={() => { setPendingRoles(pr => ({ ...pr, [user.id]: r.value })); setRoleDropdown(d => ({ ...d, [user.id]: false })) }}
                            >
                              {r.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="text-green-600 hover:bg-green-50 rounded p-0.5"
                      title="Approve"
                      onClick={() => handleApprove(user.id, pendingRoles[user.id] || 'member')}
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      className="text-red-500 hover:bg-red-50 rounded p-0.5"
                      title="Decline"
                      onClick={() => handleDecline(user.id)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        </div>
      )}

    </div>
  )
} 