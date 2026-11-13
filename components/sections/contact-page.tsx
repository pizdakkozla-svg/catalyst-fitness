'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Check, MessageSquare, X } from 'lucide-react'
import { footerLinks } from '@/lib/data'
import { SiteHeader, TransformModal } from './interactive-shell'

function ReasonsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null
  const reasons = [
    ['A system, not another reset', 'Follow a clear 12-week structure designed to make progress repeatable.'],
    ['Coaching that adapts', 'Your plan adjusts around your schedule, energy, and real-life constraints.'],
    ['Accountability that lands', 'Weekly check-ins and honest feedback keep the next action visible.'],
    ['Progress you can feel', 'Build strength, confidence, and habits that carry beyond the program.'],
  ]

  return <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-5 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="reasons-dialog-title" className="glass-card w-full max-w-lg p-6 sm:p-8">
      <div className="flex items-start justify-between gap-6"><div><p className="eyebrow mb-3">Why Catalyst</p><h2 id="reasons-dialog-title" className="font-mono text-2xl font-bold uppercase tracking-tight">Built for your real life</h2></div><button type="button" onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close reasons dialog"><X /></button></div>
      <div className="mt-6 grid gap-3">{reasons.map(([title, text]) => <div key={title} className="flex gap-3 rounded-lg border border-border/70 bg-muted/30 p-4"><Check className="mt-0.5 size-4 shrink-0 text-primary" /><div><h3 className="font-sans text-sm font-bold uppercase">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div></div>)}</div>
      <button type="button" onClick={onClose} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-4 font-mono text-xs font-bold uppercase tracking-[0.15em] text-primary-foreground transition-transform hover:-translate-y-0.5">I&apos;m ready to start <ArrowRight className="size-4" /></button>
    </section>
  </div>
}

export function ContactPage() {
  const [joinOpen, setJoinOpen] = useState(false)
  const [reasonsOpen, setReasonsOpen] = useState(false)
  return <div className="min-h-screen bg-background text-foreground"><SiteHeader /><main>
    <section className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:px-10"><div><Link href="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back home</Link><p className="eyebrow mt-16">Contact Marcus</p><h1 className="mt-4 text-balance font-sans text-5xl font-black uppercase tracking-[-0.06em] sm:text-7xl">Let&apos;s make the next step clear.</h1><p className="mt-6 max-w-md leading-7 text-muted-foreground">This prototype keeps the conversation simple. Choose the route that best matches where you are and Marcus will help shape the right next step.</p></div><div className="grid gap-4"><button type="button" onClick={() => setJoinOpen(true)} className="glass-card group text-left"><CalendarDays className="size-6 text-primary" /><h2 className="mt-10 font-sans text-2xl font-bold uppercase">Talk through Transform 90</h2><p className="mt-3 leading-7 text-muted-foreground">Open the enrollment dialog and see what the next step looks like.</p><span className="mt-6 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-primary">Join program <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span></button><button type="button" onClick={() => setReasonsOpen(true)} className="glass-card group text-left"><MessageSquare className="size-6 text-primary" /><h2 className="mt-10 font-sans text-2xl font-bold uppercase">Questions first</h2><p className="mt-3 leading-7 text-muted-foreground">See why this coaching system is built differently.</p><span className="mt-6 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-primary">Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span></button></div></section>
    <section className="border-y border-border/70 bg-card/30"><div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10"><div><p className="eyebrow">Make the commitment visible</p><h2 className="mt-4 max-w-3xl text-balance font-sans text-4xl font-black uppercase tracking-[-0.05em] sm:text-6xl">Your strongest chapter starts with one clear decision.</h2><p className="mt-5 max-w-xl leading-7 text-muted-foreground">Stop collecting advice and start building a system that holds up when life gets busy.</p></div><button type="button" onClick={() => setJoinOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground shadow-lg shadow-primary/15 transition-transform hover:-translate-y-0.5">Start Transform 90 <ArrowRight className="size-4" /></button></div></section>
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:flex-row lg:items-center lg:justify-between lg:px-10"><div className="flex items-center gap-5"><div className="relative size-16 overflow-hidden rounded-full border border-border"><Image src="/images/marcus-hale.png" alt="Marcus Hale, Catalyst Fitness coach" fill className="object-cover" sizes="64px" /></div><div><p className="eyebrow">Your coach</p><p className="mt-2 font-sans text-xl font-bold uppercase">Marcus Hale</p></div></div><p className="max-w-md leading-7 text-muted-foreground">Strength coach, systems nerd, and your new accountability layer.</p></section>
  </main><footer className="border-t border-border/70"><div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-8 sm:px-8 sm:py-10 lg:flex-row lg:items-center lg:justify-between lg:px-10"><Link href="/" className="font-sans text-xl font-black uppercase">Catalyst<span className="text-primary">.</span></Link><div className="flex flex-wrap gap-5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{footerLinks.map((link) => <Link href="/" key={link} className="hover:text-foreground">{link}</Link>)}<Link href="/contact" className="text-primary hover:text-foreground">Contact Marcus</Link></div></div></footer><TransformModal open={joinOpen} onClose={() => setJoinOpen(false)} /><ReasonsModal open={reasonsOpen} onClose={() => setReasonsOpen(false)} /></div>
}

export default ContactPage
