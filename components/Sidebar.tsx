'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  MdDashboard, MdCalculate, MdFolderOpen, MdDescription,
  MdSettings, MdChevronLeft, MdChevronRight, MdBarChart,
  MdWarehouse, MdInventory, MdPeople, MdTrendingUp, MdMenu, MdClose, MdAutoFixHigh,
  MdLightMode, MdDarkMode, MdNightsStay, MdMenuBook,
} from 'react-icons/md'
import { useTheme } from '@/context/ThemeContext'
import type { ThemeId } from '@/lib/theme'
import clsx from 'clsx'

// ── Company logo hook — theme-aware, reads localStorage per active theme ──────
function useCompanyLogo() {
  const { prefs } = useTheme()
  const isDark = prefs.theme === 'dark' || prefs.theme === 'night'
  const [logo, setLogo] = useState('')

  useEffect(() => {
    const read = () => {
      const themeKey = isDark ? 'company_logo_dark' : 'company_logo_light'
      const themed  = localStorage.getItem(themeKey)
      const legacy  = localStorage.getItem('company_logo')
      setLogo(themed || legacy || '')
    }
    read()
    window.addEventListener('company-logo-updated', read)
    return () => window.removeEventListener('company-logo-updated', read)
  }, [isDark])

  return logo
}

// ── Plain gold "M" text mark ──────────────────────────────────────────────────
function GoldM({ size }: { size: number }) {
  return (
    <span
      aria-hidden
      style={{
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1,
        color: 'var(--color-accent, #C6A969)',
        letterSpacing: '-0.03em',
        fontFamily: 'system-ui, sans-serif',
        userSelect: 'none',
      }}
    >
      M
    </span>
  )
}

