import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ROUTE_PERMISSIONS } from '@/lib/auth-users'
import type { UserRole } from '@/types/next-auth'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = (req as any).nextauth?.token

    if (!token) return NextResponse.redirect(new URL('/login', req.url))

    const userRole = token.role as UserRole

    // Check route-specific permissions
    const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find(route =>
      pathname.startsWith(route)
    )

    if (matchedRoute) {
      const allowed = ROUTE_PERMISSIONS[matchedRoute]
      if (!allowed.includes(userRole)) {
        // Redirect to dashboard with access-denied message
        return NextResponse.redirect(new URL('/?access=denied', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    // Protect all routes except login and API auth
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
