import { withAuth, NextRequestWithAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { ROUTE_PERMISSIONS } from '@/lib/auth-users'
import type { UserRole } from '@/types/next-auth'

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl
    // Token is already verified by withAuth — use it directly
    const token = req.nextauth.token

    if (!token) return NextResponse.redirect(new URL('/login', req.url))

    const userRole = token.role as UserRole

    // Check route-specific permissions
    const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find(route =>
      pathname.startsWith(route)
    )

    if (matchedRoute) {
      const allowed = ROUTE_PERMISSIONS[matchedRoute]
      if (!allowed.includes(userRole)) {
        return NextResponse.redirect(new URL('/?access=denied', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    secret: process.env.NEXTAUTH_SECRET ?? 'meridian-room-dev-secret-2026',
  }
)

export const config = {
  matcher: [
    // Protect all routes except login and API auth
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
