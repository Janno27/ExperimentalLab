'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function LoginForm() {
  const searchParams = useSearchParams()
  const orgIdFromUrl = searchParams?.get('orgId') || ''
  const orgNameFromUrl = searchParams?.get('orgName') || ''
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ email: '', password: '', fullName: '', confirmPassword: '', org: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (orgIdFromUrl && orgNameFromUrl) {
      setIsLogin(false)
      setForm(f => ({ ...f, org: orgNameFromUrl }))
    }
  }, [orgIdFromUrl, orgNameFromUrl])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (!isLogin) {
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.')
        setLoading(false)
        return
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters.')
        setLoading(false)
        return
      }
      // Inscription
      const { data, error } = await signUp(form.email, form.password, form.fullName, orgIdFromUrl ? { id: orgIdFromUrl, name: orgNameFromUrl } : undefined)
      if (error) {
        setError(error.message)
      } else {
        setError(null)
        // Si org, ajoute dans organization_members en pending
        if (orgIdFromUrl) {
          toast.success('Your registration is pending admin approval.', { position: 'bottom-left' })
        } else {
          toast.success('Check your email to confirm your registration.', { position: 'bottom-left' })
        }
        setIsLogin(true)
      }
    } else {
      const { error } = await signIn(form.email, form.password)
      if (error) {
        setError(error.message)
      } else {
        setError(null)
        router.push('/dashboard')
      }
    }
    setLoading(false)
  }

  // Style pour la cohérence avec SearchBar, aligné à gauche, padding réduit
  const inputClass = "pl-3 rounded-2xl border border-gray-200 text-left focus:border-transparent focus:ring-2 focus:ring-violet-500/20 focus:ring-offset-0 focus:outline-none transition-all duration-200 hover:border-gray-300 [&:focus]:border-transparent [&:focus]:ring-2 [&:focus]:ring-violet-500/20"

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">{isLogin ? 'Sign in' : 'Sign up'}</h1>
        <p className="text-muted-foreground text-sm text-balance">
          {isLogin ? 'Sign in to your account' : 'Create an account to access the platform'}
        </p>
      </div>
      <div className="grid gap-6">
        {!isLogin && (
          <>
            {orgIdFromUrl && (
              <div className="grid gap-3">
                <Label htmlFor="org">Organization</Label>
                <Input id="org" name="org" type="text" value={form.org} disabled className={inputClass + ' bg-gray-100 text-gray-500 cursor-not-allowed'} />
              </div>
            )}
            <div className="grid gap-3">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" type="text" placeholder="John Doe" value={form.fullName} onChange={handleChange} required className={inputClass} />
            </div>
          </>
        )}
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="m@example.com" value={form.email} onChange={handleChange} required className={inputClass} />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required className={inputClass} />
        </div>
        {!isLogin && (
          <div className="grid gap-3">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required className={inputClass} />
          </div>
        )}
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Loading...' : isLogin ? 'Sign in' : 'Sign up'}
        </Button>
        <div className="text-center text-sm">
          {isLogin ? (
            <>Don&apos;t have an account?{' '}
              <button type="button" className="underline underline-offset-4" onClick={() => setIsLogin(false)}>
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button type="button" className="underline underline-offset-4" onClick={() => setIsLogin(true)}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  )
}
