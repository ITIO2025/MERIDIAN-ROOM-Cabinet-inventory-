'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Calculator, FolderOpen, FileText,
  Settings, ChevronLeft, ChevronRight, BarChart3,
  Warehouse, Package, Users, TrendingUp, Menu, X,
} from 'lucide-react'
import clsx from 'clsx'

// ── Logo hook — reads from localStorage, refreshes on custom event ────────────
function useCompanyLogo() {
  const [logo, setLogo] = useState('')
  useEffect(() => {
    const read = () => setLogo(localStorage.getItem('company_logo') ?? '')
    read()
    window.addEventListener('company-logo-updated', read)
    return () => window.removeEventListener('company-logo-updated', read)
  }, [])
  return logo
}

// ── Logo mark component ───────────────────────────────────────────────────────
function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  const logo = useCompanyLogo()
  if (logo) {
    return (
      <div
        className={clsx('rounded-lg overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0', className)}
        style={{ width: size, height: size }}
      >
        <img src={logo} alt="logo" className="w-full h-full object-contain p-0.5" />
      </div>
    )
  }
  return (
    <div
      className={clsx('rounded-lg gold-gradient flex items-center justify-center flex-shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <span className="text-primary font-bold" style={{ fontSize: size * 0.4 }}>M</span>
    </div>
  )
}

const NAV_ITEMS = [
  { href: '/',            label: 'Dashboard',    icon: LayoutDashboard, group: 'main' },
  { href: '/pricing',     label: 'คิดราคา',      icon: Calculator,      group: 'main' },
  { href: '/projects',    label: 'โปรเจกต์',     icon: FolderOpen,      group: 'main' },
  { href: '/quotation',   label: 'ใบเสนอราคา',   icon: FileText,        group: 'main' },
  { href: '/analytics',   label: 'วิเคราะห์',    icon: BarChart3,       group: 'insight' },
  { href: '/production',  label: 'การผลิต',      icon: Warehouse,       group: 'insight' },
  { href: '/stock',       label: 'คลังวัสดุ',    icon: Package,         group: 'insight' },
  { href: '/customers',   label: 'ลูกค้า',       icon: Users,           group: 'manage' },
  { href: '/profit',      label: 'กำไร & Margin', icon: TrendingUp,     group: 'manage' },
  { href: '/settings',    label: 'ตั้งค่า',      icon: Settings,        group: 'manage' },
]

const GROUP_LABELS: Record<string, string> = { main: 'หลัก', insight: 'วิเคราะห์', manage: 'จัดการ' }
const GROUPS = ['main', 'insight', 'manage'] as const

function NavLink({ item, collapsed }: { item: typeof NAV_ITEMS[0]; collapsed: boolean }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      title={item.label}
      className={clsx(
        'flex items-center gap-3 px-2 py-2.5 rounded-xl mb-0.5 transition-all duration-200 group relative',
        collapsed ? 'justify-center' : '',
        isActive
          ? 'bg-accent/20 text-accent border-l-[3px] border-accent pl-[5px]'
          : 'text-white/60 hover:bg-white/5 hover:text-white'
      )}
    >
      <Icon size={18} className={clsx('flex-shrink-0', isActive && 'text-accent')} />
      {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-secondary text-white text-xs rounded-lg
                        opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity
                        whitespace-nowrap z-50 shadow-lg border border-white/10">
          {item.label}
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-secondary rotate-45 border-l border-b border-white/10" />
        </div>
      )}
    </Link>
  )
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={clsx(
      'fixed left-0 top-0 h-full z-40 flex-col transition-all duration-300',
      'bg-primary text-white shadow-xl hidden md:flex',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 px-4 py-5 border-b border-white/10', collapsed && 'justify-center px-2')}>
        <LogoMark size={32} />
        {!collapsed && (
          <div>
            <p className="font-semibold text-sm text-white leading-tight">MERIDIAN</p>
            <p className="text-[10px] text-accent leading-tight tracking-wider">ROOM AI</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {GROUPS.map(group => (
          <div key={group} className="mb-4">
            {!collapsed && (
              <p className="text-[10px] text-white/30 uppercase tracking-widest px-2 mb-1 font-medium">
                {GROUP_LABELS[group]}
              </p>
            )}
            {NAV_ITEMS.filter(i => i.group === group).map(item => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
        >
          {collapsed
            ? <ChevronRight size={16} />
            : <div className="flex items-center gap-2 text-xs text-white/40"><ChevronLeft size={16} /><span>ย่อ</span></div>}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 py-2 border-t border-white/5">
          <p className="text-[9px] text-white/15 text-center">MERIDIAN ROOM v2.0 · 2026</p>
        </div>
      )}
    </aside>
  )
}

// ─── Mobile Sidebar (Drawer) ──────────────────────────────────────────────────

function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Hamburger Button (fixed top-left on mobile) */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-4 z-50 p-2 rounded-xl bg-primary text-accent shadow-lg"
        aria-label="เปิดเมนู"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside className={clsx(
        'md:hidden fixed left-0 top-0 h-full w-72 z-50 flex flex-col',
        'bg-primary text-white shadow-2xl transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <LogoMark size={36} className="rounded-xl" />
            <div>
              <p className="font-semibold text-white">MERIDIAN</p>
              <p className="text-[10px] text-accent tracking-wider">ROOM AI</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {GROUPS.map(group => (
            <div key={group} className="mb-5">
              <p className="text-[10px] text-white/30 uppercase tracking-widest px-2 mb-2 font-medium">
                {GROUP_LABELS[group]}
              </p>
              {NAV_ITEMS.filter(i => i.group === group).map(item => (
                <NavLink key={item.href} item={item} collapsed={false} />
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-[9px] text-white/20 text-center">MERIDIAN ROOM v2.0 · 2026</p>
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
