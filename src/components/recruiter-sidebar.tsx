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
    <div className="hidden md:flex h-full w-64 flex-col fixed inset-y-0 bg-gray-50 border-r">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-5">
          <h2 className="text-lg font-semibold">Recruiter Panel</h2>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {recruiterNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                  isActive
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 flex-shrink-0 h-5 w-5',
                    isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
