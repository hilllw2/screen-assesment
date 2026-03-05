import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC PATHS - No authentication required
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. Static assets from public/ folder
  if (
    path.startsWith('/Verbal-Assessment-Videos/') ||
    path.startsWith('/Written-Assessment-Videos/') ||
    path.startsWith('/_next/') ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // 2. Static file extensions
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|html|css|js)$/i.test(path)) {
    return NextResponse.next()
  }

  // 3. Candidate test flow - entire /test/* tree
  if (path.startsWith('/test/') || path === '/test') {
    return NextResponse.next()
  }

  // 4. Test-related API endpoints
  if (
    path.startsWith('/api/test/') ||
    path === '/api/upload' ||
    path.startsWith('/api/videos/')
  ) {
    return NextResponse.next()
  }

  // 5. Login page
  if (path === '/login' || path.startsWith('/login')) {
    return NextResponse.next()
  }

  // 6. Debug/test pages
  if (path === '/test-video-access' || path === '/video-test.html') {
    return NextResponse.next()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHENTICATED PATHS - Require login
  // ═══════════════════════════════════════════════════════════════════════════

  // Create Supabase client for auth check
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  // Root path: redirect logged-in users to dashboard
  if (path === '/') {
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      const dashboard = userData?.role === 'admin' 
        ? '/admin/dashboard' 
        : '/recruiter/dashboard'
      
      return NextResponse.redirect(new URL(dashboard, request.url))
    }
    // Not logged in at root - show home or redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protected routes: require authentication
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin routes: require admin role
  if (path.startsWith('/admin')) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.redirect(new URL('/recruiter/dashboard', request.url))
    }
  }

  return response
}

// Matcher config - tells Next.js which paths to run proxy on
// This is an optimization; the proxy function handles all logic internally
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Video folders
     * - Common static file extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|Verbal-Assessment-Videos|Written-Assessment-Videos|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)',
  ],
}
