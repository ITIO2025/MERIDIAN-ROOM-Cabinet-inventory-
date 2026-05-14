'use client'
import { useState, useEffect, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn, AlertCircle, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    if (status === 'authenticated') router.replace(callbackUrl)
  }, [status, router, callbackUrl])

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoginError('')
    const result = await signIn('credentials', { email, password, redirect: false, callbackUrl })
    setLoading(false)
    if (result?.error) {
      setLoginError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } else if (result?.ok) {
      router.replace(callbackUrl)
    }
  }

  const handleGoogle = () => signIn('google', { callbackUrl })

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <Loader2 size={32} className="text-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent/5" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/3" />
        {/* Grid lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(198,169,105,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(198,169,105,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-4 shadow-gold">
            <span className="text-primary font-bold text-2xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-white">MERIDIAN ROOM</h1>
          <p className="text-accent text-sm tracking-widest mt-1">AI PRICING ENGINE</p>
        </div>

        {/* Card */}
        <div className="bg-secondary rounded-3xl p-8 shadow-xl border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-1">เข้าสู่ระบบ</h2>
          <p className="text-sm text-white/40 mb-6">กรอกข้อมูลเพื่อเข้าใช้งาน MERIDIAN ROOM</p>

          {/* Error */}
          {(loginError || error) && (
            <div className="flex items-center gap-2 p-3 bg-danger/15 border border-danger/30 rounded-xl mb-4">
              <AlertCircle size={15} className="text-danger flex-shrink-0" />
              <p className="text-sm text-red-300">
                {loginError || 'เกิดข้อผิดพลาด กรุณาลองใหม่'}
              </p>
            </div>
          )}

          {/* Google Login */}
          {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true' && (
            <>
              <button
                onClick={handleGoogle}
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-gray-700
                           font-medium text-sm hover:bg-gray-50 transition-colors mb-4"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                เข้าสู่ระบบด้วย Google
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-white/30">หรือ</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@meridian.co"
                className="w-full px-4 py-3 rounded-xl bg-primary border border-white/10 text-white text-sm
                           placeholder:text-white/20 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-primary border border-white/10 text-white text-sm
                             placeholder:text-white/20 focus:outline-none focus:border-accent transition-colors"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl gold-gradient text-primary font-bold text-sm
                         hover:shadow-gold transition-all hover:scale-[1.01] active:scale-100
                         disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> กำลังเข้าสู่ระบบ...</>
              ) : (
                <><LogIn size={16} /> เข้าสู่ระบบ</>
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-[10px] text-white/20 text-center mb-3 uppercase tracking-wider">Demo Accounts</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Admin', email: 'admin@meridian.co', pass: 'meridian2026' },
                { label: 'Sales', email: 'sales@meridian.co', pass: 'sales2026' },
                { label: 'Designer', email: 'designer@meridian.co', pass: 'design2026' },
              ].map(acc => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword(acc.pass) }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/8 text-center transition-colors"
                >
                  <p className="text-[10px] font-semibold text-accent">{acc.label}</p>
                  <p className="text-[9px] text-white/30 truncate mt-0.5">{acc.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-white/20 mt-4">
          MERIDIAN ROOM AI v2.0 · Precision Engineering in Furniture™
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <Loader2 size={32} className="text-accent animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
