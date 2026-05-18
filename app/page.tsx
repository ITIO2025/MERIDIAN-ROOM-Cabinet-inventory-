'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MdTrendingUp, MdTrendingDown, MdCalculate, MdFolderOpen,
  MdWarning, MdCheckCircle, MdAccessTime, MdBolt, MdBarChart,
  MdArrowForward, MdInventory, MdAttachMoney, MdPercent, MdShowChart,
} from 'react-icons/md'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { getDashboardStats, getProjects } from '@/lib/storage'
import type { StoredProject } from '@/lib/storage'
import { PROJECT_TYPE_LABELS } from '@/lib/types'
import type { ProjectStatus } from '@/lib/types'

// ── Hook: reads live CSS variables, refreshes on data-theme change ─────────────
function useThemeColors() {
  const [colors, setColors] = useState({
    accent: '#C6A969',
    success: '#00A86B',
    border: '#F0F0F0',
    text: '#6B7280',
    cardBg: '#FFFFFF',
  })
  useEffect(() => {
    const update = () => {
      const cs = getComputedStyle(document.documentElement)
      const get = (v: string) => cs.getPropertyValue(v).trim()
      setColors({
        accent:  get('--color-accent')  || '#C6A969',
        success: '#00A86B',
        border:  get('--theme-border')  || '#F0F0F0',
        text:    get('--theme-text-muted') || '#6B7280',
        cardBg:  get('--theme-card')    || '#FFFFFF',
      })
    }
    update()
    const obs = new MutationObserver(() => { setTimeout(update, 0) })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] })
    return () => obs.disconnect()
  }, [])
  return colors
}

// ── Status config — inline Tailwind colors per spec ────────────────────────────
const STATUS_CONFIG: Record<ProjectStatus, { label: string; borderCls: string; textCls: string }> = {
  QUOTE:        { label: 'ใบเสนอราคา', borderCls: 'border-blue-500',   textCls: 'text-blue-600'    },
  CONFIRMED:    { label: 'ยืนยันแล้ว',  borderCls: 'border-green-500',  textCls: 'text-green-600'   },
  PRODUCTION:   { label: 'กำลังผลิต',   borderCls: 'border-amber-500',  textCls: 'text-amber-600'   },
  INSTALLATION: { label: 'ติดตั้ง',     borderCls: 'border-purple-500', textCls: 'text-purple-600'  },
  COMPLETED:    { label: 'เสร็จสิ้น',   borderCls: 'border-emerald-500',textCls: 'text-emerald-600' },
  CANCELLED:    { label: 'ยกเลิก',      borderCls: 'border-red-400',    textCls: 'text-red-500'     },
}

// ── KPI Card — left colored border, big number, trend badge ────────────────────
function KPICard({ label, value, sub, icon: Icon, trend, trendUp, accentColor = '#C6A969' }: {
  label: string; value: string; sub?: string; icon: React.ElementType
  trend?: string; trendUp?: boolean; accentColor?: string
}) {
  return (
    <div
      className="bg-white dark:bg-neutral-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800 border-l-4 hover:shadow-md transition-shadow"
      style={{ borderLeftColor: accentColor }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ background: `${accentColor}18` }}>
          <Icon size={18} style={{ color: accentColor }} />
        </div>
        {trend && (
          <span
            className={`flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full
              ${trendUp
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-500'}`}
          >
            {trendUp ? <MdTrendingUp size={12} /> : <MdTrendingDown size={12} />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-primary leading-none mb-1">{value}</p>
      <p className="text-[13px] font-medium text-gray-500">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Chart tooltip ───────────────────────────────────────────────────────────────
const TooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white shadow-lg rounded-xl p-3 border border-gray-100 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: ฿{p.value?.toLocaleString('th-TH')}
        </p>
      ))}
    </div>
  )
}

// PIE_TYPES — accent slot filled dynamically from useThemeColors
const PIE_TYPE_KEYS = [
  { key: 'WARDROBE',   colorSlot: 'accent'  },
  { key: 'KITCHEN',    colorSlot: 'static',  color: '#4B5563' },
  { key: 'WALK_IN',    colorSlot: 'static',  color: '#4CAF50' },
  { key: 'TV_CABINET', colorSlot: 'static',  color: '#2196F3' },
]

