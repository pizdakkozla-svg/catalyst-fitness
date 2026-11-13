import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role, status, created_at, address_line_1, address_line_2, postal_code, city, phone')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) redirect('/login')

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
      <ProfileForm profile={profile} email={user.email ?? null} />
    </main>
  )
}