// ── Logo mark — uses company logo image if set, otherwise plain gold M ────────
function LogoMark({ size = 36, collapsed }: { size?: number; collapsed: boolean }) {
  const logo = useCompanyLogo()

  if (logo) {
    return (
      <div
        className="flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{
          width: size,
          height: size,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <img
          src={logo}
          alt="Logo"
          className="w-full h-full object-contain"
          style={{ padding: Math.round(size * 0.1) }}
        />
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <GoldM size={Math.round(size * 0.7)} />
    </div>
  )
}

// ── Brand text lockup ─────────────────────────────────────────────────────────
function BrandText() {
  return (
    <div className="flex flex-col" style={{ gap: 2 }}>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.10em',
          color: 'var(--sidebar-text, rgba(255,255,255,0.92))',
          lineHeight: 1,
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        MERIDIAN
      </span>
      <span
        style={{
          fontSize: 8,
          fontWeight: 500,
          letterSpacing: '0.32em',
          color: 'var(--color-accent, #C6A969)',
          lineHeight: 1,
          paddingRight: '0.32em',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        ROOM AI
      </span>
    </div>
  )
}

// ── Logo area (top of sidebar) ────────────────────────────────────────────────
function LogoArea({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/"
      className={clsx(
        'flex items-center border-b transition-colors duration-200 hover:bg-white/[0.03]',
        collapsed ? 'justify-center px-0 py-[17px]' : 'gap-3 px-4 py-[17px]',
      )}
      style={{ borderColor: 'rgba(255,255,255,0.07)', textDecoration: 'none' }}
    >
      <LogoMark size={collapsed ? 32 : 36} collapsed={collapsed} />
      {!collapsed && <BrandText />}
    </Link>
  )
}

// ── Mobile logo lockup ────────────────────────────────────────────────────────
function MobileLogoLockup() {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={36} collapsed={false} />
      <BrandText />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/',               label: 'Dashboard',      icon: MdDashboard,  group: 'main'    },
  { href: '/pricing',        label: 'คิดราคา',        icon: MdCalculate,  group: 'main'    },
  { href: '/projects',       label: 'โปรเจกต์',       icon: MdFolderOpen, group: 'main'    },
  { href: '/quotation',      label: 'ใบเสนอราคา',     icon: MdDescription, group: 'main'   },
  { href: '/analytics',      label: 'วิเคราะห์',      icon: MdBarChart,   group: 'insight' },
  { href: '/production',     label: 'การผลิต',        icon: MdWarehouse,  group: 'insight' },
  { href: '/stock',          label: 'คลังวัสดุ',      icon: MdInventory,  group: 'insight' },
  { href: '/customers',      label: 'ลูกค้า',         icon: MdPeople,     group: 'manage'  },
  { href: '/profit',         label: 'กำไร & Margin',  icon: MdTrendingUp, group: 'manage'  },
  { href: '/settings',       label: 'ตั้งค่า',        icon: MdSettings,   group: 'manage'  },
  { href: '/settings/theme', label: 'Theme Studio',   icon: MdAutoFixHigh, group: 'manage' },
  { href: '/guide',          label: 'คู่มือ',          icon: MdMenuBook,   group: 'manage'  },
]

const GROUP_LABELS: Record<string, string> = { main: 'หลัก', insight: 'วิเคราะห์', manage: 'จัดการ' }
const GROUPS = ['main', 'insight', 'manage'] as const

// ── Mode toggle ───────────────────────────────────────────────────────────────
const MODES: { id: ThemeId; icon: React.ElementType; label: string }[] = [
  { id: 'light', icon: MdLightMode,  label: 'Light' },
  { id: 'dark',  icon: MdDarkMode,   label: 'Dark'  },
  { id: 'night', icon: MdNightsStay, label: 'Night' },
]

function ModeToggle({ collapsed }: { collapsed: boolean }) {
  const { prefs, setTheme } = useTheme()
  const active = prefs.theme

  if (collapsed) {
    const currentIdx = MODES.findIndex(m => m.id === active)
    const next = MODES[(currentIdx + 1) % MODES.length]
    const Current = MODES[currentIdx]?.icon ?? MdLightMode
    return (
      <button
        title={`Switch to ${next.label}`}
        onClick={() => setTheme(next.id)}
        className="w-full flex items-center justify-center p-2 hover:bg-white/10 transition-colors"
        style={{ borderRadius: 0 }}
      >
        <Current size={15} className="text-white/50" />
      </button>
    )
  }

  return (
    <div
      className="flex items-center gap-px p-0.5"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
      }}
    >
      {MODES.map(({ id, icon: Icon, label }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            title={label}
            onClick={() => setTheme(id)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium transition-all duration-200',
              isActive
                ? 'text-primary'
                : 'text-white/35 hover:text-white/70 hover:bg-white/8',
            )}
            style={
              isActive
                ? { background: 'var(--color-accent, #C6A969)', color: '#111' }
                : undefined
            }
          >
            <Icon size={11} />
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Nav link — left-border gold when active ───────────────────────────────────
function NavLink({ item, collapsed }: { item: typeof NAV_ITEMS[0]; collapsed: boolean }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      title={item.label}
      className={clsx(
        'flex items-center gap-3 mb-px transition-colors duration-150 group relative',
        collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2',
        isActive
          ? 'text-white bg-white/[0.06]'
          : 'text-white/50 hover:text-white/85 hover:bg-white/[0.04]',
      )}
      style={
        isActive
          ? {
              borderLeft: '3px solid var(--color-accent, #C6A969)',
              paddingLeft: collapsed ? undefined : '9px',
            }
          : {
              borderLeft: '3px solid transparent',
            }
      }
    >
      <Icon
        size={22}
        className="flex-shrink-0"
        style={isActive ? { color: 'var(--color-accent, #C6A969)' } : undefined}
      />

      {!collapsed && (
        <span
          className="truncate"
          style={{
            fontSize: 12,
            fontWeight: isActive ? 600 : 400,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {item.label}
        </span>
      )}

      {/* Collapsed tooltip */}
      {collapsed && (
        <div
          className="absolute left-full ml-2 px-2.5 py-1.5 text-xs whitespace-nowrap z-50
                     opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150
                     shadow-xl"
          style={{
            background: 'var(--theme-card, #1a1a1a)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: 'var(--sidebar-text, rgba(255,255,255,0.9))',
            borderRadius: 2,
          }}
        >
          {item.label}
        </div>
      )}
    </Link>
  )
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.sidebarCollapsed = collapsed ? '1' : '0'
  }, [collapsed])

  return (
    <aside
      className="fixed left-0 top-0 h-full z-40 flex-col hidden md:flex"
      style={{
        width: collapsed ? 64 : 240,
        transition: 'width 200ms ease',
        background: 'var(--theme-sidebar-bg, #111111)',
        borderRight: '1px solid var(--theme-sidebar-border, rgba(255,255,255,0.07))',
      }}
    >
      {/* Logo */}
      <LogoArea collapsed={collapsed} />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3" style={{ overflowX: 'hidden' }}>
        {GROUPS.map(group => (
          <div key={group} className="mb-4">
            {!collapsed && (
              <p
                className="px-4 mb-1"
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.20em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent, #C6A969)',
                  opacity: 0.7,
                }}
              >
                {GROUP_LABELS[group]}
              </p>
            )}
            {NAV_ITEMS.filter(i => i.group === group).map(item => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom: mode toggle + collapse */}
      <div
        className="p-2 space-y-1"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <ModeToggle collapsed={collapsed} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
          style={{ borderRadius: 0 }}
        >
          {collapsed ? (
            <MdChevronRight size={16} />
          ) : (
            <div className="flex items-center gap-1.5" style={{ fontSize: 11, letterSpacing: '0.04em' }}>
              <MdChevronLeft size={16} />
              <span className="text-white/35" style={{ fontSize: 11 }}>ย่อ</span>
            </div>
          )}
        </button>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div
          className="px-3 py-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <Link
            href="/settings/theme"
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 transition-colors group"
          >
            <MdAutoFixHigh size={12} style={{ color: 'var(--color-accent, #C6A969)', opacity: 0.6 }} />
            <span className="text-white/25 group-hover:text-white/55 transition-colors" style={{ fontSize: 10 }}>
              Theme Studio
            </span>
          </Link>
          <p className="text-center text-white/12 pb-1" style={{ fontSize: 9 }}>
            MERIDIAN ROOM v2.0 · 2026
          </p>
        </div>
      )}
    </aside>
  )
}

// ─── Mobile Sidebar (Drawer) ──────────────────────────────────────────────────

function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-4 z-50 p-2 text-accent shadow-lg"
        style={{ background: 'var(--theme-sidebar-bg, #111111)', borderRadius: 2 }}
        aria-label="เปิดเมนู"
      >
        <MdMenu size={20} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer — full-width overlay */}
      <aside
        className="md:hidden fixed left-0 top-0 h-full z-50 flex flex-col w-full shadow-2xl"
        style={{
          maxWidth: 300,
          background: 'var(--theme-sidebar-bg, #111111)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 200ms ease',
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-4 py-[17px]"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <MobileLogoLockup />
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            style={{ borderRadius: 2 }}
          >
            <MdClose size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          {GROUPS.map(group => (
            <div key={group} className="mb-4">
              <p
                className="px-4 mb-1"
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.20em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent, #C6A969)',
                  opacity: 0.7,
                }}
              >
                {GROUP_LABELS[group]}
              </p>
              {NAV_ITEMS.filter(i => i.group === group).map(item => (
                <NavLink key={item.href} item={item} collapsed={false} />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div
          className="p-3 space-y-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <ModeToggle collapsed={false} />
          <p className="text-center text-white/20 pb-1" style={{ fontSize: 9 }}>
            MERIDIAN ROOM v2.0 · 2026
          </p>
        </div>
      </aside>
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  )
}
