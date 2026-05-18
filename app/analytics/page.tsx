'use client'
import { useState, useEffect } from 'react'
import { MdBarChart, MdTrendingUp, MdAttachMoney, MdTrackChanges, MdEmojiEvents, MdCalendarToday } from 'react-icons/md'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { getProjects, getStock } from '@/lib/storage'
import type { StoredProject } from '@/lib/storage'
import { PROJECT_TYPE_LABELS } from '@/lib/types'
import clsx from 'clsx'

// ── Live theme color hook ─────────────────────────────────────────────────────
function useThemeColors() {
  const [c, setC] = useState({ accent: '#C6A969', border: '#F0F0F0', text: '#6B7280', cardBg: '#FFFFFF' })
  useEffect(() => {
    const update = () => {
      const cs = getComputedStyle(document.documentElement)
      setC({
        accent:  cs.getPropertyValue('--color-accent').trim()     || '#C6A969',
        border:  cs.getPropertyValue('--theme-border').trim()     || '#F0F0F0',
        text:    cs.getPropertyValue('--theme-text-muted').trim() || '#6B7280',
        cardBg:  cs.getPropertyValue('--theme-card').trim()       || '#FFFFFF',
      })
    }
    update()
    const obs = new MutationObserver(() => { setTimeout(update, 0) })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] })
    return () => obs.disconnect()
  }, [])
  return c
}

