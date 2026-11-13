'use client'

import Link from 'next/link'
import { Activity, AlertCircle, ArrowUpRight, CalendarDays, CheckCircle2, ChevronRight, ClipboardList, Dumbbell, LayoutDashboard, Menu, Plus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { UserMenu } from '@/components/auth/user-menu'
import { NotificationBell } from '@/components/notifications/notification-bell'

const navItems = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Sessions', href: '/admin/sessions', icon: Dumbbell },
  { label: 'Clients', href: '/admin/clients', icon: Users },
  { label: 'Bookings', href: '/admin/bookings', icon: ClipboardList },
]

type Activity = { id: number; actor_id: string | null; action: string; entity_type: string; entity_id: string | null; metadata: Record<string, unknown> | null; created_at: string; actor: { full_name: string | null; role: string | null } | null }
type OverviewData = { activeClients: number; activeSessions: number; pendingBookings: number; attendanceRate: number; sessions: { id: string; title: string; session_date: string; start_time: string; capacity: number; coach_name: string | null }[]; bookings: { id: string; status: string; booked_at: string; user: { full_name: string | null } | null; session: { title: string } | null }[]; activities: Activity[] }

const summaryCards = [
  { label: 'Active clients', value: '128', detail: '+12% this month', icon: Users, tone: 'primary' },
  { label: 'Sessions this week', value: '24', detail: '6 remaining places', icon: CalendarDays, tone: 'default' },
  { label: 'Pending bookings', value: '17', detail: 'Needs confirmation', icon: ClipboardList, tone: 'default' },
  { label: 'Attendance rate', value: '94%', detail: '+4.2% vs last month', icon: Activity, tone: 'primary' },
]

const upcomingSessions = [
  { time: '07:30', date: 'MON 14 OCT', title: 'Strength & Conditioning', category: 'Strength', spots: '8 / 12', coach: 'Alex Morgan' },
  { time: '18:00', date: 'MON 14 OCT', title: 'Mobility Reset', category: 'Recovery', spots: '6 / 10', coach: 'Jamie Lee' },
  { time: '09:00', date: 'TUE 15 OCT', title: 'Performance Circuit', category: 'Performance', spots: '12 / 12', coach: 'Alex Morgan' },
]

const recentBookings: { name: string; session: string; status: string; initials: string }[] = []

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <button aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-30 bg-background/70 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card/95 px-5 py-6 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-start justify-between">
          <Link href="/" className="group" onClick={onClose}>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-primary">Catalyst</p>
            <p className="mt-1 text-xl font-black uppercase tracking-tight">Admin portal</p>
          </Link>
        </div>
        <div className="mt-12">
          <p className="eyebrow px-3">Workspace</p>
          <nav aria-label="Admin navigation" className="mt-3 flex flex-col gap-1">
            {navItems.map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} onClick={onClose} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${href === '/admin' ? 'bg-primary/12 font-semibold text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <Icon className="size-4" /> <span>{label}</span>{href === '/admin' && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto rounded-xl border border-border/70 bg-background/40 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Quick note</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Keep the week moving. Review pending bookings before your first session.</p>
        </div>
      </aside>
    </>
  )
}