export default function Dashboard() {
  const router = useRouter()
  const tc = useThemeColors()
  const [stats, setStats] = useState({
    totalProjects: 0, activeProjects: 0, completedProjects: 0,
    revenue: 0, profit: 0, avgMargin: 0, lowStockCount: 0, unreadNoti: 0,
  })
  const [projects, setProjects] = useState<StoredProject[]>([])
  const [allProjects, setAllProjects] = useState<StoredProject[]>([])

  useEffect(() => {
    setStats(getDashboardStats())
    const all = getProjects()
    setAllProjects(all)
    setProjects(all.slice(0, 5))
  }, [])

  // ─── Monthly chart — real data from projects grouped by month ───────────────
  const MONTHLY = (() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const label = d.toLocaleDateString('th-TH', { month: 'short' })
      const monthProjects = allProjects.filter(p => {
        const pd = new Date(p.createdAt)
        return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth() && p.status !== 'CANCELLED'
      })
      const revenue = monthProjects.reduce((s, p) => s + p.sellingPrice, 0)
      const cost    = monthProjects.reduce((s, p) => s + p.netCost, 0)
      return { month: label, revenue, cost, profit: revenue - cost }
    })
  })()

  // Build pie data from actual projects
  const byType = PIE_TYPE_KEYS.map(t => ({
    name: PROJECT_TYPE_LABELS[t.key as keyof typeof PROJECT_TYPE_LABELS] ?? t.key,
    value: allProjects.filter(p => p.projectType === t.key).length,
    color: t.colorSlot === 'accent' ? tc.accent : (t.color ?? '#999'),
  })).filter(t => t.value > 0)
  if (byType.length === 0) byType.push({ name: 'ไม่มีข้อมูล', value: 1, color: '#E0E0E0' })

  const installCount = projects.filter(p => p.status === 'INSTALLATION').length
  const lowMarginCount = projects.filter(p => p.margin < 25).length

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-bold text-primary leading-tight">Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">ภาพรวมธุรกิจ MERIDIAN ROOM</p>
        </div>
        <Link
          href="/pricing"
          className="group flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold tracking-wider transition-all duration-200 hover:scale-105 active:scale-100"
          style={{
            background: '#1A1C1E',
            borderRadius: '6px',
            borderLeft: '3px solid #D4AF60',
            boxShadow: '0 2px 8px rgba(26,28,30,0.35)',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 18px rgba(212,175,96,0.28)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,28,30,0.35)')}
        >
          <MdCalculate size={14} style={{ color: '#D4AF60' }} />
          <span className="hidden sm:inline">คิดราคาใหม่</span>
          <span className="sm:hidden">+</span>
        </Link>
      </div>

      {/* ── KPI Cards — 4 columns ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <KPICard
          label="ยอดขายรวม"
          value={`฿${(stats.revenue / 1000).toFixed(0)}k`}
          sub="ทุกสถานะ"
          icon={MdAttachMoney}
          accentColor={tc.accent}
        />
        <KPICard
          label="กำไรรวม"
          value={`฿${(stats.profit / 1000).toFixed(0)}k`}
          sub={`Margin ${stats.avgMargin.toFixed(1)}%`}
          icon={MdTrendingUp}
          trend={stats.avgMargin >= 35 ? '+ดี' : 'ต่ำ'}
          trendUp={stats.avgMargin >= 35}
          accentColor="#00A86B"
        />
        <KPICard
          label="โปรเจกต์ทั้งหมด"
          value={String(stats.totalProjects)}
          sub={`Active ${stats.activeProjects} งาน`}
          icon={MdFolderOpen}
          trend={`+${stats.activeProjects}`}
          trendUp
          accentColor="#2196F3"
        />
        <KPICard
          label="Avg Margin"
          value={`${stats.avgMargin.toFixed(1)}%`}
          sub="เป้าหมาย 35%"
          icon={MdPercent}
          trend={stats.avgMargin >= 35 ? 'ผ่านเป้า' : 'ต่ำกว่าเป้า'}
          trendUp={stats.avgMargin >= 35}
          accentColor="#9C27B0"
        />
      </div>

      {/* ── Charts — 60/40 split ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">

        {/* Area Chart — 3 of 5 cols ≈ 60% */}
        <div className="lg:col-span-3 bg-white dark:bg-neutral-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400">รายได้ &amp; กำไร</p>
              <p className="text-xs text-gray-400 mt-0.5">6 เดือนล่าสุด</p>
            </div>
            <MdShowChart size={16} className="text-accent" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={tc.accent}  stopOpacity={0.22} />
                  <stop offset="95%" stopColor={tc.accent}  stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={tc.success} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={tc.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={tc.border} strokeOpacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Prompt', fill: tc.text }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tc.text }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
              <Tooltip content={<TooltipContent />} />
              <Area type="monotone" dataKey="revenue" name="ยอดขาย" stroke={tc.accent} fill="url(#revGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="profit"  name="กำไร"   stroke={tc.success} fill="url(#profitGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — 2 of 5 cols ≈ 40% */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400">ประเภทงาน</p>
              <p className="text-xs text-gray-400 mt-0.5">จากข้อมูลจริง</p>
            </div>
            <MdBarChart size={16} className="text-accent" />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={byType} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                {byType.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip
                formatter={(v: any) => [v, 'งาน']}
                contentStyle={{
                  fontFamily: 'Prompt', fontSize: 11,
                  background: tc.cardBg, border: `1px solid ${tc.border}`,
                  borderRadius: 8, color: tc.text,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {byType.map(p => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <span className="text-gray-600">{p.name}</span>
                </div>
                <span className="font-semibold text-gray-700">{p.value} งาน</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Stats Row — 3 items ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl px-4 py-3 shadow-sm border border-gray-100 dark:border-neutral-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <MdFolderOpen size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">โปรเจกต์ Active</p>
            <p className="text-lg font-bold text-primary leading-tight">{stats.activeProjects}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl px-4 py-3 shadow-sm border border-gray-100 dark:border-neutral-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50">
            <MdInventory size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Stock ต่ำ</p>
            <p className={`text-lg font-bold leading-tight ${stats.lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {stats.lowStockCount} รายการ
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl px-4 py-3 shadow-sm border border-gray-100 dark:border-neutral-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50">
            <MdPercent size={16} className="text-purple-500" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">Avg Margin</p>
            <p className={`text-lg font-bold leading-tight ${stats.avgMargin >= 35 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {stats.avgMargin.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* ── Recent Projects + Sidebar ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Projects Table */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-neutral-800">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400">โปรเจกต์ล่าสุด</p>
            <Link href="/projects" className="text-xs text-accent hover:underline flex items-center gap-0.5">
              ดูทั้งหมด <MdArrowForward size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-neutral-800">
                  <th className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">งาน</th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">ลูกค้า</th>
                  <th className="text-center px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">สถานะ</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">ราคา</th>
                  <th className="text-right px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">Margin</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                      ยังไม่มีโปรเจกต์{' '}
                      <Link href="/pricing" className="text-accent hover:underline">สร้างใหม่</Link>
                    </td>
                  </tr>
                ) : projects.map((p, idx) => {
                  const st = STATUS_CONFIG[p.status]
                  return (
                    <tr
                      key={p.id}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/60 dark:bg-neutral-800/40' : ''}`}
                      onClick={() => router.push('/quotation')}
                    >
                      <td className="px-5 py-3 font-medium text-primary max-w-[140px] truncate">{p.projectName}</td>
                      <td className="px-3 py-3 text-gray-500 hidden sm:table-cell">{p.customerName}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block border px-2 py-0.5 rounded text-[10px] font-semibold ${st.borderCls} ${st.textCls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-gray-700">
                        ฿{(p.sellingPrice / 1000).toFixed(0)}k
                      </td>
                      <td className="px-5 py-3 text-right hidden sm:table-cell">
                        <span className={`font-semibold text-xs ${p.margin >= 35 ? 'text-emerald-600' : p.margin >= 25 ? 'text-amber-600' : 'text-red-500'}`}>
                          {p.margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">

          {/* Alerts */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-3">
              <MdBolt size={15} className="text-accent" />
              <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400">AI Alerts</p>
            </div>
            <div className="space-y-2">
              {stats.lowStockCount > 0 && (
                <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
                  <MdWarning size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700">{stats.lowStockCount} รายการ Stock ใกล้หมด</p>
                </div>
              )}
              {lowMarginCount > 0 && (
                <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                  <MdWarning size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700">{lowMarginCount} งาน Margin ต่ำกว่า 25%</p>
                </div>
              )}
              {installCount > 0 && (
                <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                  <MdAccessTime size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700">{installCount} งานกำลังติดตั้ง</p>
                </div>
              )}
              {stats.lowStockCount === 0 && lowMarginCount === 0 && (
                <div className="flex items-start gap-2 p-2 bg-emerald-50 rounded-lg">
                  <MdCheckCircle size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700">ทุกอย่างอยู่ในเกณฑ์ดี</p>
                </div>
              )}
            </div>
          </div>

          {/* Stock Summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MdInventory size={14} className="text-accent" />
                <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400">Stock</p>
              </div>
              <Link href="/stock" className="text-[10px] text-accent hover:underline">จัดการ</Link>
            </div>
            {stats.lowStockCount > 0 ? (
              <p className="text-sm text-amber-600 font-semibold">ต่ำกว่าขั้นต่ำ {stats.lowStockCount} รายการ</p>
            ) : (
              <p className="text-sm text-emerald-600 font-semibold">Stock ทั้งหมดปกติ</p>
            )}
          </div>

          {/* Quick Action */}
          <Link
            href="/pricing"
            className="block w-full text-white font-semibold text-sm text-center py-3 transition-all duration-200 hover:scale-[1.02] active:scale-100"
            style={{
              background: 'linear-gradient(90deg, #1A1C1E 0%, #252729 100%)',
              borderRadius: '8px',
              borderLeft: '4px solid #D4AF60',
              letterSpacing: '0.06em',
              boxShadow: '0 2px 10px rgba(26,28,30,0.4)',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 22px rgba(212,175,96,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 10px rgba(26,28,30,0.4)')}
          >
            <div className="flex items-center justify-center gap-2">
              <MdCalculate size={15} style={{ color: '#D4AF60' }} />
              เริ่มคิดราคาใหม่
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
