import 'next-auth'
import 'next-auth/jwt'

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SALES' | 'DESIGNER' | 'PRODUCTION' | 'INSTALLER' | 'ACCOUNTANT'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image?: string
      role: UserRole
    }
  }
  interface User {
    id: string
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    id: string
  }
}
