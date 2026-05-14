'use client'
import { useState, useEffect, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const { status } = useSession()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [loginError, setLoginError] = useState('')
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      setRedirecting(true)
      router.replace(callbackUrl)
    }
  }, [status, router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoginError('')
    const result = await signIn('credentials', { email, password, redirect: false, callbackUrl })
    setLoading(false)
    if (result?.error) setLoginError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
  }

  if (status === 'loading' || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <Loader2 size={28} className="text-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-5 shadow-gold">
            <span className="text-primary font-bold text-xl">M</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">MERIDIAN ROOM</h1>
          <p className="text-accent/70 text-xs tracking-widest mt-1.5">PRICING ENGINE</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Error */}
          {(loginError || error) && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{loginError || 'เกิดข้อผิดพลาด กรุณาลองใหม่'}</p>
            </div>
          )}

          {/* Email */}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="อีเมล"
            autoComplete="email"
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm
                       placeholder:text-white/25 focus:outline-none focus:border-accent/60 focus:bg-white/8
                       transition-all"
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="รหัสผ่าน"
              autoComplete="current-password"
              className="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border border-white/10 text-white text-sm
                         placeholder:text-white/25 focus:outline-none focus:border-accent/60 focus:bg-white/8
                         transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors p-0.5"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-1 rounded-xl gold-gradient text-primary font-semibold text-sm
                       hover:shadow-gold transition-all hover:scale-[1.01] active:scale-100
                       disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> กำลังเข้าสู่ระบบ…</>
              : 'เข้าสู่ระบบ'
            }
          </button>
        </form>

        <p className="text-center text-[10px] text-white/15 mt-8">v2.0 © 2026 MERIDIAN ROOM</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <Loader2 size={28} className="text-accent animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
