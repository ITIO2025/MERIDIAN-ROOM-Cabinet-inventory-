'use client'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'

const AUTH_ROUTES = ['/login']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = AUTH_ROUTES.some(r => pathname.startsWith(r))

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-60 transition-all duration-300 flex flex-col min-h-screen w-full">
        <Header />
        <div className="flex-1">{children}</div>
      </main>
    </div>
  )
}
