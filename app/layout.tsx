import type { Metadata, Viewport } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import AuthProvider from '@/components/AuthProvider'
import { ToastProvider } from '@/context/ToastContext'

export const metadata: Metadata = {
  title: 'MERIDIAN ROOM AI — Smart Built-In Pricing Engine',
  description: 'AI-powered furniture pricing & production management system',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface font-prompt antialiased">
        <AuthProvider>
          <ToastProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              {/* Main Content — offset for sidebar (desktop: 240px, mobile: 0) */}
              <main className="flex-1 md:ml-60 transition-all duration-300 flex flex-col min-h-screen w-full">
                <Header />
                <div className="flex-1">{children}</div>
              </main>
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
