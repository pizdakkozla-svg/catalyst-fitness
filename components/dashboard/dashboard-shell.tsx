'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, Clock3, LogOut, MapPin, UserRound, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { BookingCalendar } from '@/components/dashboard/booking-calendar'

type Profile = { id: string; full_name: string | null; avatar_url: string | null; city: string | null; phone: string | null; role: 'user' | 'admin'; status: 'active' | 'suspended' }
type Session = { id: string; title: string; description: string | null; session_date: string; start_time: string; duration_minutes: number; capacity: number; booked_count: number; coach_name: string; price: number | null }
type Booking = { id: string; session_id: string; status: string; price_at_booking: number | null; session: Session }

function publicAvatar(supabase: ReturnType<typeof createClient>, value: string | null) {
  if (!value) return null
  return /^https?:\/\//i.test(value) ? value : supabase.storage.from('avatars').getPublicUrl(value).data.publicUrl
}

function endTime(session: Session) {
  return new Date(new Date(`2000-01-01T${session.start_time}`).getTime() + session.duration_minutes * 60000).toISOString().slice(11, 16)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

export function DashboardShell() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const [profileResult, sessionsResult, bookingsResult] = await Promise.all([
      supabase.from('profiles').select('id,full_name,avatar_url,city,phone,role,status').eq('id', user.id).single(),
      supabase.from('sessions').select('id,title,description,session_date,start_time,duration_minutes,capacity,coach_name,session_type_id').gte('session_date', new Date().toISOString().slice(0, 10)).order('session_date').order('start_time'),
      supabase.from('bookings').select('id,session_id,status,price_at_booking,session:sessions(id,title,description,session_date,start_time,duration_minutes,capacity,coach_name,session_type_id)').eq('user_id', user.id).order('booked_at', { ascending: false }),
    ])
    if (sessionsResult.error) {
      console.error('[v0] Failed to load sessions:', sessionsResult.error)
      setError('We could not load sessions right now. Please refresh and try again.')
    }
    const profileData = profileResult.data
    const sessionData = sessionsResult.data
    const bookingData = bookingsResult.data
    const rawSessions = (sessionData ?? []) as (Omit<Session, 'price'> & { session_type_id: string | null })[]
    const typeIds = [...new Set(rawSessions.map((item) => item.session_type_id).filter((value): value is string => Boolean(value)))]
    const { data: types } = typeIds.length ? await supabase.from('session_types').select('id,price').in('id', typeIds) : { data: [] as { id: string; price: number | null }[] }
    const priceByType = new Map((types ?? []).map((item: { id: string; price: number | null }) => [item.id, item.price]))
    const withPrices = rawSessions.map((item) => ({ ...item, booked_count: 0, price: priceByType.get(item.session_type_id ?? '') ?? null })) as Session[]
    const sessionMap = new Map(withPrices.map((item: Session) => [item.id, item]))
    const normalizedBookings = (bookingData ?? []).map((item: { id: string; session_id: string; status: string; price_at_booking: number | null; session: Session | null }) => ({ ...item, session: sessionMap.get(item.session_id) ?? item.session })) as Booking[]
    setProfile(profileData ? { ...profileData, avatar_url: publicAvatar(supabase, profileData.avatar_url) } : null)
    setSessions(withPrices)
    setBookings(normalizedBookings)
    setLoading(false)
  }

  useEffect(() => { void loadDashboard() }, [router, supabase])

  const bookedIds = useMemo(() => new Set(bookings.filter((item) => item.status === 'booked').map((item) => item.session_id)), [bookings])
  const attendedBookings = useMemo(() => bookings.filter((item) => item.status === 'attended'), [bookings])
  const offlinePayments = useMemo(() => attendedBookings.reduce((total, booking) => total + (booking.price_at_booking ?? 0), 0), [attendedBookings])

  async function book(session: Session) {
    setSaving(session.id); setError(''); setMessage('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (bookedIds.has(session.id) || session.booked_count >= session.capacity) { setError('This session is no longer available.'); setSaving(null); return }
    const { error: bookingError } = await supabase.from('bookings').insert({ session_id: session.id, user_id: user.id })
    if (bookingError) setError(bookingError.code === '23505' ? 'You already booked this session.' : 'Could not book this session.')
    else { setMessage('Booking confirmed. Check your notifications for details.'); await loadDashboard() }
    setSaving(null)
  }

  async function cancel(booking: Booking) {
    setSaving(booking.id); setError(''); setMessage('')
    const { error: cancelError } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
    if (cancelError) setError('Could not cancel this booking.')
    else { setMessage('Booking cancelled.'); await loadDashboard() }
    setSaving(null)
  }

  async function signOut() { await supabase.auth.signOut(); window.location.assign('/') }
  if (loading) return <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading your portal...</main>

  return <main className="client-dashboard min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-10"><div className="mx-auto max-w-7xl"><header className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow">Catalyst / Member portal</p><h1 className="mt-3 max-w-3xl text-4xl font-black uppercase tracking-tight text-balance sm:text-6xl">Train with intent.</h1><div className="mt-4 flex items-center gap-3"><span className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-mono text-xs font-bold text-primary">{profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile avatar" className="size-full object-cover" /> : (profile?.full_name?.slice(0, 2) || 'AT').toUpperCase()}</span><p className="text-sm text-muted-foreground">Welcome back, <span className="font-semibold text-foreground">{profile?.full_name || 'athlete'}</span>.</p></div></div><nav aria-label="Dashboard navigation" className="flex flex-wrap items-center gap-2"><NotificationBell /><span className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:inline-flex"><CalendarDays className="size-3.5 text-primary" /> Client dashboard</span><Link href="/dashboard/book" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground">Book a session</Link><Link href="#bookings" className="inline-flex h-10 items-center rounded-lg border border-border px-4 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-foreground">My bookings</Link><Link href="/profile" className="inline-flex h-10 items-center rounded-lg border border-border px-4 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-foreground"><UserRound className="mr-2 size-4" />Profile</Link><button onClick={signOut} className="inline-flex h-10 items-center rounded-lg border border-border px-3 text-muted-foreground hover:border-primary hover:text-foreground" aria-label="Sign out"><LogOut className="size-4" /></button></nav></header>
    <section aria-label="Client stats" className="mt-8 grid gap-3 sm:grid-cols-3"><div className="glass-card p-5"><p className="eyebrow">Completed</p><p className="mt-3 text-3xl font-black">{attendedBookings.length}</p><p className="mt-1 text-xs text-muted-foreground">sessions attended</p></div><div className="glass-card p-5"><p className="eyebrow">In-person payments</p><p className="mt-3 text-3xl font-black">{offlinePayments.toLocaleString()} ₽</p><p className="mt-1 text-xs text-muted-foreground">recorded from attended sessions</p></div><div className="glass-card p-5"><p className="eyebrow">Upcoming</p><p className="mt-3 text-3xl font-black">{bookings.filter((booking) => booking.status === 'booked').length}</p><p className="mt-1 text-xs text-muted-foreground">sessions booked</p></div></section>
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.65fr]"><section aria-label="Your schedule"><div className="mb-4"><p className="eyebrow">Your schedule</p><h2 className="mt-2 text-2xl font-black uppercase">Upcoming sessions</h2></div><BookingCalendar embedded /></section><section id="sessions" className="hidden"><div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-start gap-3"><CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="font-semibold">Your client workspace</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Book upcoming sessions, manage your schedule, review offline payment history, and keep your profile up to date from one place.</p></div></div></div><div className="mb-4 flex items-end justify-between gap-4"><div><p className="eyebrow">Open calendar</p><h2 className="mt-2 text-2xl font-black uppercase">Book a session</h2></div><span className="font-mono text-xs text-muted-foreground">{sessions.length} available</span></div>{error && <p role="alert" className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}{message && <p role="status" className="mb-4 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">{message}</p>}<div className="flex flex-col gap-3">{sessions.length ? sessions.map((session) => { const isBooked = bookedIds.has(session.id); const full = session.booked_count >= session.capacity; return <article key={session.id} className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary"><span>{formatDate(session.session_date)}</span><span className="text-border">/</span><span>{session.start_time.slice(0, 5)}–{endTime(session)}</span></div><h3 className="mt-2 truncate text-xl font-bold uppercase">{session.title}</h3><p className="mt-1 text-sm text-muted-foreground">with {session.coach_name}</p><div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{session.duration_minutes} min</span><span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{session.booked_count}/{session.capacity} spots</span><span className="font-mono text-foreground">{session.price == null ? 'Price on request' : `${session.price.toLocaleString()} ₽`}</span></div></div><button type="button" onClick={() => isBooked ? undefined : void book(session)} disabled={isBooked || full || saving === session.id} className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-primary px-5 font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{isBooked ? <><Check className="mr-2 size-4" />Booked</> : full ? 'Full' : saving === session.id ? 'Booking' : 'Book now'}</button></article> }) : <div className="glass-card p-10 text-center"><CalendarDays className="mx-auto size-8 text-primary" /><h3 className="mt-4 text-lg font-bold uppercase">No sessions yet</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">New training sessions will appear here as soon as they are scheduled.</p></div>}</div></section>
    <aside id="bookings" className="space-y-6"><div><p className="eyebrow">Your schedule</p><h2 className="mt-2 text-2xl font-black uppercase">My bookings</h2></div>{bookings.length ? <div className="flex flex-col gap-3">{bookings.map((booking) => <article key={booking.id} className="rounded-xl border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold uppercase">{booking.session?.title || 'Session'}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{booking.session && formatDate(booking.session.session_date)} · {booking.session?.start_time.slice(0, 5)}</p></div><span className={`rounded-full px-2 py-1 font-mono text-[10px] uppercase ${booking.status === 'booked' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>{booking.status}</span></div>{booking.price_at_booking != null && <p className="mt-3 font-mono text-xs text-muted-foreground">{booking.status === 'attended' ? 'Paid in person' : 'Price locked'}: {booking.price_at_booking.toLocaleString()} ₽</p>}{booking.status === 'booked' && <button type="button" onClick={() => void cancel(booking)} disabled={saving === booking.id} className="mt-4 inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-destructive disabled:opacity-50"><X className="mr-1 size-3.5" />Cancel booking</button>}</article>)}</div> : <div className="rounded-xl border border-dashed border-border p-6 text-sm leading-6 text-muted-foreground">You have no bookings yet. Choose a session to get started.</div>}</aside></div></div></main>
}
