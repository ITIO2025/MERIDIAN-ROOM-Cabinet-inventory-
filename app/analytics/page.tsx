'use client'
import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Target, Award } from 'lucide-react'
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <BarChart3 size={22} className="text-accent" /> วิเคราะห์ข้อมูล
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">ภาพรวมธุรกิจจาก {active.length} โปรเจกต์ที่ใช้งาน</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="รายได้รวม" value={fmt(revenue)} icon={DollarSign} color="bg-accent/10 text-accent" />
        <StatCard label="กำไรรวม"  value={fmt(profit)}  icon={TrendingUp}  color="bg-success/10 text-success" />
        <StatCard label="Margin เฉลี่ย" value={`${avgMargin.toFixed(1)}%`} icon={Target}
          sub={avgMargin >= 25 ? 'ดี' : avgMargin >= 15 ? 'ต่ำ' : 'ต้องปรับปรุง'}
          color={avgMargin >= 25 ? 'bg-success/10 text-success' : avgMargin >= 15 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'} />
        <StatCard label="โปรเจกต์ทั้งหมด" value={String(active.length)} icon={Award} color="bg-primary/10 text-primary" />
      </div>

      {projects.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <BarChart3 size={48} className="text-gray-200 mx-auto mb-4" />
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
