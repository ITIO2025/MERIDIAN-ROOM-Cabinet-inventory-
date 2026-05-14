'use client'
import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { getProjects } from '@/lib/storage'
import type { StoredProject } from '@/lib/storage'
import { PROJECT_TYPE_LABELS, STATUS_LABELS } from '@/lib/types'
import clsx from 'clsx'

export default function ProfitPage() {
  const [projects, setProjects] = useState<StoredProject[]>([])
  const [sortKey, setSortKey] = useState<'margin' | 'profit' | 'sellingPrice'>('margin')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => { setProjects(getProjects()) }, [])

  const active = projects.filter(p => p.status !== 'CANCELLED')

  const sorted = [...active].sort((a, b) => {
    const aVal = sortKey === 'profit' ? (a.sellingPrice - a.netCost) : a[sortKey]
    const bVal = sortKey === 'profit' ? (b.sellingPrice - b.netCost) : b[sortKey]
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal
  })

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const revenue = active.reduce((s, p) => s + p.sellingPrice, 0)
  const totalCost = active.reduce((s, p) => s + p.netCost, 0)
  const profit = revenue - totalCost
  const avgMargin = active.length > 0 ? active.reduce((s, p) => s + p.margin, 0) / active.length : 0

  const fmt = (v: number) => v.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 })

  const SortIcon = ({ k }: { k: typeof sortKey }) =>
    sortKey === k ? (sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />) : null

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <TrendingUp size={22} className="text-accent" /> กำไร & Margin
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">วิเคราะห์ความสามารถในการทำกำไรแต่ละโปรเจกต์</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'รายได้รวม',    value: fmt(revenue),     icon: DollarSign, color: 'bg-accent/10 text-accent' },
          { label: 'ต้นทุนรวม',    value: fmt(totalCost),   icon: TrendingUp, color: 'bg-gray-100 text-gray-600' },
          { label: 'กำไรสุทธิ',    value: fmt(profit),      icon: CheckCircle, color: profit >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger' },
          { label: 'Margin เฉลี่ย', value: `${avgMargin.toFixed(1)}%`, icon: AlertTriangle,
            color: avgMargin >= 25 ? 'bg-success/10 text-success' : avgMargin >= 15 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger' },
        ].map(c => (
          <div key={c.label} className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">{c.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.color}`}>
                <c.icon size={14} />
              </div>
            </div>
            <p className="text-xl font-bold text-primary">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Margin Progress Bars */}
      <div className="glass-card rounded-2xl p-5">
        <p className="font-semibold text-primary text-sm mb-4">สัดส่วน Margin ของพอร์ตโฟลิโอ</p>
        {active.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-4">ยังไม่มีข้อมูล</p>
        ) : (
          <div className="space-y-3">
            {[
              { label: 'Danger (<15%)',      min: 0,  max: 15, color: '#E53935' },
              { label: 'Low (15–25%)',       min: 15, max: 25, color: '#FFB800' },
              { label: 'Good (25–35%)',      min: 25, max: 35, color: '#00A86B' },
              { label: 'Premium (>35%)',     min: 35, max: 999, color: '#C6A969' },
            ].map(b => {
              const count = active.filter(p => p.margin >= b.min && p.margin < b.max).length
              return (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{b.label}</span>
                    <span className="font-semibold" style={{ color: b.color }}>{count} / {active.length} งาน ({active.length ? ((count/active.length)*100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: active.length ? `${(count/active.length)*100}%` : '0%', background: b.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <TrendingUp size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">ยังไม่มีโปรเจกต์</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">โปรเจกต์</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">ประเภท</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-primary"
                    onClick={() => toggleSort('sellingPrice')}>
                    <span className="flex items-center justify-end gap-1">ราคาขาย <SortIcon k="sellingPrice" /></span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell cursor-pointer hover:text-primary"
                    onClick={() => toggleSort('profit')}>
                    <span className="flex items-center justify-end gap-1">กำไร <SortIcon k="profit" /></span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-primary"
                    onClick={() => toggleSort('margin')}>
                    <span className="flex items-center justify-end gap-1">Margin <SortIcon k="margin" /></span>
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(p => {
                  const itemProfit = p.sellingPrice - p.netCost
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-primary">{p.projectName}</p>
                        <p className="text-xs text-gray-400">{p.customerName}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {PROJECT_TYPE_LABELS[p.projectType as keyof typeof PROJECT_TYPE_LABELS] ?? p.projectType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <p className="text-sm font-semibold text-primary">{fmt(p.sellingPrice)}</p>
                        <p className="text-xs text-gray-400">{fmt(p.netCost)} ต้นทุน</p>
                      </td>
                      <td className="px-4 py-3.5 text-right hidden md:table-cell">
                        <p className={clsx('text-sm font-semibold', itemProfit >= 0 ? 'text-success' : 'text-danger')}>
                          {fmt(itemProfit)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={clsx('text-sm font-bold', p.margin >= 25 ? 'text-success' : p.margin >= 15 ? 'text-warning' : 'text-danger')}>
                            {p.margin.toFixed(1)}%
                          </span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${Math.min(p.margin, 50) * 2}%`,
                                background: p.margin >= 25 ? '#00A86B' : p.margin >= 15 ? '#FFB800' : '#E53935' }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                        <span className="text-xs text-gray-500">{STATUS_LABELS[p.status]}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center">
            <p className="text-xs text-gray-400">{sorted.length} โปรเจกต์</p>
            <p className="text-xs font-semibold text-success hidden sm:block">กำไรรวม {fmt(profit)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