const STATIC_COLORS = ['#4B5563','#00A86B','#FFB800','#E53935','#7C3AED','#0EA5E9']

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold text-primary">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const tc = useThemeColors()
  const [projects, setProjects] = useState<StoredProject[]>([])

  useEffect(() => { setProjects(getProjects()) }, [])

  const active = projects.filter(p => p.status !== 'CANCELLED')
  const revenue = active.reduce((s, p) => s + p.sellingPrice, 0)
  const profit = active.reduce((s, p) => s + (p.sellingPrice - p.netCost), 0)
  const avgMargin = active.length > 0 ? active.reduce((s, p) => s + p.margin, 0) / active.length : 0

  const byType = Object.entries(
    active.reduce<Record<string, { count: number; revenue: number }>>(
      (acc, p) => {
        const k = p.projectType
        if (!acc[k]) acc[k] = { count: 0, revenue: 0 }
        acc[k].count++
        acc[k].revenue += p.sellingPrice
        return acc
      }, {}
    )
  ).map(([type, d]) => ({
    name: PROJECT_TYPE_LABELS[type as keyof typeof PROJECT_TYPE_LABELS] ?? type,
    count: d.count,
    revenue: d.revenue,
  }))

  const byStatus = Object.entries(
    projects.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const marginBuckets = [
    { label: '<15% (เสี่ยง)',    count: active.filter(p => p.margin < 15).length,             fill: '#E53935' },
    { label: '15–25% (ต่ำ)',    count: active.filter(p => p.margin >= 15 && p.margin < 25).length, fill: '#FFB800' },
    { label: '25–35% (ดี)',     count: active.filter(p => p.margin >= 25 && p.margin < 35).length, fill: '#00A86B' },
    { label: '>35% (ยอดเยี่ยม)', count: active.filter(p => p.margin >= 35).length,             fill: tc.accent },
  ]

  const topProjects = [...active].sort((a, b) => b.sellingPrice - a.sellingPrice).slice(0, 5)

  const fmt = (v: number) => v.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 })
  const fmtK = (v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)

  // ── Quarterly data ────────────────────────────────────────────────────────
  const QUARTERS = [
    { id: 'Q1', label: 'Q1', months: 'ม.ค.–มี.ค.',  range: [0, 2]  },
    { id: 'Q2', label: 'Q2', months: 'เม.ย.–มิ.ย.', range: [3, 5]  },
    { id: 'Q3', label: 'Q3', months: 'ก.ค.–ก.ย.',   range: [6, 8]  },
    { id: 'Q4', label: 'Q4', months: 'ต.ค.–ธ.ค.',   range: [9, 11] },
  ]

  const currentYear = new Date().getFullYear()

  const quarterlyData = QUARTERS.map(q => {
    const qProjects = active.filter(p => {
      const d = new Date(p.createdAt)
      const m = d.getMonth()
      const y = d.getFullYear()
      return y === currentYear && m >= q.range[0] && m <= q.range[1]
    })
    const rev    = qProjects.reduce((s, p) => s + p.sellingPrice, 0)
    const cost   = qProjects.reduce((s, p) => s + p.netCost, 0)
    const profit = rev - cost
    const margin = qProjects.length > 0 ? qProjects.reduce((s, p) => s + p.margin, 0) / qProjects.length : 0
    return { name: q.id, months: q.months, count: qProjects.length, revenue: rev, cost, profit, margin }
  })

  const [qView, setQView] = useState<'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('all')

  const qFiltered = qView === 'all' ? active : active.filter(p => {
    const d = new Date(p.createdAt)
    const m = d.getMonth()
    const y = d.getFullYear()
    const q = QUARTERS.find(q => q.id === qView)!
    return y === currentYear && m >= q.range[0] && m <= q.range[1]
  })

  const qRevenue = qFiltered.reduce((s, p) => s + p.sellingPrice, 0)
  const qProfit  = qFiltered.reduce((s, p) => s + (p.sellingPrice - p.netCost), 0)
  const qMargin  = qFiltered.length > 0 ? qFiltered.reduce((s, p) => s + p.margin, 0) / qFiltered.length : 0

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <MdBarChart size={22} className="text-accent" /> วิเคราะห์ข้อมูล
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {qView === 'all' ? `ภาพรวมธุรกิจ ${active.length} โปรเจกต์` : `${qView} · ${QUARTERS.find(q=>q.id===qView)?.months} · ${qFiltered.length} โปรเจกต์`}
          </p>
        </div>

        {/* Quarter Filter */}
        <div className="flex items-center gap-1 bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-xl p-1">
          <button
            onClick={() => setQView('all')}
            className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              qView === 'all' ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-primary hover:bg-[var(--theme-hover)]'
            )}
          >
            <MdCalendarToday size={11} /> ทั้งปี
          </button>
          {QUARTERS.map(q => (
            <button key={q.id}
              onClick={() => setQView(q.id as typeof qView)}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                qView === q.id ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-primary hover:bg-[var(--theme-hover)]'
              )}
            >
              {q.id}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards — reflect selected quarter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="รายได้รวม"       value={fmt(qRevenue)} icon={MdAttachMoney} color="bg-accent/10 text-accent" />
        <StatCard label="กำไรรวม"         value={fmt(qProfit)}  icon={MdTrendingUp}  color="bg-success/10 text-success" />
        <StatCard label="Margin เฉลี่ย"   value={`${qMargin.toFixed(1)}%`} icon={MdTrackChanges}
          sub={qMargin >= 25 ? 'ดี' : qMargin >= 15 ? 'ต่ำ' : 'ต้องปรับปรุง'}
          color={qMargin >= 25 ? 'bg-success/10 text-success' : qMargin >= 15 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'} />
        <StatCard label="โปรเจกต์" value={String(qFiltered.length)} icon={MdEmojiEvents} color="bg-primary/10 text-primary" />
      </div>

      {/* Quarterly Overview Chart */}
      {active.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <p className="font-semibold text-primary text-sm mb-1 flex items-center gap-2">
            <MdCalendarToday size={14} className="text-accent" /> รายได้รายไตรมาส (ทั้งปี)
          </p>
          <p className="text-xs text-gray-400 mb-4">คลิกแถบด้านบนเพื่อกรองข้อมูล</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={quarterlyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={tc.border} strokeOpacity={0.6} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: tc.text, fontWeight: 600 }} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: tc.text }} />
              <Tooltip
                formatter={(v: number, name: string) => [fmt(v), name === 'revenue' ? 'รายได้' : 'กำไร']}
                contentStyle={{ background: tc.cardBg, border: `1px solid ${tc.border}`, borderRadius: 8, fontSize: 11 }}
              />
              <Legend formatter={(v) => v === 'revenue' ? 'รายได้' : 'กำไร'} />
              <Bar dataKey="revenue" name="revenue" fill={tc.accent} radius={[6,6,0,0]}
                onClick={(d) => setQView(d.name as typeof qView)} style={{ cursor: 'pointer' }}
              />
              <Bar dataKey="profit" name="profit" fill="#00A86B" radius={[6,6,0,0]}
                onClick={(d) => setQView(d.name as typeof qView)} style={{ cursor: 'pointer' }}
              />
            </BarChart>
          </ResponsiveContainer>
          {/* Q summary row */}
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-[var(--theme-border)]">
            {quarterlyData.map(q => (
              <button key={q.name}
                onClick={() => setQView(q.name as typeof qView)}
                className={clsx(
                  'text-center p-2 rounded-xl transition-all border',
                  qView === q.name ? 'border-accent bg-accent/10' : 'border-[var(--theme-border)] hover:bg-[var(--theme-hover)]'
                )}
              >
                <p className={clsx('text-xs font-bold', qView === q.name ? 'text-accent' : 'text-primary')}>{q.name}</p>
                <p className="text-[10px] text-muted">{q.months}</p>
                <p className="text-[11px] font-semibold text-primary mt-0.5">{fmtK(q.revenue)}</p>
                <p className="text-[9px] text-muted">{q.count} งาน</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <MdBarChart size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">ยังไม่มีข้อมูลสำหรับวิเคราะห์</p>
          <p className="text-sm text-gray-300 mt-1">สร้างโปรเจกต์จากหน้า คิดราคา เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <>
          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Revenue by Type */}
            <div className="glass-card rounded-2xl p-5">
              <p className="font-semibold text-primary text-sm mb-4">รายได้แยกตามประเภทงาน</p>
              {byType.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byType} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={tc.border} strokeOpacity={0.6} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: tc.text }} />
                    <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: tc.text }} />
                    <Tooltip formatter={(v: number) => fmt(v)} labelStyle={{ fontWeight: 600 }} contentStyle={{ background: tc.cardBg, border: `1px solid ${tc.border}`, borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="revenue" name="รายได้" fill={tc.accent} radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-300 text-sm">ไม่มีข้อมูล</div>
              )}
            </div>

            {/* Status Distribution */}
            <div className="glass-card rounded-2xl p-5">
              <p className="font-semibold text-primary text-sm mb-4">สัดส่วนสถานะโปรเจกต์</p>
              {byStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {byStatus.map((_, i) => <Cell key={i} fill={i === 0 ? tc.accent : STATIC_COLORS[i % STATIC_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: tc.cardBg, border: `1px solid ${tc.border}`, borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-300 text-sm">ไม่มีข้อมูล</div>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Margin Distribution */}
            <div className="glass-card rounded-2xl p-5">
              <p className="font-semibold text-primary text-sm mb-4">การกระจาย Margin</p>
              <div className="space-y-3">
                {marginBuckets.map(b => (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{b.label}</span>
                      <span className="font-semibold" style={{ color: b.fill }}>{b.count} งาน</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: active.length ? `${(b.count / active.length) * 100}%` : '0%', background: b.fill }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Projects */}
            <div className="glass-card rounded-2xl p-5">
              <p className="font-semibold text-primary text-sm mb-4">โปรเจกต์มูลค่าสูงสุด</p>
              <div className="space-y-3">
                {topProjects.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary truncate">{p.projectName}</p>
                      <p className="text-[10px] text-gray-400">{p.customerName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-primary">{fmt(p.sellingPrice)}</p>
                      <p className={clsx('text-[10px] font-semibold', p.margin >= 25 ? 'text-success' : p.margin >= 15 ? 'text-warning' : 'text-danger')}>
                        {p.margin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
                {topProjects.length === 0 && (
                  <p className="text-sm text-gray-300 text-center py-4">ไม่มีข้อมูล</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
