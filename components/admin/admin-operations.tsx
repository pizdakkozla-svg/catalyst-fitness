'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, CalendarDays, Check, Eye, Pencil, Search, Trash2, UserRound, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Profile = { id: string; full_name: string | null; avatar_url: string | null; email?: string | null; phone: string | null; city: string | null; status: string; role: string; created_at: string }
type Session = { id: string; title: string; session_date: string; start_time: string; capacity: number; session_type_id: string | null; price: number | null }
type Booking = { id: string; user_id: string; session_id: string; status: string; booked_at: string; price_at_booking: number | null; profile?: Profile; session?: Session }

const roles = ['client', 'user', 'admin'] as const
const bookingStatuses = ['pending', 'booked', 'cancelled', 'attended', 'no_show']

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function formatDate(date: Date) { return date.toISOString().slice(0, 10) }

export function AdminOperations({ type }: { type: 'clients' | 'bookings' }) {
  const supabase = useMemo(() => createClient(), [])
  const avatarSrc = useCallback((url: string | null) => {
    const trimmed = url?.trim()
    if (!trimmed) return null
    return isExternalUrl(trimmed) ? trimmed : supabase.storage.from('avatars').getPublicUrl(trimmed).data.publicUrl
  }, [supabase])
  const searchParams = useSearchParams()
  const selectedSessionId = searchParams.get('session_id')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [role, setRole] = useState('all')
  const [sessionType, setSessionType] = useState('all')
  const [datePreset, setDatePreset] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortKey, setSortKey] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selected, setSelected] = useState<Profile | null>(null)
  const [editDraft, setEditDraft] = useState<Profile | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id ?? null)
    const [{ data: profileRows, error: profileError }, { data: sessionRows, error: sessionError }, { data: sessionTypeRows, error: sessionTypeError }, { data: bookingRows, error: bookingError }] = await Promise.all([
      supabase.from('profiles').select('id,full_name,avatar_url,email,phone,city,status,role,created_at').order('created_at', { ascending: false }),
      supabase.from('sessions').select('id,title,session_date,start_time,capacity,session_type_id').order('session_date', { ascending: true }),
      supabase.from('session_types').select('id,name,price'),
      supabase.from('bookings').select('id,user_id,session_id,status,booked_at,price_at_booking').order('booked_at', { ascending: false }),
    ])
    if (profileError || sessionError || sessionTypeError || bookingError) setError(profileError?.message ?? sessionError?.message ?? sessionTypeError?.message ?? bookingError?.message ?? 'Unable to load admin data.')
    const typedProfiles = (profileRows ?? []) as Profile[]
    const pricesById = new Map<string, number | null>((sessionTypeRows ?? []).map((row: { id: string; name: string; price: number | null }) => [row.id, row.price]))
    const pricesByName = new Map<string, number | null>((sessionTypeRows ?? []).map((row: { id: string; name: string; price: number | null }) => [row.name.trim().toLowerCase(), row.price]))
    const typedSessions = ((sessionRows ?? []) as Omit<Session, 'price'>[]).map((row) => ({ ...row, price: row.session_type_id ? pricesById.get(row.session_type_id) ?? null : pricesByName.get(row.title.trim().toLowerCase()) ?? null }))
    const typedBookings = (bookingRows ?? []) as Booking[]
    const profileMap = new Map(typedProfiles.map((row) => [row.id, row]))
    const sessionMap = new Map(typedSessions.map((row) => [row.id, row]))
    setProfiles(typedProfiles)
    setSessions(typedSessions)
    setBookings(typedBookings.map((row) => ({ ...row, profile: profileMap.get(row.user_id), session: sessionMap.get(row.session_id) })))
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void load()
    const channel = supabase.channel(`admin-${type}`).on('postgres_changes', { event: '*', schema: 'public', table: type === 'clients' ? 'profiles' : 'bookings' }, () => void load()).subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [load, supabase, type])

  async function updateProfile(profile: Profile, changes: Partial<Pick<Profile, 'full_name' | 'phone' | 'city' | 'status' | 'role' | 'avatar_url'>>) {
    if (profile.id === currentUserId && changes.role && changes.role !== profile.role) { setError('You cannot change your own role from the client directory.'); return }
    setSaving(profile.id); setError('')
    const { error: updateError } = await supabase.from('profiles').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', profile.id)
    const { error: auditError } = !updateError && currentUserId ? await supabase.from('audit_logs').insert({ actor_id: currentUserId, action: 'admin_update_client_profile', entity_type: 'profile', entity_id: profile.id, metadata: { changes } }) : { error: null }
    if (updateError || auditError) setError(updateError?.message ?? auditError?.message ?? 'Unable to record this admin action.')
    else { setSelected(null); await load() }
    setSaving(null)
  }

  async function saveClientEdits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editDraft) return
    await updateProfile(editDraft, { full_name: editDraft.full_name, phone: editDraft.phone, city: editDraft.city, status: editDraft.status, role: editDraft.role, avatar_url: editDraft.avatar_url })
    setEditDraft(null)
  }

  async function uploadClientAvatar(file: File) {
    if (!editDraft) return
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${editDraft.id}/avatar-${Date.now()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
    if (uploadError) { setError(uploadError.message); return }
    setEditDraft({ ...editDraft, avatar_url: path })
  }

  async function deleteProfile(profile: Profile) {
    if (profile.id === currentUserId) { setError('You cannot delete your own account from the client directory.'); return }
    if (!window.confirm(`Delete ${profile.full_name || 'this client'}?`)) return
    setSaving(profile.id); setError('')
    const { error: deleteError } = await supabase.from('profiles').delete().eq('id', profile.id)
    if (deleteError) setError(deleteError.message); else { setSelected(null); await load() }
    setSaving(null)
  }

  async function updateBooking(booking: Booking, nextStatus: string) {
    setSaving(booking.id); setError('')
    const { error: updateError } = await supabase.from('bookings').update({ status: nextStatus }).eq('id', booking.id)
    const { error: auditError } = !updateError && currentUserId ? await supabase.from('audit_logs').insert({ actor_id: currentUserId, action: 'admin_update_booking_status', entity_type: 'booking', entity_id: booking.id, metadata: { from: booking.status, to: nextStatus } }) : { error: null }
    if (updateError || auditError) setError(updateError?.message ?? auditError?.message ?? 'Unable to record this admin action.')
    else await load()
    setSaving(null)
  }

  const sessionTypes = [...new Set(sessions.map((item) => item.title))]
  const dateBounds = useMemo(() => {
    const now = new Date()
    if (datePreset === 'today') return { from: formatDate(now), to: formatDate(now) }
    if (datePreset === 'week') { const end = new Date(now); end.setDate(now.getDate() + 7); return { from: formatDate(now), to: formatDate(end) } }
    if (datePreset === 'month') { const end = new Date(now); end.setMonth(now.getMonth() + 1); return { from: formatDate(now), to: formatDate(end) } }
    return { from: fromDate, to: toDate }
  }, [datePreset, fromDate, toDate])
  const dateMatches = (date?: string) => !date || (!dateBounds.from || date >= dateBounds.from) && (!dateBounds.to || date <= dateBounds.to)
  const filteredProfiles = profiles.filter((item) => `${item.full_name ?? ''} ${item.email ?? ''} ${item.phone ?? ''} ${item.city ?? ''}`.toLowerCase().includes(query.toLowerCase()) && (status === 'all' || item.status === status) && (role === 'all' || item.role === role))
  const filteredBookings = bookings.filter((item) => `${item.profile?.full_name ?? ''} ${item.session?.title ?? ''}`.toLowerCase().includes(query.toLowerCase()) && (!selectedSessionId || item.session_id === selectedSessionId) && (status === 'all' || item.status === status) && (sessionType === 'all' || item.session?.title === sessionType) && dateMatches(item.session?.session_date))
  const sortRows = <T,>(rows: T[], getValue: (row: T, key: string) => string | number | null | undefined) => [...rows].sort((a, b) => { const left = getValue(a, sortKey); const right = getValue(b, sortKey); if (left == null && right == null) return 0; if (left == null) return 1; if (right == null) return -1; const comparison = String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' }); return sortDirection === 'asc' ? comparison : -comparison })
  const sortedProfiles = sortRows(filteredProfiles, (item, key) => key === 'client' ? item.full_name : key === 'email' ? item.email : key === 'role' ? item.role : key === 'status' ? item.status : '')
  const sortedBookings = sortRows(filteredBookings, (item, key) => key === 'client' ? item.profile?.full_name : key === 'session' ? item.session?.title : key === 'date' ? item.session?.session_date : key === 'price' ? item.price_at_booking : key === 'status' ? item.status : '')
  const toggleSort = (key: string) => { if (sortKey === key) setSortDirection((value) => value === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDirection('asc') } }

  return <main className="min-h-screen bg-background px-5 py-8 sm:px-8 lg:px-10"><div className="mx-auto max-w-7xl">{type === 'clients' && editDraft && <form onSubmit={saveClientEdits} className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-2xl"><div className="flex items-center justify-between"><div><p className="eyebrow">Admin edit</p><h2 className="mt-1 text-xl font-black uppercase">{editDraft.full_name || 'Client profile'}</h2></div><button type="button" onClick={() => setEditDraft(null)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="size-5" /></button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm">Name<input value={editDraft.full_name ?? ''} onChange={(event) => setEditDraft({ ...editDraft, full_name: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3" /></label><label className="text-sm">Phone<input value={editDraft.phone ?? ''} onChange={(event) => setEditDraft({ ...editDraft, phone: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3" /></label><label className="text-sm">City<input value={editDraft.city ?? ''} onChange={(event) => setEditDraft({ ...editDraft, city: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3" /></label><label className="text-sm">Status<select value={editDraft.status} onChange={(event) => setEditDraft({ ...editDraft, status: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3"><option value="active">Active</option><option value="suspended">Suspended</option></select></label><label className="text-sm">Role<select value={editDraft.role} disabled={editDraft.id === currentUserId} onChange={(event) => setEditDraft({ ...editDraft, role: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3">{roles.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="text-sm">Photo<input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadClientAvatar(file) }} className="mt-2 block w-full text-xs" /></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setEditDraft(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={saving === editDraft.id} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{saving === editDraft.id ? 'Saving…' : 'Save changes'}</button></div></form>}<Link href="/admin" className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Back to overview</Link><div className="mt-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Workspace / {type}</p><h1 className="mt-3 text-4xl font-black uppercase tracking-tight">{type === 'clients' ? 'Client directory' : 'Booking review'}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Live Supabase data · changes update automatically.</p></div><div className="flex flex-wrap gap-2"><label className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card/50 px-3"><Search className="size-4 text-muted-foreground" /><input aria-label="Search" value={query} onChange={(event) => setQuery(event.target.value)} className="w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Search" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-border bg-card px-3 text-sm"><option value="all">All statuses</option>{(type === 'clients' ? ['active', 'suspended'] : bookingStatuses).map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select>{type === 'clients' ? <select aria-label="Filter by role" value={role} onChange={(event) => setRole(event.target.value)} className="h-10 rounded-lg border border-border bg-card px-3 text-sm"><option value="all">All roles</option>{roles.map((value) => <option key={value} value={value}>{value}</option>)}</select> : <><select aria-label="Filter by session type" value={sessionType} onChange={(event) => setSessionType(event.target.value)} className="h-10 rounded-lg border border-border bg-card px-3 text-sm"><option value="all">All session types</option>{sessionTypes.map((value) => <option key={value} value={value}>{value}</option>)}</select><div className="flex h-10 items-center gap-1 rounded-lg border border-border bg-card px-1"><button type="button" aria-label="Today" title="Today" onClick={() => setDatePreset(datePreset === 'today' ? 'all' : 'today')} className={`rounded-md p-2 ${datePreset === 'today' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}><CalendarDays className="size-4" /></button><button type="button" aria-label="Next 7 days" title="Next 7 days" onClick={() => setDatePreset(datePreset === 'week' ? 'all' : 'week')} className={`rounded-md px-2 py-1 font-mono text-[10px] ${datePreset === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>7D</button><button type="button" aria-label="Next 30 days" title="Next 30 days" onClick={() => setDatePreset(datePreset === 'month' ? 'all' : 'month')} className={`rounded-md px-2 py-1 font-mono text-[10px] ${datePreset === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>30D</button></div><label className="flex h-10 items-center gap-1 rounded-lg border border-border bg-card px-2"><span className="sr-only">Custom date range</span><input aria-label="From date" type="date" value={fromDate} onChange={(event) => { setDatePreset('custom'); setFromDate(event.target.value) }} className="w-32 bg-transparent text-xs" /><span className="text-muted-foreground">–</span><input aria-label="To date" type="date" value={toDate} onChange={(event) => { setDatePreset('custom'); setToDate(event.target.value) }} className="w-32 bg-transparent text-xs" /></label></>}</div></div>{error && <p role="alert" className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}{loading ? <div className="mt-10 text-sm text-muted-foreground">Loading live data…</div> : type === 'clients' ? <div className="mt-8 overflow-hidden rounded-xl border border-border"><table className="w-full text-left"><thead className="bg-card/60"><tr>{['client', 'role', 'status'].map((key) => <th key={key} className="px-5 py-3 font-mono text-[10px] uppercase tracking-widest"><button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-2">{key}<span aria-hidden="true">{sortKey === key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span></button></th>)}<th className="px-5 py-3 text-right font-mono text-[10px] uppercase tracking-widest">Actions</th></tr></thead><tbody>{sortedProfiles.map((item) => <tr key={item.id} tabIndex={0} onClick={() => { setSelected(item) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { setSelected(item) } }} className="cursor-pointer border-b border-border/50 last:border-0 hover:bg-card/60"><td className="px-5 py-4 font-semibold"><div className="flex items-center gap-2"><span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">{avatarSrc(item.avatar_url) ? <img src={avatarSrc(item.avatar_url) || "/placeholder.svg"} alt="" className="size-full object-cover" crossOrigin="anonymous" /> : <UserRound className="size-4 text-muted-foreground" />}</span>{item.full_name || 'Unnamed client'}{item.id === currentUserId && <span className="rounded-full bg-primary/15 px-2 py-1 font-mono text-[10px] uppercase text-primary">You</span>}</div></td><td className="px-5 py-4 font-mono text-xs uppercase">{item.role}</td><td className="px-5 py-4 font-mono text-xs uppercase">{item.status}</td><td className="px-5 py-4 text-right"><button type="button" onClick={(event) => { event.stopPropagation(); setSelected(item) }} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="View client"><Eye className="size-4" /></button><button type="button" onClick={(event) => { event.stopPropagation(); setEditDraft(item) }} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Edit ${item.full_name || 'client'}`}><Pencil className="size-4" /></button></td></tr>)}</tbody></table></div> : <div className="mt-8 overflow-hidden rounded-xl border border-border"><table className="w-full text-left"><thead className="bg-card/60"><tr>{['client', 'session', 'date', 'price', 'status'].map((key) => <th key={key} className="px-5 py-3 font-mono text-[10px] uppercase tracking-widest"><button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-2">{key}<span aria-hidden="true">{sortKey === key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span></button></th>)}<th className="px-5 py-3 text-right font-mono text-[10px] uppercase tracking-widest">Actions</th></tr></thead><tbody>{sortedBookings.map((item) => <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-card/60"><td className="px-5 py-4 font-semibold">{item.profile?.full_name || 'Unknown client'}</td><td className="px-5 py-4 text-sm">{item.session?.title || 'Unknown session'}</td><td className="px-5 py-4 text-sm text-muted-foreground">{item.session ? `${item.session.session_date} · ${item.session.start_time}` : '—'}</td><td className="px-5 py-4 text-sm font-mono">{item.session?.price == null ? '—' : `$${item.session.price.toFixed(2)}`}</td><td className="px-5 py-4"><span className="rounded-full border border-border px-2 py-1 font-mono text-[10px] uppercase">{item.status}</span></td><td className="px-5 py-4 text-right"><div className="flex justify-end gap-1">{item.status === 'pending' ? <button type="button" onClick={() => updateBooking(item, 'booked')} disabled={saving === item.id} className="rounded-md p-2 text-primary hover:bg-primary/10" aria-label="Activate booking" title="Activate booking"><Check className="size-4" /></button> : item.status !== 'attended' && item.status !== 'cancelled' && <button type="button" onClick={() => updateBooking(item, 'attended')} disabled={saving === item.id} className="rounded-md p-2 text-primary hover:bg-primary/10" aria-label="Mark attended" title="Mark attended"><Check className="size-4" /></button>}<button type="button" onClick={() => updateBooking(item, 'cancelled')} disabled={saving === item.id} className="rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label="Cancel booking" title="Cancel booking"><X className="size-4" /></button></div></td></tr>)}</tbody></table></div>}{selected && <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-5 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}><section role="dialog" aria-modal="true" aria-labelledby="client-dialog-title" className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">{avatarSrc(selected.avatar_url) ? <img src={avatarSrc(selected.avatar_url) || "/placeholder.svg"} alt="" className="size-full object-cover" crossOrigin="anonymous" /> : <UserRound className="size-6 text-muted-foreground" />}</span><div><p className="eyebrow">Client profile</p><h2 id="client-dialog-title" className="mt-2 text-2xl font-black uppercase">{selected.full_name || 'Unnamed client'}</h2></div></div><button type="button" onClick={() => setSelected(null)} aria-label="Close dialog" className="rounded-md p-2 text-muted-foreground hover:bg-muted"><X className="size-5" /></button></div><div className="mt-8 grid grid-cols-2 gap-6"><div><p className="text-sm text-muted-foreground">Role</p><p className="mt-1 font-mono uppercase">{selected.role}</p></div><div><p className="text-sm text-muted-foreground">Status</p><p className="mt-1 font-mono uppercase">{selected.status}</p></div><div><p className="text-sm text-muted-foreground">Phone</p><p className="mt-1">{selected.phone || '—'}</p></div><div><p className="text-sm text-muted-foreground">City</p><p className="mt-1">{selected.city || '—'}</p></div></div><div className="mt-8 flex flex-wrap gap-2"><select aria-label="Change client role" value={selected.role} onChange={(event) => { const nextRole = event.target.value; setSelected({ ...selected, role: nextRole }); void updateProfile(selected, { role: nextRole }) }} disabled={selected.id === currentUserId || saving === selected.id} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">{roles.map((value) => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select><button type="button" onClick={() => void updateProfile(selected, { status: selected.status === 'active' ? 'suspended' : 'active' })} disabled={saving === selected.id} className="rounded-lg border border-border px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest">{selected.status === 'active' ? 'Suspend' : 'Activate'}</button><button type="button" onClick={() => void deleteProfile(selected)} disabled={selected.id === currentUserId || saving === selected.id} className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-destructive"><Trash2 className="size-4" /> Delete</button></div></section></div>}</div></main>
}
