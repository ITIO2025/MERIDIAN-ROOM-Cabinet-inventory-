import type { Metadata, Viewport } from 'next'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import { ToastProvider } from '@/context/ToastContext'
import { ThemeProvider } from '@/context/ThemeContext'
import AppShell from '@/components/AppShell'

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
    <html lang="th" suppressHydrationWarning>
      <head>
        {/* Google Fonts — Prompt + Inter + Kanit */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Kanit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/*
          Flash-prevention script — runs synchronously before first paint.
          Reads stored theme prefs and applies data attributes to <html>
          so the correct theme CSS variables are active before React hydrates.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    var p = JSON.parse(localStorage.getItem('meridian_theme_prefs') || '{}');
    var r = document.documentElement;
    if (p.theme)   r.setAttribute('data-theme',   p.theme);
    if (p.font)    r.setAttribute('data-font',    p.font);
    if (p.radius)  r.setAttribute('data-radius',  p.radius);
    if (p.density) r.setAttribute('data-density', p.density);
    if (p.accentHex) r.style.setProperty('--color-accent', p.accentHex);
  } catch(e){}
})();
            `.trim(),
          }}
        />
      </head>
      <body className="bg-[var(--theme-bg)] antialiased">
        <AuthProvider>
          <ToastProvider>
            <ThemeProvider>
              <AppShell>{children}</AppShell>
            </ThemeProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
