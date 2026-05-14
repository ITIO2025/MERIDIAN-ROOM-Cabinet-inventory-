'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Package, Plus, Search, Minus, Trash2, X, Save,
  AlertTriangle, TrendingDown, ImageIcon, Upload, Camera
} from 'lucide-react'
import { getStock, saveStockItem, adjustStock, deleteStockItem } from '@/lib/storage'
import type { StoredStockItem } from '@/lib/storage'
import { useToast } from '@/context/ToastContext'
import clsx from 'clsx'

const STATUS_COLORS = {
  OK:  'bg-success/10 text-success',
  LOW: 'bg-warning/10 text-warning',
  OUT: 'bg-danger/10 text-danger',
}
const STATUS_LABELS = { OK: 'ปกติ', LOW: 'ใกล้หมด', OUT: 'หมด' }

interface FormState {
  name: string
  category: string
  unit: string
  qty: number
  minQty: number
  unitCost: number
  supplier: string
  note: string
  imageUrl: string
}

const BLANK: FormState = {
  name: '', category: 'วัสดุหลัก', unit: 'แผ่น',
  qty: 0, minQty: 5, unitCost: 0,
  supplier: '', note: '', imageUrl: '',
}

const CATEGORIES = ['วัสดุหลัก', 'ผิวสัมผัส', 'Edge', 'อุปกรณ์', 'สี/เคลือบ', 'อื่นๆ']
const UNITS = ['แผ่น', 'ม้วน', 'ตัว', 'ชุด', 'กิโลกรัม', 'ลิตร', 'เมตร', 'ใบ']

