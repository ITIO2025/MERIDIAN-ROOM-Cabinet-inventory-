import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'
import { SYSTEM_USERS } from './auth-users'
import type { UserRole } from '@/types/next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID ? [GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })] : []),

    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email:    { label: 'อีเมล',     type: 'email',    placeholder: 'admin@meridian.co' },
        password: { label: 'รหัสผ่าน', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = SYSTEM_USERS.find(
          u => u.email === credentials.email && u.password === credentials.password
        )
        if (!user) return null
        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id   = user.id
        token.role = (user as any).role ?? 'SALES'
      }
      if (account?.provider === 'google' && !token.role) {
        token.role = 'DESIGNER' as UserRole
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },

  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET ?? 'meridian-room-dev-secret-2026',
}
