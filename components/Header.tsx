'use client'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  MdNotifications, MdExpandMore, MdLogout, MdSettings, MdDoneAll,
} from 'react-icons/md'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth-users'
import type { UserRole } from '@/types/next-auth'
import { getNotifications, markAllRead } from '@/lib/storage'
import type { StoredNotification } from '@/lib/storage'
import clsx from 'clsx'

// ── Pathname → Thai page title ────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  '/':               'Dashboard',
  '/pricing':        'คิดราคา',
  '/projects':       'โปรเจกต์',
  '/quotation':      'ใบเสนอราคา',
  '/analytics':      'วิเคราะห์',
  '/production':     'การผลิต',
  '/stock':          'คลังวัสดุ',
  '/customers':      'ลูกค้า',
  '/profit':         'กำไร & Margin',
  '/settings/theme': 'Theme Studio',
  '/settings':       'ตั้งค่า',
  '/guide':          'คู่มือ',
}

function usePageTitle() {
  const pathname = usePathname()
  // Match longest prefix first
  const sorted = Object.keys(PAGE_TITLES).sort((a, b) => b.length - a.length)
  const match = sorted.find(p => pathname === p || (p !== '/' && pathname.startsWith(p)))
  return match ? PAGE_TITLES[match] : ''
}

// ── Notification type badge colors ───────────────────────────────────────────
const NOTI_COLORS = {
  INFO:    'text-info bg-info/10',
  WARNING: 'text-warning bg-warning/10',
  SUCCESS: 'text-success bg-success/10',
  DANGER:  'text-danger bg-danger/10',
}

// ── Clean dropdown panel ──────────────────────────────────────────────────────
function Panel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        'absolute right-0 top-full mt-1.5 z-20 overflow-hidden shadow-xl animate-scale-in',
        className,
      )}
      style={{
        background: 'var(--theme-card, #ffffff)',
        border: '1px solid var(--theme-border, #e8e8e8)',
        borderRadius: 2,
        minWidth: 0,
      }}
    >
      {children}
    </div>
  )
}

function Divider() {
  return <div className="border-b" style={{ borderColor: 'var(--theme-border, #e8e8e8)' }} />
}

// ── User initials avatar ──────────────────────────────────────────────────────
function UserAvatar({
  name,
  image,
  roleColor,
  size = 28,
}: {
  name?: string | null
  image?: string | null
  roleColor: string
  size?: number
}) {
  if (image) {
    return (
      <img
        src={image}
        alt=""
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div
      className="flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${roleColor}22`,
        color: roleColor,
        fontSize: size * 0.43,
        border: `1.5px solid ${roleColor}44`,
      }}
    >
      {name?.charAt(0).toUpperCase() ?? '?'}
    </div>
  )
}

