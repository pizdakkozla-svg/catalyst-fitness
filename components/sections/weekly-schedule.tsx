'use client'

import { CalendarDays, Clock3, Users } from 'lucide-react'

type PublicSession = {
  id: string
  title: string | null
  session_date: string
  start_time: string
  duration_minutes: number | null
  capacity: number | null
  coach_name: string | null
}

const formatDay = (value: string) => new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`))
const formatTime = (value: string) => value.slice(0, 5)

export function WeeklySchedule({ sessions }: { sessions: PublicSession[] }) {
  const grouped = sessions.reduce<Record<string, PublicSession[]>>((days, session) => {
    ;(days[session.session_date] ??= []).push(session)
    return days
  }, {})

  return <section id="schedule" className="border-b border-border/70"><div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-10"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="eyebrow">Weekly schedule</p><h2 className="mt-4 max-w-2xl text-balance font-sans text-4xl font-black uppercase tracking-[-0.05em] sm:text-6xl">Train when it fits.</h2><p className="mt-5 max-w-xl leading-7 text-muted-foreground">Browse the next available sessions. Sign in to reserve your place.</p></div><a href="/login?next=/dashboard/book" className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-primary hover:text-foreground">Sign in to book <CalendarDays className="size-4" /></a></div>{sessions.length === 0 ? <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center"><CalendarDays className="mx-auto size-8 text-muted-foreground" /><p className="mt-4 font-sans text-lg font-bold uppercase">Schedule coming soon</p><p className="mt-2 text-sm text-muted-foreground">New training sessions will appear here as soon as they are scheduled.</p></div> : <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(grouped).map(([date, daySessions]) => <div key={date} className="glass-card p-5"><div className="flex items-center justify-between border-b border-border/70 pb-4"><h3 className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-primary">{formatDay(date)}</h3><span className="text-muted-foreground">{daySessions.length} {daySessions.length === 1 ? 'session' : 'sessions'}</span></div><div className="mt-4 flex flex-col gap-3">{daySessions.map((session) => <article key={session.id} className="rounded-lg border border-border/70 bg-background/50 p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="font-sans text-base font-bold uppercase">{session.title ?? 'Training session'}</h4><p className="mt-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><span className="flex items-center gap-1.5 text-foreground"><Clock3 className="size-3.5 text-primary" /> {formatTime(session.start_time)}</span>{session.duration_minutes ? <span>{session.duration_minutes} min</span> : null}{session.capacity ? <span className="flex items-center gap-1.5"><Users className="size-3.5" /> {session.capacity} spots</span> : null}</p></div></div><a href={`/login?next=/dashboard/book`} className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-primary/50 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground">Sign in to book</a></article>)}</div></div>)}</div>}</div></section>
}
