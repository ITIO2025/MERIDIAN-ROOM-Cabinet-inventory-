'use client'
import { useState, useEffect } from 'react'
import {
  FileText, Download, Printer, Search, Plus, ChevronRight,
  CheckCircle, MapPin, Phone, Building2, Filter, ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import { getProjects, getStock } from '@/lib/storage'
import type { StoredProject, StoredStockItem } from '@/lib/storage'
import { formatCurrency } from '@/lib/pricing-engine'
import { STATUS_LABELS } from '@/lib/types'
import type { ProjectStatus } from '@/lib/types'
import clsx from 'clsx'

const STATUS_COLORS: Record<ProjectStatus, string> = {
  QUOTE:        'bg-blue-50 text-blue-700',
  CONFIRMED:    'bg-success/10 text-success',
  PRODUCTION:   'bg-warning/10 text-warning',
  INSTALLATION: 'bg-purple-50 text-purple-700',
  COMPLETED:    'bg-success/15 text-success',
  CANCELLED:    'bg-danger/10 text-danger',
}

function QuotationPreview({ project }: { project: StoredProject }) {
  const now = new Date()
  const validUntil = new Date(now)
  validUntil.setDate(validUntil.getDate() + 30)

  const dateStr = (d: Date) => d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  const qNum = `QUO-${project.id}`

  // Load company info from localStorage
  const [company, setCompany] = useState({ name: 'MERIDIAN ROOM', taxId: '', phone: '', address: '' })
  const [logoUrl, setLogoUrl] = useState('')
  // Load stock items with images
  const [stockItems, setStockItems] = useState<StoredStockItem[]>([])

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('company_info') : null
    if (saved) setCompany(JSON.parse(saved))
    setLogoUrl(typeof window !== 'undefined' ? (localStorage.getItem('company_logo') ?? '') : '')
    setStockItems(getStock().filter(s => s.imageUrl))

    const onLogoUpdate = () => setLogoUrl(localStorage.getItem('company_logo') ?? '')
    window.addEventListener('company-logo-updated', onLogoUpdate)
    return () => window.removeEventListener('company-logo-updated', onLogoUpdate)
  }, [])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-5 no-print">
        <button onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
          <Printer size={15} /> พิมพ์
        </button>
        <Link href="/pricing"
          className="flex items-center gap-2 px-4 py-2 gold-gradient text-primary text-sm font-semibold rounded-xl hover:shadow-gold transition-all">
          <Download size={15} /> คิดราคาใหม่ + Export PDF
        </Link>
      </div>

      {/* Document */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden" id="quotation-doc">
        {/* Header */}
        <div className="bg-primary px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {/* Company Logo */}
                {logoUrl ? (
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img src={logoUrl} alt="logo" className="w-full h-full object-contain p-1" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-lg">M</span>
                  </div>
                )}
                <div>
                  <p className="font-bold text-white text-lg leading-tight">{company.name || 'MERIDIAN ROOM'}</p>
                  <p className="text-accent text-xs tracking-widest">SMART BUILT-IN</p>
                </div>
              </div>
              <div className="text-white/50 text-xs space-y-0.5 mt-3">
                {company.address && <p className="flex items-center gap-1.5"><MapPin size={10} /> {company.address}</p>}
                {company.phone && <p className="flex items-center gap-1.5"><Phone size={10} /> {company.phone}</p>}
                {company.taxId && <p className="flex items-center gap-1.5"><Building2 size={10} /> เลขผู้เสียภาษี {company.taxId}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-accent font-bold text-2xl mb-1">ใบเสนอราคา</p>
              <p className="text-white/70 text-sm font-medium">{qNum}</p>
              <div className="mt-3 text-xs text-white/50 space-y-0.5">
                <p>วันที่ออก: <span className="text-white/80">{dateStr(now)}</span></p>
                <p>ใช้ได้ถึง: <span className="text-white/80">{dateStr(validUntil)}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Customer + Project */}
          <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-100">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">เสนอราคาแก่</p>
              <p className="font-bold text-primary text-base">{project.customerName}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">โปรเจกต์</p>
              <p className="font-semibold text-primary">{project.projectName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{project.projectType}</p>
            </div>
          </div>

          {/* Summary Table */}
          <table className="w-full mb-6">
            <thead>
              <tr className="bg-primary">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-accent uppercase tracking-wider">รายการ</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-accent uppercase tracking-wider w-32">ต้นทุน</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-accent uppercase tracking-wider w-32">ราคาขาย</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-3 py-3">
                  <p className="text-sm font-semibold text-primary">{project.projectName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">ประเภท: {project.projectType}</p>
                </td>
                <td className="px-3 py-3 text-right text-sm text-gray-500">{formatCurrency(project.netCost)}</td>
                <td className="px-3 py-3 text-right text-sm font-bold text-primary">{formatCurrency(project.sellingPrice)}</td>
              </tr>
            </tbody>
          </table>

          {/* Price Summary */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>ต้นทุนสุทธิ</span>
                <span>{formatCurrency(project.netCost)}</span>
              </div>
              <div className="flex justify-between text-sm text-success">
                <span>กำไรรวม (Margin {project.margin.toFixed(1)}%)</span>
                <span>+{formatCurrency(project.sellingPrice - project.netCost)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-primary">
                <span className="font-bold text-primary">ยอดรวมสุทธิ</span>
                <span className="font-bold text-accent text-lg">{formatCurrency(project.sellingPrice)}</span>
              </div>
            </div>
          </div>

          {/* ── Materials Gallery ── */}
          {stockItems.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
                <ImageIcon size={11} /> วัสดุและส่วนประกอบ
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {stockItems.map(item => (
                  <div key={item.id} className="rounded-xl overflow-hidden border border-gray-100">
                    <div className="relative h-20">
                      <img src={item.imageUrl!} alt={item.name}
                        className="w-full h-full object-cover" />
                    </div>
                    <div className="px-2 py-1.5 bg-gray-50">
                      <p className="text-[9px] font-semibold text-primary leading-tight truncate">{item.name}</p>
                      <p className="text-[8px] text-gray-400 mt-0.5">{item.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">เงื่อนไขและหมายเหตุ</p>
            <ul className="space-y-1.5">
              {[
                'ราคานี้มีอายุ 30 วัน นับจากวันที่ออกใบเสนอราคา',
                'ราคารวมค่าวัสดุ ค่าแรงผลิต และค่าติดตั้งตามที่ระบุ',
                'ชำระเงิน 50% ก่อนเริ่มงาน / 40% ก่อนส่งมอบ / 10% หลังติดตั้งเสร็จ',
                'กำหนดแล้วเสร็จภายใน 30-45 วันทำการหลังยืนยัน',
              ].map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <CheckCircle size={11} className="text-accent flex-shrink-0 mt-0.5" />
                  {note}
                </li>
              ))}
            </ul>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-100">
            {['ลายเซ็นผู้เสนอราคา', 'ลายเซ็นผู้อนุมัติ'].map(label => (
              <div key={label} className="text-center">
                <div className="h-16 border-b border-dashed border-gray-300 mb-2" />
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label === 'ลายเซ็นผู้เสนอราคา' ? (company.name || 'MERIDIAN ROOM') : 'ลูกค้า'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 1cm; size: A4 portrait; }
        }
      `}</style>
    </div>
  )
}

export default function QuotationPage() {
  const [projects, setProjects] = useState<StoredProject[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<StoredProject | null>(null)
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL')

  useEffect(() => { setProjects(getProjects()) }, [])

  const filtered = projects.filter(p => {
    const matchSearch = p.projectName.toLowerCase().includes(search.toLowerCase()) ||
                        p.customerName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  if (selected) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-3 mb-5 no-print">
          <button onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors">
            ← กลับ
          </button>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-sm font-semibold text-primary">{selected.projectName}</span>
        </div>
        <QuotationPreview project={selected} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <FileText size={22} className="text-accent" /> ใบเสนอราคา
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">เลือกโปรเจกต์เพื่อดูและพิมพ์ใบเสนอราคา</p>
        </div>
        <Link href="/pricing"
          className="flex items-center gap-2 px-4 py-2 gold-gradient text-primary text-sm font-semibold rounded-xl hover:shadow-gold transition-all">
          <Plus size={16} /> คิดราคาและสร้างใบใหม่
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อโปรเจกต์ หรือลูกค้า..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white" />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ProjectStatus | 'ALL')}
            className="pl-8 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white appearance-none cursor-pointer">
            <option value="ALL">ทุกสถานะ</option>
            {(['QUOTE','CONFIRMED','PRODUCTION','INSTALLATION','COMPLETED','CANCELLED'] as ProjectStatus[]).map(s =>
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            )}
          </select>
        </div>
      </div>

      {/* Project List */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <FileText size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">ไม่มีใบเสนอราคา</p>
          <p className="text-sm text-gray-300 mt-1">คิดราคาในหน้า "คิดราคา" แล้วกด "บันทึก" เพื่อเพิ่มโปรเจกต์</p>
          <Link href="/pricing" className="inline-flex items-center gap-2 mt-4 px-4 py-2 gold-gradient text-primary text-sm font-semibold rounded-xl">
            <Plus size={14} /> เริ่มคิดราคา
          </Link>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">โปรเจกต์</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">ลูกค้า</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">ราคาขาย</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">สถานะ</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">ใบเสนอราคา</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-primary leading-tight">{p.projectName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.id} · {new Date(p.createdAt).toLocaleDateString('th-TH')}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <p className="text-sm text-gray-700">{p.customerName}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right hidden md:table-cell">
                      <p className="text-sm font-semibold text-primary">{formatCurrency(p.sellingPrice)}</p>
                      <p className={clsx('text-xs font-medium', p.margin >= 25 ? 'text-success' : p.margin >= 15 ? 'text-warning' : 'text-danger')}>
                        Margin {p.margin.toFixed(1)}%
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', STATUS_COLORS[p.status])}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button onClick={() => setSelected(p)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-accent/30 text-accent rounded-lg hover:bg-accent/5 transition-colors ml-auto">
                        <FileText size={12} /> ดูใบเสนอราคา
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/30">
            <p className="text-xs text-gray-400">{filtered.length} รายการ</p>
          </div>
        </div>
      )}
    </div>
  )
}
