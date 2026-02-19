import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch stats
  const [
    { count: totalRecruiters },
    { count: totalTests },
    { count: totalSubmissions },
    { count: passedCandidates },
    { count: disqualifiedCandidates },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'recruiter'),
    supabase.from('tests').select('*', { count: 'exact', head: true }),
    supabase.from('submissions').select('*', { count: 'exact', head: true }),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'passed'),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('disqualified', true),
  ])

  const stats = [
    { title: 'Total Recruiters', value: totalRecruiters || 0, description: 'Active recruiters' },
    { title: 'Total Tests', value: totalTests || 0, description: 'Created tests' },
    { title: 'Total Submissions', value: totalSubmissions || 0, description: 'All submissions' },
    { title: 'Passed Candidates', value: passedCandidates || 0, description: 'Successful candidates' },
    { title: 'Disqualified', value: disqualifiedCandidates || 0, description: 'Due to violations' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your screening platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
