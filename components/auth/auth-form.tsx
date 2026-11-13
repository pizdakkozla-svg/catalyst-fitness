'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const destination = searchParams.get('next')?.startsWith('/') ? searchParams.get('next')! : '/dashboard'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true); setError(''); setMessage('')
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/callback` } })
      if (error) setError(error.message.includes('already') ? 'Unable to create this account.' : error.message)
      else if (data.session) router.push(destination)
      else setMessage('Check your email to confirm your account, then sign in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Invalid email or password.')
      else router.push(destination)
    }
    setLoading(false)
  }

  return <form onSubmit={submit} className="glass-card mx-auto w-full max-w-md space-y-5">
    <div><p className="eyebrow">Catalyst Fitness</p><h1 className="mt-3 text-3xl font-black uppercase tracking-tight">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{mode === 'signup' ? 'Join the coaching portal and reserve your sessions.' : 'Sign in to manage your sessions and progress.'}</p></div>
    {mode === 'signup' && <label className="block text-sm">Full name<input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-background/70 px-3 outline-none focus:border-primary" /></label>}
    <label className="block text-sm">Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-background/70 px-3 outline-none focus:border-primary" /></label>
    <label className="block text-sm">Password<input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-background/70 px-3 outline-none focus:border-primary" /></label>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}{message && <p className="text-sm text-primary">{message}</p>}
    <button disabled={loading} className="h-11 w-full rounded-lg bg-primary font-mono text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground disabled:opacity-60">{loading ? 'Please wait' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
    <p className="text-center text-sm text-muted-foreground">{mode === 'signup' ? 'Already have an account? ' : 'New to Catalyst? '}<Link className="text-primary hover:underline" href={mode === 'signup' ? '/login' : '/signup'}>{mode === 'signup' ? 'Sign in' : 'Create account'}</Link></p>
  </form>
}
