'use client'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'
import ErrorBoundary from './ErrorBoundary'

const AUTH_ROUTES = ['/login']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = AUTH_ROUTES.some(r => pathname.startsWith(r))

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen">
        <Sidebar />
        {/* sidebar-main class reads --sidebar-w CSS variable set by Sidebar.tsx */}
        <main className="sidebar-main flex-1 flex flex-col min-h-screen w-full">
          <Header />
          <div className="flex-1">{children}</div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
