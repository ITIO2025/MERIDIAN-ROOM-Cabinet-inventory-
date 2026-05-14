'use client'
import type { ProjectStatus } from './types'

// ─── Stored Models ────────────────────────────────────────────────────────────

export interface StoredProject {
  id: string
  projectName: string
  customerName: string
  projectType: string
  status: ProjectStatus
  sellingPrice: number
  netCost: number
  margin: number
  inputSnapshot: string
  createdAt: string
  updatedAt?: string
}

export interface StoredCustomer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  note?: string
  totalRevenue: number
  projectCount: number
  createdAt: string
}

export interface StoredStockItem {
  id: string
  name: string
  category: string
  unit: string
  qty: number
  minQty: number
  unitCost: number
  supplier?: string
  note?: string
  imageUrl?: string
  status: 'OK' | 'LOW' | 'OUT'
  createdAt: string
}

export interface StoredNotification {
  id: string
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER'
  title: string
  message: string
  read: boolean
  createdAt: string
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  PROJECTS:      'meridian_projects',
  CUSTOMERS:     'meridian_customers',
  STOCK:         'meridian_stock',
  NOTIFICATIONS: 'meridian_notifications',
} as const

// ─── Safe localStorage ────────────────────────────────────────────────────────

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// ─── ID Generator ─────────────────────────────────────────────────────────────

function genId(prefix: string, list: { id: string }[]): string {
  const max = list.reduce((m, i) => {
    const n = parseInt(i.id.replace(prefix, ''))
    return isNaN(n) ? m : Math.max(m, n)
  }, 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function getProjects(): StoredProject[] {
  return safeGet<StoredProject[]>(KEYS.PROJECTS, DEMO_PROJECTS)
}

export function getProjectById(id: string): StoredProject | null {
  return getProjects().find(p => p.id === id) ?? null
}

export function saveProject(project: Omit<StoredProject, 'id' | 'createdAt'> & Partial<Pick<StoredProject, 'id' | 'createdAt'>>): StoredProject {
  const list = getProjects()
  const now = new Date().toISOString()

  if (project.id) {
    const idx = list.findIndex(p => p.id === project.id)
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...project } as StoredProject
      safeSet(KEYS.PROJECTS, list)
      return list[idx]
    }
  }

  const newProject: StoredProject = {
    ...project,
    id: genId('P', list),
    createdAt: project.createdAt ?? now,
  } as StoredProject
  list.unshift(newProject)
  safeSet(KEYS.PROJECTS, list)
  return newProject
}

export function updateProjectStatus(id: string, status: ProjectStatus): void {
  const list = getProjects()
  const idx = list.findIndex(p => p.id === id)
  if (idx >= 0) {
    list[idx].status = status
    list[idx].updatedAt = new Date().toISOString()
    safeSet(KEYS.PROJECTS, list)
  }
}

export function deleteProject(id: string): void {
  safeSet(KEYS.PROJECTS, getProjects().filter(p => p.id !== id))
}

// ─── Customers ────────────────────────────────────────────────────────────────

export function getCustomers(): StoredCustomer[] {
  return safeGet<StoredCustomer[]>(KEYS.CUSTOMERS, DEMO_CUSTOMERS)
}

export function saveCustomer(c: Omit<StoredCustomer, 'id' | 'createdAt'> & Partial<Pick<StoredCustomer, 'id' | 'createdAt'>>): StoredCustomer {
  const list = getCustomers()
  const now = new Date().toISOString()

  if (c.id) {
    const idx = list.findIndex(x => x.id === c.id)
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...c }
      safeSet(KEYS.CUSTOMERS, list)
      return list[idx]
    }
  }
  const newC: StoredCustomer = { ...c, id: genId('C', list), createdAt: now } as StoredCustomer
  list.unshift(newC)
  safeSet(KEYS.CUSTOMERS, list)
  return newC
}

export function deleteCustomer(id: string): void {
  safeSet(KEYS.CUSTOMERS, getCustomers().filter(c => c.id !== id))
}

// ─── Stock ────────────────────────────────────────────────────────────────────

export function getStock(): StoredStockItem[] {
  return safeGet<StoredStockItem[]>(KEYS.STOCK, DEMO_STOCK)
}

