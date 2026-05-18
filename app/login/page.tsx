'use client'
import { useState, useEffect, useRef } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MdVisibility, MdVisibilityOff, MdArrowForward } from 'react-icons/md'

// ─── Animated geometric M ─────────────────────────────────────────────────────
function GeoMark({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden>
      {/* Outer border square */}
      <rect x="1" y="1" width="54" height="54" stroke="rgba(198,169,105,0.25)" strokeWidth="1" />
      {/* Corner accent marks */}
      <line x1="1"  y1="1"  x2="10" y2="1"  stroke="#C6A969" strokeWidth="1.5" />
      <line x1="1"  y1="1"  x2="1"  y2="10" stroke="#C6A969" strokeWidth="1.5" />
      <line x1="55" y1="1"  x2="46" y2="1"  stroke="#C6A969" strokeWidth="1.5" />
      <line x1="55" y1="1"  x2="55" y2="10" stroke="#C6A969" strokeWidth="1.5" />
      <line x1="1"  y1="55" x2="10" y2="55" stroke="#C6A969" strokeWidth="1.5" />
      <line x1="1"  y1="55" x2="1"  y2="46" stroke="#C6A969" strokeWidth="1.5" />
      <line x1="55" y1="55" x2="46" y2="55" stroke="#C6A969" strokeWidth="1.5" />
      <line x1="55" y1="55" x2="55" y2="46" stroke="#C6A969" strokeWidth="1.5" />
      {/* M letterform */}
      <path
        d="M13 43 L13 13 L28 26 L43 13 L43 43"
        stroke="#C6A969"
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
      {/* Baseline */}
      <line x1="13" y1="43" x2="43" y2="43" stroke="rgba(198,169,105,0.35)" strokeWidth="1" />
    </svg>
  )
}

// ─── Background grid ──────────────────────────────────────────────────────────
function GridBg() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Dot grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(198,169,105,0.10) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      {/* Vertical gold line — left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: 'linear-gradient(to bottom, transparent 0%, #C6A969 30%, #C6A969 70%, transparent 100%)', opacity: 0.25 }} />
      {/* Horizontal thin lines */}
      <div className="absolute inset-x-0" style={{ top: '15%', height: 1, background: 'linear-gradient(to right, transparent, rgba(198,169,105,0.08), transparent)' }} />
      <div className="absolute inset-x-0" style={{ top: '85%', height: 1, background: 'linear-gradient(to right, transparent, rgba(198,169,105,0.08), transparent)' }} />
      {/* Large faint M in background */}
      <div className="absolute" style={{ right: '-40px', top: '50%', transform: 'translateY(-50%)', opacity: 0.03 }}>
        <svg width={500} height={500} viewBox="0 0 56 56" fill="none">
          <path d="M13 43 L13 13 L28 26 L43 13 L43 43" stroke="#C6A969" strokeWidth="2" strokeLinecap="square" />
        </svg>
      </div>
    </div>
  )
}

// ─── Scan line animation ──────────────────────────────────────────────────────
function ScanLine() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-x-0 h-px opacity-[0.07]"
        style={{
          background: 'linear-gradient(to right, transparent, #C6A969, transparent)',
          animation: 'scanline 6s linear infinite',
        }}
      />
      <style>{`
        @keyframes scanline {
          0%   { top: -1%; }
          100% { top: 101%; }
        }
      `}</style>
    </div>
  )
}