export default function Header() {
  const { data: session } = useSession()
  const pageTitle = usePageTitle()

  const [menuOpen, setMenuOpen]         = useState(false)
  const [notiOpen, setNotiOpen]         = useState(false)
  const [notifications, setNotifications] = useState<StoredNotification[]>([])
  const [unread, setUnread]             = useState(0)

  const role      = session?.user?.role as UserRole | undefined
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
      className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6"
      style={{
        height: 52,
        background: 'var(--theme-header-bg, var(--theme-card, rgba(255,255,255,0.97)))',
        borderBottom: '1px solid var(--theme-border, #ebebeb)',
      }}
    >
      {/* Left — page title */}
      <div className="flex items-center">
        {/* Mobile spacer for hamburger button */}
        <div className="w-9 md:hidden flex-shrink-0" />
        {pageTitle && (
          <h1
            className="font-semibold truncate text-primary"
            style={{ fontSize: 14, letterSpacing: '0.02em' }}
          >
            {pageTitle}
          </h1>
        )}
      </div>

      {/* Right — notifications + user */}
      <div className="flex items-center gap-1">

        {/* Notifications bell */}
        <div className="relative">
          <button
            onClick={() => { setNotiOpen(!notiOpen); setMenuOpen(false) }}
            className="relative flex items-center justify-center hover:bg-accent/10 transition-colors"
            style={{ width: 36, height: 36, borderRadius: 2 }}
            aria-label="การแจ้งเตือน"
          >
            <MdNotifications size={20} className="text-primary opacity-55" />
            {unread > 0 && (
              <span
                className="absolute flex items-center justify-center font-bold text-white bg-danger"
                style={{
                  top: 6,
                  right: 6,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  fontSize: 8,
                }}
              >
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {notiOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotiOpen(false)} />
              <Panel className="w-[280px] relative z-20">
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-2.5">
                  <p className="font-semibold text-primary" style={{ fontSize: 13 }}>การแจ้งเตือน</p>
                  {unread > 0 && (
                    <button
                      onClick={handleMarkRead}
                      className="flex items-center gap-1 text-accent hover:underline"
                      style={{ fontSize: 11 }}
                    >
                      <MdDoneAll size={12} />
                      อ่านทั้งหมด
                    </button>
                  )}
                </div>
                <Divider />

                {/* Notification list */}
                <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
                  {notifications.length === 0 ? (
                    <p className="text-center text-gray-400 py-6" style={{ fontSize: 13 }}>
                      ไม่มีการแจ้งเตือน
                    </p>
                  ) : notifications.map(n => (
                    <div
                      key={n.id}
                      className={clsx(
                        'flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-accent/5',
                        !n.read && 'bg-accent/[0.04]',
                      )}
                      style={{ borderBottom: '1px solid var(--theme-border, #ebebeb)' }}
                    >
                      <div
                        className="flex-shrink-0 rounded-full mt-1.5"
                        style={{
                          width: 6,
                          height: 6,
                          background: n.read ? '#d1d5db' : 'var(--color-accent, #C6A969)',
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={clsx('font-semibold leading-snug', n.read ? 'text-muted' : 'text-primary')}
                          style={{ fontSize: 12 }}
                        >
                          {n.title}
                        </p>
                        <p className="text-gray-400 mt-0.5 leading-relaxed" style={{ fontSize: 11 }}>
                          {n.message}
                        </p>
                        <p className="text-gray-300 mt-0.5" style={{ fontSize: 10 }}>
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                      <span className={clsx('px-1.5 py-0.5 rounded-full font-medium flex-shrink-0', NOTI_COLORS[n.type])}
                        style={{ fontSize: 9 }}>
                        {n.type}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}
        </div>

        {/* User */}
        {session?.user ? (
          <div className="relative">
            <button
              onClick={() => { setMenuOpen(!menuOpen); setNotiOpen(false) }}
              className="flex items-center gap-2 px-2 hover:bg-accent/10 transition-colors"
              style={{ height: 36, borderRadius: 2 }}
            >
              <UserAvatar
                name={session.user.name}
                image={session.user.image}
                roleColor={roleColor}
                size={26}
              />
              <div className="hidden sm:block text-left">
                <p className="font-semibold text-primary leading-tight" style={{ fontSize: 12 }}>
                  {session.user.name}
                </p>
                <p className="leading-tight" style={{ fontSize: 10, color: roleColor }}>
                  {roleLabel}
                </p>
              </div>
              <MdExpandMore size={13} className="text-primary opacity-35" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <Panel className="w-52">
                  {/* User info */}
                  <div className="px-4 py-3">
                    <p className="font-semibold text-primary" style={{ fontSize: 13 }}>
                      {session.user.name}
                    </p>
                    <p className="text-gray-400 mt-0.5" style={{ fontSize: 11 }}>
                      {session.user.email}
                    </p>
                    <span
                      className="inline-block mt-1.5 px-2 py-0.5 font-medium"
                      style={{
                        fontSize: 10,
                        borderRadius: 2,
                        color: roleColor,
                        background: `${roleColor}18`,
                      }}
                    >
                      {roleLabel}
                    </span>
                  </div>
                  <Divider />
                  <div className="p-1">
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-primary hover:bg-accent/10 transition-colors"
                      style={{ fontSize: 13, borderRadius: 2 }}
                    >
                      <MdSettings size={14} className="text-primary opacity-40" />
                      ตั้งค่า
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full flex items-center gap-2 px-3 py-2 text-danger hover:bg-danger/5 transition-colors mt-px"
                      style={{ fontSize: 13, borderRadius: 2 }}
                    >
                      <MdLogout size={14} />
                      ออกจากระบบ
                    </button>
                  </div>
                </Panel>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1.5 font-semibold text-primary hover:opacity-80 transition-opacity"
            style={{
              fontSize: 12,
              background: 'var(--color-accent, #C6A969)',
              borderRadius: 2,
            }}
          >
            เข้าสู่ระบบ
          </Link>
        )}
      </div>
    </header>
  )
}