export function saveStockItem(item: Omit<StoredStockItem, 'id' | 'createdAt'> & Partial<Pick<StoredStockItem, 'id' | 'createdAt'>>): StoredStockItem {
  const list = getStock()
  const now = new Date().toISOString()

  const computeStatus = (qty: number, minQty: number): StoredStockItem['status'] =>
    qty === 0 ? 'OUT' : qty < minQty ? 'LOW' : 'OK'

  if (item.id) {
    const idx = list.findIndex(x => x.id === item.id)
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item, status: computeStatus(item.qty, item.minQty) }
      safeSet(KEYS.STOCK, list)
      return list[idx]
    }
  }
  const newItem: StoredStockItem = {
    ...item,
    id: genId('S', list),
    status: computeStatus(item.qty, item.minQty),
    createdAt: now,
  } as StoredStockItem
  list.unshift(newItem)
  safeSet(KEYS.STOCK, list)
  return newItem
}

export function adjustStock(id: string, delta: number): void {
  const list = getStock()
  const idx = list.findIndex(x => x.id === id)
  if (idx >= 0) {
    const newQty = Math.max(0, list[idx].qty + delta)
    saveStockItem({ ...list[idx], qty: newQty })
  }
}

export function deleteStockItem(id: string): void {
  safeSet(KEYS.STOCK, getStock().filter(s => s.id !== id))
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function getNotifications(): StoredNotification[] {
  return safeGet<StoredNotification[]>(KEYS.NOTIFICATIONS, DEMO_NOTIFICATIONS)
}

export function addNotification(n: Omit<StoredNotification, 'id' | 'read' | 'createdAt'>): void {
  const list = getNotifications()
  list.unshift({ ...n, id: genId('N', list), read: false, createdAt: new Date().toISOString() })
  safeSet(KEYS.NOTIFICATIONS, list.slice(0, 50)) // max 50 notifications
}

export function markAllRead(): void {
  safeSet(KEYS.NOTIFICATIONS, getNotifications().map(n => ({ ...n, read: true })))
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function getDashboardStats() {
  const projects = getProjects()
  const billable = projects.filter(p => p.status !== 'CANCELLED')
  const active = projects.filter(p => !['CANCELLED', 'COMPLETED'].includes(p.status))
  const completed = projects.filter(p => p.status === 'COMPLETED')
  const revenue = billable.reduce((s, p) => s + p.sellingPrice, 0)
  const profit = billable.reduce((s, p) => s + (p.sellingPrice - p.netCost), 0)
  const avgMargin = billable.length > 0
    ? billable.reduce((s, p) => s + p.margin, 0) / billable.length
    : 0
  const lowStockCount = getStock().filter(s => s.status === 'LOW' || s.status === 'OUT').length
  const unreadNoti = getNotifications().filter(n => !n.read).length
  return { totalProjects: projects.length, activeProjects: active.length, completedProjects: completed.length, revenue, profit, avgMargin, lowStockCount, unreadNoti }
}

// ─── Demo Seed Data ───────────────────────────────────────────────────────────

const DEMO_PROJECTS: StoredProject[] = [
  { id: 'P001', projectName: 'ตู้เสื้อผ้าห้องนอนหลัก', customerName: 'คุณสมชาย วงศ์สุวรรณ', projectType: 'WARDROBE', status: 'PRODUCTION', sellingPrice: 85000, netCost: 55900, margin: 34.2, inputSnapshot: '{}', createdAt: '2026-04-15T09:00:00.000Z' },
  { id: 'P002', projectName: 'ครัว Island Kitchen', customerName: 'คุณวิไล ทรัพย์มาก', projectType: 'KITCHEN', status: 'CONFIRMED', sellingPrice: 220000, netCost: 135200, margin: 38.5, inputSnapshot: '{}', createdAt: '2026-04-20T09:00:00.000Z' },
  { id: 'P003', projectName: 'Walk-in Closet Luxury', customerName: 'คุณประภา รุ่งเรือง', projectType: 'WALK_IN', status: 'QUOTE', sellingPrice: 380000, netCost: 219800, margin: 42.1, inputSnapshot: '{}', createdAt: '2026-05-01T09:00:00.000Z' },
  { id: 'P004', projectName: 'ตู้ TV + Display Cabinet', customerName: 'คุณนิพนธ์ มั่นคง', projectType: 'TV_CABINET', status: 'INSTALLATION', sellingPrice: 65000, netCost: 44300, margin: 31.8, inputSnapshot: '{}', createdAt: '2026-03-28T09:00:00.000Z' },
  { id: 'P005', projectName: 'Pantry + Counter Bar', customerName: 'คุณสุภา ดีใจ', projectType: 'PANTRY', status: 'COMPLETED', sellingPrice: 145000, netCost: 91500, margin: 36.9, inputSnapshot: '{}', createdAt: '2026-03-10T09:00:00.000Z' },
]

const DEMO_CUSTOMERS: StoredCustomer[] = [
  { id: 'C001', name: 'คุณสมชาย วงศ์สุวรรณ', phone: '089-111-1111', email: 'somchai@email.com', address: 'กรุงเทพฯ', totalRevenue: 285000, projectCount: 3, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'C002', name: 'คุณวิไล ทรัพย์มาก', phone: '089-222-2222', email: 'wilai@email.com', address: 'กรุงเทพฯ', totalRevenue: 365000, projectCount: 2, createdAt: '2026-01-15T00:00:00.000Z' },
  { id: 'C003', name: 'คุณประภา รุ่งเรือง', phone: '089-333-3333', email: 'prapa@email.com', address: 'กรุงเทพฯ', totalRevenue: 380000, projectCount: 1, createdAt: '2026-02-01T00:00:00.000Z' },
  { id: 'C004', name: 'คุณนิพนธ์ มั่นคง', phone: '089-444-4444', email: 'nipon@email.com', address: 'นนทบุรี', totalRevenue: 65000, projectCount: 1, createdAt: '2026-02-15T00:00:00.000Z' },
  { id: 'C005', name: 'คุณสุภา ดีใจ', phone: '089-555-5555', email: 'supa@email.com', address: 'ปทุมธานี', totalRevenue: 195000, projectCount: 2, createdAt: '2026-03-01T00:00:00.000Z' },
]

const NOW = new Date().toISOString()
const DEMO_STOCK: StoredStockItem[] = [
  { id: 'S001', name: 'HMR 18mm', category: 'วัสดุหลัก', unit: 'แผ่น', qty: 24, minQty: 20, unitCost: 530, supplier: 'PTG Wood', status: 'OK', createdAt: NOW },
  { id: 'S002', name: 'MDF 18mm', category: 'วัสดุหลัก', unit: 'แผ่น', qty: 8, minQty: 15, unitCost: 330, supplier: 'PTG Wood', status: 'LOW', createdAt: NOW },
  { id: 'S003', name: 'HMR 9mm', category: 'วัสดุหลัก', unit: 'แผ่น', qty: 30, minQty: 20, unitCost: 270, supplier: 'PTG Wood', status: 'OK', createdAt: NOW },
  { id: 'S004', name: 'Plywood 18mm', category: 'วัสดุหลัก', unit: 'แผ่น', qty: 5, minQty: 10, unitCost: 730, supplier: 'Thai Ply', status: 'LOW', createdAt: NOW },
  { id: 'S005', name: 'Laminate HPL White', category: 'ผิวสัมผัส', unit: 'ม้วน', qty: 3, minQty: 5, unitCost: 2800, supplier: 'Formica', status: 'LOW', createdAt: NOW },
  { id: 'S006', name: 'PVC Edge 2mm White', category: 'Edge', unit: 'ม้วน', qty: 12, minQty: 5, unitCost: 450, supplier: 'Edge King', status: 'OK', createdAt: NOW },
  { id: 'S007', name: 'Hettich Hinge Soft Close', category: 'อุปกรณ์', unit: 'ตัว', qty: 180, minQty: 100, unitCost: 110, supplier: 'Hettich TH', status: 'OK', createdAt: NOW },
  { id: 'S008', name: 'Blum Drawer Slide 500', category: 'อุปกรณ์', unit: 'ชุด', qty: 20, minQty: 30, unitCost: 780, supplier: 'Blum TH', status: 'LOW', createdAt: NOW },
]

const DEMO_NOTIFICATIONS: StoredNotification[] = [
  { id: 'N001', type: 'WARNING', title: 'Stock ต่ำ', message: 'MDF 18mm เหลือ 8 แผ่น (ขั้นต่ำ 15)', read: false, createdAt: new Date().toISOString() },
  { id: 'N002', type: 'INFO', title: 'โปรเจกต์ใหม่', message: 'Walk-in Closet Luxury รอยืนยัน', read: false, createdAt: new Date().toISOString() },
  { id: 'N003', type: 'SUCCESS', title: 'งานเสร็จสิ้น', message: 'Pantry + Counter Bar ส่งมอบแล้ว', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
]
