'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Settings, Link2, CheckCircle, XCircle, Loader2, Save,
  Database, Bell, Shield, Palette, Upload, X, Camera,
  MessageCircle, Copy, ExternalLink, Zap, RefreshCw,
  Package, ChevronDown, ChevronUp, DollarSign, RotateCcw
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useSession } from 'next-auth/react'
import { ROLE_LABELS } from '@/lib/auth-users'
import type { UserRole } from '@/types/next-auth'
import { getStock } from '@/lib/storage'
import {
  SURFACE_PRICES, EDGE_PRICES, LABOR_RATES, INSTALLATION_RATES,
  savePriceOverrides, resetPriceOverrides,
} from '@/lib/data'

// ── LINE Notify prefs ─────────────────────────────────────────────────────────
interface LinePrefs { newProject: boolean; statusChange: boolean; lowStock: boolean }

// ── Resize helper ─────────────────────────────────────────────────────────────
function resizeImage(file: File, maxPx = 400, quality = 0.9, fmt = 'image/png'): Promise<string> {
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
        resolve(canvas.toDataURL(fmt, quality))
      }
      img.src = ev.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

// ── Logo Upload Zone ──────────────────────────────────────────────────────────
function LogoUploadZone({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const { error } = useToast()

  const process = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { error('กรุณาเลือกไฟล์รูปภาพ'); return }
    if (file.size > 10 * 1024 * 1024) { error('ไฟล์ใหญ่เกินไป (สูงสุด 10MB)'); return }
    const fmt = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const url = await resizeImage(file, 400, 0.9, fmt)
    onChange(url)
  }, [error, onChange])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]; if (file) process(file)
  }, [process])

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">โลโก้บริษัท</label>
      {value ? (
        <div className="flex items-start gap-4">
          <div className="relative group w-32 h-20 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center flex-shrink-0">
            <img src={value} alt="logo" className="max-w-full max-h-full object-contain p-2" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
              <button type="button" onClick={() => inputRef.current?.click()} className="p-1.5 bg-white/90 rounded-lg text-xs text-gray-700"><Camera size={13} /></button>
              <button type="button" onClick={() => onChange('')} className="p-1.5 bg-white/90 rounded-lg text-xs text-danger"><X size={13} /></button>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-success flex items-center gap-1.5"><CheckCircle size={14} /> อัปโหลดโลโก้แล้ว</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">แสดงใน Sidebar · ใบเสนอราคา · เอกสารทั้งหมด</p>
            <button type="button" onClick={() => inputRef.current?.click()} className="mt-2 text-xs text-accent hover:underline flex items-center gap-1"><Camera size={11} /> เปลี่ยนโลโก้</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)} onDrop={onDrop}
          className={`w-full h-24 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${dragging ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-accent/50 hover:bg-gray-50'}`}>
          <Upload size={18} className={dragging ? 'text-accent' : 'text-gray-400'} />
          <p className="text-xs text-gray-500">คลิกหรือลากโลโก้มาวาง · PNG แนะนำ · สูงสุด 10MB</p>
        </button>
      )}
      {value && (
        <div className="mt-2 rounded-xl bg-primary px-3 py-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
            <img src={value} alt="preview" className="max-w-full max-h-full object-contain" />
          </div>
          <p className="text-xs text-white/60">ตัวอย่างใน Sidebar (พื้นดำ)</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) process(f) }} />
    </div>
  )
}

// ── Apps Script Code constant ─────────────────────────────────────────────────
const APPS_SCRIPT_CODE = `// MERIDIAN ROOM AI — Google Apps Script v2.0
// Deploy as Web app: Execute as Me | Access: Anyone

const API_KEY = 'meridian-api-key-2026'

function doGet(e) {
  if (e.parameter.action === 'health')
    return json({ ok: true, message: 'Connected!' })
  return json({ error: 'Unknown action' })
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents)
  if (data.key !== API_KEY) return json({ error: 'Unauthorized' })
  if (data.action === 'saveProject')  return json(saveProject(data.project))
  if (data.action === 'syncStock')    return json(syncStock(data.items))
  return json({ error: 'Unknown: ' + data.action })
}

function saveProject(p) {
  const sheet = getSheet('Projects', ['ID','ชื่อ','ลูกค้า','ประเภท','สถานะ','ราคา','ต้นทุน','Margin'])
  sheet.appendRow([p.id,p.projectName,p.customerName,p.projectType,p.status,p.sellingPrice,p.netCost,p.margin])
  return { ok: true }
}

function syncStock(items) {
  const sheet = getSheet('Stock', ['ID','ชื่อ','หมวด','หน่วย','จำนวน','ราคา/หน่วย','สถานะ'])
  const last = sheet.getLastRow()
  if (last > 1) sheet.getRange(2,1,last-1,7).clearContent()
  items.forEach(function(i){ sheet.appendRow([i.id,i.name,i.category,i.unit,i.qty,i.unitCost,i.status]) })
  return { ok: true, synced: items.length }
}

function getSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var s  = ss.getSheetByName(name)
  if (!s) { s = ss.insertSheet(name); s.appendRow(headers) }
  return s
}

function json(d) {
  return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON)
}`

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

