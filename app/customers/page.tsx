'use client'
import { useState, useEffect } from 'react'
import { Users, Plus, Search, Phone, MapPin, Trash2, Edit3, X, Save } from 'lucide-react'
import { getCustomers, saveCustomer, deleteCustomer } from '@/lib/storage'
import type { StoredCustomer } from '@/lib/storage'
import { useToast } from '@/context/ToastContext'

interface FormState { name: string; phone: string; email: string; address: string; note: string }
const BLANK: FormState = { name: '', phone: '', email: '', address: '', note: '' }

export default function CustomersPage() {
  const { success, error } = useToast()
  const [customers, setCustomers] = useState<StoredCustomer[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({ ...BLANK })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => setCustomers(getCustomers())
  useEffect(() => { load() }, [])

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setForm({ ...BLANK })
    setEditId(null)
    setShowModal(true)
  }

  const openEdit = (c: StoredCustomer) => {
    setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address, note: c.note ?? '' })
    setEditId(c.id)
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) { error('กรุณากรอกชื่อลูกค้า'); return }
    setSaving(true)
    try {
      if (editId) {
        const existing = customers.find(c => c.id === editId)!
        saveCustomer({ ...existing, name: form.name, phone: form.phone, email: form.email, address: form.address, note: form.note })
        success('อัปเดตข้อมูลลูกค้าแล้ว')
      } else {
        saveCustomer({ projectCount: 0, totalRevenue: 0, name: form.name, phone: form.phone, email: form.email, address: form.address, note: form.note })
        success('เพิ่มลูกค้าใหม่แล้ว')
      }
      load()
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    deleteCustomer(id)
    load()
    setDeleteConfirm(null)
    success('ลบลูกค้าแล้ว')
  }

  const fmt = (v: number) => v.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 })

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <Users size={22} className="text-accent" /> ลูกค้า
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{customers.length} รายการในระบบ</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 gold-gradient text-primary text-sm font-semibold rounded-xl hover:shadow-gold transition-all">
          <Plus size={16} /> เพิ่มลูกค้าใหม่
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ, เบอร์โทร, อีเมล..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white"
        />
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Users size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">ยังไม่มีลูกค้า</p>
          <button onClick={openAdd} className="inline-flex items-center gap-2 mt-4 px-4 py-2 gold-gradient text-primary text-sm font-semibold rounded-xl">
            <Plus size={14} /> เพิ่มลูกค้าแรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="glass-card rounded-2xl p-5 hover:shadow-card-hover transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-bold text-base">{c.name.charAt(0)}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors">
                    <Edit3 size={13} />
                  </button>
                  <button onClick={() => setDeleteConfirm(c.id)}
                    className="p-1.5 rounded-lg hover:bg-danger/5 text-gray-400 hover:text-danger transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <p className="font-semibold text-primary text-sm">{c.name}</p>
              {c.phone && (
                <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
                  <Phone size={11} className="text-gray-300" /> {c.phone}
                </p>
              )}
              {c.address && (
                <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                  <MapPin size={11} className="text-gray-300" /> {c.address}
                </p>
              )}
              {c.note && (
                <p className="text-xs text-gray-400 mt-2 italic leading-relaxed line-clamp-2">{c.note}</p>
              )}

              <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between">
                <div>
                  <p className="text-[10px] text-gray-300 uppercase tracking-wide">โปรเจกต์</p>
                  <p className="text-sm font-bold text-primary">{c.projectCount}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-300 uppercase tracking-wide">มูลค่ารวม</p>
                  <p className="text-sm font-bold text-accent">{fmt(c.totalRevenue)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-primary">{editId ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้าใหม่'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { key: 'name', label: 'ชื่อลูกค้า *', placeholder: 'คุณสมชาย ใจดี' },
                { key: 'phone', label: 'เบอร์โทร', placeholder: '081-234-5678' },
                { key: 'email', label: 'อีเมล', placeholder: 'customer@email.com' },
                { key: 'address', label: 'ที่อยู่', placeholder: 'เลขที่...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">หมายเหตุ</label>
                <textarea
                  value={form.note}
                  onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
                  rows={2}
                  placeholder="บันทึกเพิ่มเติม..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 gold-gradient text-primary rounded-xl text-sm font-semibold hover:shadow-gold transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                <Save size={14} /> {editId ? 'บันทึก' : 'เพิ่มลูกค้า'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="w-12 h-12 bg-danger/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-danger" />
            </div>
            <h3 className="text-base font-bold text-primary text-center">ยืนยันการลบ?</h3>
            <p className="text-sm text-gray-500 text-center mt-1">
              &ldquo;{customers.find(c => c.id === deleteConfirm)?.name}&rdquo; จะถูกลบออกจากระบบ
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
