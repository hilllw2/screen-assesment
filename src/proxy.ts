import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ── Public paths: skip ALL auth logic ──────────────────────────────
  // Static assets served from public/ (videos, images, etc.)
  const isPublicAsset =
    path.startsWith('/Verbal-Assessment-Videos/') ||
    path.startsWith('/Written-Assessment-Videos/') ||
    path.startsWith('/_next/') ||
    path === '/favicon.ico' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|html)$/i.test(path)

  if (isPublicAsset) {
    return NextResponse.next()
  }

  // Candidate test flow: no auth required
  if (
    path.startsWith('/test/') ||
    path.startsWith('/api/test/') ||
    path === '/api/upload' ||
    path.startsWith('/api/videos/') ||
    path === '/test-video-access' ||
    path === '/video-test.html'
  ) {
    return NextResponse.next()
  }

  // Login page: no auth required
  if (path.startsWith('/login')) {
    return NextResponse.next()
  }

  // ── Authenticated paths: run session + auth checks ────────────────
  const response = await updateSession(request)

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

  // Root: redirect logged-in users to their dashboard
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

  // No user on a protected route → redirect to login
  if (!user && path !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Admin routes: require admin role
  if (path.startsWith('/admin') && user) {
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

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|Verbal-Assessment-Videos|Written-Assessment-Videos|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)',
  ],
}
