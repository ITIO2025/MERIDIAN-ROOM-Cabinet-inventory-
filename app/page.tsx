'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  TrendingUp, TrendingDown, Calculator, FolderOpen,
  AlertTriangle, CheckCircle, Clock, Zap, BarChart3,
  ArrowRight, Package, DollarSign, Percent, Activity,
} from 'lucide-react'
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
    // Defer observer callbacks so setState never fires during an active render cycle
    const obs = new MutationObserver(() => { setTimeout(update, 0) })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] })
    return () => obs.disconnect()
  }, [])
  return colors
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  QUOTE:        { label: 'ใบเสนอราคา', color: '#2196F3', bg: '#E3F2FD' },
  CONFIRMED:    { label: 'ยืนยันแล้ว',  color: '#FF9800', bg: '#FFF3E0' },
  PRODUCTION:   { label: 'กำลังผลิต',   color: '#9C27B0', bg: '#F3E5F5' },
  INSTALLATION: { label: 'ติดตั้ง',     color: '#009688', bg: '#E0F2F1' },
  COMPLETED:    { label: 'เสร็จสิ้น',   color: '#4CAF50', bg: '#E8F5E9' },
  CANCELLED:    { label: 'ยกเลิก',      color: '#F44336', bg: '#FFEBEE' },
}

