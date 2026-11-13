'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

type ProfileData = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string
  status: string
  created_at: string
  address_line_1: string | null
  address_line_2: string | null
  postal_code: string | null
  city: string | null
  phone: string | null
}

function initials(name: string | null, email: string | null) {
  const source = (name && name.trim()) || (email ? email.split('@')[0] : '')
  if (!source) return 'A'
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : source.slice(0, 2)
  return letters.toUpperCase()
}

export function ProfileForm({ profile, email }: { profile: ProfileData; email: string | null }) {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [addressLine1, setAddressLine1] = useState(profile.address_line_1 ?? '')
  const [addressLine2, setAddressLine2] = useState(profile.address_line_2 ?? '')
  const [postalCode, setPostalCode] = useState(profile.postal_code ?? '')
  const [city, setCity] = useState(profile.city ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  // avatarUrl holds either an external http(s) link or a private storage path (e.g. "{userId}/avatar-123.png").
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // The avatars bucket is public, so a stored path resolves directly to a public URL
  // that renders the same way for the owner, admins, and other clients.
  useEffect(() => {
    const raw = avatarUrl.trim()
    if (!raw) { setAvatarPreview(null); return }
    if (isExternalUrl(raw)) { setAvatarPreview(raw); return }
    setAvatarPreview(supabase.storage.from('avatars').getPublicUrl(raw).data.publicUrl)
  }, [avatarUrl, supabase])

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be 5MB or smaller.'); return }

    setUploading(true); setError(''); setMessage('')
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type })
    if (uploadError) { setError('Upload failed. Please try again.'); setUploading(false); return }

    const { error: saveError } = await supabase
      .from('profiles')
      .update({ avatar_url: path, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
    if (saveError) setError('Uploaded, but could not save. Please try again.')
    else { setAvatarUrl(path); setMessage('Profile picture updated.'); router.refresh() }
    setUploading(false)
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() || null, avatar_url: avatarUrl.trim() || null, address_line_1: addressLine1.trim() || null, address_line_2: addressLine2.trim() || null, postal_code: postalCode.trim() || null, city: city.trim() || null, phone: phone.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
    if (error) setError('Could not save your changes. Please try again.')
    else { setMessage('Profile updated.'); router.refresh() }
    setSaving(false)
  }

  const preview = avatarPreview

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Your account</p>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-balance">Profile</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Manage how you appear across the Catalyst portal.</p>
        </div>
        <nav aria-label="Profile navigation" className="flex flex-wrap gap-2">
          <Link href="/" className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 font-mono text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
            Home
          </Link>
          <Link href="/dashboard" className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 font-mono text-[0.7rem] font-bold uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:-translate-y-0.5">
            Book session
          </Link>
        </nav>
      </div>

      <div className="glass-card flex items-center gap-4">
        <span className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-mono text-lg font-bold uppercase text-primary">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview || "/placeholder.svg"} alt="Your avatar" className="size-full object-cover" crossOrigin="anonymous" />
          ) : (
            initials(fullName, email)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-foreground">{fullName.trim() || (email ? email.split('@')[0] : 'Member')}</p>
          {email && <p className="truncate font-mono text-xs text-muted-foreground">{email}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadAvatar} className="sr-only" aria-label="Upload profile picture" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="inline-flex h-9 items-center rounded-lg border border-primary/40 px-3 font-mono text-[0.7rem] font-bold uppercase tracking-[0.14em] text-primary transition-colors hover:bg-primary/10 disabled:opacity-60">
              {uploading ? 'Uploading' : preview ? 'Change photo' : 'Upload photo'}
            </button>
            {preview && !uploading && (
              <button type="button" onClick={async () => { setAvatarUrl(''); setMessage(''); setError(''); await supabase.from('profiles').update({ avatar_url: null, updated_at: new Date().toISOString() }).eq('id', profile.id); router.refresh() }} className="inline-flex h-9 items-center rounded-lg px-3 font-mono text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground">
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={save} className="glass-card space-y-5">
        <label className="block text-sm">Full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-background/70 px-3 outline-none focus:border-primary" placeholder="Your name" />
        </label>
        <label className="block text-sm">Phone number
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-background/70 px-3 outline-none focus:border-primary" placeholder="+1 234 567 8900" autoComplete="tel" />
        </label>
        <label className="block text-sm">External avatar link (optional)
          <input value={isExternalUrl(avatarUrl) ? avatarUrl : ''} onChange={(e) => setAvatarUrl(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-background/70 px-3 outline-none focus:border-primary" placeholder="https://…" />
          <span className="mt-1.5 block text-xs text-muted-foreground">Use the upload button above for a private photo, or paste an external image link here. Leave empty to use your initials.</span>
        </label>
        <div className="border-t border-border pt-5">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Address details</p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm">Address line 1
              <input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-background/70 px-3 outline-none focus:border-primary" placeholder="Street address or P.O. box" autoComplete="address-line1" />
            </label>
            <label className="block text-sm">Address line 2 <span className="text-muted-foreground">(optional)</span>
              <input value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-background/70 px-3 outline-none focus:border-primary" placeholder="Apartment, suite, unit, building, floor, etc." autoComplete="address-line2" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">City
                <input value={city} onChange={(e) => setCity(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-background/70 px-3 outline-none focus:border-primary" placeholder="City" autoComplete="address-level2" />
              </label>
              <label className="block text-sm">Post code
                <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-background/70 px-3 outline-none focus:border-primary" placeholder="Post code" autoComplete="postal-code" />
              </label>
            </div>
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-primary">{message}</p>}
        <button disabled={saving} className="h-11 w-full rounded-lg bg-primary font-mono text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60">{saving ? 'Saving' : 'Save changes'}</button>
      </form>

      <dl className="glass-card grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div><dt className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">Role</dt><dd className="mt-1 font-mono text-sm font-bold uppercase text-foreground">{profile.role}</dd></div>
        <div><dt className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">Status</dt><dd className="mt-1 font-mono text-sm font-bold uppercase text-foreground">{profile.status}</dd></div>
        <div><dt className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">Member since</dt><dd className="mt-1 font-mono text-sm font-bold text-foreground">{new Date(profile.created_at).toLocaleDateString()}</dd></div>
      </dl>
    </div>
  )
}