// ── Resize image with canvas for storage efficiency ──────────────────────────
function resizeImage(file: File, maxPx = 600, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = ev => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let { width: w, height: h } = img
        if (w > maxPx || h > maxPx) {
          if (w >= h) { h = Math.round((h * maxPx) / w); w = maxPx }
          else { w = Math.round((w * maxPx) / h); h = maxPx }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = ev.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

// ── Image Upload Zone ────────────────────────────────────────────────────────
function ImageUploadZone({
  value, onChange
}: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const { error } = useToast()

  const process = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { error('กรุณาเลือกไฟล์รูปภาพ'); return }
    if (file.size > 10 * 1024 * 1024) { error('ไฟล์ใหญ่เกินไป (สูงสุด 10MB)'); return }
    const url = await resizeImage(file)
    onChange(url)
  }, [error, onChange])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) process(file)
  }, [process])

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        ภาพประกอบวัสดุ
      </label>

      {value ? (
        /* ── Preview ── */
        <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
          <img src={value} alt="material" className="w-full h-36 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button type="button" onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white/90 rounded-lg text-xs font-medium text-gray-700 flex items-center gap-1.5">
              <Camera size={12} /> เปลี่ยนรูป
            </button>
            <button type="button" onClick={() => onChange('')}
              className="px-3 py-1.5 bg-white/90 rounded-lg text-xs font-medium text-danger flex items-center gap-1.5">
              <X size={12} /> ลบรูป
            </button>
          </div>
        </div>
      ) : (
        /* ── Drop Zone ── */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={clsx(
            'w-full h-32 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer',
            dragging
              ? 'border-accent bg-accent/5 scale-[1.01]'
              : 'border-gray-200 hover:border-accent/50 hover:bg-gray-50'
          )}
        >
          <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
            dragging ? 'bg-accent/15' : 'bg-gray-100')}>
            <Upload size={16} className={dragging ? 'text-accent' : 'text-gray-400'} />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600">คลิกหรือลากรูปมาวาง</p>
            <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP · สูงสุด 10MB</p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) process(f) }}
      />
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function StockPage() {
  const { success, error } = useToast()
  const [items, setItems]         = useState<StoredStockItem[]>([])
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('ALL')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)
  const [form, setForm]           = useState<FormState>({ ...BLANK })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [adjustTarget, setAdjustTarget]   = useState<StoredStockItem | null>(null)
  const [adjustQty, setAdjustQty] = useState('')
  const [viewMode, setViewMode]   = useState<'table' | 'grid'>('table')

  const load = () => setItems(getStock())
  useEffect(() => { load() }, [])

  const cats = ['ALL', ...Array.from(new Set(items.map(i => i.category)))]

  const filtered = items.filter(i => {
    const q = search.toLowerCase()
    const matchQ = i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || (i.supplier ?? '').toLowerCase().includes(q)
    const matchC = catFilter === 'ALL' || i.category === catFilter
    return matchQ && matchC
  })

  const openAdd = () => { setForm({ ...BLANK }); setEditId(null); setShowModal(true) }
  const openEdit = (item: StoredStockItem) => {
    setForm({
      name: item.name, category: item.category, unit: item.unit,
      qty: item.qty, minQty: item.minQty, unitCost: item.unitCost,
      supplier: item.supplier ?? '', note: item.note ?? '', imageUrl: item.imageUrl ?? '',
    })
    setEditId(item.id)
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) { error('กรุณากรอกชื่อวัสดุ'); return }
    if (editId) {
      const existing = items.find(i => i.id === editId)!
      saveStockItem({ ...existing, ...form })
      success('อัปเดตข้อมูลวัสดุแล้ว')
    } else {
      saveStockItem({ status: 'OK', ...form })
      success('เพิ่มวัสดุใหม่แล้ว')
    }
    load(); setShowModal(false)
  }

  const handleAdjust = (delta: number) => {
    if (!adjustTarget) return
    const qty = parseInt(adjustQty)
    if (isNaN(qty) || qty <= 0) { error('กรอกจำนวนที่ถูกต้อง'); return }
    adjustStock(adjustTarget.id, delta > 0 ? qty : -qty)
    load(); setAdjustTarget(null); setAdjustQty('')
    success(`${delta > 0 ? 'รับเข้า' : 'เบิกออก'} ${qty} ${adjustTarget.unit} แล้ว`)
  }

  const handleDelete = (id: string) => {
    deleteStockItem(id); load(); setDeleteConfirm(null); success('ลบวัสดุแล้ว')
  }

  const fmt  = (v: number) => v.toLocaleString('th-TH', { maximumFractionDigits: 0 })
  const fmtB = (v: number) => v.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 })
  const lowCount = items.filter(i => i.status !== 'OK').length
  const totalValue = items.reduce((s, i) => s + i.qty * i.unitCost, 0)

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <Package size={22} className="text-accent" /> คลังวัสดุ
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {items.length} รายการ · มูลค่า {fmtB(totalValue)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('table')}
              className={clsx('px-3 py-2 text-xs font-medium transition-colors',
                viewMode === 'table' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}>
              ☰ ตาราง
            </button>
            <button onClick={() => setViewMode('grid')}
              className={clsx('px-3 py-2 text-xs font-medium transition-colors',
                viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}>
              ⊞ Grid
            </button>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 gold-gradient text-primary text-sm font-semibold rounded-xl hover:shadow-gold transition-all">
            <Plus size={16} /> เพิ่มวัสดุ
          </button>
        </div>
      </div>

      {/* ── Low Stock Alert ── */}
      {lowCount > 0 && (
        <div className="flex items-center gap-3 p-3.5 bg-warning/8 border border-warning/20 rounded-2xl">
          <AlertTriangle size={18} className="text-warning flex-shrink-0" />
          <p className="text-sm text-gray-700">
            มี <span className="font-bold text-warning">{lowCount}</span> รายการที่ Stock ต่ำกว่าเกณฑ์ ควรสั่งซื้อเพิ่ม
          </p>
        </div>
      )}

      {/* ── Search + Category Filter ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อวัสดุ หมวดหมู่ หรือผู้จัดจำหน่าย..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={clsx('px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap',
                catFilter === c
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-accent/40')}>
              {c === 'ALL' ? 'ทั้งหมด' : c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Empty State ── */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Package size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">ยังไม่มีวัสดุในคลัง</p>
          <button onClick={openAdd}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 gold-gradient text-primary text-sm font-semibold rounded-xl">
            <Plus size={14} /> เพิ่มวัสดุแรก
          </button>
        </div>
      ) : viewMode === 'grid' ? (

        /* ══ GRID VIEW ══════════════════════════════════════════════════════ */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(item => (
            <div key={item.id}
              className="glass-card rounded-2xl overflow-hidden group hover:shadow-card transition-all cursor-pointer"
              onClick={() => openEdit(item)}>
              {/* Image */}
              <div className="relative h-32 bg-gray-100">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={28} className="text-gray-300" />
                  </div>
                )}
                {/* Status badge */}
                <span className={clsx(
                  'absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                  STATUS_COLORS[item.status]
                )}>
                  {STATUS_LABELS[item.status]}
                </span>
              </div>
              {/* Info */}
              <div className="p-3">
                <p className="text-xs font-bold text-primary leading-tight line-clamp-2">{item.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{item.category}</p>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <p className={clsx('text-sm font-bold leading-tight',
                      item.status === 'OUT' ? 'text-danger' : item.status === 'LOW' ? 'text-warning' : 'text-primary')}>
                      {fmt(item.qty)}
                    </p>
                    <p className="text-[10px] text-gray-400">{item.unit}</p>
                  </div>
                  <p className="text-[10px] text-gray-500">{fmtB(item.unitCost)}/{item.unit}</p>
                </div>
                {/* Action row */}
                <div className="flex gap-1 mt-2.5" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setAdjustTarget(item); setAdjustQty('') }}
                    className="flex-1 py-1 text-[10px] font-medium rounded-lg bg-accent/8 text-accent hover:bg-accent/15 transition-colors">
                    ± ปรับ
                  </button>
                  <button onClick={() => setDeleteConfirm(item.id)}
                    className="p-1 rounded-lg hover:bg-danger/10 text-gray-400 hover:text-danger transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add new card */}
          <button onClick={openAdd}
            className="h-full min-h-[200px] rounded-2xl border-2 border-dashed border-gray-200 hover:border-accent/50 hover:bg-gray-50 flex flex-col items-center justify-center gap-2 transition-all text-gray-400 hover:text-accent">
            <Plus size={24} />
            <p className="text-xs font-medium">เพิ่มวัสดุ</p>
          </button>
        </div>

      ) : (

        /* ══ TABLE VIEW ═════════════════════════════════════════════════════ */
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-12">รูป</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">วัสดุ</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">หมวดหมู่</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">คงเหลือ</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">ราคา/หน่วย</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">สถานะ</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    {/* Thumbnail */}
                    <td className="px-3 py-2.5">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover cursor-pointer hover:scale-110 transition-transform shadow-sm"
                          onClick={() => openEdit(item)} />
                      ) : (
                        <button onClick={() => openEdit(item)}
                          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-accent/10 hover:text-accent text-gray-300 transition-colors"
                          title="เพิ่มรูป">
                          <ImageIcon size={14} />
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-sm font-semibold text-primary">{item.name}</p>
                      {item.supplier && <p className="text-xs text-gray-400 mt-0.5">{item.supplier}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{item.category}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <p className={clsx('text-sm font-bold',
                        item.status === 'OUT' ? 'text-danger' : item.status === 'LOW' ? 'text-warning' : 'text-primary')}>
                        {fmt(item.qty)}
                      </p>
                      <p className="text-xs text-gray-400">{item.unit}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right hidden md:table-cell">
                      <p className="text-sm text-gray-700">{fmtB(item.unitCost)}</p>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={clsx('text-xs px-2.5 py-1 rounded-full font-medium', STATUS_COLORS[item.status])}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setAdjustTarget(item); setAdjustQty('') }}
                          className="p-1.5 rounded-lg hover:bg-accent/10 text-gray-400 hover:text-accent transition-colors" title="ปรับจำนวน">
                          <TrendingDown size={13} />
                        </button>
                        <button onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors" title="แก้ไข">
                          <Plus size={13} />
                        </button>
                        <button onClick={() => setDeleteConfirm(item.id)}
                          className="p-1.5 rounded-lg hover:bg-danger/5 text-gray-400 hover:text-danger transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ ADJUST MODAL ════════════════════════════════════════════════════ */}
      {adjustTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {adjustTarget.imageUrl && (
                  <img src={adjustTarget.imageUrl} alt={adjustTarget.name}
                    className="w-10 h-10 rounded-xl object-cover" />
                )}
                <h3 className="font-bold text-primary text-sm">{adjustTarget.name}</h3>
              </div>
              <button onClick={() => setAdjustTarget(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              คงเหลือ: <span className="font-bold text-primary">{adjustTarget.qty} {adjustTarget.unit}</span>
            </p>
            <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)}
              placeholder="จำนวน..." min="1"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 mb-3" />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleAdjust(1)}
                className="py-2.5 bg-success/10 text-success rounded-xl text-sm font-semibold hover:bg-success/20 transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> รับเข้า
              </button>
              <button onClick={() => handleAdjust(-1)}
                className="py-2.5 bg-danger/10 text-danger rounded-xl text-sm font-semibold hover:bg-danger/20 transition-colors flex items-center justify-center gap-2">
                <Minus size={14} /> เบิกออก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ADD / EDIT MODAL ════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-scale-in overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-primary">{editId ? 'แก้ไขวัสดุ' : 'เพิ่มวัสดุใหม่'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* ── Image Upload ── */}
              <ImageUploadZone
                value={form.imageUrl}
                onChange={url => setForm(p => ({ ...p, imageUrl: url }))}
              />

              {/* ── Name ── */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">ชื่อวัสดุ *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="เช่น HMR 18mm, Laminate HPL White..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30" />
              </div>

              {/* ── Category + Unit ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">หมวดหมู่</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">หน่วย</label>
                  <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* ── Qty + MinQty + Cost ── */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">จำนวน</label>
                  <input type="number" value={form.qty} onChange={e => setForm(p => ({ ...p, qty: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">ขั้นต่ำ</label>
                  <input type="number" value={form.minQty} onChange={e => setForm(p => ({ ...p, minQty: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">ราคา/หน่วย (฿)</label>
                  <input type="number" value={form.unitCost} onChange={e => setForm(p => ({ ...p, unitCost: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
              </div>

              {/* ── Supplier ── */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">ผู้จัดจำหน่าย</label>
                <input value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))}
                  placeholder="เช่น PTG Wood, Hettich TH..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30" />
              </div>

              {/* ── Note ── */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">หมายเหตุ</label>
                <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                  rows={2} placeholder="บันทึกเพิ่มเติม สี รหัสสินค้า ฯลฯ"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none" />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 gold-gradient text-primary rounded-xl text-sm font-semibold hover:shadow-gold transition-all flex items-center justify-center gap-2">
                <Save size={14} /> {editId ? 'บันทึก' : 'เพิ่มวัสดุ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM ══════════════════════════════════════════════════ */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="w-12 h-12 bg-danger/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-danger" />
            </div>
            <h3 className="text-base font-bold text-primary text-center">ยืนยันการลบ?</h3>
            <p className="text-sm text-gray-500 text-center mt-1">
              &ldquo;{items.find(i => i.id === deleteConfirm)?.name}&rdquo; จะถูกลบออกจากคลัง
            </p>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                ยกเลิก
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-danger text-white rounded-xl text-sm font-semibold hover:bg-danger/90 transition-colors">
                ลบเลย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
