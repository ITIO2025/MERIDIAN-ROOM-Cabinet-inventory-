'use client'
import { useSession, signOut } from 'next-auth/react'
import { Bell, ChevronDown, LogOut, Settings, Shield, CheckCheck } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth-users'
import type { UserRole } from '@/types/next-auth'
import { getNotifications, markAllRead } from '@/lib/storage'
import type { StoredNotification } from '@/lib/storage'
import clsx from 'clsx'

const NOTI_COLORS = {
  INFO:    'text-info bg-info/10',
  WARNING: 'text-warning bg-warning/10',
  SUCCESS: 'text-success bg-success/10',
  DANGER:  'text-danger bg-danger/10',
}

// ── Panel: theme-aware dropdown card ─────────────────────────────────────────
function Panel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={clsx('absolute right-0 top-full mt-2 rounded-2xl shadow-lg z-20 overflow-hidden animate-scale-in', className)}
      style={{ background: 'var(--theme-card, #ffffff)', border: '1px solid var(--theme-border, #F0F0F0)' }}
    >
      {children}
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ borderColor: 'var(--theme-border, #F0F0F0)' }} className="border-b" />
}

export default function Header() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notiOpen, setNotiOpen] = useState(false)
  const [notifications, setNotifications] = useState<StoredNotification[]>([])
  const [unread, setUnread] = useState(0)

  const role = session?.user?.role as UserRole | undefined
  const roleLabel = role ? ROLE_LABELS[role] : ''
  const roleColor = role ? ROLE_COLORS[role] : '#C6A969'

  useEffect(() => {
    const load = () => {
      const n = getNotifications()
      setNotifications(n.slice(0, 8))
      setUnread(n.filter(x => !x.read).length)
    }
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [])

  const handleMarkRead = () => {
    markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'เมื่อกี้'
    if (min < 60) return `${min} นาทีที่แล้ว`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h} ชม.ที่แล้ว`
    return `${Math.floor(h / 24)} วันที่แล้ว`
  }

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-md px-4 md:px-6 py-3"
      style={{
        background: 'var(--theme-header-bg, var(--theme-card, rgba(255,255,255,0.95)))',
        borderBottom: '1px solid var(--theme-border, #F0F0F0)',
      }}
    >
      <div className="flex items-center justify-between">
        {/* Mobile spacer */}
        <div className="w-10 md:hidden" />

        {/* Right Side */}
        <div className="flex items-center gap-2">

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotiOpen(!notiOpen); setMenuOpen(false) }}
              className="relative p-2 rounded-xl transition-colors hover:bg-accent/10"
            >
              <Bell size={18} className="text-primary opacity-60" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {notiOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotiOpen(false)} />
                <Panel className="w-80">
                  <div className="flex items-center justify-between px-4 py-3">
                    <p className="font-semibold text-sm text-primary">การแจ้งเตือน</p>
                    {unread > 0 && (
                      <button onClick={handleMarkRead} className="flex items-center gap-1 text-xs text-accent hover:underline">
                        <CheckCheck size={12} /> อ่านทั้งหมด
                      </button>
                    )}
                  </div>
                  <Divider />
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-6">ไม่มีการแจ้งเตือน</p>
                    ) : notifications.map(n => (
                      <div
                        key={n.id}
                        className={clsx('flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/5', !n.read && 'bg-accent/5')}
                        style={{ borderBottom: '1px solid var(--theme-border, #F0F0F0)' }}
                      >
                        <div className={clsx('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', !n.read ? 'bg-accent' : 'bg-gray-300')} />
                        <div className="flex-1 min-w-0">
                          <p className={clsx('text-xs font-semibold', !n.read ? 'text-primary' : 'text-muted')}>{n.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        <span className={clsx('text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0', NOTI_COLORS[n.type])}>
                          {n.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </>
            )}
          </div>

          {/* User Menu */}
          {session?.user ? (
            <div className="relative">
              <button
                onClick={() => { setMenuOpen(!menuOpen); setNotiOpen(false) }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-accent/10 transition-colors"
              >
                {session.user.image ? (
                  <img src={session.user.image} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-primary flex-shrink-0"
                    style={{ background: `${roleColor}25` }}
                  >
                    {session.user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-primary leading-tight">{session.user.name}</p>
                  <p className="text-[10px] leading-tight" style={{ color: roleColor }}>{roleLabel}</p>
                </div>
                <ChevronDown size={13} className="text-primary opacity-40" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <Panel className="w-52">
                    <div className="px-4 py-3">
                      <p className="font-semibold text-primary text-sm">{session.user.name}</p>
                      <p className="text-xs text-gray-400">{session.user.email}</p>
                      <span
                        className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ color: roleColor, background: `${roleColor}18` }}
                      >
                        {roleLabel}
                      </span>
                    </div>
                    <Divider />
                    <div className="p-1.5">
                      <Link href="/settings" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent/10 rounded-xl transition-colors">
                        <Settings size={14} className="text-primary opacity-40" />
                        ตั้งค่า
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5 rounded-xl transition-colors mt-0.5"
                      >
                        <LogOut size={14} />
                        ออกจากระบบ
                      </button>
                    </div>
                  </Panel>
                </>
              )}
            </div>
          ) : (
            <Link href="/login"
              className="px-3 py-1.5 gold-gradient text-primary text-xs font-semibold rounded-xl hover:shadow-gold transition-all">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
