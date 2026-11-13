import { LandingPage } from '@/components/sections/landing-page'
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data: sessions } = await supabase.from('sessions').select('id,title,session_date,start_time,duration_minutes,capacity,coach_name').gte('session_date', today).order('session_date').order('start_time').limit(30)
  return <LandingPage publicSessions={sessions ?? []} />
}