type Section = 'ทั่วไป' | 'ราคาวัสดุ' | 'Google Sheets' | 'LINE OA' | 'การแจ้งเตือน' | 'บัญชีผู้ใช้'
const SECTIONS: Section[] = ['ทั่วไป', 'ราคาวัสดุ', 'Google Sheets', 'LINE OA', 'การแจ้งเตือน', 'บัญชีผู้ใช้']

interface SheetsCfg { id: string; url: string; key: string }

export default function SettingsPage() {
  const { success, error } = useToast()
  const { data: session }  = useSession()
  const [section, setSection] = useState<Section>('ทั่วไป')

  // General
  const [company, setCompany] = useState({ name: 'MERIDIAN ROOM', taxId: '', phone: '', address: '' })
  const [logoUrl, setLogoUrl] = useState('')

  // Google Sheets
  const [sheets, setSheets]     = useState<SheetsCfg>({ id: '', url: '', key: 'meridian-api-key-2026' })
  const [autoSync, setAutoSync] = useState(false)
  const [testing, setTesting]   = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [syncing, setSyncing]   = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [showCode, setShowCode] = useState(false)

  // LINE Messaging API
  const [lineToken, setLineToken]     = useState('')
  const [lineUserId, setLineUserId]   = useState('')
  const [linePrefs, setLinePrefs]     = useState<LinePrefs>({ newProject: true, statusChange: true, lowStock: true })
  const [lineTesting, setLineTesting] = useState(false)
  const [lineResult, setLineResult]   = useState<{ ok: boolean; message: string } | null>(null)
  const [showToken, setShowToken]     = useState(false)

  // Notifications
  const [notiPrefs, setNotiPrefs] = useState({ lowStock: true, lowMargin: true, newProject: true })

  // Price overrides
  const [surfaceOv, setSurfaceOv] = useState<Record<string, number>>({...SURFACE_PRICES})
  const [edgeOv, setEdgeOv]       = useState<Record<string, number>>({...EDGE_PRICES})
  const [laborOv, setLaborOv]     = useState<Record<string, number>>({...LABOR_RATES})
  const [installOv, setInstallOv] = useState<Record<string, number>>({...INSTALLATION_RATES})

  useEffect(() => {
    if (typeof window === 'undefined') return
    const co = localStorage.getItem('company_info')
    if (co) setCompany(JSON.parse(co))
    setLogoUrl(localStorage.getItem('company_logo') ?? '')
    setSheets({
      id:  localStorage.getItem('sheets_id')  ?? '',
      url: localStorage.getItem('sheets_url') ?? '',
      key: localStorage.getItem('sheets_key') ?? 'meridian-api-key-2026',
    })
    setAutoSync(localStorage.getItem('sheets_autosync') === 'true')
    setLineToken(localStorage.getItem('line_notify_token') ?? '')
    setLineUserId(localStorage.getItem('line_user_id') ?? '')
    const lp = localStorage.getItem('line_notify_prefs')
    if (lp) setLinePrefs(JSON.parse(lp))
    const np = localStorage.getItem('noti_prefs')
    if (np) setNotiPrefs(JSON.parse(np))
    // Load price overrides
    const ov = localStorage.getItem('price_overrides')
    if (ov) {
      const parsed = JSON.parse(ov)
      if (parsed.surface) setSurfaceOv(prev => ({ ...prev, ...parsed.surface }))
      if (parsed.edge)    setEdgeOv(prev => ({ ...prev, ...parsed.edge }))
      if (parsed.labor)   setLaborOv(prev => ({ ...prev, ...parsed.labor }))
      if (parsed.install) setInstallOv(prev => ({ ...prev, ...parsed.install }))
    }
  }, [])

  // ── Savers ────────────────────────────────────────────────────────────────

  const saveCompany = () => {
    localStorage.setItem('company_info', JSON.stringify(company))
    if (logoUrl) localStorage.setItem('company_logo', logoUrl)
    else localStorage.removeItem('company_logo')
    window.dispatchEvent(new Event('company-logo-updated'))
    success('บันทึกข้อมูลบริษัทแล้ว')
  }

  const saveSheets = () => {
    localStorage.setItem('sheets_id',  sheets.id)
    localStorage.setItem('sheets_url', sheets.url)
    localStorage.setItem('sheets_key', sheets.key)
    localStorage.setItem('sheets_autosync', autoSync ? 'true' : 'false')
    setTestResult(null)
    success('บันทึกการตั้งค่า Google Sheets แล้ว')
  }

  const testSheets = async () => {
    if (!sheets.url) { error('กรุณากรอก Apps Script URL ก่อน'); return }
    setTesting(true); setTestResult(null)
    try {
      const res  = await fetch(`/api/sheets?action=health`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTestResult({ ok: true, message: data.message ?? 'เชื่อมต่อสำเร็จ ✓' })
    } catch (e: unknown) {
      setTestResult({ ok: false, message: e instanceof Error ? e.message : 'เชื่อมต่อไม่ได้' })
    } finally { setTesting(false) }
  }

  const syncNow = async () => {
    if (!sheets.url) { error('กรุณาตั้งค่า Apps Script URL ก่อน'); return }
    setSyncing(true)
    try {
      const items = getStock()
      const res  = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'syncStock', key: sheets.key, items }),
      })
      const data = await res.json()
      if (data.ok || data.status === 'ok') success(`Sync สำเร็จ: ${data.synced ?? items.length} รายการ`)
      else throw new Error(data.error ?? 'Sync failed')
    } catch (e: unknown) {
      error(e instanceof Error ? e.message : 'Sync ไม่สำเร็จ')
    } finally { setSyncing(false) }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
    success('คัดลอกโค้ดแล้ว วางใน Apps Script ได้เลย')
  }

  const saveLineSettings = () => {
    localStorage.setItem('line_notify_token', lineToken)
    localStorage.setItem('line_user_id', lineUserId)
    localStorage.setItem('line_notify_prefs', JSON.stringify(linePrefs))
    success('บันทึก LINE Messaging API แล้ว')
  }

  const testLine = async () => {
    if (!lineToken) { error('กรุณากรอก Channel Access Token ก่อน'); return }
    setLineTesting(true); setLineResult(null)
    const mode = lineUserId ? 'Push' : 'Broadcast'
    try {
      const res = await fetch('/api/line-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: lineToken,
          userId: lineUserId || undefined,
          message: `🏠 MERIDIAN ROOM\n━━━━━━━━━━━━━━━━\n✅ ทดสอบการเชื่อมต่อสำเร็จ! (${mode})\nระบบพร้อมส่งการแจ้งเตือนแล้ว 🎉`,
        }),
      })
      const data = await res.json()
      if (data.ok) setLineResult({ ok: true, message: `ส่ง LINE สำเร็จ! (${mode}) เช็คมือถือได้เลย 📱` })
      else throw new Error(data.message)
    } catch (e: unknown) {
      setLineResult({ ok: false, message: e instanceof Error ? e.message : 'ส่งไม่สำเร็จ ตรวจสอบ Token อีกครั้ง' })
    } finally { setLineTesting(false) }
  }

  const saveNotiPrefs = () => {
    localStorage.setItem('noti_prefs', JSON.stringify(notiPrefs))
    success('บันทึกการตั้งค่าการแจ้งเตือนแล้ว')
  }

  const savePrices = () => {
    // Build full overrides object and save
    const ov = {
      surface: surfaceOv,
      edge:    edgeOv,
      labor:   laborOv,
      install: installOv,
    }
    localStorage.setItem('price_overrides', JSON.stringify(ov))
    success('บันทึกราคาวัสดุแล้ว มีผลทันทีในการคำนวณใหม่')
  }

  const resetPrices = () => {
    if (!confirm('รีเซ็ตราคาทั้งหมดกลับค่าเริ่มต้น?')) return
    resetPriceOverrides()
    setSurfaceOv({...SURFACE_PRICES})
    setEdgeOv({...EDGE_PRICES})
    setLaborOv({...LABOR_RATES})
    setInstallOv({...INSTALLATION_RATES})
    success('รีเซ็ตราคาเป็นค่าเริ่มต้นแล้ว')
  }

  // ── Nav icons ─────────────────────────────────────────────────────────────
  const ICONS: Record<Section, React.ElementType> = {
    'ทั่วไป': Palette, 'ราคาวัสดุ': DollarSign, 'Google Sheets': Database,
    'LINE OA': MessageCircle, 'การแจ้งเตือน': Bell, 'บัญชีผู้ใช้': Shield,
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <Settings size={22} className="text-accent" /> ตั้งค่าระบบ
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">จัดการการเชื่อมต่อ LINE OA, Google Sheets และข้อมูลบริษัท</p>
      </div>

      <div className="flex flex-col md:flex-row gap-5">
        {/* ── Side Nav ── */}
        <div className="md:w-52 flex-shrink-0">
          <div className="glass-card rounded-2xl p-2 flex flex-row md:flex-col gap-1">
            {SECTIONS.map(s => {
              const Icon = ICONS[s]
              const isLine = s === 'LINE OA'
              return (
                <button key={s} onClick={() => setSection(s)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors w-full text-left ${
                    section === s
                      ? isLine ? 'bg-green-50 text-green-700 font-semibold' : 'bg-accent/15 text-accent font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  <Icon size={15} className={section === s && isLine ? 'text-green-600' : ''} />
                  <span className="hidden md:inline">{s}</span>
                  {isLine && lineToken && <span className="hidden md:inline ml-auto w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 glass-card rounded-2xl p-5 md:p-6">

          {/* ════ GENERAL ════ */}
          {section === 'ทั่วไป' && (
            <div className="space-y-5">
              <h2 className="font-bold text-primary text-base">ข้อมูลบริษัทและโลโก้</h2>
              <LogoUploadZone value={logoUrl} onChange={setLogoUrl} />
              <div className="border-t border-gray-100 pt-4 space-y-3">
                {[
                  { key: 'name',    label: 'ชื่อบริษัท',   ph: 'MERIDIAN ROOM' },
                  { key: 'taxId',   label: 'เลขนิติบุคคล', ph: '0105xxx' },
                  { key: 'phone',   label: 'เบอร์โทร',      ph: '02-xxx-xxxx' },
                  { key: 'address', label: 'ที่อยู่',        ph: 'เลขที่...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                    <input value={company[f.key as keyof typeof company]}
                      onChange={e => setCompany(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.ph}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30" />
                  </div>
                ))}
              </div>
              <button onClick={saveCompany}
                className="flex items-center gap-2 px-5 py-2.5 gold-gradient text-primary text-sm font-semibold rounded-xl hover:shadow-gold transition-all">
                <Save size={14} /> บันทึกข้อมูลบริษัท
              </button>
            </div>
          )}

          {/* ════ PRICE MANAGEMENT ════ */}
          {section === 'ราคาวัสดุ' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-primary text-base">ตั้งค่าราคาวัสดุ</h2>
                  <p className="text-xs text-gray-400 mt-0.5">ราคาที่ตั้งที่นี่มีผลทันทีในการคำนวณใบเสนอราคา</p>
                </div>
                <button onClick={resetPrices}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-danger transition-colors px-2.5 py-1.5 border border-gray-200 rounded-lg">
                  <RotateCcw size={12} /> รีเซ็ต
                </button>
              </div>

              {/* Surface prices */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ผิวสัมผัส (฿/ตร.ม. เพิ่มจากเมลามีน)</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(surfaceOv) as [string, number][]).map(([key, val]) => {
                    const labels: Record<string, string> = {
                      MELAMINE: 'เมลามีน', LAMINATE: 'ลามิเนต HPL',
                      ACRYLIC: 'อะคริลิค', VENEER: 'วีเนียร์',
                      HIGLOSS: 'Hi-Gloss', PU_PAINT: 'PU Paint', VACUUM: 'Vacuum',
                    }
                    const def = SURFACE_PRICES[key as keyof typeof SURFACE_PRICES]
                    const changed = val !== def
                    return (
                      <div key={key} className={`flex items-center gap-2 p-2.5 rounded-xl border ${changed ? 'border-accent/40 bg-accent/5' : 'border-gray-100'}`}>
                        <span className="text-xs text-gray-600 flex-1 truncate">{labels[key] ?? key}</span>
                        <input type="number" min={0} step={10} value={val}
                          onChange={e => setSurfaceOv(p => ({ ...p, [key]: Number(e.target.value) }))}
                          className="w-20 text-xs text-right px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/30" />
                        <span className="text-[10px] text-gray-400 flex-shrink-0">฿</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Edge prices */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Edge Banding (฿/เมตร)</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(edgeOv) as [string, number][]).map(([key, val]) => {
                    const labels: Record<string, string> = {
                      MELAMINE: 'Melamine', PVC_1MM: 'PVC 1mm', PVC_2MM: 'PVC 2mm', ABS: 'ABS',
                    }
                    const def = EDGE_PRICES[key as keyof typeof EDGE_PRICES]
                    const changed = val !== def
                    return (
                      <div key={key} className={`flex items-center gap-2 p-2.5 rounded-xl border ${changed ? 'border-accent/40 bg-accent/5' : 'border-gray-100'}`}>
                        <span className="text-xs text-gray-600 flex-1">{labels[key] ?? key}</span>
                        <input type="number" min={0} step={1} value={val}
                          onChange={e => setEdgeOv(p => ({ ...p, [key]: Number(e.target.value) }))}
                          className="w-16 text-xs text-right px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/30" />
                        <span className="text-[10px] text-gray-400 flex-shrink-0">฿</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Labor rates */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ค่าแรงผลิต</p>
                <div className="grid grid-cols-1 gap-2">
                  {([
                    ['cuttingPerSheet',      'ค่าตัดไม้ / แผ่น'],
                    ['edgeBandingPerMeter',  'ค่า Edge Banding / ม.'],
                    ['assemblyPerCabinet',   'ค่าประกอบตู้ / ชุด'],
                    ['paintingPerSqm',       'ค่าแรงทาสี PU / ตร.ม.'],
                    ['vacuumPerSqm',         'ค่าแรง Vacuum / ตร.ม.'],
                    ['qcPerCabinet',         'ค่า QC / ชุด'],
                    ['packagingPerCabinet',  'ค่าบรรจุภัณฑ์ / ชุด'],
                  ] as [string, string][]).map(([key, label]) => {
                    const def = LABOR_RATES[key as keyof typeof LABOR_RATES]
                    const val = laborOv[key] ?? def
                    const changed = val !== def
                    return (
                      <div key={key} className={`flex items-center gap-3 p-2.5 rounded-xl border ${changed ? 'border-accent/40 bg-accent/5' : 'border-gray-100'}`}>
                        <span className="text-xs text-gray-600 flex-1">{label}</span>
                        <span className="text-[10px] text-gray-300">(ค่าเริ่มต้น: {def}฿)</span>
                        <input type="number" min={0} step={5} value={val}
                          onChange={e => setLaborOv(p => ({ ...p, [key]: Number(e.target.value) }))}
                          className="w-20 text-xs text-right px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/30" />
                        <span className="text-[10px] text-gray-400 flex-shrink-0">฿</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Installation rates */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ค่าติดตั้ง (฿/ตร.ม.)</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['HOUSE',      'บ้าน / โครงการ'],
                    ['CONDO',      'คอนโด / อาคารสูง'],
                    ['OFFICE',     'สำนักงาน'],
                    ['SHOPHOUSE',  'ตึกแถว'],
                  ] as [string, string][]).map(([key, label]) => {
                    const def = INSTALLATION_RATES[key as keyof typeof INSTALLATION_RATES]
                    const val = installOv[key] ?? def
                    const changed = val !== def
                    return (
                      <div key={key} className={`flex items-center gap-2 p-2.5 rounded-xl border ${changed ? 'border-accent/40 bg-accent/5' : 'border-gray-100'}`}>
                        <span className="text-xs text-gray-600 flex-1">{label}</span>
                        <input type="number" min={0} step={10} value={val}
                          onChange={e => setInstallOv(p => ({ ...p, [key]: Number(e.target.value) }))}
                          className="w-20 text-xs text-right px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/30" />
                        <span className="text-[10px] text-gray-400 flex-shrink-0">฿</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button onClick={savePrices}
                className="flex items-center gap-2 px-5 py-2.5 gold-gradient text-primary text-sm font-semibold rounded-xl hover:shadow-gold transition-all">
                <Save size={14} /> บันทึกราคาวัสดุ
              </button>
            </div>
          )}

          {/* ════ GOOGLE SHEETS ════ */}
          {section === 'Google Sheets' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-bold text-primary text-base">Google Sheets Integration</h2>
                {autoSync && <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">Auto-sync ON</span>}
              </div>

              {/* Step-by-step guide */}
              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center gap-2">
                  <Zap size={14} className="text-accent" />
                  <p className="text-xs font-semibold text-gray-700">วิธีตั้งค่า (ทำครั้งเดียว)</p>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { step: 1, icon: '📄', title: 'เปิด Google Sheets', desc: 'สร้าง Sheet ใหม่ หรือใช้ Sheet ที่มีอยู่แล้ว' },
                    { step: 2, icon: '⚙️', title: 'Extensions → Apps Script', desc: 'วางโค้ดที่ copy ด้านล่าง แทนที่โค้ดเดิมทั้งหมด' },
                    { step: 3, icon: '🚀', title: 'Deploy → New deployment', desc: 'Type: Web app · Execute as: Me · Access: Anyone กด Deploy' },
                    { step: 4, icon: '🔗', title: 'Copy Web app URL', desc: 'วาง URL ในช่องด้านล่าง แล้วกด "บันทึก"' },
                  ].map(s => (
                    <div key={s.step} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary text-accent text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {s.step}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary">{s.icon} {s.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code block */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800">
                  <span className="text-xs text-gray-400 font-mono">Code.gs — วางใน Apps Script</span>
                  <div className="flex gap-2">
                    <button onClick={() => setShowCode(v => !v)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                      {showCode ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {showCode ? 'ซ่อน' : 'ดูโค้ด'}
                    </button>
                    <button onClick={copyCode}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        codeCopied ? 'bg-success text-white' : 'bg-accent text-primary hover:bg-accent/90'
                      }`}>
                      <Copy size={11} /> {codeCopied ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                </div>
                {showCode && (
                  <pre className="bg-gray-900 text-green-300 text-[10px] leading-relaxed p-4 overflow-x-auto max-h-52 font-mono">
                    {APPS_SCRIPT_CODE}
                  </pre>
                )}
              </div>

              {/* Config fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Apps Script URL *</label>
                  <input value={sheets.url} onChange={e => setSheets(p => ({ ...p, url: e.target.value }))}
                    placeholder="https://script.google.com/macros/s/AKfy.../exec"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Spreadsheet ID (ไม่บังคับ)</label>
                    <input value={sheets.id} onChange={e => setSheets(p => ({ ...p, id: e.target.value }))}
                      placeholder="1BxiMVs0XRA5..."
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
                    <input value={sheets.key} onChange={e => setSheets(p => ({ ...p, key: e.target.value }))}
                      placeholder="meridian-api-key-2026"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 font-mono" />
                  </div>
                </div>
              </div>

              {/* Auto-sync toggle */}
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-primary">Auto-sync โปรเจกต์</p>
                  <p className="text-xs text-gray-400 mt-0.5">บันทึกโปรเจกต์ไปยัง Sheets อัตโนมัติ</p>
                </div>
                <button onClick={() => setAutoSync(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${autoSync ? 'bg-accent' : 'bg-gray-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoSync ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {testResult && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${testResult.ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                  {testResult.ok ? <CheckCircle size={15} /> : <XCircle size={15} />}
                  {testResult.message}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button onClick={testSheets} disabled={testing}
                  className="flex items-center gap-2 px-4 py-2.5 border border-accent text-accent text-sm font-medium rounded-xl hover:bg-accent/5 transition-colors disabled:opacity-60">
                  {testing ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />} ทดสอบ
                </button>
                <button onClick={syncNow} disabled={syncing}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60">
                  {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Sync Stock ตอนนี้
                </button>
                <button onClick={saveSheets}
                  className="flex items-center gap-2 px-4 py-2.5 gold-gradient text-primary text-sm font-semibold rounded-xl hover:shadow-gold transition-all">
                  <Save size={14} /> บันทึก
                </button>
                <a href="https://script.google.com" target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-gray-500 hover:text-primary transition-colors">
                  <ExternalLink size={12} /> เปิด Apps Script
                </a>
              </div>
            </div>
          )}

          {/* ════ LINE OA ════ */}
          {section === 'LINE OA' && (
            <div className="space-y-5">

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#06C755] flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-primary text-base">LINE Messaging API</h2>
                  <p className="text-xs text-gray-400">รับแจ้งเตือนงานสำคัญผ่าน LINE Bot ทันที</p>
                </div>
                {lineToken && (
                  <span className="ml-auto text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {lineUserId ? 'Push Mode' : 'Broadcast Mode'}
                  </span>
                )}
              </div>

              {/* Mode explanation */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl border-2 transition-all ${lineUserId ? 'border-green-200 bg-green-50/50' : 'border-gray-100'}`}>
                  <p className="text-xs font-bold text-green-700 mb-1">🎯 Push Mode</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">ส่งตรงถึง User/Group ที่ระบุ — แนะนำสำหรับผู้ใช้คนเดียว</p>
                </div>
                <div className={`p-3 rounded-xl border-2 transition-all ${!lineUserId && lineToken ? 'border-green-200 bg-green-50/50' : 'border-gray-100'}`}>
                  <p className="text-xs font-bold text-blue-700 mb-1">📢 Broadcast Mode</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">ส่งถึงทุกคนที่ follow Bot — ใช้เมื่อไม่ได้กรอก User ID</p>
                </div>
              </div>

              {/* Setup guide */}
              <div className="rounded-2xl border border-green-100 bg-green-50/40 overflow-hidden">
                <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
                  <Zap size={13} className="text-green-600" />
                  <p className="text-xs font-bold text-green-800">วิธีตั้งค่า LINE Messaging API (ทำครั้งเดียว)</p>
                </div>
                <div className="p-4 space-y-4">
                  {[
                    {
                      n: 1,
                      t: 'สร้าง LINE Bot Channel',
                      d: 'ไปที่ LINE Developers Console → สร้าง Provider → New Channel → Messaging API',
                      link: 'https://developers.line.biz/console/',
                      lbl: 'เปิด LINE Developers Console',
                    },
                    {
                      n: 2,
                      t: 'ออก Channel Access Token',
                      d: 'ใน Channel ที่สร้าง → แท็บ Messaging API → ปุ่ม "Issue" ใต้ Channel access token (long-lived)',
                      link: null, lbl: '',
                    },
                    {
                      n: 3,
                      t: 'หา User ID ของตัวเอง',
                      d: 'Basic Settings → Your user ID (ขึ้นต้น Uxxxxxxx) — ต้อง add Bot เป็น friend ก่อน แล้วใส่ใน "LINE User ID" ด้านล่าง',
                      link: null, lbl: '',
                    },
                    {
                      n: 4,
                      t: 'วาง Token และกดทดสอบ',
                      d: 'วาง Channel Access Token และ User ID ในช่องด้านล่าง กด "ส่งทดสอบ" — ควรได้รับข้อความใน LINE ทันที',
                      link: null, lbl: '',
                    },
                  ].map(s => (
                    <div key={s.n} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-[#06C755] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {s.n}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-900">{s.t}</p>
                        <p className="text-xs text-green-700 mt-0.5 leading-relaxed">{s.d}</p>
                        {s.link && (
                          <a href={s.link} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 mt-1.5 text-xs text-green-600 font-medium hover:text-green-800 underline-offset-2 hover:underline transition-colors">
                            <ExternalLink size={10} /> {s.lbl}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Token input */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Channel Access Token <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={lineToken}
                      onChange={e => setLineToken(e.target.value)}
                      placeholder="วาง Channel Access Token จาก LINE Developers..."
                      className="w-full px-3 py-2.5 pr-20 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 font-mono"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button onClick={() => setShowToken(v => !v)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded transition-colors">
                        {showToken ? 'ซ่อน' : 'แสดง'}
                      </button>
                      {lineToken && (
                        <button onClick={() => setLineToken('')} className="text-gray-300 hover:text-danger">
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    LINE User ID <span className="text-gray-400 font-normal">(ไม่บังคับ — ถ้าว่างจะใช้ Broadcast)</span>
                  </label>
                  <input
                    type="text"
                    value={lineUserId}
                    onChange={e => setLineUserId(e.target.value)}
                    placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 font-mono"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    หาได้ที่ LINE Developers Console → Basic Settings → Your user ID
                  </p>
                </div>
              </div>

              {/* Test result */}
              {lineResult && (
                <div className={`flex items-center gap-2 p-3.5 rounded-xl text-sm font-medium ${
                  lineResult.ok
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-danger/10 text-danger border border-danger/20'
                }`}>
                  {lineResult.ok ? <CheckCircle size={15} /> : <XCircle size={15} />}
                  {lineResult.message}
                </div>
              )}

              {/* Notification toggles */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">แจ้งเตือนเมื่อ</p>
                {[
                  { key: 'newProject'   as keyof LinePrefs, icon: '📋', label: 'มีโปรเจกต์ใหม่',   desc: 'เมื่อสร้างหรือบันทึกโปรเจกต์ใหม่' },
                  { key: 'statusChange' as keyof LinePrefs, icon: '🔄', label: 'สถานะงานเปลี่ยน',  desc: 'เมื่อเปลี่ยนจากผลิต → ติดตั้ง → เสร็จ' },
                  { key: 'lowStock'     as keyof LinePrefs, icon: '⚠️', label: 'Stock ใกล้หมด',    desc: 'เมื่อวัสดุต่ำกว่าเกณฑ์ขั้นต่ำ' },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between p-3.5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-base leading-none mt-0.5">{n.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-primary">{n.label}</p>
                        <p className="text-xs text-gray-400">{n.desc}</p>
                      </div>
                    </div>
                    <button onClick={() => setLinePrefs(p => ({ ...p, [n.key]: !p[n.key] }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${linePrefs[n.key] ? 'bg-[#06C755]' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${linePrefs[n.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Message preview */}
              {lineToken && (
                <div className="rounded-xl border border-[#06C755]/25 bg-[#06C755]/5 p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2.5 flex items-center gap-1.5">
                    <MessageCircle size={12} className="text-[#06C755]" /> ตัวอย่างข้อความที่จะได้รับ
                  </p>
                  <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 text-xs text-gray-700 whitespace-pre-line leading-relaxed font-mono">
                    {`🏠 MERIDIAN ROOM\n━━━━━━━━━━━━━━━━━━━━\n📋 โปรเจกต์ใหม่: Walk-in Closet VIP\n👤 ลูกค้า: คุณสมชาย วงษ์สุวรรณ\n💰 ราคา: ฿385,000\n📊 Margin: 38.5%\n📅 ${new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}`}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">
                    {lineUserId ? `📍 ส่งแบบ Push → User ID: ${lineUserId.slice(0, 8)}...` : '📢 ส่งแบบ Broadcast ถึงทุก follower'}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={testLine} disabled={lineTesting || !lineToken}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#06C755] text-white text-sm font-semibold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50">
                  {lineTesting ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
                  ส่งทดสอบ
                </button>
                <button onClick={saveLineSettings}
                  className="flex items-center gap-2 px-4 py-2.5 gold-gradient text-primary text-sm font-semibold rounded-xl hover:shadow-gold transition-all">
                  <Save size={14} /> บันทึก
                </button>
              </div>
            </div>
          )}

          {/* ════ NOTIFICATIONS ════ */}
          {section === 'การแจ้งเตือน' && (
            <div className="space-y-4">
              <h2 className="font-bold text-primary text-base mb-4">การแจ้งเตือนในระบบ</h2>
              {[
                { key: 'lowStock',   label: 'Stock ใกล้หมด',  desc: 'แจ้งเตือนเมื่อวัสดุต่ำกว่าเกณฑ์' },
                { key: 'lowMargin',  label: 'Margin ต่ำ',     desc: 'แจ้งเตือนเมื่อ Margin ต่ำกว่า 15%' },
                { key: 'newProject', label: 'โปรเจกต์ใหม่',  desc: 'แจ้งเตือนเมื่อมีโปรเจกต์ถูกสร้าง' },
              ].map(n => (
                <div key={n.key} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-primary">{n.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
                  </div>
                  <button onClick={() => setNotiPrefs(p => ({ ...p, [n.key]: !p[n.key as keyof typeof p] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${notiPrefs[n.key as keyof typeof notiPrefs] ? 'bg-accent' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notiPrefs[n.key as keyof typeof notiPrefs] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
              <button onClick={saveNotiPrefs}
                className="flex items-center gap-2 px-4 py-2.5 gold-gradient text-primary text-sm font-semibold rounded-xl hover:shadow-gold transition-all mt-2">
                <Save size={14} /> บันทึก
              </button>
            </div>
          )}

          {/* ════ ACCOUNT ════ */}
          {section === 'บัญชีผู้ใช้' && (
            <div className="space-y-4">
              <h2 className="font-bold text-primary text-base mb-4">บัญชีผู้ใช้</h2>
              {session?.user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    {session.user.image ? (
                      <img src={session.user.image} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center text-2xl font-bold text-accent">
                        {session.user.name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-primary">{session.user.name}</p>
                      <p className="text-sm text-gray-500">{session.user.email}</p>
                      <span className="inline-block mt-1.5 text-xs px-2.5 py-0.5 bg-accent/15 text-accent rounded-full font-medium">
                        {ROLE_LABELS[(session.user as { role?: UserRole }).role ?? 'SALES']}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-xl space-y-1.5">
                    {[
                      ['เวอร์ชัน', 'MERIDIAN ROOM v2.0'],
                      ['LINE Messaging', lineToken ? `✅ ${lineUserId ? 'Push' : 'Broadcast'}` : '❌ ยังไม่ตั้งค่า'],
                      ['Google Sheets', sheets.url ? '✅ ตั้งค่าแล้ว' : '❌ ยังไม่ตั้งค่า'],
                      ['Auto-sync', autoSync ? 'เปิด' : 'ปิด'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-medium text-primary">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border border-warning/20 bg-warning/5 rounded-xl">
                    <p className="text-xs font-semibold text-warning mb-1">ล้างข้อมูลทั้งหมด</p>
                    <p className="text-xs text-gray-500 mb-3">ล้างโปรเจกต์ ลูกค้า คลัง ไม่สามารถกู้คืนได้</p>
                    <button onClick={() => {
                      if (!confirm('ยืนยันการล้างข้อมูลทั้งหมด?')) return
                      ;['meridian_projects','meridian_customers','meridian_stock','meridian_notifications']
                        .forEach(k => localStorage.removeItem(k))
                      success('ล้างข้อมูลทั้งหมดแล้ว')
                    }} className="text-xs px-3 py-1.5 bg-warning/15 text-warning rounded-lg hover:bg-warning/25 font-medium">
                      ล้างข้อมูล
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">กรุณาเข้าสู่ระบบก่อน</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
