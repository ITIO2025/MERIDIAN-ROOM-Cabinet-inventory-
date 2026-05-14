'use client'
import { useState, useEffect } from 'react'
import { FolderOpen, Plus, Search, Filter, MoreVertical, Trash2, Eye, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { getProjects, deleteProject, updateProjectStatus } from '@/lib/storage'
import type { StoredProject } from '@/lib/storage'
import { useToast } from '@/context/ToastContext'
import { STATUS_LABELS } from '@/lib/types'
import type { ProjectStatus } from '@/lib/types'
import { sendLine, lineStatusChange, getLinePrefs } from '@/lib/notify'
import clsx from 'clsx'

const STATUS_COLORS: Record<ProjectStatus, string> = {
  QUOTE:        'bg-blue-50 text-blue-700',
  CONFIRMED:    'bg-success/10 text-success',
  PRODUCTION:   'bg-warning/10 text-warning',
  INSTALLATION: 'bg-purple-50 text-purple-700',
  COMPLETED:    'bg-success/15 text-success font-semibold',
  CANCELLED:    'bg-danger/10 text-danger',
}

const STATUSES: ProjectStatus[] = ['QUOTE','CONFIRMED','PRODUCTION','INSTALLATION','COMPLETED','CANCELLED']

export default function ProjectsPage() {
  const { success } = useToast()
  const [projects, setProjects] = useState<StoredProject[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null)

  const load = () => setProjects(getProjects())
  useEffect(() => { load() }, [])

  const filtered = projects.filter(p => {
    const matchSearch = p.projectName.toLowerCase().includes(search.toLowerCase()) ||
                        p.customerName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleDelete = (id: string) => {
    deleteProject(id)
    load()
    setDeleteConfirm(null)
    setOpenMenu(null)
    success('ลบโปรเจกต์แล้ว')
  }

  const handleStatusChange = (id: string, status: ProjectStatus) => {
    const project = projects.find(p => p.id === id)
    const oldStatus = project?.status ?? 'QUOTE'
    updateProjectStatus(id, status)
    load()
    setStatusDropdown(null)
    success('อัปเดตสถานะแล้ว')
    // LINE Notify
    const prefs = getLinePrefs()
    if (prefs.statusChange && project) {
      const msg = lineStatusChange({ projectName: project.projectName, oldStatus, newStatus: status })
      sendLine(msg)
    }
  }

  const fmt = (v: number) => v.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 })

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <FolderOpen size={22} className="text-accent" /> โปรเจกต์ทั้งหมด
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{projects.length} โปรเจกต์ในระบบ</p>
        </div>
        <Link href="/pricing"
          className="flex items-center gap-2 px-4 py-2 gold-gradient text-primary text-sm font-semibold rounded-xl hover:shadow-gold transition-all">
          <Plus size={16} /> สร้างโปรเจกต์ใหม่
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อโปรเจกต์ หรือลูกค้า..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ProjectStatus | 'ALL')}
            className="pl-8 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 bg-white appearance-none cursor-pointer"
          >
            <option value="ALL">สถานะทั้งหมด</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <FolderOpen size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">ไม่พบโปรเจกต์</p>
          <p className="text-sm text-gray-300 mt-1">ลองค้นหาด้วยคำอื่น หรือสร้างโปรเจกต์ใหม่</p>
          <Link href="/pricing" className="inline-flex items-center gap-2 mt-4 px-4 py-2 gold-gradient text-primary text-sm font-semibold rounded-xl">
            <Plus size={14} /> สร้างโปรเจกต์
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
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Margin</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">สถานะ</th>
                  <th className="px-4 py-3 w-10" />
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
                      <p className="text-sm font-semibold text-primary">{fmt(p.sellingPrice)}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                      <span className={clsx('text-sm font-bold',
                        p.margin >= 25 ? 'text-success' : p.margin >= 15 ? 'text-warning' : 'text-danger')}>
                        {p.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setStatusDropdown(statusDropdown === p.id ? null : p.id)}
                          className={clsx('text-xs px-2.5 py-1 rounded-full flex items-center gap-1 whitespace-nowrap', STATUS_COLORS[p.status])}
                        >
                          {STATUS_LABELS[p.status]}
                          <ChevronDown size={10} />
                        </button>
                        {statusDropdown === p.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setStatusDropdown(null)} />
                            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 min-w-[140px]">
                              {STATUSES.map(s => (
                                <button key={s} onClick={() => handleStatusChange(p.id, s)}
                                  className={clsx('w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors',
                                    p.status === s ? 'font-semibold text-accent' : 'text-gray-700')}>
                                  {STATUS_LABELS[s]}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="relative flex justify-end">
                        <button
                          onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
                        >
                          <MoreVertical size={14} />
                        </button>
                        {openMenu === p.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 w-40">
                              <Link href="/pricing" onClick={() => setOpenMenu(null)}
                                className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                                <Eye size={12} /> ดูและแก้ไข
                              </Link>
                              <button
                                onClick={() => { setDeleteConfirm(p.id); setOpenMenu(null) }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/5 transition-colors">
                                <Trash2 size={12} /> ลบโปรเจกต์
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center">
            <p className="text-xs text-gray-400">แสดง {filtered.length} จาก {projects.length} รายการ</p>
            <p className="text-xs text-gray-400 hidden sm:block">
              รวม {fmt(filtered.reduce((s, p) => s + p.sellingPrice, 0))}
            </p>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="w-12 h-12 bg-danger/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-danger" />
            </div>
            <h3 className="text-base font-bold text-primary text-center">ยืนยันการลบ?</h3>
            <p className="text-sm text-gray-500 text-center mt-1">
              โปรเจกต์ &ldquo;{projects.find(p => p.id === deleteConfirm)?.projectName}&rdquo; จะถูกลบถาวร
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
