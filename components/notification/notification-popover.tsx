import React, { useEffect, useState } from 'react'
import { Bell, Check, X, Link2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'

// Type explicite pour les approvals
interface ApprovalProfile {
  id: string
  full_name: string
  email: string
}
interface Approval {
  id: string
  role: string
  user_id: string
  profile: ApprovalProfile | null
}

export function NotificationPopover() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('notification')
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [org, setOrg] = useState<{ id: string; name: string } | null>(null)

  // Récupérer les demandes d'approbation (Team)
  const fetchApprovals = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return setLoading(false)
    // Récupérer le profil pour l'orga principale
    const { data: profile } = await supabase
      .from('profiles')
      .select('main_organization_id')
      .eq('id', user.id)
      .single()
    if (!profile?.main_organization_id) return setLoading(false)
    // Récupérer l'organisation principale (pour le lien d'invitation)
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', profile.main_organization_id)
      .single()
    setOrg(orgData)
    // 1. Récupérer les membres en attente
    const { data: pendingMembers } = await supabase
      .from('organization_members')
      .select('id, role, user_id')
      .eq('organization_id', profile.main_organization_id)
      .eq('role', 'pending')
    if (!pendingMembers || pendingMembers.length === 0) {
      setApprovals([])
      setLoading(false)
      return
    }
    // 2. Récupérer les profils correspondants
    const userIds = pendingMembers.map((m: { user_id: string }) => m.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)
    // 3. Fusionner les deux listes
    const approvalsWithProfiles: Approval[] = pendingMembers.map((member: { id: string, role: string, user_id: string }) => ({
      ...member,
      profile: profiles?.find((p: ApprovalProfile) => p.id === member.user_id) || null
    }))
    setApprovals(approvalsWithProfiles)
    setLoading(false)
  }

  useEffect(() => {
    if (open && tab === 'team') fetchApprovals()
  }, [open, tab])

  // Vérifier les approvals au chargement de la page
  useEffect(() => {
    fetchApprovals()
  }, [])

  // Générer le lien d'invitation
  const generateInviteLink = () => {
    if (!org) return ''
    return `${window.location.origin}/login?orgId=${org.id}&orgName=${encodeURIComponent(org.name)}`
  }

  // Copier le lien d'invitation
  const handleCopyInvite = () => {
    if (!org) return
    const url = generateInviteLink()
    navigator.clipboard.writeText(url)
    toast.success('Invite link copied!', { position: 'bottom-left' })
  }

  // Approuver un utilisateur
  const handleApprove = async (id: string) => {
    setActionLoading(id)
    // Mettre à jour le rôle de l'utilisateur
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ role: 'member' })
      .eq('id', id)
    if (updateError) {
      toast.error('Erreur lors de l&#39;approbation')
      setActionLoading(null)
      return
    }
    // Récupérer l'email pour feedback
    const user = approvals.find((a) => a.id === id)
    if (user?.profile?.email) {
      toast.success('Utilisateur approuvé et email envoyé à ' + user.profile.email)
    } else {
      toast.success('Utilisateur approuvé')
    }
    await fetchApprovals()
    setActionLoading(null)
  }

  // Refuser un utilisateur
  const handleDecline = async (id: string) => {
    setActionLoading(id)
    // Supprimer l'utilisateur
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', id)
    if (deleteError) {
      toast.error('Erreur lors du refus')
      setActionLoading(null)
      return
    }
    const user = approvals.find((a) => a.id === id)
    if (user?.profile?.email) {
      toast.success('Demande refusée et email envoyé à ' + user.profile.email)
    } else {
      toast.success('Demande refusée')
    }
    await fetchApprovals()
    setActionLoading(null)
  }

  // Calcul du nombre d'approvals (max 10+)
  const approvalCount = approvals.length
  const approvalBadge = approvalCount > 10 ? '10+' : approvalCount > 0 ? approvalCount : null

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-105">
          <Bell className="w-4 h-4 text-gray-600 transition-colors duration-200 hover:text-violet-600" />
          {/* Badge sur la cloche */}
          {approvalBadge && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-5 px-1 flex items-center justify-center text-xs font-semibold bg-violet-100 text-violet-700 rounded-full shadow-sm border border-white select-none pointer-events-none">
              {approvalBadge}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="flex justify-center pt-2 pb-1">
            <div className="bg-muted rounded-3xl p-1 flex">
              <TabsList className="bg-transparent rounded-xl">
                <TabsTrigger value="notification" className="rounded-xl transition-all duration-200 hover:scale-105">Notification</TabsTrigger>
                <TabsTrigger value="team" className="rounded-xl relative transition-all duration-200 hover:scale-105">
                  Team
                  {/* Badge sur l'onglet Team */}
                  {approvalBadge && (
                    <span className="ml-2 min-w-[18px] h-5 px-1 flex items-center justify-center text-xs font-semibold bg-violet-100 text-violet-700 rounded-full shadow-sm border border-white select-none pointer-events-none">
                      {approvalBadge}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          <TabsContent value="notification" className="p-4 min-h-[120px]">
            <div className="text-center text-gray-400 text-sm py-8">Aucune notification pour le moment.</div>
          </TabsContent>
          <TabsContent value="team" className="p-4 min-h-[120px]">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium text-xs text-gray-500">Approval</div>
              <button
                className="flex items-center gap-1 text-xs text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded transition cursor-pointer"
                title="Show invite link"
                onClick={handleCopyInvite}
                type="button"
              >
                <Link2 className="w-3 h-3" /> Invite
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            ) : approvals.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8">Aucune demande d&apos;approbation</div>
            ) : (
              <ul className="space-y-2">
                {approvals.map((user) => (
                  <li key={user.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div>
                      <div className="font-medium text-sm">{user.profile?.full_name || 'Utilisateur inconnu'}</div>
                      <div className="text-xs text-gray-500">{user.profile?.email || ''}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="p-1 rounded hover:bg-green-100 text-green-600 disabled:opacity-50 transition-all duration-200 hover:scale-110"
                        disabled={actionLoading === user.id}
                        onClick={() => handleApprove(user.id)}
                      >
                        {actionLoading === user.id ? <Skeleton className="w-4 h-4 rounded-full" /> : <Check className="w-4 h-4 transition-colors duration-200 hover:text-green-700" />}
                      </button>
                      <button
                        className="p-1 rounded hover:bg-red-100 text-red-600 disabled:opacity-50 transition-all duration-200 hover:scale-110"
                        disabled={actionLoading === user.id}
                        onClick={() => handleDecline(user.id)}
                      >
                        {actionLoading === user.id ? <Skeleton className="w-4 h-4 rounded-full" /> : <X className="w-4 h-4 transition-colors duration-200 hover:text-red-700" />}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 