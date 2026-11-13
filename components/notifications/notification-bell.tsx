'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Notification = { id: string; recipient_id: string; title: string; message: string; entity_type: string | null; entity_id: string | null; read_at: string | null; created_at: string }
type NotificationPayload = { new: Notification }

export function NotificationBell() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!active || !user) return
      setUserId(user.id)
      const { data } = await supabase.from('notifications').select('id,title,message,entity_type,entity_id,read_at,created_at').eq('recipient_id', user.id).order('created_at', { ascending: false }).limit(20)
      if (active) setItems((data ?? []) as Notification[])
    }
    void load()
    const channel = supabase.channel('notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload: NotificationPayload) => {
      if (active && payload.new.recipient_id === userId) setItems((current) => [payload.new as Notification, ...current].slice(0, 20))
    }).subscribe()
    return () => { active = false; void supabase.removeChannel(channel) }
  }, [supabase, userId])

  const unread = items.filter((item) => !item.read_at).length
  async function markAllRead() {
    if (!userId || !unread) return
    const timestamp = new Date().toISOString()
    await supabase.from('notifications').update({ read_at: timestamp }).eq('recipient_id', userId).is('read_at', null)
    setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? timestamp })))
  }

  async function dismiss(id: string) {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('recipient_id', userId)
    setItems((current) => current.filter((item) => item.id !== id))
  }

  return <div className="relative"><button type="button" onClick={() => setOpen((value) => !value)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} className="relative rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"><Bell className="size-4" />{unread > 0 && <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[9px] font-bold text-primary-foreground">{unread > 9 ? '9+' : unread}</span>}</button>{open && <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between border-b border-border/60 px-4 py-3"><p className="font-mono text-xs font-bold uppercase tracking-widest">Notifications</p><div className="flex items-center gap-2"><button type="button" onClick={() => void markAllRead()} disabled={!unread} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"><CheckCheck className="size-3.5" /> Mark read</button><button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Close notifications"><X className="size-4" /></button></div></div><div className="max-h-80 overflow-y-auto">{items.length ? items.map((item) => <div key={item.id} className={`relative border-b border-border/40 px-4 py-3 pr-10 ${item.read_at ? '' : 'bg-primary/5'}`}><button type="button" onClick={() => void dismiss(item.id)} className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Dismiss ${item.title}`}><X className="size-3.5" /></button><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.message}</p><time className="mt-2 block font-mono text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleString()}</time></div>) : <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>}</div></div>}</div>
}
