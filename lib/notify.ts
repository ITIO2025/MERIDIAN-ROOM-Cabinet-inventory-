// ─── LINE Messaging API + Google Sheets Sync Utility ─────────────────────────
// All functions are client-safe and use localStorage for config.

export interface LineNotifyPrefs {
  newProject:    boolean
  statusChange:  boolean
  lowStock:      boolean
  dailySummary:  boolean
}

const DEFAULT_PREFS: LineNotifyPrefs = {
  newProject:   true,
  statusChange: true,
  lowStock:     true,
  dailySummary: false,
}

// ── Getters ───────────────────────────────────────────────────────────────────

/** Channel Access Token จาก LINE Developers Console */
export function getLineToken(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('line_notify_token') ?? ''
}

/** LINE User ID หรือ Group ID สำหรับ push message (ถ้าว่างจะ broadcast) */
export function getLineUserId(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('line_user_id') ?? ''
}

export function getLinePrefs(): LineNotifyPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  const saved = localStorage.getItem('line_notify_prefs')
  return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS
}

export function getSheetsUrl(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('sheets_url') ?? ''
}

export function getSheetsKey(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('sheets_key') ?? ''
}

export function isSheetsAutoSync(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('sheets_autosync') === 'true'
}

// ── LINE Messaging API sender ─────────────────────────────────────────────────
// ถ้ามี userId → push  |  ถ้าไม่มี → broadcast ถึงทุก follower

export async function sendLine(message: string): Promise<boolean> {
  const token = getLineToken()
  if (!token) return false
  const userId = getLineUserId()
  try {
    const res = await fetch('/api/line-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId: userId || undefined, message }),
    })
    const data = await res.json()
    return data.ok === true
  } catch {
    return false
  }
}

// ── Formatted LINE messages ───────────────────────────────────────────────────

export function lineNewProject(opts: {
  projectName: string
  customerName: string
  projectType: string
  sellingPrice: number
  margin: number
}): string {
  const price = opts.sellingPrice.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 })
  return [
    '🏠 MERIDIAN ROOM',
    '━━━━━━━━━━━━━━━━━━━━',
    `📋 โปรเจกต์ใหม่: ${opts.projectName}`,
    `👤 ลูกค้า: ${opts.customerName}`,
    `🪵 ประเภท: ${opts.projectType}`,
    `💰 ราคา: ${price}`,
    `📊 Margin: ${opts.margin.toFixed(1)}%`,
    `📅 ${new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}`,
  ].join('\n')
}

export function lineStatusChange(opts: {
  projectName: string
  oldStatus: string
  newStatus: string
}): string {
  const statusEmoji: Record<string, string> = {
    QUOTE: '📝', CONFIRMED: '✅', PRODUCTION: '🔨',
    INSTALLATION: '🔧', COMPLETED: '🎉', CANCELLED: '❌',
  }
  const statusTh: Record<string, string> = {
    QUOTE: 'ใบเสนอราคา', CONFIRMED: 'ยืนยันแล้ว', PRODUCTION: 'กำลังผลิต',
    INSTALLATION: 'ติดตั้ง', COMPLETED: 'เสร็จสิ้น', CANCELLED: 'ยกเลิก',
  }
  const emoji = statusEmoji[opts.newStatus] ?? '🔄'
  return [
    '🏠 MERIDIAN ROOM',
    '━━━━━━━━━━━━━━━━━━━━',
    `${emoji} อัปเดตสถานะงาน`,
    `📋 ${opts.projectName}`,
    `📌 ${statusTh[opts.oldStatus] ?? opts.oldStatus} → ${statusTh[opts.newStatus] ?? opts.newStatus}`,
    `📅 ${new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}`,
  ].join('\n')
}

export function lineLowStock(items: { name: string; qty: number; unit: string }[]): string {
  const list = items.map(i => `  • ${i.name}: เหลือ ${i.qty} ${i.unit}`).join('\n')
  return [
    '🏠 MERIDIAN ROOM',
    '━━━━━━━━━━━━━━━━━━━━',
    `⚠️ Stock ใกล้หมด ${items.length} รายการ`,
    list,
    `📅 ${new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}`,
  ].join('\n')
}

// ── Google Sheets Sync ────────────────────────────────────────────────────────

export async function syncToSheets(action: string, payload: Record<string, unknown>): Promise<boolean> {
  const url = getSheetsUrl()
  const key = getSheetsKey()
  if (!url) return false
  try {
    const res = await fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, key, ...payload }),
    })
    const data = await res.json()
    return data.ok === true || data.status === 'ok'
  } catch {
    return false
  }
}

export async function syncProjectToSheets(project: Record<string, unknown>): Promise<boolean> {
  if (!isSheetsAutoSync()) return false
  return syncToSheets('saveProject', { project })
}
