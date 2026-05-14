'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calculator, ChevronDown, ChevronUp, Loader2,
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

const inputCls = 'w-full px-3 py-2 text-sm border border-black/8 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/25 bg-white/70 backdrop-blur-sm transition-all placeholder:text-gray-300'
const labelCls = 'block text-[11px] font-medium text-gray-400 mb-1 uppercase tracking-wide'

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
        on ? 'bg-accent' : 'bg-gray-200'
      )}>
        <div className={clsx(
          'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200',
          on ? 'translate-x-4' : 'translate-x-0.5'
        )} />
      </div>
      <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">{label}</span>
    </button>
  )
}

// ─── Section Accordion ─────────────────────────────────────────────────────────

type SectionId = 'basic' | 'materials' | 'hardware' | 'pricing' | 'install'

interface SectionProps {
  id: SectionId
  open: SectionId
  onOpen: (id: SectionId) => void
  icon: React.ElementType
  label: string
  badge?: string
  children: React.ReactNode
}

function Section({ id, open, onOpen, icon: Icon, label, badge, children }: SectionProps) {
  const isOpen = open === id
  return (
    <div className="rounded-2xl overflow-hidden border border-black/[0.05] bg-white/80 backdrop-blur-sm">
      <button
        onClick={() => onOpen(isOpen ? 'basic' : id)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-black/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center',
            isOpen ? 'bg-accent text-white' : 'bg-gray-100 text-gray-400')}>
            <Icon size={13} />
          </div>
          <span className={clsx('text-sm font-semibold', isOpen ? 'text-primary' : 'text-gray-600')}>{label}</span>
          {badge && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{badge}</span>
          )}
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-gray-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 pt-0.5 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  const [section, setSection] = useState<SectionId>('basic')
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
    setSaved(true)
    success('บันทึกโปรเจกต์แล้ว')
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
    syncProjectToSheets({ ...sp })
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

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 57px)', overflow: 'hidden', background: '#F7F5F2' }}>

      {/* ── Top Context Bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 bg-white/80 backdrop-blur-md border-b border-black/[0.05] z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Calculator size={13} className="text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary truncate max-w-[180px]">
              {input.projectName || 'โปรเจกต์ใหม่'}
            </p>
            <p className="text-[10px] text-gray-400">{PROJECT_TYPE_LABELS[input.projectType]}</p>
          </div>
          {autoCalc && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 text-[10px] text-success bg-success/8 px-2 py-1 rounded-full"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Auto
            </motion.div>
          )}
        </div>

        {/* View Mode + Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {([['clean', Eye, 'Preview'], ['technical', Grid, 'Technical']] as const).map(([mode, Icon, lbl]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                  viewMode === mode ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600')}>
                <Icon size={11} />{lbl}
              </button>
            ))}
          </div>
          <button onClick={handleCalculate} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 gold-gradient text-white rounded-xl text-xs font-semibold hover:shadow-gold transition-all disabled:opacity-60">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
            คำนวณ
          </button>
        </div>
      </div>

      {/* ── 3-Column Body (responsive) ── */}
      {/* Extract panel JSX into variables for reuse in mobile tabs and desktop grid */}
      {(() => {
        const leftPanel = (
          <div className="p-3 space-y-2" style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest px-1 pb-1">Configuration</p>

            {/* Basic Info */}
            <Section id="basic" open={section} onOpen={setSection} icon={FileText} label="ข้อมูลพื้นฐาน">
              <F label="ชื่อโปรเจกต์ *">
                <input value={input.projectName} onChange={e => set('projectName', e.target.value)}
                  placeholder="ห้องนอนคุณสมชาย..." className={inputCls} />
              </F>
              <F label="ชื่อลูกค้า">
                <input value={input.customerName} onChange={e => set('customerName', e.target.value)}
                  placeholder="คุณสมชาย ใจดี" className={inputCls} />
              </F>
              <F label="ประเภทงาน">
                <Sel value={input.projectType} onChange={v => set('projectType', v as CabinetInput['projectType'])} options={PROJECT_TYPE_LABELS} />
              </F>
              <F label="การติดตั้ง">
                <Sel value={input.installationType} onChange={v => set('installationType', v as CabinetInput['installationType'])}
                  options={{ HOUSE: 'บ้าน', CONDO: 'คอนโด', OFFICE: 'ออฟฟิศ', SHOPHOUSE: 'ตึกแถว' }} />
              </F>
              <div>
                <label className={labelCls}>ขนาด (ซม.)</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">กว้าง</p>
                    <Num value={input.width} onChange={v => set('width', v)} min={30} max={600} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">สูง</p>
                    <Num value={input.height} onChange={v => set('height', v)} min={30} max={300} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">ลึก</p>
                    <Num value={input.depth} onChange={v => set('depth', v)} min={20} max={100} />
                  </div>
                </div>
              </div>
            </Section>

            {/* Materials */}
            <Section id="materials" open={section} onOpen={setSection} icon={Layers} label="วัสดุ & ผิวสัมผัส">
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
              <F label="ประตู">
                <Sel value={input.doorType} onChange={v => set('doorType', v as CabinetInput['doorType'])} options={DOOR_TYPE_LABELS} />
              </F>
            </Section>

            {/* Hardware */}
            <Section id="hardware" open={section} onOpen={setSection} icon={Wrench} label="อุปกรณ์ & มือจับ">
              <F label="แบรนด์อุปกรณ์">
                <Sel value={input.hardwareBrand} onChange={v => set('hardwareBrand', v as CabinetInput['hardwareBrand'])} options={HARDWARE_BRAND_LABELS} />
              </F>
              <F label="รูปแบบมือจับ">
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.entries(HANDLE_TYPE_LABELS) as [CabinetInput['handleType'], string][]).map(([k, lbl]) => (
                    <button key={k} onClick={() => set('handleType', k)}
                      className={clsx('px-2 py-1.5 text-xs rounded-xl border text-left transition-all font-medium',
                        input.handleType === k
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-black/8 text-gray-500 bg-white hover:border-gray-300')}>
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

              {/* Custom @Options */}
              <div className="pt-2 border-t border-black/5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Tag size={10} className="text-accent" /> รายการพิเศษ (@Option)
                </p>
                <AnimatePresence>
                  {input.customOptions.map(opt => (
                    <motion.div key={opt.id}
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1.5 mb-1.5">
                      <span className="flex-1 text-xs text-gray-700 truncate bg-gray-50 rounded-lg px-2 py-1.5 border border-black/5">
                        {opt.name}
                      </span>
                      <span className="text-xs text-accent font-semibold whitespace-nowrap">×{opt.qty} {opt.price.toLocaleString()}฿</span>
                      <button onClick={() => set('customOptions', input.customOptions.filter(o => o.id !== opt.id))}
                        className="text-gray-300 hover:text-danger transition-colors p-0.5">
                        <X size={12} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div className="flex gap-1.5 mt-1">
                  <input placeholder="ชื่อรายการ..." value={newOption.name}
                    onChange={e => setNewOption(p => ({ ...p, name: e.target.value }))}
                    className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-black/8 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/25 bg-white" />
                  <input type="number" min={0} placeholder="฿" value={newOption.price || ''}
                    onChange={e => setNewOption(p => ({ ...p, price: Number(e.target.value) }))}
                    className="w-14 px-2 py-1.5 text-xs border border-black/8 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/25 bg-white" />
                  <input type="number" min={1} placeholder="x" value={newOption.qty}
                    onChange={e => setNewOption(p => ({ ...p, qty: Number(e.target.value) }))}
                    className="w-10 px-1.5 py-1.5 text-xs border border-black/8 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/25 bg-white" />
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
            </Section>

            {/* Pricing */}
            <Section id="pricing" open={section} onOpen={setSection} icon={TrendingUp} label="Margin & ส่วนลด">
              <F label={`Margin Target: ${(input.targetMargin * 100).toFixed(0)}%`}>
                <input type="range" min="0.10" max="0.60" step="0.05" value={input.targetMargin}
                  onChange={e => set('targetMargin', Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer" />
                <div className="flex justify-between text-[10px] text-gray-300 mt-1">
                  <span>10%</span><span className="text-accent font-medium">{(input.targetMargin * 100).toFixed(0)}%</span><span>60%</span>
                </div>
              </F>
              <F label={`ส่วนลด: ${input.discount}%`}>
                <input type="range" min="0" max="30" step="1" value={input.discount}
                  onChange={e => set('discount', Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer" />
                <div className="flex justify-between text-[10px] text-gray-300 mt-1">
                  <span>0%</span>
                  <span className="text-accent font-medium">{input.discount}%</span>
                  <span>30%</span>
                </div>
              </F>
              <Toggle on={input.includeVAT} onToggle={() => set('includeVAT', !input.includeVAT)} label="รวม VAT 7%" />
            </Section>

            {/* Reset */}
            <button onClick={() => { setInput(DEFAULT_INPUT); setResult(null) }}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-black/5 mt-1">
              <RefreshCw size={11} /> รีเซตทั้งหมด
            </button>
          </div>
        )

        const centerPanel = (
          <div className="p-4 flex flex-col gap-4">
            {/* Visualizer card */}
            <div className="relative rounded-2xl overflow-hidden border border-black/[0.05] bg-white shadow-sm"
              style={{ minHeight: 280 }}>
              {viewMode === 'technical' && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-white/0"
                    style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(198,169,105,0.04) 0px, rgba(198,169,105,0.04) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(198,169,105,0.04) 0px, rgba(198,169,105,0.04) 1px, transparent 1px, transparent 20px)' }} />
                </div>
              )}
              <CabinetVisualizer input={input} />
            </div>

            {/* Dimension badges */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {[
                { icon: Ruler, label: 'W', value: input.width, unit: 'ซม.' },
                { icon: Ruler, label: 'H', value: input.height, unit: 'ซม.' },
                { icon: Ruler, label: 'D', value: input.depth, unit: 'ซม.' },
              ].map(d => (
                <motion.div key={d.label}
                  layout
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-black/[0.05] shadow-sm">
                  <span className="text-[10px] text-gray-400 font-medium">{d.label}</span>
                  <span className="text-sm font-bold text-primary">{d.value}</span>
                  <span className="text-[10px] text-gray-300">{d.unit}</span>
                </motion.div>
              ))}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-black/[0.05] shadow-sm">
                <span className="text-[10px] text-gray-400 font-medium">×</span>
                <span className="text-sm font-bold text-primary">{input.quantity}</span>
                <span className="text-[10px] text-gray-300">ตู้</span>
              </div>
            </div>

            {/* Floating Cost Card */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl overflow-hidden border border-black/[0.05] shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #1a1512 0%, #2a2118 50%, #1a1512 100%)' }}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5">ราคาขายสุทธิ</p>
                        <div className="flex items-end gap-2">
                          <AnimatedNumber value={result.sellingPrice} className="text-3xl font-bold text-white" />
                          <span className="text-white/30 text-sm mb-0.5">฿</span>
                        </div>
                        <p className="text-white/30 text-xs mt-1">
                          {formatCurrency(result.pricePerSqm)} / ตร.ม.
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5">Gross Margin</p>
                        <motion.p
                          key={result.grossMarginPercent}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-2xl font-bold"
                          style={{ color: marginColor }}
                        >
                          {result.grossMarginPercent.toFixed(1)}%
                        </motion.p>
                        <p className="text-white/25 text-[10px] mt-1">
                          {result.grossMarginPercent >= 30 ? '✓ Healthy' : result.grossMarginPercent >= 20 ? '⚠ Moderate' : '✗ Low'}
                        </p>
                      </div>
                    </div>

                    {/* Cost bars */}
                    <div className="space-y-2.5 pt-4 border-t border-white/8">
                      {[
                        { label: 'วัสดุแผ่นไม้', val: result.costBreakdown.boardMaterial, color: '#C6A969' },
                        { label: 'ผิว + Edge', val: result.costBreakdown.surfaceFinish + result.costBreakdown.edgebanding, color: '#8BB5D4' },
                        { label: 'อุปกรณ์', val: result.costBreakdown.hardware, color: '#A8D8A0' },
                        { label: 'ค่าแรง', val: result.costBreakdown.laborFactory + result.costBreakdown.laborInstallation, color: '#D4A0A8' },
                      ].map(row => (
                        <div key={row.label}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-white/50">{row.label}</span>
                            <span className="text-white/70 font-medium">{formatCurrency(row.val)}</span>
                          </div>
                          <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: row.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max((row.val / result.netCost) * 100, 2)}%` }}
                              transition={{ duration: 0.7, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Net cost summary */}
                    <div className="mt-4 pt-3 border-t border-white/8 flex items-center justify-between">
                      <span className="text-white/40 text-xs">ต้นทุนสุทธิ</span>
                      <span className="text-white/80 text-sm font-semibold">{formatCurrency(result.netCost)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Placeholder when no result */}
            {!result && (
              <div className="rounded-2xl border border-dashed border-black/10 p-8 text-center flex flex-col items-center justify-center">
                <Calculator size={32} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400 font-medium">กรอกชื่อโปรเจกต์เพื่อเริ่มคำนวณ</p>
                <p className="text-xs text-gray-300 mt-1">ระบบจะ Auto-Calculate ทันที</p>
              </div>
            )}
          </div>
        )

        const rightPanel = (
          <div className="p-3 space-y-3" style={{ background: '#FAFAF8' }}>
            <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest px-1 pb-1">Analysis</p>

            {/* Structure Health */}
            <div className="rounded-2xl border border-black/[0.05] bg-white p-3.5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <ShieldCheck size={10} className="text-accent" /> Structure Health
              </p>
              <StructureHealth input={input} />
            </div>

            {/* Cutting Estimation */}
            {result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-black/[0.05] bg-white p-3.5"
              >
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <Scissors size={10} className="text-accent" /> Cutting Estimation
                </p>
                <CuttingEstimation result={result} />
              </motion.div>
            )}

            {/* AI Analysis */}
            {result?.aiAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-black/[0.05] bg-white p-3.5"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
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
                  {result.aiAnalysis.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-orange-700 bg-orange-50/80 rounded-xl p-2.5">
                      <AlertTriangle size={10} className="flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{w.message}</span>
                    </div>
                  ))}
                  {result.aiAnalysis.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-blue-700 bg-blue-50/80 rounded-xl p-2.5">
                      <CheckCircle size={10} className="flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed"><strong>{s.title}:</strong> {s.description}</span>
                    </div>
                  ))}
                  {result.aiAnalysis.warnings.length === 0 && result.aiAnalysis.suggestions.length === 0 && (
                    <p className="text-[11px] text-success flex items-center gap-1.5 p-2">
                      <CheckCircle size={10} /> Margin ดี ไม่มีข้อแนะนำ
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* BOQ Mini */}
            {result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-black/[0.05] bg-white p-3.5"
              >
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <Package size={10} className="text-accent" /> BOQ ({result.boqItems.length} รายการ)
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.boqItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-1 border-b border-black/[0.04] last:border-0">
                      <span className="text-[11px] text-gray-500 truncate pr-2">{item.description}</span>
                      <span className="text-[11px] font-semibold text-primary flex-shrink-0">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            {result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-black/[0.05] bg-white p-3.5 space-y-2"
              >
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Actions</p>
                <button onClick={handleSave} disabled={saved}
                  className={clsx('w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all',
                    saved ? 'bg-success/10 text-success border border-success/20' : 'gold-gradient text-white hover:shadow-gold')}>
                  {saved ? <><CheckCircle size={12} /> บันทึกแล้ว</> : <><Save size={12} /> บันทึกโปรเจกต์</>}
                </button>
                <div className="grid grid-cols-3 gap-1.5">
                  <button onClick={handlePrint}
                    className="flex items-center justify-center gap-1 py-2 border border-black/8 text-gray-500 hover:bg-gray-50 rounded-xl text-[11px] font-medium transition-colors">
                    <Printer size={11} /> พิมพ์
                  </button>
                  <button onClick={handleBOQ}
                    className="flex items-center justify-center gap-1 py-2 border border-accent/30 text-accent hover:bg-accent/5 rounded-xl text-[11px] font-medium transition-colors">
                    <FileText size={11} /> BOQ
                  </button>
                  <button onClick={handlePDF} disabled={exporting}
                    className="flex items-center justify-center gap-1 py-2 border border-black/8 text-gray-500 hover:bg-gray-50 rounded-xl text-[11px] font-medium transition-colors disabled:opacity-50">
                    {exporting ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />} PDF
                  </button>
                </div>
              </motion.div>
            )}

            {/* Specs summary (technical mode) */}
            {viewMode === 'technical' && result && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl border border-accent/20 bg-accent/5 p-3.5"
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
                      <span className="text-gray-500">{l}</span>
                      <span className="font-semibold text-primary">{v}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )

        return (
          <>
            {/* Mobile tab bar (below lg) */}
            <div className="lg:hidden flex-shrink-0 flex items-center border-b border-black/[0.05] bg-white/90">
              {([['form', 'ข้อมูล', FileText], ['preview', 'ตัวอย่าง', Eye], ['analysis', 'วิเคราะห์', BarChart2]] as const).map(([t, lbl, Icon]) => (
                <button key={t} onClick={() => setMobileTab(t as typeof mobileTab)}
                  className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-colors',
                    mobileTab === t ? 'border-accent text-accent' : 'border-transparent text-gray-400')}>
                  <Icon size={13} />{lbl}
                </button>
              ))}
            </div>

            {/* Body: mobile single-panel or desktop 3-column */}
            <div className="flex-1 overflow-hidden">
              {/* Mobile single panel */}
              <div className="lg:hidden h-full overflow-y-auto">
                {mobileTab === 'form' && leftPanel}
                {mobileTab === 'preview' && centerPanel}
                {mobileTab === 'analysis' && rightPanel}
              </div>

              {/* Desktop 3-column grid */}
              <div className="hidden lg:grid h-full overflow-hidden" style={{ gridTemplateColumns: '27% 1fr 22%' }}>
                <div className="overflow-y-auto border-r border-black/[0.05]">{leftPanel}</div>
                <div className="overflow-y-auto">{centerPanel}</div>
                <div className="overflow-y-auto border-l border-black/[0.05]">{rightPanel}</div>
              </div>
            </div>
          </>
        )
      })()}
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
