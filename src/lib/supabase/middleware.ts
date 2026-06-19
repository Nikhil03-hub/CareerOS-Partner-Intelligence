import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do NOT remove
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes that don't require auth
  const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/auth/callback']
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname === '/'

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    // Redirect to appropriate dashboard
    const role = user.user_metadata?.role as string | undefined
    const url = request.nextUrl.clone()
    url.pathname = getDashboardPath(role)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

function getDashboardPath(role?: string): string {
  switch (role) {
    case 'super_admin': return '/admin'
    case 'account_manager': return '/admin/colleges'
    case 'tpo': return '/college/dashboard'
    case 'hod': return '/college/students'
    case 'faculty_coord': return '/college/training'
    case 'club_coord': return '/college/placements'
    default: return '/college/dashboard'
  }
}
