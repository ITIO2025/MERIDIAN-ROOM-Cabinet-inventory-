'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calculator, Loader2,
  FileText, Download, Printer, Save, CheckCircle,
  AlertTriangle, TrendingUp, Package, Wrench, Layers,
  Cpu, ShieldCheck, Scissors, BarChart2, Zap,
  Plus, X, Tag, RefreshCw, Eye, Ruler, Grid
} from 'lucide-react'
import { calculatePricing, formatCurrency } from '@/lib/pricing-engine'
import { saveProject } from '@/lib/storage'
import { generateQuotationPDF, generateBOQPDF } from '@/lib/pdf-generator'
import { useToast } from '@/context/ToastContext'
import type { CabinetInput, CustomOption } from '@/lib/types'
import {
  PROJECT_TYPE_LABELS, BOARD_TYPE_LABELS, SURFACE_TYPE_LABELS,
  DOOR_TYPE_LABELS, HARDWARE_BRAND_LABELS, HANDLE_TYPE_LABELS
} from '@/lib/types'
import clsx from 'clsx'
import CabinetVisualizer from '@/components/CabinetVisualizer'
import { sendLine, lineNewProject, syncProjectToSheets, getLinePrefs } from '@/lib/notify'

// ─── Default Input ─────────────────────────────────────────────────────────────

const DEFAULT_INPUT: CabinetInput = {
  projectName: '', customerName: '', designer: '', sales: '',
  projectType: 'WARDROBE', location: '', province: '', floorLevel: '',
  width: 280, height: 240, depth: 60, quantity: 1,
  boardType: 'MDF', boardThickness: 18, surfaceType: 'MELAMINE',
  color: '', edgeType: 'MELAMINE',
  backBoardType: 'MDF', backBoardThickness: 9,
  doorType: 'SWING', doorCount: 2, hasSoftClose: true, hasPushOpen: false, hasGlassDoor: false,
  shelfCount: 3, drawerCount: 2, hasHangingRail: false, hangingRailLength: 0,
  hasLED: false, ledLength: 0, hasMirror: false, hasBasket: false, basketCount: 0,
  hardwareBrand: 'STANDARD', handleType: 'BAR', hasLiftSystem: false, hasSensorLight: false,
  customOptions: [],
  installationType: 'CONDO', hasLift: false, isNightWork: false,
  hasSiteRestriction: false, distanceKm: 0,
  targetMargin: 0.35, discount: 0, includeVAT: true, salesCommission: 0,
}

// ─── Animated Number ───────────────────────────────────────────────────────────

function AnimatedNumber({ value, prefix = '', suffix = '', className = '' }: {
  value: number; prefix?: string; suffix?: string; className?: string
}) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    const start = prev.current
    const end = value
    const duration = 500
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(Math.round(start + (end - start) * eased))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
      else prev.current = end
    }

    if (frame.current) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(tick)
    return () => { if (frame.current) cancelAnimationFrame(frame.current) }
  }, [value])

  return (
    <span className={className}>
      {prefix}{display.toLocaleString('th-TH')}{suffix}
    </span>
  )
}

// ─── Field Primitives ──────────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 text-sm border border-[var(--theme-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 bg-[var(--theme-card)] text-primary placeholder:text-subtle transition-all'
const labelCls = 'block text-[11px] font-medium text-muted mb-1 uppercase tracking-wide'

// ─── Preset Button ─────────────────────────────────────────────────────────────

function PresetBtn({ label, onClick, active }: { label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-2.5 py-1 text-xs rounded-lg border transition-all',
        active
          ? 'bg-accent text-white border-accent'
          : 'border-[var(--theme-border)] text-muted hover:border-accent hover:text-accent'
      )}
    >
      {label}
    </button>
  )
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

function Sel({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: Record<string, string>
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={clsx(inputCls, 'cursor-pointer')}>
      {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  )
}

function Num({ value, onChange, min, max, step }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number
}) {
  return (
    <input type="number" value={value} min={min} max={max} step={step ?? 1}
      onChange={e => onChange(Number(e.target.value))} className={inputCls} />
  )
}

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-2 group">
      <div className={clsx(
        'relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0',
        on ? 'bg-accent' : 'bg-[var(--theme-border)]'
      )}>
        <div className={clsx(
          'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200',
          on ? 'translate-x-4' : 'translate-x-0.5'
        )} />
      </div>
      <span className="text-sm text-muted group-hover:text-primary transition-colors">{label}</span>
    </button>
  )
}

// ─── Form Step Card ────────────────────────────────────────────────────────────

