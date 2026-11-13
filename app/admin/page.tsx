import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role,status').eq('id', user.id).single()
  if (profile?.role !== 'admin' || profile.status !== 'active') redirect('/not-authorized')
  const today = new Date().toISOString().slice(0, 10)
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  const [{ count: activeClients }, { count: pendingBookings }, { data: sessions }, { count: activeSessions }, { data: bookings }, { data: activities }, { count: totalBookings }, { count: attendedBookings }] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'client').eq('status', 'active'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('sessions').select('id,title,session_date,start_time,capacity,coach_name').gte('session_date', today).lte('session_date', weekEnd).order('session_date').order('start_time').limit(5),
    supabase.from('sessions').select('id', { count: 'exact', head: true }).gte('session_date', today).lte('session_date', weekEnd),
    supabase.from('bookings').select('id,status,booked_at,user:profiles(full_name),session:sessions(title)').order('booked_at', { ascending: false }).limit(5),
    supabase.from('audit_logs').select('id,actor_id,action,entity_type,entity_id,metadata,created_at,actor:profiles(full_name,role)').order('created_at', { ascending: false }).limit(20),
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'attended'),
  ])
  return <AdminDashboard data={{ activeClients: activeClients ?? 0, activeSessions: activeSessions ?? 0, pendingBookings: pendingBookings ?? 0, sessions: sessions ?? [], bookings: (bookings ?? []).map((booking) => ({ ...booking, user: Array.isArray(booking.user) ? booking.user[0] ?? null : booking.user, session: Array.isArray(booking.session) ? booking.session[0] ?? null : booking.session })), activities: (activities ?? []).map((activity) => ({ ...activity, actor: Array.isArray(activity.actor) ? activity.actor[0] ?? null : activity.actor })), attendanceRate: totalBookings ? Math.round(((attendedBookings ?? 0) / totalBookings) * 100) : 0 }} />
}
