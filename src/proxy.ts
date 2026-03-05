import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Test video page should be accessible without auth
  if (path === '/test-video-access') {
    return NextResponse.next()
  }

  // Candidate test paths should bypass all auth checks
  if (
    path.startsWith('/test/') ||
    path.startsWith('/api/test/') ||
    path === '/api/upload'
  ) {
    return NextResponse.next()
  }

  // Update session
  const response = await updateSession(request)
  
  // Get user from session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is logged in and on root, redirect to appropriate dashboard
  if (user && path === '/') {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData) {
      const url = request.nextUrl.clone()
      url.pathname = userData.role === 'admin' ? '/admin/dashboard' : '/recruiter/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Protect admin routes
  if (path.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/recruiter/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Protect recruiter routes
  if (path.startsWith('/recruiter')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|Verbal-Assessment-Videos|Written-Assessment-Videos|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)',
  ],
}
