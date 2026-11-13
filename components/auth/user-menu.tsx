'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, LayoutDashboard, LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type MenuProfile = { full_name: string | null; avatar_url: string | null; role: string | null }

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function initials(name: string | null, email: string | null) {
  const source = (name && name.trim()) || (email ? email.split('@')[0] : '')
  if (!source) return 'A'
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : source.slice(0, 2)
  return letters.toUpperCase()
}

export function UserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const [ready, setReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<MenuProfile>({ full_name: null, avatar_url: null, role: null })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!active) return
      if (!user) { setSignedIn(false); setReady(true); return }
      setSignedIn(true)
      setEmail(user.email ?? null)
      const { data } = await supabase.from('profiles').select('full_name,avatar_url,role').eq('id', user.id).maybeSingle()
      if (!active) return
      if (data) setProfile(data as MenuProfile)
      const raw = (data as MenuProfile | null)?.avatar_url?.trim()
      if (raw) {
        // The avatars bucket is public — resolve the stored path to its public URL so it renders for everyone.
        if (isExternalUrl(raw)) setAvatarPreview(raw)
        else setAvatarPreview(supabase.storage.from('avatars').getPublicUrl(raw).data.publicUrl)
      }
      if (active) setReady(true)
    })()
    return () => { active = false }
  }, [supabase])

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false) }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [open])

  async function signOut() {
    setOpen(false)
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore network/session errors — still force a clean client state below
    }
    onNavigate?.()
    // Full reload so the server re-reads cleared auth cookies and the singleton client resets.
    window.location.assign('/')
  }

  function go(path: string) {
    setOpen(false)
    onNavigate?.()
    router.push(path)
  }

  if (!ready) return null

  if (!signedIn) {
    return (
      <>
        <span className="hidden h-4 w-px bg-border lg:block" aria-hidden="true" />
        <a href="/login" onClick={onNavigate} className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground">Log in</a>
        <a href="/signup" onClick={onNavigate} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:-translate-y-0.5">Sign up</a>
      </>
    )
  }

  const label = profile.full_name?.trim() || (email ? email.split('@')[0] : 'Account')

  return (
    <div ref={menuRef} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} className="flex items-center gap-2 rounded-full border border-border bg-card/60 py-1 pl-1 pr-2.5 transition-colors hover:border-primary">
        <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-mono text-xs font-bold uppercase text-primary">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview || "/placeholder.svg"} alt="" className="size-full object-cover" crossOrigin="anonymous" />
          ) : (
            initials(profile.full_name, email)
          )}
        </span>
        <span className="hidden max-w-[9rem] truncate font-mono text-xs font-bold uppercase tracking-[0.12em] text-foreground sm:inline">{label}</span>
        <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-border/60 px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-foreground">{label}</p>
            {email && <p className="truncate font-mono text-[0.7rem] text-muted-foreground">{email}</p>}
          </div>
          <button type="button" role="menuitem" onClick={() => go(profile.role === 'admin' ? '/admin' : '/dashboard')} className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted">
            <LayoutDashboard className="size-4 text-muted-foreground" /> Dashboard
          </button>
          <div className="mt-1 flex items-center gap-1">
            <button type="button" role="menuitem" onClick={() => go('/profile')} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted">
              <User className="size-4 shrink-0 text-muted-foreground" /> Profile
            </button>
            <button type="button" role="menuitem" onClick={signOut} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted" aria-label="Log out">
              <LogOut className="size-4 text-muted-foreground" /> <span className="sr-only">Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
