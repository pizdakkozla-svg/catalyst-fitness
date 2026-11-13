import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminOperations } from '@/components/admin/admin-operations'

export default async function AdminClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role,status').eq('id', user.id).single()
  if (profile?.role !== 'admin' || profile.status !== 'active') redirect('/not-authorized')
  return <AdminOperations type="clients" />
}
