import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RecruiterSidebar } from '@/components/recruiter-sidebar'
import { AppShell } from '@/components/shell/AppShell'

export default async function RecruiterLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, name, email')
    .eq('id', user.id)
    .single()

  return (
    <AppShell
      sidebar={<RecruiterSidebar />}
      contextTitle="Recruiter"
      roleLabel={userData?.role ?? undefined}
    >
      {children}
    </AppShell>
  )
}