function KPICard({ label, value, sub, icon: Icon, trend, trendUp, color = '#C6A969' }: {
  label: string; value: string; sub?: string; icon: React.ElementType
  trend?: string; trendUp?: boolean; color?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl" style={{ background: `${color}18` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
            ${trendUp ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
            {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-primary mb-0.5">{value}</p>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

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
  const [stats, setStats] = useState({ totalProjects: 0, activeProjects: 0, completedProjects: 0, revenue: 0, profit: 0, avgMargin: 0, lowStockCount: 0, unreadNoti: 0 })
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

  // Build pie data from actual projects — accent slot uses live theme color
  const byType = PIE_TYPE_KEYS.map(t => ({
    name: PROJECT_TYPE_LABELS[t.key as keyof typeof PROJECT_TYPE_LABELS] ?? t.key,
    value: projects.filter(p => p.projectType === t.key).length,
    color: t.colorSlot === 'accent' ? tc.accent : (t.color ?? '#999'),
  })).filter(t => t.value > 0)
  if (byType.length === 0) byType.push({ name: 'ไม่มีข้อมูล', value: 1, color: '#E0E0E0' })

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">ภาพรวมธุรกิจ MERIDIAN ROOM</p>
        </div>
        <Link href="/pricing"
          className="flex items-center gap-2 px-4 py-2 gold-gradient text-primary text-sm font-semibold rounded-xl hover:shadow-gold transition-all hover:scale-105 active:scale-100">
          <Calculator size={15} />
          <span className="hidden sm:inline">คิดราคาใหม่</span>
          <span className="sm:hidden">+</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <KPICard label="ยอดขายรวม" value={`฿${(stats.revenue / 1000).toFixed(0)}k`}
          sub="ทุกสถานะ" icon={DollarSign} color={tc.accent} />
        <KPICard label="กำไรรวม" value={`฿${(stats.profit / 1000).toFixed(0)}k`}
          sub={`Margin ${stats.avgMargin.toFixed(1)}%`} icon={TrendingUp}
          trend={stats.avgMargin >= 35 ? '+ดี' : 'ต่ำ'} trendUp={stats.avgMargin >= 35} color="#00A86B" />
        <KPICard label="โปรเจกต์" value={String(stats.totalProjects)}
          sub={`Active ${stats.activeProjects} งาน`} icon={FolderOpen}
          trend={`+${stats.activeProjects}`} trendUp color="#2196F3" />
        <KPICard label="Avg Margin" value={`${stats.avgMargin.toFixed(1)}%`}
          sub="เป้าหมาย 35%" icon={Percent}
          trend={stats.avgMargin >= 35 ? 'ผ่านเป้า' : 'ต่ำกว่าเป้า'} trendUp={stats.avgMargin >= 35} color="#9C27B0" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-card border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-primary">Revenue & Profit</h2>
              <p className="text-xs text-gray-400">6 เดือนล่าสุด (จากข้อมูลจริง)</p>
            </div>
            <Activity size={16} className="text-accent" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={tc.accent} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={tc.accent} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={tc.success} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={tc.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={tc.border} strokeOpacity={0.6} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Prompt', fill: tc.text }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tc.text }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
              <Tooltip content={<TooltipContent />} />
              <Area type="monotone" dataKey="revenue" name="ยอดขาย" stroke={tc.accent} fill="url(#revGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="profit" name="กำไร" stroke={tc.success} fill="url(#profitGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-primary">ประเภทงาน</h2>
              <p className="text-xs text-gray-400">จากข้อมูลจริง</p>
            </div>
            <BarChart3 size={16} className="text-accent" />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={byType} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                {byType.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [v, 'งาน']} contentStyle={{ fontFamily: 'Prompt', fontSize: 11, background: tc.cardBg, border: `1px solid ${tc.border}`, borderRadius: 8, color: tc.text }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {byType.map(p => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-gray-600">{p.name}</span>
                </div>
                <span className="font-medium">{p.value} งาน</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Projects + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Projects Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-primary">โปรเจกต์ล่าสุด</h2>
            <Link href="/projects" className="text-xs text-accent hover:underline flex items-center gap-1">
              ดูทั้งหมด <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full premium-table">
              <thead><tr>
                <th className="text-left">งาน</th>
                <th className="text-left hidden sm:table-cell">ลูกค้า</th>
                <th className="text-center">สถานะ</th>
                <th className="text-right">ราคา</th>
                <th className="text-right hidden sm:table-cell">Margin</th>
              </tr></thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                    ยังไม่มีโปรเจกต์ <Link href="/pricing" className="text-accent hover:underline">สร้างใหม่</Link>
                  </td></tr>
                ) : projects.map(p => {
                  const st = STATUS_CONFIG[p.status]
                  return (
                    <tr key={p.id} className="cursor-pointer hover:bg-accent/5 transition-colors"
                      onClick={() => router.push('/quotation')}>
                      <td className="font-medium text-primary max-w-[140px] truncate">{p.projectName}</td>
                      <td className="text-gray-500 hidden sm:table-cell">{p.customerName}</td>
                      <td className="text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ color: st.color, background: st.bg }}>{st.label}</span>
                      </td>
                      <td className="text-right font-medium">฿{(p.sellingPrice / 1000).toFixed(0)}k</td>
                      <td className="text-right hidden sm:table-cell">
                        <span className={`font-semibold text-xs ${p.margin >= 35 ? 'text-success' : p.margin >= 25 ? 'text-warning' : 'text-danger'}`}>
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
          <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-accent" />
              <h3 className="font-semibold text-primary text-sm">AI Alerts</h3>
            </div>
            <div className="space-y-2">
              {stats.lowStockCount > 0 && (
                <div className="flex items-start gap-2 p-2 bg-warning/8 rounded-lg">
                  <AlertTriangle size={13} className="text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700">{stats.lowStockCount} รายการ Stock ใกล้หมด</p>
                </div>
              )}
              {projects.filter(p => p.margin < 25).length > 0 && (
                <div className="flex items-start gap-2 p-2 bg-danger/8 rounded-lg">
                  <AlertTriangle size={13} className="text-danger flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700">{projects.filter(p => p.margin < 25).length} งาน Margin ต่ำกว่า 25%</p>
                </div>
              )}
              {projects.filter(p => p.status === 'INSTALLATION').length > 0 && (
                <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                  <Clock size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700">{projects.filter(p => p.status === 'INSTALLATION').length} งานกำลังติดตั้ง</p>
                </div>
              )}
              {stats.lowStockCount === 0 && projects.filter(p => p.margin < 25).length === 0 && (
                <div className="flex items-start gap-2 p-2 bg-success/8 rounded-lg">
                  <CheckCircle size={13} className="text-success flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700">ทุกอย่างอยู่ในเกณฑ์ดี</p>
                </div>
              )}
            </div>
          </div>

          {/* Stock Summary */}
          <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package size={15} className="text-accent" />
                <h3 className="font-semibold text-primary text-sm">Stock</h3>
              </div>
              <Link href="/stock" className="text-[10px] text-accent hover:underline">จัดการ</Link>
            </div>
            {stats.lowStockCount > 0 ? (
              <p className="text-sm text-warning font-medium">⚠️ ต่ำกว่าขั้นต่ำ {stats.lowStockCount} รายการ</p>
            ) : (
              <p className="text-sm text-success font-medium">✓ Stock ทั้งหมดปกติ</p>
            )}
          </div>

          {/* Quick Action */}
          <Link href="/pricing"
            className="block w-full gold-gradient text-primary font-semibold text-sm text-center py-3 rounded-xl hover:shadow-gold transition-all hover:scale-[1.02] active:scale-100">
            <div className="flex items-center justify-center gap-2">
              <Calculator size={16} />
              เริ่มคิดราคาใหม่
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
