'use client'

import { CalendarDays, Check, Clock3, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Session = { id: string; title: string; description: string | null; session_date: string; start_time: string; duration_minutes: number; capacity: number; coach_name: string; session_type_id: string | null; price: number | null }
type Booking = { session_id: string; status: string }

const dateLabel = (date: string) => new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`))
const endTime = (session: Session) => new Date(new Date(`2000-01-01T${session.start_time}`).getTime() + session.duration_minutes * 60000).toISOString().slice(11, 16)

export function BookingCalendar({ embedded = false }: { embedded?: boolean }) {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const requestedSessionId = searchParams.get('session')
  const [sessions, setSessions] = useState<Session[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [view, setView] = useState<'agenda' | 'calendar'>('agenda')
  const [selected, setSelected] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Please sign in to book a session.'); setLoading(false); return }
    setUserId(user.id)
    const [{ data: sessionData }, { data: bookingData }] = await Promise.all([
      supabase.from('sessions').select('id,title,description,session_date,start_time,duration_minutes,capacity,coach_name,session_type_id').gte('session_date', new Date().toISOString().slice(0, 10)).order('session_date').order('start_time'),
      supabase.from('bookings').select('session_id,status').eq('user_id', user.id),
    ])
    const rawSessions = (sessionData ?? []) as Omit<Session, 'price'>[]
    const typeIds = [...new Set(rawSessions.map((item: Omit<Session, 'price'>) => item.session_type_id).filter((item): item is string => Boolean(item)))]
    const { data: types } = typeIds.length ? await supabase.from('session_types').select('id,price').in('id', typeIds) : { data: [] as { id: string; price: number | null }[] }
    const prices = new Map((types ?? []).map((item: { id: string; price: number | null }) => [item.id, item.price]))
    const hydratedSessions = rawSessions.map((item: Omit<Session, 'price'>) => ({ ...item, price: prices.get(item.session_type_id ?? '') ?? null })) as Session[]
    setSessions(hydratedSessions)
    if (requestedSessionId) setSelected(hydratedSessions.find((session) => session.id === requestedSessionId) ?? null)
    setBookings((bookingData ?? []) as Booking[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const bookedIds = useMemo(() => new Set(bookings.filter((item) => item.status !== 'cancelled' && item.status !== 'no_show').map((item) => item.session_id)), [bookings])
  const grouped = useMemo(() => sessions.reduce<Record<string, Session[]>>((days, session) => { days[session.session_date] = [...(days[session.session_date] ?? []), session]; return days }, {}), [sessions])

  async function book() {
    if (!selected || !userId) return
    setSaving(true); setError(''); setMessage('')
    if (bookedIds.has(selected.id)) { setError('You are already booked for this session.'); setSaving(false); return }
    const { count } = await supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('session_id', selected.id).not('status', 'in', '(cancelled,no_show)')
    if ((count ?? 0) >= selected.capacity) { setError('This session is full.'); setSaving(false); return }
    const { error: bookingError } = await supabase.from('bookings').insert({ session_id: selected.id, user_id: userId, status: 'booked' })
    if (bookingError) setError(bookingError.code === '23505' ? 'You are already booked for this session.' : 'Could not create booking.')
    else { setBookings((current) => [...current, { session_id: selected.id, status: 'booked' }]); setSelected(null); setMessage('Session booked. Check My bookings on your dashboard.') }
    setSaving(false)
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading sessions...</main>
  return <section className={embedded ? '' : 'min-h-screen bg-background px-4 py-8 sm:px-8'}><div className={embedded ? '' : 'mx-auto max-w-6xl'}>{!embedded && <header className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Catalyst / Schedule</p><h1 className="mt-3 text-4xl font-black uppercase tracking-tight sm:text-6xl">Book a session.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Choose a time that fits your week. Your booking and price will be saved to your client dashboard.</p></div><div className="flex rounded-lg border border-border p-1"><button type="button" onClick={() => setView('agenda')} className={`rounded-md px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest ${view === 'agenda' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Agenda</button><button type="button" onClick={() => setView('calendar')} className={`rounded-md px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest ${view === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Calendar</button></div></header>}{embedded && <div className="mb-4 flex justify-end"><div className="flex rounded-lg border border-border p-1"><button type="button" onClick={() => setView('agenda')} className={`rounded-md px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest ${view === 'agenda' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Agenda</button><button type="button" onClick={() => setView('calendar')} className={`rounded-md px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest ${view === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Calendar</button></div></div>}{message && <p role="status" className="mt-5 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">{message}</p>}{error && <p role="alert" className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}{!sessions.length ? <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center"><CalendarDays className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-4 text-xl font-bold uppercase">No sessions yet</h2><p className="mt-2 text-sm text-muted-foreground">New training sessions will appear here as soon as they are scheduled.</p></div> : view === 'agenda' ? <div className="mt-8 grid gap-5 md:grid-cols-2">{Object.entries(grouped).map(([date, items]) => <section key={date}><p className="eyebrow mb-3">{dateLabel(date)}</p><div className="flex flex-col gap-3">{items.map((session) => <SessionCard key={session.id} session={session} booked={bookedIds.has(session.id)} onSelect={setSelected} />)}</div></section>)}</div> : <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(grouped).map(([date, items]) => <section key={date} className="rounded-xl border border-border bg-card/40 p-4"><div className="flex items-center gap-2 border-b border-border pb-3"><CalendarDays className="size-4 text-primary" /><p className="font-mono text-xs font-bold uppercase tracking-widest">{dateLabel(date)}</p></div><div className="mt-3 flex flex-col gap-2">{items.map((session) => <SessionCard key={session.id} session={session} booked={bookedIds.has(session.id)} onSelect={setSelected} compact />)}</div></section>)}</div>}{selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-5 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Confirm booking</p><h2 className="mt-2 text-2xl font-black uppercase">{selected.title}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Close" className="rounded-md p-2 text-muted-foreground hover:bg-muted"><X className="size-5" /></button></div><div className="mt-5 grid gap-3 text-sm text-muted-foreground"><p><CalendarDays className="mr-2 inline size-4 text-primary" />{dateLabel(selected.session_date)} · {selected.start_time.slice(0, 5)}–{endTime(selected)}</p><p><Users className="mr-2 inline size-4 text-primary" />{selected.capacity} places available by capacity</p><p><span className="font-semibold text-foreground">Coach:</span> {selected.coach_name}</p><p><span className="font-semibold text-foreground">Price:</span> {selected.price != null ? `${selected.price.toLocaleString()} ₽` : 'Price to be confirmed'}</p></div><button type="button" onClick={() => void book()} disabled={saving} className="mt-6 h-11 w-full rounded-lg bg-primary font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50">{saving ? 'Booking...' : 'Confirm booking'}</button></div></div>}</div></section>
}

function SessionCard({ session, booked, onSelect, compact = false }: { session: Session; booked: boolean; onSelect: (session: Session) => void; compact?: boolean }) {
  return <article className={`rounded-xl border border-border bg-card p-4 transition-colors ${booked ? 'border-primary/40' : 'hover:border-primary/60'} ${compact ? 'p-3' : ''}`}><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-bold text-primary">{session.start_time.slice(0, 5)}–{endTime(session)}</p><h3 className="mt-2 font-bold uppercase">{session.title}</h3><p className="mt-1 text-sm text-muted-foreground">with {session.coach_name}</p></div>{booked ? <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-1 font-mono text-[10px] font-bold uppercase text-primary"><Check className="size-3" />Booked</span> : <button type="button" onClick={() => onSelect(session)} className="rounded-lg bg-primary px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground">Book</button>}</div><div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{session.duration_minutes} min</span><span className="inline-flex items-center gap-1"><Users className="size-3.5" />Capacity {session.capacity}</span><span>{session.price != null ? `${session.price.toLocaleString()} ₽` : 'TBD'}</span></div></article>
}
