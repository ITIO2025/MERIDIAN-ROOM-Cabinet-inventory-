'use client'
import { useState, useEffect } from 'react'
import { Warehouse, Clock, CheckCircle, AlertTriangle, Package } from 'lucide-react'
import { getProjects } from '@/lib/storage'
import type { StoredProject } from '@/lib/storage'
import { STATUS_LABELS } from '@/lib/types'
import clsx from 'clsx'
import Link from 'next/link'

const PRODUCTION_STATUSES = ['CONFIRMED', 'PRODUCTION', 'INSTALLATION'] as const

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED:    'bg-success/10 text-success',
  PRODUCTION:   'bg-warning/10 text-warning',
  INSTALLATION: 'bg-purple-50 text-purple-700',
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  CONFIRMED:    CheckCircle,
  PRODUCTION:   Clock,
  INSTALLATION: Warehouse,
}

export default function ProductionPage() {
  const [projects, setProjects] = useState<StoredProject[]>([])

  useEffect(() => { setProjects(getProjects()) }, [])

  const inProduction = projects.filter(p => (PRODUCTION_STATUSES as readonly string[]).includes(p.status))

  const byStatus = PRODUCTION_STATUSES.map(s => ({
    status: s,
    items: inProduction.filter(p => p.status === s),
  }))

  const fmt = (v: number) => v.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 })

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <Warehouse size={22} className="text-accent" /> การผลิต
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">{inProduction.length} งานในกระบวนการผลิตและติดตั้ง</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {byStatus.map(({ status, items }) => {
          const Icon = STATUS_ICONS[status]
          return (
            <div key={status} className="glass-card rounded-2xl p-4 text-center">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2', STATUS_COLORS[status])}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-primary">{items.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">{STATUS_LABELS[status]}</p>
            </div>
          )
        })}
      </div>

      {inProduction.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Warehouse size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">ไม่มีงานในกระบวนการผลิต</p>
          <p className="text-sm text-gray-300 mt-1">เปลี่ยนสถานะโปรเจกต์เป็น &ldquo;อนุมัติแล้ว&rdquo; เพื่อเริ่มกระบวนการผลิต</p>
          <Link href="/projects" className="inline-flex items-center gap-2 mt-4 px-4 py-2 border border-accent text-accent text-sm font-medium rounded-xl">
            ดูโปรเจกต์ทั้งหมด
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {byStatus.filter(b => b.items.length > 0).map(({ status, items }) => {
            const Icon = STATUS_ICONS[status]
            return (
              <div key={status}>
                <div className={clsx('flex items-center gap-2 mb-3 text-sm font-semibold', STATUS_COLORS[status].split(' ')[1])}>
                  <Icon size={15} />
                  <span>{STATUS_LABELS[status]} ({items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(p => (
                    <div key={p.id} className="glass-card rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-primary leading-tight">{p.projectName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{p.customerName}</p>
                        </div>
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full flex-shrink-0', STATUS_COLORS[p.status])}>
                          {STATUS_LABELS[p.status]}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-gray-300 uppercase tracking-wide">มูลค่า</p>
                          <p className="text-sm font-bold text-accent">{fmt(p.sellingPrice)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-300 uppercase tracking-wide">วันที่</p>
                          <p className="text-xs text-gray-600">{new Date(p.createdAt).toLocaleDateString('th-TH')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Materials Needed */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-accent" />
          <p className="font-semibold text-primary text-sm">วัสดุที่ต้องใช้ (ประมาณการ)</p>
        </div>
        {inProduction.length === 0 ? (
          <p className="text-sm text-gray-300">ไม่มีงานที่ต้องผลิต</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <AlertTriangle size={14} className="text-warning" />
              <p className="text-sm text-gray-600">
                มีงานรอผลิต <span className="font-bold text-primary">{inProduction.length}</span> โปรเจกต์
                คิดเป็นมูลค่ารวม <span className="font-bold text-accent">{fmt(inProduction.reduce((s, p) => s + p.sellingPrice, 0))}</span>
              </p>
            </div>
            <p className="text-xs text-gray-400 px-1">ตรวจสอบ BOQ แต่ละโปรเจกต์ในหน้าคิดราคาสำหรับรายการวัสดุโดยละเอียด</p>
          </div>
        )}
      </div>
    </div>
  )
}
