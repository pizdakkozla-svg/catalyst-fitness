import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SessionManager } from '@/components/admin/session-manager'

export default async function AdminSessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role,status').eq('id', user.id).single()
  if (profile?.role !== 'admin' || profile.status !== 'active') redirect('/not-authorized')
  return <SessionManager />
}