function StepCard({ step, title, icon: Icon, children }: {
  step: number; title: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="border border-[var(--theme-border)] bg-[var(--theme-card)] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--theme-border)]">
        <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-accent">{step}</span>
        </div>
        <Icon size={13} className="text-accent flex-shrink-0" />
        <span className="text-sm font-semibold text-primary">{title}</span>
      </div>
      <div className="px-4 pb-4 pt-3 space-y-3">
        {children}
      </div>
    </div>
  )
}

// ─── Structure Health Badge ────────────────────────────────────────────────────

function StructureHealth({ input }: { input: CabinetInput }) {
  // input.width in cm → convert to mm for engineering comparison
  const sections  = Math.max(input.shelfCount + 1, 1)
  const spanMm    = (input.width * 10) / sections  // shelf span in mm
  const depthCm   = input.depth

  let level: 'STABLE' | 'MEDIUM' | 'REINFORCE'
  let color: string
  let bg: string
  let icon: React.ReactNode

  // Industry standard: < 600mm = stable, 600–900mm = brace needed, > 900mm = reinforce
  if (spanMm <= 600 && depthCm <= 65) {
    level = 'STABLE';   color = '#00A86B'; bg = '#00A86B15'
    icon = <ShieldCheck size={12} />
  } else if (spanMm <= 900) {
    level = 'MEDIUM';   color = '#FFB800'; bg = '#FFB80015'
    icon = <AlertTriangle size={12} />
  } else {
    level = 'REINFORCE'; color = '#E53935'; bg = '#E5393515'
    icon = <AlertTriangle size={12} />
  }

  const label = {
    STABLE:   'โครงสร้างแข็งแรง',
    MEDIUM:   'ควรเสริมแผ่นกั้น',
    REINFORCE:'ต้องเสริมโครงสร้าง',
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: bg }}>
      <span style={{ color }}>{icon}</span>
      <div className="flex-1">
        <p className="text-xs font-semibold" style={{ color }}>{label[level]}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">ช่วงพาด {spanMm.toFixed(0)} มม./ช่วง</p>
      </div>
    </div>
  )
}

// ─── Cutting Estimation ────────────────────────────────────────────────────────

function CuttingEstimation({ result }: { result: ReturnType<typeof calculatePricing> }) {
  const area = result.totalAreaSqm ?? 0
  const sheets = result.totalSheetsUsed ?? Math.ceil(area / 2.97)
  const wastePercent = result.wastePercent ?? 0

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">พื้นที่แผ่นรวม</span>
        <span className="font-semibold text-primary">{area.toFixed(2)} ตร.ม.</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">แผ่นที่ใช้</span>
        <span className="font-semibold text-primary">{sheets} แผ่น</span>
      </div>
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-gray-500">Waste</span>
          <span className={clsx('font-semibold', wastePercent < 15 ? 'text-success' : wastePercent < 25 ? 'text-warning' : 'text-danger')}>
            {wastePercent.toFixed(1)}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={clsx('h-full rounded-full', wastePercent < 15 ? 'bg-success' : wastePercent < 25 ? 'bg-warning' : 'bg-danger')}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(wastePercent * 2, 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
      {wastePercent > 20 && (
        <p className="text-[10px] text-orange-600 bg-orange-50 rounded-lg px-2 py-1.5 leading-relaxed">
          💡 ปรับขนาดให้เป็น 60/120/240 ซม. ลด waste ได้อีก {(wastePercent - 12).toFixed(0)}%
        </p>
      )}
    </div>
  )
}

// ─── Main Content ──────────────────────────────────────────────────────────────