// ─── Login Form ────────────────────────────────────────────────────────────────
function LoginForm() {
  const router      = useRouter()
  const { status }  = useSession()
  const searchParams = useSearchParams()
  const callbackUrl  = searchParams.get('callbackUrl') || '/'
  const error        = searchParams.get('error')

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [loginError, setLoginError] = useState('')
  const [redirecting, setRedirecting] = useState(false)
  const [focused,    setFocused]    = useState<'email' | 'password' | null>(null)

  useEffect(() => {
    if (status === 'authenticated') { setRedirecting(true); router.replace(callbackUrl) }
  }, [status, router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setLoginError('')
    const result = await signIn('credentials', { email, password, redirect: false, callbackUrl })
    setLoading(false)
    if (result?.error) setLoginError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
  }

  // Show form immediately — redirect happens silently via useEffect
  // Never block on status==='loading' to avoid the stuck spinner screen

  return (
    <div
      className="relative min-h-screen flex"
      style={{ background: '#080808', fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Redirect overlay — only shows AFTER successful login, not during session check */}
      {redirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5"
          style={{ background: '#080808' }}>
          <GeoMark size={52} />
          <div style={{ display: 'flex', gap: 6 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: '50%',
                background: '#C6A969',
                animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                opacity: 0.6,
              }} />
            ))}
          </div>
          <style>{`
            @keyframes dotPulse {
              0%,80%,100% { transform: scale(0.7); opacity:0.4; }
              40%          { transform: scale(1.1); opacity:1; }
            }
          `}</style>
        </div>
      )}
      <GridBg />
      <ScanLine />

      {/* ── Split Layout ─────────────────────────────────────── */}

      {/* LEFT — Brand panel (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative border-r" style={{ borderColor: 'rgba(198,169,105,0.10)' }}>
        {/* Top-left label */}
        <div className="p-10">
          <p style={{ fontSize: 10, letterSpacing: '0.25em', color: 'rgba(198,169,105,0.45)', fontFamily: 'monospace' }}>
            MERIDIAN ROOM AI · v2.0
          </p>
        </div>

        {/* Center content */}
        <div className="flex-1 flex flex-col items-start justify-center px-16 pb-8">
          <GeoMark size={64} />

          <div style={{ marginTop: 32 }}>
            <h1 style={{
              fontSize: 52,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              marginBottom: 8,
            }}>
              MERIDIAN
            </h1>
            <h2 style={{
              fontSize: 52,
              fontWeight: 900,
              color: 'transparent',
              WebkitTextStroke: '1px rgba(255,255,255,0.20)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              marginBottom: 24,
            }}>
              ROOM AI
            </h2>

            {/* Gold rule */}
            <div style={{ width: 48, height: 2, background: '#C6A969', marginBottom: 20 }} />

            <p style={{ fontSize: 11, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.30)', fontFamily: 'monospace' }}>
              LUXURY BUILT-IN FURNITURE
            </p>
            <p style={{ fontSize: 11, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.30)', fontFamily: 'monospace', marginTop: 4 }}>
              PRECISION CABINET ENGINEERING
            </p>
          </div>

          {/* Feature tags */}
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              '3D Cabinet Configurator',
              'AI-powered Pricing Engine',
              'Real-time Margin Analysis',
              'Google Sheets + LINE Sync',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 4, height: 4, background: '#C6A969', flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>{f}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom-left coords */}
        <div className="p-10">
          <p style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(198,169,105,0.25)', fontFamily: 'monospace' }}>
            SYS:SECURE · AUTH:REQUIRED · 2026
          </p>
        </div>
      </div>

      {/* RIGHT — Auth panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 relative">

        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-12">
          <GeoMark size={52} />
          <h1 style={{ marginTop: 16, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
            MERIDIAN ROOM
          </h1>
          <p style={{ fontSize: 9, color: 'rgba(198,169,105,0.55)', letterSpacing: '0.25em', marginTop: 4, fontFamily: 'monospace' }}>
            AI PRICING ENGINE
          </p>
        </div>

        {/* Form card area */}
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Section label */}
          <p style={{ fontSize: 9, letterSpacing: '0.28em', color: 'rgba(198,169,105,0.55)', fontFamily: 'monospace', marginBottom: 28 }}>
            01 — AUTHENTICATION
          </p>

          <h2 style={{
            fontSize: 26,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.01em',
            marginBottom: 6,
            lineHeight: 1.1,
          }}>
            เข้าสู่ระบบ
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 36 }}>
            กรอกข้อมูลเพื่อเข้าใช้งาน MERIDIAN ROOM
          </p>

          {/* Error */}
          {(loginError || error) && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', marginBottom: 20,
              borderLeft: '2px solid #EF4444',
              background: 'rgba(239,68,68,0.06)',
            }}>
              <p style={{ fontSize: 12, color: '#FCA5A5' }}>
                {loginError || 'เกิดข้อผิดพลาด กรุณาลองใหม่'}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Email field */}
            <div style={{ marginBottom: 28, position: 'relative' }}>
              <label style={{
                display: 'block', fontSize: 9, letterSpacing: '0.22em',
                color: focused === 'email' ? '#C6A969' : 'rgba(255,255,255,0.30)',
                fontFamily: 'monospace', marginBottom: 10,
                transition: 'color 0.2s',
              }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                required
                autoFocus
                autoComplete="email"
                placeholder="your@email.com"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${focused === 'email' ? '#C6A969' : 'rgba(255,255,255,0.12)'}`,
                  padding: '8px 0',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  letterSpacing: '0.02em',
                }}
              />
              {/* Animated focus line */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0,
                height: 1, background: '#C6A969',
                width: focused === 'email' ? '100%' : '0%',
                transition: 'width 0.3s ease',
              }} />
            </div>

            {/* Password field */}
            <div style={{ marginBottom: 40, position: 'relative' }}>
              <label style={{
                display: 'block', fontSize: 9, letterSpacing: '0.22em',
                color: focused === 'password' ? '#C6A969' : 'rgba(255,255,255,0.30)',
                fontFamily: 'monospace', marginBottom: 10,
                transition: 'color 0.2s',
              }}>
                PASSWORD
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${focused === 'password' ? '#C6A969' : 'rgba(255,255,255,0.12)'}`,
                  padding: '8px 32px 8px 0',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  letterSpacing: showPass ? '0.02em' : '0.18em',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% - 32px)',
                  background: 'transparent', border: 'none',
                  color: 'rgba(255,255,255,0.25)', cursor: 'pointer',
                  padding: 2, display: 'flex', alignItems: 'center',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(198,169,105,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
              >
                {showPass ? <MdVisibilityOff size={15} /> : <MdVisibility size={15} />}
              </button>
              {/* Animated focus line */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0,
                height: 1, background: '#C6A969',
                width: focused === 'password' ? '100%' : '0%',
                transition: 'width 0.3s ease',
              }} />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 0',
                background: loading ? 'rgba(198,169,105,0.4)' : 'linear-gradient(135deg, #B8943A 0%, #D4AF60 40%, #EAC96E 65%, #C6A448 100%)',
                color: '#0A0A0A',
                border: 'none',
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.18em',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'opacity 0.2s, transform 0.1s',
                fontFamily: 'system-ui, sans-serif',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              onMouseDown={e  => { if (!loading) e.currentTarget.style.transform = 'scale(0.99)' }}
              onMouseUp={e    => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {loading
                ? <>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                      style={{ animation: 'spin 0.8s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    AUTHENTICATING
                  </>
                : <><span>ENTER SYSTEM</span><MdArrowForward size={14} /></>
              }
            </button>

          </form>

          {/* Hint */}
          <p style={{ marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.15)', lineHeight: 1.6 }}>
            ติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์เข้าใช้งาน
          </p>
        </div>

        {/* Bottom-right version */}
        <div style={{ position: 'absolute', bottom: 24, right: 32 }}>
          <p style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.10)', fontFamily: 'monospace' }}>
            v2.0 · 2026
          </p>
        </div>

        {/* Corner bracket — top right */}
        <div aria-hidden style={{ position: 'absolute', top: 24, right: 24, opacity: 0.15 }}>
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <line x1="16" y1="0" x2="0"  y2="0"  stroke="#C6A969" strokeWidth="1.5" />
            <line x1="16" y1="0" x2="16" y2="16" stroke="#C6A969" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Corner bracket — bottom left */}
        <div aria-hidden style={{ position: 'absolute', bottom: 24, left: 24, opacity: 0.15 }}>
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <line x1="0"  y1="16" x2="16" y2="16" stroke="#C6A969" strokeWidth="1.5" />
            <line x1="0"  y1="16" x2="0"  y2="0"  stroke="#C6A969" strokeWidth="1.5" />
          </svg>
        </div>

      </div>
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function LoginPage() {
  return <LoginForm />
}
