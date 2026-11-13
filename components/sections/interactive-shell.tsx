'use client'

import { useEffect, useState } from 'react'
import { ArrowUp, Check, Menu, X } from 'lucide-react'
import { UserMenu } from '@/components/auth/user-menu'
const cta = 'Start Transform 90'
const offer = { price: '$249', title: 'Transform 90', note: 'The complete 12-week coaching system.' }

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header id="top" className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <a href="#top" onClick={close} className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-foreground">Catalyst<span className="text-primary">.</span></a>
        <nav id="primary-navigation" className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col gap-5 border-b border-border bg-background px-5 py-6 lg:static lg:flex lg:flex-row lg:items-center lg:gap-6 lg:border-0 lg:bg-transparent lg:p-0`} aria-label="Primary navigation">
          <a href="#method" onClick={close} className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground">Method</a>
          <a href="#path" onClick={close} className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground">The path</a>
          <a href="#proof" onClick={close} className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground">Proof</a>
          <a href="#pricing" onClick={close} className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-primary transition-colors hover:text-foreground">Start here</a>
          <a href="/contact" onClick={close} className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground">Contact Marcus</a>
          <UserMenu onNavigate={close} />
        </nav>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="primary-navigation" className="rounded-md p-2 text-foreground transition-colors hover:bg-muted lg:hidden">
          <span className="sr-only">{open ? 'Close navigation' : 'Open navigation'}</span>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  )
}

export function TransformModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null
  return <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-5 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="transform-dialog-title" className="glass-card w-full max-w-lg p-6 sm:p-8">
      <div className="flex items-start justify-between gap-6"><div><p className="eyebrow mb-3">Prototype enrollment</p><h2 id="transform-dialog-title" className="font-mono text-2xl font-bold uppercase tracking-tight">Start Transform 90</h2></div><button type="button" onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close dialog"><X /></button></div>
      <p className="mt-5 leading-7 text-muted-foreground">This prototype is ready for the next step. In the production version, this action will connect you with Marcus for a fit call and personalized onboarding.</p>
      <div className="mt-6 rounded-lg border border-border/70 bg-muted/40 p-4"><div className="flex items-center justify-between gap-4"><span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">Current offer</span><span className="font-mono text-lg font-bold text-primary">{offer.price}</span></div><p className="mt-2 text-sm text-muted-foreground">{offer.title} · {offer.note}</p></div>
      <button type="button" onClick={onClose} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-4 font-mono text-xs font-bold uppercase tracking-[0.15em] text-primary-foreground transition-transform hover:-translate-y-0.5">Continue prototype <Check className="size-4" /></button>
    </section>
  </div>
}

export function BackToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const onScroll = () => setVisible(window.scrollY > 500); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll) }, [])
  if (!visible) return null
  return <a href="#top" aria-label="Back to top" className="fixed bottom-5 right-5 z-30 inline-flex size-11 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-lg backdrop-blur-md transition-transform hover:-translate-y-1"><ArrowUp className="size-4" /></a>
}

export function StickyCTA({ onOpen }: { onOpen: () => void }) {
  return <button type="button" onClick={onOpen} className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-center gap-2 border-t border-primary/30 bg-primary px-5 py-4 font-mono text-xs font-bold uppercase tracking-[0.15em] text-primary-foreground shadow-2xl lg:hidden">{cta}</button>
}