function PricingContent() {
  const { success, error: toastError } = useToast()
  const [input, setInput] = useState<CabinetInput>(DEFAULT_INPUT)
  const [result, setResult] = useState<ReturnType<typeof calculatePricing> | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newOption, setNewOption] = useState({ name: '', price: 0, qty: 1 })
  const [viewMode, setViewMode] = useState<'clean' | 'technical'>('clean')
  const [autoCalc, setAutoCalc] = useState(true)
  const [mobileTab, setMobileTab] = useState<'form' | 'preview' | 'analysis'>('form')
  const calcTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const set = useCallback(<K extends keyof CabinetInput>(key: K, val: CabinetInput[K]) =>
    setInput(prev => ({ ...prev, [key]: val })), [])

  // Auto-calculate when input changes
  useEffect(() => {
    if (!autoCalc) return
    if (calcTimeout.current) clearTimeout(calcTimeout.current)
    calcTimeout.current = setTimeout(() => {
      if (input.projectName || input.width > 0) {
        const r = calculatePricing(input)
        setResult(r)
      }
    }, 400)
    return () => { if (calcTimeout.current) clearTimeout(calcTimeout.current) }
  }, [input, autoCalc])

  const handleCalculate = useCallback(() => {
    if (!input.projectName) { toastError('กรุณากรอกชื่อโปรเจกต์'); return }
    setLoading(true)
    setTimeout(() => {
      setResult(calculatePricing(input))
      setLoading(false)
    }, 300)
  }, [input, toastError])

  const handleSave = useCallback(async () => {
    if (!result) return
    const sp = saveProject({
      id: '', createdAt: '',
      projectName: input.projectName || 'ไม่ระบุชื่อ',
      customerName: input.customerName || 'ไม่ระบุลูกค้า',
      projectType: input.projectType, status: 'QUOTE',
      sellingPrice: result.sellingPrice, netCost: result.netCost,
      margin: result.grossMarginPercent ?? 0,
      inputSnapshot: JSON.stringify(input),
    })
    // save to localStorage first
    setSaved(true)
    success('บันทึกแล้ว')
    setTimeout(() => setSaved(false), 3000)
    const prefs = getLinePrefs()
    if (prefs.newProject) {
      sendLine(lineNewProject({
        projectName: input.projectName || 'ไม่ระบุชื่อ',
        customerName: input.customerName || 'ไม่ระบุลูกค้า',
        projectType: PROJECT_TYPE_LABELS[input.projectType] ?? input.projectType,
        sellingPrice: result.sellingPrice,
        margin: result.grossMarginPercent ?? 0,
      }))
    }
    // sync to sheets separately — non-blocking, don't let it crash save
    try {
      await syncProjectToSheets({ ...sp })
    } catch (e) {
      console.warn('[sheets-sync] failed (non-critical):', e)
    }
  }, [result, input, success])

  const handlePDF = useCallback(async () => {
    if (!result) return
    setExporting(true)
    try { await generateQuotationPDF(result); success('PDF สำเร็จ') }
    catch { toastError('PDF ไม่สำเร็จ') }
    finally { setExporting(false) }
  }, [result, success, toastError])

  const handleBOQ = useCallback(async () => {
    if (!result) return
    try { await generateBOQPDF(result); success('BOQ สำเร็จ') }
    catch { toastError('BOQ ไม่สำเร็จ') }
  }, [result, success, toastError])

  const handlePrint = useCallback(() => {
    if (!result) return
    sessionStorage.setItem('meridian_print_quo', JSON.stringify(result))
    window.open('/quotation/print', '_blank')
  }, [result])

  const marginColor = result
    ? result.grossMarginPercent >= 30 ? '#00A86B'
    : result.grossMarginPercent >= 20 ? '#FFB800'
    : '#E53935'
    : '#C6A969'

  // ── Smart suggestions ──────────────────────────────────────────
  const suggestions: { type: 'warn' | 'tip'; msg: string }[] = []
  if (input.width > 300) suggestions.push({ type: 'tip', msg: 'แนะนำแบ่งเป็น 2 ตู้ ลด waste และง่ายต่อขนส่ง' })
  if (result && result.grossMarginPercent < 20) {
    const targetPrice = Math.ceil(result.netCost / 0.80 / 1000) * 1000
    suggestions.push({ type: 'warn', msg: `Margin ต่ำ — ราคาขายควรอยู่ที่ ${formatCurrency(targetPrice)} เพื่อให้ได้ 20%` })
  }
  if (input.shelfCount === 0 && input.projectType === 'WARDROBE') {
    suggestions.push({ type: 'tip', msg: 'เพิ่มชั้นวางเพื่อเสริมมูลค่าและรายได้' })
  }

  // ── Shared panels ──────────────────────────────────────────────
  const formPanel = (
    <div className="p-4 space-y-3">

      {/* Step 1 */}
      <StepCard step={1} title="ข้อมูลพื้นฐาน" icon={FileText}>
        <F label="ชื่อโปรเจกต์ *">
          <input value={input.projectName} onChange={e => set('projectName', e.target.value)}
            placeholder="ห้องนอนคุณสมชาย..." className={inputCls} />
        </F>
        <F label="ชื่อลูกค้า">
          <input value={input.customerName} onChange={e => set('customerName', e.target.value)}
            placeholder="คุณสมชาย ใจดี" className={inputCls} />
        </F>
        <div className="grid grid-cols-2 gap-2">
          <F label="ประเภทงาน">
            <Sel value={input.projectType} onChange={v => set('projectType', v as CabinetInput['projectType'])} options={PROJECT_TYPE_LABELS} />
          </F>
          <F label="การติดตั้ง">
            <Sel value={input.installationType} onChange={v => set('installationType', v as CabinetInput['installationType'])}
              options={{ HOUSE: 'บ้าน', CONDO: 'คอนโด', OFFICE: 'ออฟฟิศ', SHOPHOUSE: 'ตึกแถว' }} />
          </F>
        </div>
      </StepCard>

      {/* Step 2 */}
      <StepCard step={2} title="ขนาด & โครงสร้าง" icon={Ruler}>
        {/* Width presets */}
        <div>
          <label className={labelCls}>กว้าง (ซม.)</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {[200, 240, 280, 320, 360, 400].map(w => (
              <PresetBtn key={w} label={String(w)} active={input.width === w} onClick={() => set('width', w)} />
            ))}
          </div>
          <Num value={input.width} onChange={v => set('width', v)} min={30} max={600} />
        </div>
        {/* Height presets */}
        <div>
          <label className={labelCls}>สูง (ซม.)</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {[210, 220, 230, 240, 250].map(h => (
              <PresetBtn key={h} label={String(h)} active={input.height === h} onClick={() => set('height', h)} />
            ))}
          </div>
          <Num value={input.height} onChange={v => set('height', v)} min={30} max={300} />
        </div>
        {/* Depth presets */}
        <div>
          <label className={labelCls}>ลึก (ซม.)</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {[55, 60, 65].map(d => (
              <PresetBtn key={d} label={String(d)} active={input.depth === d} onClick={() => set('depth', d)} />
            ))}
          </div>
          <Num value={input.depth} onChange={v => set('depth', v)} min={20} max={100} />
        </div>
        {/* Structure health inline */}
        <StructureHealth input={input} />
      </StepCard>

      {/* Step 3 */}
      <StepCard step={3} title="วัสดุ & ผิว" icon={Layers}>
        <F label="วัสดุหลัก">
          <Sel value={input.boardType} onChange={v => set('boardType', v as CabinetInput['boardType'])} options={BOARD_TYPE_LABELS} />
        </F>
        <F label="ผิวสัมผัส">
          <Sel value={input.surfaceType} onChange={v => set('surfaceType', v as CabinetInput['surfaceType'])} options={SURFACE_TYPE_LABELS} />
        </F>
        {(input.surfaceType === 'PU_PAINT' || input.surfaceType === 'HIGLOSS' || input.surfaceType === 'VACUUM') && (
          <F label="สี / เฉดสี">
            <input value={input.color} onChange={e => set('color', e.target.value)}
              placeholder="ขาว, เทา, #F0E0C4..." className={inputCls} />
          </F>
        )}
        <F label="Edge Banding">
          <Sel value={input.edgeType} onChange={v => set('edgeType', v as CabinetInput['edgeType'])}
            options={{ MELAMINE: 'Melamine', PVC_1MM: 'PVC 1mm', PVC_2MM: 'PVC 2mm', ABS: 'ABS' }} />
        </F>
      </StepCard>

      {/* Step 4 */}
      <StepCard step={4} title="บานประตู & อุปกรณ์" icon={Wrench}>
        <div className="grid grid-cols-2 gap-2">
          <F label="ประตู">
            <Sel value={input.doorType} onChange={v => set('doorType', v as CabinetInput['doorType'])} options={DOOR_TYPE_LABELS} />
          </F>
          <F label="แบรนด์อุปกรณ์">
            <Sel value={input.hardwareBrand} onChange={v => set('hardwareBrand', v as CabinetInput['hardwareBrand'])} options={HARDWARE_BRAND_LABELS} />
          </F>
        </div>
        <F label="รูปแบบมือจับ">
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.entries(HANDLE_TYPE_LABELS) as [CabinetInput['handleType'], string][]).map(([k, lbl]) => (
              <button key={k} onClick={() => set('handleType', k)}
                className={clsx('px-2 py-1.5 text-xs rounded-lg border text-left transition-all font-medium',
                  input.handleType === k
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-[var(--theme-border)] text-muted bg-[var(--theme-card)] hover:border-accent/50')}>
                {lbl}
              </button>
            ))}
          </div>
        </F>
        <div className="grid grid-cols-2 gap-2">
          <F label="บาน"><Num value={input.doorCount} onChange={v => set('doorCount', v)} min={0} max={10} /></F>
          <F label="ลิ้นชัก"><Num value={input.drawerCount} onChange={v => set('drawerCount', v)} min={0} max={8} /></F>
          <F label="ชั้นวาง"><Num value={input.shelfCount} onChange={v => set('shelfCount', v)} min={0} max={10} /></F>
          <F label="จำนวนตู้"><Num value={input.quantity} onChange={v => set('quantity', v)} min={1} max={20} /></F>
        </div>
        <div className="space-y-2 pt-1">
          <Toggle on={input.hasMirror} onToggle={() => set('hasMirror', !input.hasMirror)} label="กระจก" />
          <Toggle on={input.hasLED} onToggle={() => set('hasLED', !input.hasLED)} label="LED Strip" />
          <Toggle on={input.hasSoftClose} onToggle={() => set('hasSoftClose', !input.hasSoftClose)} label="Soft-close" />
        </div>
      </StepCard>

      {/* Step 5 */}
      <StepCard step={5} title="เพิ่มเติม & Margin" icon={TrendingUp}>
        <F label={`Margin Target: ${(input.targetMargin * 100).toFixed(0)}%`}>
          <input type="range" min="0.10" max="0.60" step="0.05" value={input.targetMargin}
            onChange={e => set('targetMargin', Number(e.target.value))}
            className="w-full accent-accent cursor-pointer" />
          <div className="flex justify-between text-[10px] text-subtle mt-1">
            <span>10%</span><span className="text-accent font-medium">{(input.targetMargin * 100).toFixed(0)}%</span><span>60%</span>
          </div>
        </F>
        <F label={`ส่วนลด: ${input.discount}%`}>
          <input type="range" min="0" max="30" step="1" value={input.discount}
            onChange={e => set('discount', Number(e.target.value))}
            className="w-full accent-accent cursor-pointer" />
          <div className="flex justify-between text-[10px] text-subtle mt-1">
            <span>0%</span><span className="text-accent font-medium">{input.discount}%</span><span>30%</span>
          </div>
        </F>
        <Toggle on={input.includeVAT} onToggle={() => set('includeVAT', !input.includeVAT)} label="รวม VAT 7%" />

        {/* Custom @Options */}
        <div className="pt-2 border-t border-[var(--theme-border)]">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Tag size={10} className="text-accent" /> รายการพิเศษ
          </p>
          <AnimatePresence>
            {input.customOptions.map(opt => (
              <motion.div key={opt.id}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1.5 mb-1.5">
                <span className="flex-1 text-xs text-primary truncate bg-[var(--theme-surface)] rounded-lg px-2 py-1.5 border border-[var(--theme-border)]">
                  {opt.name}
                </span>
                <span className="text-xs text-accent font-semibold whitespace-nowrap">×{opt.qty} {opt.price.toLocaleString()}฿</span>
                <button onClick={() => set('customOptions', input.customOptions.filter(o => o.id !== opt.id))}
                  className="text-subtle hover:text-danger transition-colors p-0.5">
                  <X size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="flex gap-1.5 mt-1">
            <input placeholder="ชื่อรายการ..." value={newOption.name}
              onChange={e => setNewOption(p => ({ ...p, name: e.target.value }))}
              className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-[var(--theme-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/25 bg-[var(--theme-card)] text-primary" />
            <input type="number" min={0} placeholder="฿" value={newOption.price || ''}
              onChange={e => setNewOption(p => ({ ...p, price: Number(e.target.value) }))}
              className="w-14 px-2 py-1.5 text-xs border border-[var(--theme-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/25 bg-[var(--theme-card)] text-primary" />
            <input type="number" min={1} placeholder="x" value={newOption.qty}
              onChange={e => setNewOption(p => ({ ...p, qty: Number(e.target.value) }))}
              className="w-10 px-1.5 py-1.5 text-xs border border-[var(--theme-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/25 bg-[var(--theme-card)] text-primary" />
            <button disabled={!newOption.name || newOption.price <= 0}
              onClick={() => {
                set('customOptions', [...input.customOptions, { id: Date.now().toString(), ...newOption }])
                setNewOption({ name: '', price: 0, qty: 1 })
              }}
              className="px-2 py-1.5 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-40">
              <Plus size={12} />
            </button>
          </div>
        </div>
      </StepCard>

      {/* Reset */}
      <button onClick={() => { setInput(DEFAULT_INPUT); setResult(null) }}
        className="w-full flex items-center justify-center gap-2 py-2 text-xs text-muted hover:text-primary hover:bg-[var(--theme-hover)] rounded-xl transition-colors border border-[var(--theme-border)]">
        <RefreshCw size={11} /> รีเซตทั้งหมด
      </button>
    </div>
  )

  // ── Sticky result panel ────────────────────────────────────────
  const resultPanel = (
    <div className="p-4 space-y-3">

      {/* Price card */}
      <div className="border border-[var(--theme-border)] bg-[var(--theme-card)] rounded-xl overflow-hidden">
        {/* Header: big price */}
        <div className="p-4 border-b border-[var(--theme-border)]">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-1">ราคาขาย</p>
          {result ? (
            <>
              <AnimatedNumber value={result.sellingPrice} prefix="฿" className="text-3xl font-bold text-primary" />
              <p className="text-[10px] text-muted mt-0.5">{formatCurrency(result.pricePerSqm)} / ตร.ม.</p>
            </>
          ) : (
            <p className="text-2xl font-bold text-subtle">฿ —</p>
          )}
        </div>

        {/* Cost / profit / margin */}
        {result && (
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">ต้นทุน</span>
              <span className="font-semibold text-primary">{formatCurrency(result.netCost)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">กำไรขั้นต้น</span>
              <span className="font-semibold text-success">{formatCurrency(result.sellingPrice - result.netCost)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Margin</span>
              <span className="font-bold text-sm" style={{ color: marginColor }}>
                {result.grossMarginPercent.toFixed(1)}%
                <span className="ml-1 text-[10px] font-normal">
                  {result.grossMarginPercent >= 30 ? '✓ Healthy' : result.grossMarginPercent >= 20 ? '⚠ Moderate' : '✗ Low'}
                </span>
              </span>
            </div>
            {/* Margin bar */}
            <div className="h-1.5 bg-[var(--theme-border)] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: marginColor }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(result.grossMarginPercent * 2, 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Cost breakdown */}
        {result && (
          <div className="px-4 pb-4 space-y-2 border-t border-[var(--theme-border)] pt-3">
            {[
              { emoji: '📦', label: 'วัสดุแผ่นไม้', val: result.costBreakdown.boardMaterial },
              { emoji: '🎨', label: 'ผิว + Edge', val: result.costBreakdown.surfaceFinish + result.costBreakdown.edgebanding },
              { emoji: '🔧', label: 'อุปกรณ์', val: result.costBreakdown.hardware },
              { emoji: '👷', label: 'ค่าแรงรวม', val: result.costBreakdown.laborFactory + result.costBreakdown.laborInstallation },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between text-xs">
                <span className="text-muted">{row.emoji} {row.label}</span>
                <span className="font-medium text-primary">{formatCurrency(row.val)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smart suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          {suggestions.map((s, i) => (
            <div key={i} className={clsx(
              'flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs leading-relaxed',
              s.type === 'warn'
                ? 'bg-warning/8 border border-warning/20 text-warning'
                : 'bg-info/8 border border-info/20 text-info'
            )}>
              <span className="flex-shrink-0">{s.type === 'warn' ? '⚠' : '💡'}</span>
              <span>{s.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {result && (
        <div className="border border-[var(--theme-border)] bg-[var(--theme-card)] rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleCalculate} disabled={loading}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold gold-gradient text-white transition-all disabled:opacity-60">
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} คำนวณ
            </button>
            <button onClick={handleSave} disabled={saved}
              className={clsx('flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all',
                saved ? 'bg-success/10 text-success border border-success/20' : 'border border-[var(--theme-border)] text-primary hover:bg-[var(--theme-hover)]')}>
              {saved ? <CheckCircle size={12} /> : <Save size={12} />} {saved ? 'บันทึกแล้ว' : 'บันทึก'}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button onClick={handlePDF} disabled={exporting}
              className="flex items-center justify-center gap-1 py-2 border border-[var(--theme-border)] text-muted hover:text-primary hover:bg-[var(--theme-hover)] rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50">
              {exporting ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />} PDF
            </button>
            <button onClick={handleBOQ}
              className="flex items-center justify-center gap-1 py-2 border border-accent/30 text-accent hover:bg-accent/5 rounded-lg text-[11px] font-medium transition-colors">
              <FileText size={11} /> BOQ
            </button>
            <button onClick={handlePrint}
              className="flex items-center justify-center gap-1 py-2 border border-[var(--theme-border)] text-muted hover:text-primary hover:bg-[var(--theme-hover)] rounded-lg text-[11px] font-medium transition-colors">
              <Printer size={11} /> พิมพ์
            </button>
          </div>
        </div>
      )}

      {/* Structure health + cutting estimation */}
      <div className="border border-[var(--theme-border)] bg-[var(--theme-card)] rounded-xl p-3.5">
        <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
          <ShieldCheck size={10} className="text-accent" /> Structure Health
        </p>
        <StructureHealth input={input} />
      </div>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="border border-[var(--theme-border)] bg-[var(--theme-card)] rounded-xl p-3.5">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <Scissors size={10} className="text-accent" /> Cutting Estimation
          </p>
          <CuttingEstimation result={result} />
        </motion.div>
      )}

      {/* AI Analysis */}
      {result?.aiAnalysis && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="border border-[var(--theme-border)] bg-[var(--theme-card)] rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wide flex items-center gap-1.5">
              <Cpu size={10} className="text-accent" /> AI Analysis
            </p>
            <span className={clsx('text-xs px-2 py-0.5 rounded-full font-bold',
              result.aiAnalysis.score >= 70 ? 'bg-success/10 text-success'
              : result.aiAnalysis.score >= 40 ? 'bg-warning/10 text-warning'
              : 'bg-danger/10 text-danger')}>
              {result.aiAnalysis.score}/100
            </span>
          </div>
          <div className="space-y-1.5">
            {(result.aiAnalysis.warnings ?? []).map((w, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-warning bg-warning/8 rounded-xl p-2.5">
                <AlertTriangle size={10} className="flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{w.message}</span>
              </div>
            ))}
            {(result.aiAnalysis.suggestions ?? []).map((s, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-info bg-info/8 rounded-xl p-2.5">
                <CheckCircle size={10} className="flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed"><strong>{s.title}:</strong> {s.description}</span>
              </div>
            ))}
            {(result.aiAnalysis.warnings ?? []).length === 0 && (result.aiAnalysis.suggestions ?? []).length === 0 && (
              <p className="text-[11px] text-success flex items-center gap-1.5 p-2">
                <CheckCircle size={10} /> Margin ดี ไม่มีข้อแนะนำ
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* BOQ mini */}
      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="border border-[var(--theme-border)] bg-[var(--theme-card)] rounded-xl p-3.5">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <Package size={10} className="text-accent" /> BOQ ({(result.boqItems ?? []).length} รายการ)
          </p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {(result.boqItems ?? []).map(item => (
              <div key={item.id} className="flex items-center justify-between py-1 border-b border-[var(--theme-border)] last:border-0">
                <span className="text-[11px] text-muted truncate pr-2">{item.description}</span>
                <span className="text-[11px] font-semibold text-primary flex-shrink-0">{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Technical specs (technical mode) */}
      {viewMode === 'technical' && result && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border border-accent/20 bg-accent/5 rounded-xl p-3.5"
        >
          <p className="text-[10px] font-semibold text-accent uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <BarChart2 size={10} /> Technical Specs
          </p>
          <div className="space-y-1.5">
            {[
              ['พื้นที่ทั้งหมด', `${((input.width * input.height) / 10000).toFixed(2)} ตร.ม.`],
              ['บอร์ดหลัก', `${input.boardType} ${input.boardThickness}mm`],
              ['บอร์ดหลัง', `${input.backBoardType} ${input.backBoardThickness}mm`],
              ['ราคา/ตร.ม.', formatCurrency(result.pricePerSqm)],
              ['ต้นทุน/ตร.ม.', formatCurrency(result.netCost / Math.max((input.width * input.height) / 10000, 0.01))],
            ].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between text-[11px]">
                <span className="text-muted">{l}</span>
                <span className="font-semibold text-primary">{v}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )

  // ── Visualizer panel ───────────────────────────────────────────
  const visualPanel = (
    <div className="p-4 flex flex-col gap-4">
      <div className="relative rounded-xl overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-card)]"
        style={{ minHeight: 280 }}>
        {viewMode === 'technical' && (
          <div className="absolute inset-0 pointer-events-none z-10"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(var(--tw-accent),0.03) 0px, rgba(var(--tw-accent),0.03) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(var(--tw-accent),0.03) 0px, rgba(var(--tw-accent),0.03) 1px, transparent 1px, transparent 20px)' }} />
        )}
        <CabinetVisualizer input={input} />
      </div>

      {/* Dimension badges */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {[
          { label: 'W', value: input.width },
          { label: 'H', value: input.height },
          { label: 'D', value: input.depth },
        ].map(d => (
          <motion.div key={d.label} layout
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--theme-card)] rounded-xl border border-[var(--theme-border)]">
            <span className="text-[10px] text-muted font-medium">{d.label}</span>
            <span className="text-sm font-bold text-primary">{d.value}</span>
            <span className="text-[10px] text-subtle">ซม.</span>
          </motion.div>
        ))}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--theme-card)] rounded-xl border border-[var(--theme-border)]">
          <span className="text-[10px] text-muted font-medium">×</span>
          <span className="text-sm font-bold text-primary">{input.quantity}</span>
          <span className="text-[10px] text-subtle">ตู้</span>
        </div>
      </div>

      {!result && (
        <div className="rounded-xl border border-dashed border-[var(--theme-border)] p-8 text-center flex flex-col items-center justify-center">
          <Calculator size={32} className="text-subtle mb-3" />
          <p className="text-sm text-muted font-medium">กรอกชื่อโปรเจกต์เพื่อเริ่มคำนวณ</p>
          <p className="text-xs text-subtle mt-1">ระบบจะ Auto-Calculate ทันที</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 57px)', overflow: 'hidden', background: 'var(--theme-bg)' }}>

      {/* ── Top Context Bar ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2.5 bg-[var(--theme-card)] border-b border-[var(--theme-border)] z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Calculator size={13} className="text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-primary truncate">
              {input.projectName || 'โปรเจกต์ใหม่'}
            </p>
            <p className="text-[10px] text-muted truncate">{PROJECT_TYPE_LABELS[input.projectType]}</p>
          </div>
          {autoCalc && result && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="flex-shrink-0 flex items-center gap-1 text-[10px] text-success bg-success/8 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Auto
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-xl p-1">
            {([['clean', Eye, 'Preview'], ['technical', Grid, 'Technical']] as const).map(([mode, Icon, lbl]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                  viewMode === mode ? 'bg-[var(--theme-card)] text-primary shadow-sm' : 'text-muted hover:text-primary')}>
                <Icon size={11} />{lbl}
              </button>
            ))}
          </div>
          <button onClick={handleCalculate} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 gold-gradient text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-60">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} คำนวณ
          </button>
        </div>
      </div>

      {/* ── Mobile tab bar ── */}
      <div className="lg:hidden flex-shrink-0 flex items-center border-b border-[var(--theme-border)] bg-[var(--theme-card)]">
        {([['form', 'ข้อมูล', FileText], ['preview', 'ตัวอย่าง', Eye], ['analysis', 'ผลลัพธ์', BarChart2]] as const).map(([t, lbl, Icon]) => (
          <button key={t} onClick={() => setMobileTab(t as typeof mobileTab)}
            className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-colors',
              mobileTab === t ? 'border-accent text-accent' : 'border-transparent text-muted')}>
            <Icon size={13} />{lbl}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile: single panel */}
        <div className="lg:hidden h-full overflow-y-auto">
          {mobileTab === 'form' && formPanel}
          {mobileTab === 'preview' && visualPanel}
          {mobileTab === 'analysis' && resultPanel}
        </div>

        {/* Desktop: 2-column — left form (scrollable) + right sticky result */}
        <div className="hidden lg:flex h-full overflow-hidden">
          {/* Left: form + visualizer */}
          <div className="flex overflow-hidden border-r border-[var(--theme-border)]" style={{ width: '58%' }}>
            <div className="overflow-y-auto" style={{ width: '45%', borderRight: '1px solid var(--theme-border)' }}>
              {formPanel}
            </div>
            <div className="overflow-y-auto flex-1">
              {visualPanel}
            </div>
          </div>
          {/* Right: sticky result panel */}
          <div className="overflow-y-auto" style={{ width: '42%' }}>
            {resultPanel}
          </div>
        </div>
      </div>

      {/* ── Mobile sticky bottom summary ── */}
      {result && (
        <div className="lg:hidden flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-[var(--theme-card)] border-t border-[var(--theme-border)]">
          <div>
            <p className="text-[10px] text-muted">ราคาขาย</p>
            <AnimatedNumber value={result.sellingPrice} prefix="฿" className="text-base font-bold text-primary" />
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted">Margin</p>
            <p className="text-base font-bold" style={{ color: marginColor }}>{result.grossMarginPercent.toFixed(1)}%</p>
          </div>
          <button onClick={handleSave} disabled={saved}
            className={clsx('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
              saved ? 'bg-success/10 text-success' : 'gold-gradient text-white')}>
            {saved ? <CheckCircle size={12} /> : <Save size={12} />} {saved ? 'บันทึกแล้ว' : 'บันทึก'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Page Export ───────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={28} className="animate-spin text-gray-300" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}
