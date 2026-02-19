import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RecruiterSidebar } from '@/components/recruiter-sidebar'
import { Navbar } from '@/components/navbar'

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
    <div className="h-screen flex flex-col">
      <Navbar userEmail={userData?.email} userName={userData?.name} />
      <div className="flex-1 flex overflow-hidden">
        <RecruiterSidebar />
        <main className="flex-1 overflow-y-auto md:ml-64 bg-gray-50">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
