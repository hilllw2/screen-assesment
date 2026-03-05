'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  FileText, 
  Link as LinkIcon,
  BarChart3
} from 'lucide-react'

const recruiterNavItems = [
  {
    title: 'Dashboard',
    href: '/recruiter/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Tests',
    href: '/recruiter/tests',
    icon: FileText,
  },
  {
    title: 'Test Links',
    href: '/recruiter/links',
    icon: LinkIcon,
  },
  {
    title: 'Analytics',
    href: '/recruiter/analytics',
    icon: BarChart3,
  },
]

export function RecruiterSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center flex-shrink-0 px-4 pt-5 pb-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Recruiter
        </h2>
      </div>
      <nav className="flex-1 space-y-1 px-2 pb-4">
        {recruiterNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
            >
              <span
                className={cn(
                  'absolute left-0 h-7 w-[3px] rounded-full bg-transparent',
                  isActive && 'bg-primary'
                )}
              />
              <item.icon
                className={cn(
                  'h-4 w-4 flex-shrink-0 text-muted-foreground',
                  isActive && 'text-primary'
                )}
              />
              <span className="truncate">{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