export function AdminDashboard({ data }: { data: OverviewData }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activityFilter, setActivityFilter] = useState<'all' | 'user' | 'admin'>('all')
  const filteredActivities = useMemo(() => data.activities.filter((activity) => activityFilter === 'all' || activity.actor?.role === activityFilter), [activityFilter, data.activities])
  const liveSummaryCards = summaryCards.map((card) => ({ ...card, value: card.label === 'Active clients' ? String(data.activeClients) : card.label === 'Pending bookings' ? String(data.pendingBookings) : card.label === 'Attendance rate' ? `${data.attendanceRate}%` : String(data.activeSessions), detail: card.label === 'Sessions this week' ? `${data.activeSessions} scheduled in the next 7 days` : card.label === 'Pending bookings' ? (data.pendingBookings ? 'Needs confirmation' : 'All clear') : card.detail }))
  const liveSessions = data.sessions.map((session) => ({ ...session, time: session.start_time.slice(0, 5), date: new Date(`${session.session_date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase(), spots: `${session.capacity}`, coach: session.coach_name ?? 'Coach', category: 'Training' }))
  const liveBookings = data.bookings.map((booking) => ({ name: booking.user?.full_name ?? 'Unknown client', session: booking.session?.title ?? 'Unknown session', status: booking.status, initials: (booking.user?.full_name ?? 'UC').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() }))

  return (
    <div className="min-h-screen bg-background lg:flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1">
        <header className="flex h-20 items-center justify-between border-b border-border/70 px-5 sm:px-8 lg:px-10">
          <button aria-label="Open navigation" onClick={() => setSidebarOpen(true)} className="fixed left-5 top-5 z-50 rounded-lg border border-border bg-card/95 p-2 text-muted-foreground shadow-lg backdrop-blur-sm hover:text-foreground sm:left-8 lg:hidden"><Menu className="size-5" /></button>
          <div className="hidden lg:block"><p className="eyebrow">Monday, 14 October</p><p className="mt-1 text-sm text-muted-foreground">Good morning, keep the momentum.</p></div>
          <div className="ml-auto flex items-center gap-3"><NotificationBell /><UserMenu /></div>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><p className="eyebrow">Owner controls / Overview</p><h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-balance sm:text-5xl">Your week, in motion.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">A clear view of your coaching floor, client activity, and the sessions that need your attention.</p></div>
            <Link href="/admin/sessions" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground transition-transform hover:-translate-y-0.5">Create session <ChevronRight className="size-4" /></Link>
          </div>
          <section aria-label="Summary" className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {liveSummaryCards.map((card) => { const Icon = card.icon; return <div key={card.label} title={card.label === 'Active clients' ? 'Active client profiles with role client and status active.' : card.label === 'Sessions this week' ? 'All sessions scheduled from today through the next 7 days.' : card.label === 'Pending bookings' ? 'Bookings awaiting admin confirmation.' : 'Attended bookings divided by all bookings.'} className="rounded-xl border border-border/80 bg-card/60 p-5"><div className="flex items-start justify-between gap-3"><p className="eyebrow">{card.label}</p><Icon className={`size-4 ${card.tone === 'primary' ? 'text-primary' : 'text-muted-foreground'}`} /></div><p className={`mt-5 text-4xl font-black ${card.tone === 'primary' ? 'text-primary' : ''}`}>{card.value}</p><p className="mt-2 text-xs text-muted-foreground">{card.detail}</p></div> })}
          </section>
          <section className="mt-8 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <div className="rounded-xl border border-border/80 bg-card/60 p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="eyebrow">Schedule / This week</p><h2 className="mt-2 text-xl font-bold uppercase">Upcoming sessions</h2></div><Link href="/admin/sessions" className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View all</Link></div><div className="mt-6 flex flex-col gap-2">{liveSessions.map((session) => <div key={`${session.date}-${session.time}`} className="flex items-center gap-4 rounded-lg border border-border/60 bg-background/30 p-4"><div className="w-16 shrink-0"><p className="font-mono text-lg font-bold text-primary">{session.time}</p><p className="mt-1 font-mono text-[9px] uppercase text-muted-foreground">{session.date}</p></div><div className="min-w-0 flex-1 border-l border-border pl-4"><p className="truncate text-sm font-semibold">{session.title}</p><p className="mt-1 text-xs text-muted-foreground">{session.category} · {session.coach}</p></div><span className="hidden rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase text-muted-foreground sm:inline-flex">{session.spots}</span></div>)}</div></div>
            <div className="rounded-xl border border-border/80 bg-card/60 p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Activity / Latest</p><h2 className="mt-2 text-xl font-bold uppercase">Recent activity</h2></div><div className="flex items-center gap-1 rounded-lg border border-border p-1" aria-label="Activity filter">{(['all', 'user', 'admin'] as const).map((filter) => <button key={filter} type="button" onClick={() => setActivityFilter(filter)} className={`rounded px-2 py-1 font-mono text-[9px] uppercase tracking-wider ${activityFilter === filter ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{filter}</button>)}</div></div><div className="mt-6 flex flex-col gap-1">{filteredActivities.length ? filteredActivities.map((activity) => <div key={activity.id} className="flex items-center gap-3 border-b border-border/60 py-3 last:border-0"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-bold text-primary">{(activity.actor?.full_name ?? 'System').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{activity.actor?.full_name ?? 'System'} <span className="font-mono text-[9px] uppercase text-muted-foreground">· {activity.actor?.role ?? 'system'}</span></p><p className="truncate text-xs text-muted-foreground">{activity.action.replaceAll('_', ' ')} · {activity.entity_type}</p></div><time className="shrink-0 font-mono text-[9px] uppercase text-muted-foreground" dateTime={activity.created_at}>{new Date(activity.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</time></div>) : <p className="py-8 text-sm text-muted-foreground">No activity for this filter.</p>}</div></div>
          </section>
          <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_1fr]"><div className="rounded-xl border border-border/80 bg-card/60 p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="eyebrow">Today / Monday 14 October</p><h2 className="mt-2 text-xl font-bold uppercase">Floor status</h2></div><span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase text-primary"><CheckCircle2 className="size-3" /> On track</span></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-border/60 bg-background/30 p-4"><p className="eyebrow">Sessions</p><p className="mt-3 text-2xl font-black">{data.activeSessions}</p><p className="mt-1 text-xs text-muted-foreground">Scheduled in the next 7 days</p></div><div className="rounded-lg border border-border/60 bg-background/30 p-4"><p className="eyebrow">Booked spots</p><p className="mt-3 text-2xl font-black">26 / 32</p><p className="mt-1 text-xs text-muted-foreground">81% utilization</p></div><div className="rounded-lg border border-border/60 bg-background/30 p-4"><p className="eyebrow">Attention</p><p className="mt-3 text-2xl font-black text-primary">4</p><p className="mt-1 text-xs text-muted-foreground">Items to review</p></div></div></div><div className="rounded-xl border border-primary/30 bg-primary/5 p-5 sm:p-6"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 size-5 text-primary" /><div><p className="eyebrow text-primary">Needs attention</p><h2 className="mt-2 text-xl font-bold uppercase">Review before 07:30</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{data.pendingBookings ? `${data.pendingBookings} pending bookings are waiting for confirmation.` : 'No pending bookings need attention right now.'}</p><Link href="/admin/bookings" className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">Review bookings <ArrowUpRight className="size-3" /></Link></div></div></div></section>
          <section className="mt-8"><p className="eyebrow">Quick actions</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><Link href="/admin/sessions" className="group rounded-xl border border-border/80 bg-card/40 p-4 transition-colors hover:border-primary/70"><Plus className="size-5 text-primary" /><p className="mt-4 text-sm font-bold uppercase">Create session</p><p className="mt-1 text-xs text-muted-foreground">Create categories and schedule training.</p><ChevronRight className="mt-4 size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></Link><Link href="/admin/clients" className="group rounded-xl border border-border/80 bg-card/40 p-4 transition-colors hover:border-primary/70"><Users className="size-5 text-primary" /><p className="mt-4 text-sm font-bold uppercase">Review clients</p><p className="mt-1 text-xs text-muted-foreground">Open profiles and member activity.</p><ChevronRight className="mt-4 size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></Link><Link href="/admin/bookings" className="group rounded-xl border border-border/80 bg-card/40 p-4 transition-colors hover:border-primary/70"><ClipboardList className="size-5 text-primary" /><p className="mt-4 text-sm font-bold uppercase">Review bookings</p><p className="mt-1 text-xs text-muted-foreground">Confirm attendance and waitlists.</p><ChevronRight className="mt-4 size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></Link></div></section>
        </main>
      </div>
    </div>
  )
}
