import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin-sidebar'
import { AppShell } from '@/components/shell/AppShell'

export default async function AdminLayout({
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

  if (userData?.role !== 'admin') {
    redirect('/recruiter/dashboard')
  }

  return (
    <AppShell
      sidebar={<AdminSidebar />}
      contextTitle="Admin"
      roleLabel="Admin"
    >
      {children}
    </AppShell>
  )
}
