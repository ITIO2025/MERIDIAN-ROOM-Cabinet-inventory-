'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdCalculate, MdRefresh, MdDescription, MdDownload, MdPrint, MdSave, MdCheckCircle,
  MdWarning, MdTrendingUp, MdInventory, MdBuild, MdLayers, MdMemory, MdVerified,
  MdContentCut, MdBarChart, MdBolt, MdAdd, MdClose, MdLocalOffer, MdStraighten,
  MdExpandMore, MdRestaurant, MdCheckroom, MdTv, MdDoorFront, MdWeekend, MdStar,
  MdWork, MdGridView, MdArrowForward, MdAutoAwesome,
} from 'react-icons/md'
import { calculatePricing, formatCurrency } from '@/lib/pricing-engine'
import { saveProject } from '@/lib/storage'
import { generateBOQPDF } from '@/lib/pdf-generator'
import { useToast } from '@/context/ToastContext'
import type { CabinetInput, CustomOption } from '@/lib/types'
import {
  PROJECT_TYPE_LABELS, BOARD_TYPE_LABELS, SURFACE_TYPE_LABELS,
  DOOR_TYPE_LABELS, HARDWARE_BRAND_LABELS, HANDLE_TYPE_LABELS,
} from '@/lib/types'
import clsx from 'clsx'
import CabinetVisualizerWrapper from '@/components/CabinetVisualizer3DWrapper'
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

// ─── Project type visual config ────────────────────────────────────────────────

const PROJECT_TYPE_ICONS: Record<string, { icon: React.ElementType; emoji: string; color: string }> = {
  WARDROBE:         { icon: MdCheckroom,   emoji: '👔', color: '#7C3AED' },
  WALK_IN:          { icon: MdDoorFront,   emoji: '🚪', color: '#059669' },
  TV_CABINET:       { icon: MdTv,          emoji: '📺', color: '#2563EB' },
  KITCHEN:          { icon: MdRestaurant,  emoji: '🍳', color: '#D97706' },
  PANTRY:           { icon: MdInventory,   emoji: '🧺', color: '#0891B2' },
  VANITY:           { icon: MdWeekend,     emoji: '🪞', color: '#DB2777' },
  COUNTER:          { icon: MdGridView,    emoji: '🔲', color: '#64748B' },
  SHOE_CABINET:     { icon: MdLayers,      emoji: '👟', color: '#16A34A' },
  DISPLAY_CABINET:  { icon: MdStar,        emoji: '🏺', color: '#B45309' },
  FLOATING_CABINET: { icon: MdArrowForward,emoji: '🛋️', color: '#4F46E5' },
  FULL_HEIGHT:      { icon: MdStraighten,  emoji: '📐', color: '#0E7490' },
  OFFICE:           { icon: MdWork,        emoji: '💼', color: '#374151' },
  LUXURY:           { icon: MdAutoAwesome, emoji: '✨', color: '#C6A969' },
}

// ─── Material visual swatches ──────────────────────────────────────────────────

const SURFACE_SWATCHES: Record<string, { color: string; shine?: boolean }> = {
  MELAMINE: { color: '#EDE8E0' },
  LAMINATE: { color: '#A0845C' },
  ACRYLIC:  { color: '#A8C8E8', shine: true },
  VENEER:   { color: '#C8A478' },
  HIGLOSS:  { color: '#E8E8E8', shine: true },
  PU_PAINT: { color: '#D4C4A8' },
  VACUUM:   { color: '#C8B898' },
}

// ─── Animated Number ───────────────────────────────────────────────────────────

function AnimatedNumber({ value, prefix = '', suffix = '', className = '' }: {
  value: number; prefix?: string; suffix?: string; className?: string
}) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    const start = prev.current; const end = value
    const duration = 600; const startTime = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(start + (end - start) * eased))
      if (p < 1) frame.current = requestAnimationFrame(tick)
      else prev.current = end
    }
    if (frame.current) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(tick)
    return () => { if (frame.current) cancelAnimationFrame(frame.current) }
  }, [value])

  return <span className={className}>{prefix}{display.toLocaleString('th-TH')}{suffix}</span>
}

// ─── Accordion Section ─────────────────────────────────────────────────────────

function ConfigSection({
  id, title, icon: Icon, badge, defaultOpen = true, summary, children,
  openSections, toggle,
}: {
  id: string; title: string; icon: React.ElementType; badge?: string | number
  defaultOpen?: boolean; summary?: string; children: React.ReactNode
  openSections: Set<string>; toggle: (id: string) => void
}) {
  const open = openSections.has(id)
  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-card)]">
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--theme-hover)] transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-xl bg-accent/12 flex items-center justify-center flex-shrink-0">
          <Icon size={13} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary">{title}</p>
          {!open && summary && <p className="text-[10px] text-muted truncate mt-0.5">{summary}</p>}
        </div>
        {badge != null && (
          <span className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded-full font-bold flex-shrink-0">
            {badge}
          </span>
        )}
        <MdExpandMore
          size={14}
          className={clsx('text-muted transition-transform duration-200 flex-shrink-0', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--theme-border)] px-4 pb-4 pt-3 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Project Type Grid ─────────────────────────────────────────────────────────

function ProjectTypeGrid({ value, onChange }: {
  value: string; onChange: (v: string) => void
}) {
  const entries = Object.entries(PROJECT_TYPE_ICONS)
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {entries.map(([id, cfg]) => {
        const active = value === id
        return (
          <motion.button
            key={id}
            onClick={() => onChange(id)}
            whileTap={{ scale: 0.95 }}
            className={clsx(
              'flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-all text-center',
              active
                ? 'border-accent bg-accent/10 shadow-sm shadow-accent/20'
                : 'border-[var(--theme-border)] hover:border-accent/40 bg-[var(--theme-card)] hover:bg-[var(--theme-hover)]'
            )}
          >
            <span className="text-base leading-none">{cfg.emoji}</span>
            <span className={clsx(
              'text-[9px] font-semibold leading-tight',
              active ? 'text-accent' : 'text-muted'
            )}>
              {PROJECT_TYPE_LABELS[id as keyof typeof PROJECT_TYPE_LABELS] ?? id}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

// ─── Surface Material Grid ─────────────────────────────────────────────────────

function SurfaceGrid({ value, onChange }: {
  value: string; onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {(Object.entries(SURFACE_SWATCHES) as [string, { color: string; shine?: boolean }][]).map(([id, cfg]) => {
        const active = value === id
        return (
          <motion.button
            key={id}
            onClick={() => onChange(id)}
            whileTap={{ scale: 0.96 }}
            className={clsx(
              'flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all',
              active
                ? 'border-accent bg-accent/8 shadow-sm'
                : 'border-[var(--theme-border)] hover:border-accent/40 bg-[var(--theme-card)] hover:bg-[var(--theme-hover)]'
            )}
          >
            <span
              className="w-5 h-5 rounded-lg flex-shrink-0 border border-black/10"
              style={{
                background: cfg.shine
                  ? `linear-gradient(135deg, ${cfg.color}, #fff 60%, ${cfg.color})`
                  : cfg.color,
              }}
            />
            <span className={clsx(
              'text-[10px] font-semibold truncate',
              active ? 'text-accent' : 'text-muted'
            )}>
              {SURFACE_TYPE_LABELS[id as keyof typeof SURFACE_TYPE_LABELS] ?? id}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

// ─── Smart Dimension Input ─────────────────────────────────────────────────────

function DimInput({ label, unit = 'ซม.', value, onChange, min, max, presets }: {
  label: string; unit?: string; value: number; onChange: (v: number) => void
  min: number; max: number; presets?: number[]
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wide">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold text-primary">{value}</span>
          <span className="text-[10px] text-subtle">{unit}</span>
        </div>
      </div>
      {presets && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {presets.map(p => (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={clsx(
                'px-2 py-0.5 text-[10px] rounded-lg border font-medium transition-all',
                value === p
                  ? 'bg-accent text-white border-accent'
                  : 'border-[var(--theme-border)] text-muted hover:border-accent hover:text-accent'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="range-premium w-full"
        style={{ background: `linear-gradient(to right, rgb(var(--tw-accent)) ${((value - min) / (max - min)) * 100}%, var(--theme-border) 0%)` }}
      />
    </div>
  )
}

// ─── Editable Dimension Chip (bottom strip of 3D view) ────────────────────────

function EditableDimChip({ label, value, unit, onChange, min, max }: {
  label: string; value: number; unit: string
  onChange: (v: number) => void; min: number; max: number
}) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const open  = () => { setEditing(true); setTimeout(() => inputRef.current?.select(), 30) }
  const close = () => setEditing(false)
  const commit = (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === 'Escape') close() }

  return (
    <button
      onClick={open}
      className="group text-center focus:outline-none"
      title={`คลิกแก้ไข ${label}`}
    >
      <p className="text-[9px] text-muted font-medium group-hover:text-accent transition-colors">{label}</p>
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
          onBlur={close}
          onKeyDown={commit}
          className="w-14 text-sm font-bold text-center bg-transparent border-b-2 border-accent focus:outline-none text-primary"
          style={{ MozAppearance: 'textfield' }}
        />
      ) : (
        <p className="text-sm font-bold text-primary leading-none mt-0.5 group-hover:text-accent transition-colors">
          {value}<span className="text-[9px] font-normal text-subtle ml-0.5">{unit}</span>
        </p>
      )}
    </button>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onToggle, label, description }: {
  on: boolean; onToggle: () => void; label: string; description?: string
}) {
  return (
    <button onClick={onToggle} className="flex items-center gap-3 group w-full text-left">
      <div className={clsx(
        'relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0',
        on ? 'bg-accent' : 'bg-[var(--theme-border)]'
      )}>
        <div className={clsx(
          'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200',
          on ? 'translate-x-4' : 'translate-x-0.5'
        )} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-primary group-hover:text-accent transition-colors">{label}</p>
        {description && <p className="text-[10px] text-subtle">{description}</p>}
      </div>
    </button>
  )
}

// ─── Input primitives ─────────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 text-sm border border-[var(--theme-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/25 bg-[var(--theme-card)] text-primary placeholder:text-subtle transition-all'
const labelCls = 'block text-[10px] font-semibold text-muted uppercase tracking-wide mb-1.5'

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={labelCls}>{label}</label>{children}</div>
}

function Sel({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: Record<string, string>
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={clsx(inputCls, 'cursor-pointer')}>
      {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  )
}

function Num({ value, onChange, min, max }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <input type="number" value={value} min={min} max={max}
      onChange={e => onChange(Number(e.target.value))} className={inputCls} />
  )
}

// ─── Structure Health Badge ────────────────────────────────────────────────────

function StructureHealth({ input }: { input: CabinetInput }) {
  const sections = Math.max(input.shelfCount + 1, 1)
  const spanMm   = (input.width * 10) / sections
  const depthCm  = input.depth

  let level: 'STABLE' | 'MEDIUM' | 'REINFORCE'
  let color: string; let bg: string

  if (spanMm <= 600 && depthCm <= 65) { level = 'STABLE';    color = '#00A86B'; bg = '#00A86B18' }
  else if (spanMm <= 900)              { level = 'MEDIUM';    color = '#FFB800'; bg = '#FFB80018' }
  else                                 { level = 'REINFORCE'; color = '#E53935'; bg = '#E5393518' }

  const labels = { STABLE: 'โครงสร้างแข็งแรง', MEDIUM: 'ควรเสริมแผ่นกั้น', REINFORCE: 'ต้องเสริมโครงสร้าง' }
  const icons  = { STABLE: '🛡️', MEDIUM: '⚠️', REINFORCE: '🔴' }

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: bg }}>
      <span className="text-sm">{icons[level]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold" style={{ color }}>{labels[level]}</p>
        <p className="text-[9px] text-subtle mt-0.5">ช่วงพาด {spanMm.toFixed(0)} มม./ช่วง</p>
      </div>
    </div>
  )
}

// ─── Cutting Estimation ────────────────────────────────────────────────────────

function CuttingEstimation({ result }: { result: ReturnType<typeof calculatePricing> }) {
  const area        = result.totalAreaSqm ?? 0
  const sheets      = result.totalSheetsUsed ?? Math.ceil(area / 2.97)
  const wastePercent = result.wastePercent ?? 0
  const wasteColor  = wastePercent < 15 ? '#00A86B' : wastePercent < 25 ? '#FFB800' : '#E53935'

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'พื้นที่รวม', val: `${area.toFixed(2)} ตร.ม.` },
          { label: 'แผ่นที่ใช้', val: `${sheets} แผ่น` },
        ].map(r => (
          <div key={r.label} className="text-center p-2 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)]">
            <p className="text-sm font-bold text-primary">{r.val}</p>
            <p className="text-[9px] text-subtle mt-0.5">{r.label}</p>
          </div>
        ))}
      </div>
      <div>
        <div className="flex justify-between text-[10px] mb-1.5">
          <span className="text-muted font-medium">Waste</span>
          <span className="font-bold" style={{ color: wasteColor }}>{wastePercent.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-[var(--theme-border)] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: wasteColor }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(wastePercent * 2, 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
      {wastePercent > 20 && (
        <p className="text-[10px] text-amber-600 bg-amber-500/8 border border-amber-500/20 rounded-xl px-2.5 py-2 leading-relaxed">
          💡 ปรับขนาดเป็น 60/120/240 ซม. ลด waste ได้อีก ~{(wastePercent - 12).toFixed(0)}%
        </p>
      )}
    </div>
  )
}

// ─── Margin Ring (SVG arc gauge) ───────────────────────────────────────────────

function MarginRing({ percent, color }: { percent: number; color: string }) {
  const r = 28; const cx = 36; const cy = 36
  const circ = 2 * Math.PI * r
  const filled = Math.min(percent / 100, 1) * circ * 0.75 // 75% of circle = 270°
  const dash = `${filled} ${circ}`

  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <svg width="72" height="72" className="-rotate-[225deg]">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--theme-border)" strokeWidth="5"
          strokeDasharray={`${circ * 0.75} ${circ}`} strokeLinecap="round" />
        <motion.circle
          cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: dash }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-primary leading-none" style={{ color }}>
          {percent.toFixed(0)}%
        </span>
        <span className="text-[8px] text-muted mt-0.5">margin</span>
      </div>
    </div>
  )
}

// ─── Cost Bar row ──────────────────────────────────────────────────────────────

function CostBar({ emoji, label, value, total, color }: {
  emoji: string; label: string; value: number; total: number; color: string
}) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="flex items-center gap-1.5 text-muted">
          <span>{emoji}</span>{label}
        </span>
        <span className="font-semibold text-primary">{formatCurrency(value)}</span>
      </div>
      <div className="h-1.5 bg-[var(--theme-border)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ─── Handle Type Selector ──────────────────────────────────────────────────────

const HANDLE_VISUALS: Record<string, { emoji: string }> = {
  BAR:        { emoji: '▬' },
  KNOB:       { emoji: '●' },
  RECESSED:   { emoji: '▭' },
  INTEGRATED: { emoji: '∅' },
  NONE:       { emoji: '✕' },
}

// ─── Main Content ──────────────────────────────────────────────────────────────

function PricingContent() {
  const { success, error: toastError } = useToast()
  const [input, setInput] = useState<CabinetInput>(DEFAULT_INPUT)
  const [result, setResult] = useState<ReturnType<typeof calculatePricing> | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newOption, setNewOption] = useState({ name: '', price: 0, qty: 1 })
  const [autoCalc] = useState(true)
  const [mobileTab, setMobileTab] = useState<'form' | 'preview' | 'analysis'>('form')
  const calcTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Accordion state — open by default
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(['project', 'dimensions', 'material', 'doors', 'hardware', 'pricing'])
  )
  const toggleSection = useCallback((id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const set = useCallback(<K extends keyof CabinetInput>(key: K, val: CabinetInput[K]) =>
    setInput(prev => ({ ...prev, [key]: val })), [])

  // Auto-calculate
  useEffect(() => {
    if (!autoCalc) return
    if (calcTimeout.current) clearTimeout(calcTimeout.current)
    calcTimeout.current = setTimeout(() => {
      const r = calculatePricing(input)
      setResult(r)
    }, 350)
    return () => { if (calcTimeout.current) clearTimeout(calcTimeout.current) }
  }, [input, autoCalc])

  const handleCalculate = useCallback(() => {
    setLoading(true)
    setTimeout(() => { setResult(calculatePricing(input)); setLoading(false) }, 300)
  }, [input])

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
    setSaved(true); success('บันทึกแล้ว')
    setTimeout(() => setSaved(false), 3000)
    const prefs = getLinePrefs()
    if (prefs.newProject) {
      sendLine(lineNewProject({
        projectName: input.projectName || 'ไม่ระบุชื่อ',
        customerName: input.customerName || 'ไม่ระบุลูกค้า',
        projectType: PROJECT_TYPE_LABELS[input.projectType] ?? input.projectType,
        sellingPrice: result.sellingPrice, margin: result.grossMarginPercent ?? 0,
      }))
    }
    try { await syncProjectToSheets({ ...sp }) }
    catch (e) { console.warn('[sheets-sync] failed:', e) }
  }, [result, input, success])

  const handlePDF = useCallback(() => {
    if (!result) return
    // Open Thai-font print page (TH Sarabun via browser print = best quality)
    sessionStorage.setItem('meridian_pricing_print', JSON.stringify({ result, input }))
    window.open('/pricing/print', '_blank')
  }, [result, input])

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

  const suggestions: { type: 'warn' | 'tip'; msg: string }[] = []
  if (input.width > 300) suggestions.push({ type: 'tip', msg: 'แนะนำแบ่งเป็น 2 ตู้ ลด waste และง่ายต่อขนส่ง' })
  if (result && result.grossMarginPercent < 20) {
    suggestions.push({ type: 'warn', msg: `Margin ต่ำ — ราคาควรอยู่ที่ ${formatCurrency(Math.ceil(result.netCost / 0.80 / 1000) * 1000)} เพื่อได้ 20%` })
  }
  if (input.shelfCount === 0 && input.projectType === 'WARDROBE') {
    suggestions.push({ type: 'tip', msg: 'เพิ่มชั้นวางเพื่อเสริมมูลค่าและรายได้' })
  }

  // ── Form Panel ─────────────────────────────────────────────────────────────
  const formPanel = (
    <div className="p-3 space-y-2">

      {/* ─ Section 1: Project ─ */}
      <ConfigSection
        id="project" title="โปรเจกต์" icon={MdDescription}
        summary={input.projectName || PROJECT_TYPE_LABELS[input.projectType]}
        openSections={openSections} toggle={toggleSection}
      >
        <F label="ชื่อโปรเจกต์">
          <input value={input.projectName} onChange={e => set('projectName', e.target.value)}
            placeholder="เช่น ห้องนอนคุณสมชาย..." className={inputCls} />
        </F>
        <F label="ชื่อลูกค้า">
          <input value={input.customerName} onChange={e => set('customerName', e.target.value)}
            placeholder="คุณสมชาย ใจดี" className={inputCls} />
        </F>
        <div>
          <label className={labelCls}>ประเภทงาน</label>
          <ProjectTypeGrid
            value={input.projectType}
            onChange={v => set('projectType', v as CabinetInput['projectType'])}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <F label="การติดตั้ง">
            <Sel value={input.installationType}
              onChange={v => set('installationType', v as CabinetInput['installationType'])}
              options={{ HOUSE: '🏠 บ้าน', CONDO: '🏢 คอนโด', OFFICE: '💼 ออฟฟิศ', SHOPHOUSE: '🏪 ตึกแถว' }} />
          </F>
          <F label="จำนวนตู้">
            <Num value={input.quantity} onChange={v => set('quantity', v)} min={1} max={20} />
          </F>
        </div>
      </ConfigSection>

      {/* ─ Section 2: Dimensions ─ */}
      <ConfigSection
        id="dimensions" title="ขนาด & โครงสร้าง" icon={MdStraighten}
        summary={`W${input.width} × H${input.height} × D${input.depth} ซม.`}
        badge={`${((input.width * input.height * input.depth) / 1000000).toFixed(2)} ม³`}
        openSections={openSections} toggle={toggleSection}
      >
        <DimInput label="กว้าง" value={input.width} onChange={v => set('width', v)}
          min={30} max={600} presets={[180, 200, 240, 280, 320, 360, 400]} />
        <DimInput label="สูง" value={input.height} onChange={v => set('height', v)}
          min={30} max={300} presets={[180, 210, 220, 230, 240, 250]} />
        <DimInput label="ลึก" value={input.depth} onChange={v => set('depth', v)}
          min={20} max={100} presets={[40, 55, 60, 65]} />
        <StructureHealth input={input} />
      </ConfigSection>

      {/* ─ Section 3: Material ─ */}
      <ConfigSection
        id="material" title="วัสดุ & ผิว" icon={MdLayers}
        summary={`${BOARD_TYPE_LABELS[input.boardType]} · ${SURFACE_TYPE_LABELS[input.surfaceType]}`}
        openSections={openSections} toggle={toggleSection}
      >
        <F label="วัสดุหลัก">
          <Sel value={input.boardType} onChange={v => set('boardType', v as CabinetInput['boardType'])} options={BOARD_TYPE_LABELS} />
        </F>
        <div>
          <label className={labelCls}>ผิวสัมผัส</label>
          <SurfaceGrid
            value={input.surfaceType}
            onChange={v => set('surfaceType', v as CabinetInput['surfaceType'])}
          />
        </div>
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
      </ConfigSection>

      {/* ─ Section 4: Doors ─ */}
      <ConfigSection
        id="doors" title="ระบบบาน & ช่องเก็บ" icon={MdBuild}
        summary={`${DOOR_TYPE_LABELS[input.doorType]} · ${input.doorCount} บาน · ${input.drawerCount} ลิ้นชัก`}
        openSections={openSections} toggle={toggleSection}
      >
        <div className="grid grid-cols-2 gap-2">
          <F label="ประตู">
            <Sel value={input.doorType} onChange={v => set('doorType', v as CabinetInput['doorType'])} options={DOOR_TYPE_LABELS} />
          </F>
          <F label="จำนวนบาน">
            <Num value={input.doorCount} onChange={v => set('doorCount', v)} min={0} max={10} />
          </F>
        </div>

        <div>
          <label className={labelCls}>รูปแบบมือจับ</label>
          <div className="grid grid-cols-5 gap-1">
            {(Object.entries(HANDLE_TYPE_LABELS) as [CabinetInput['handleType'], string][]).map(([k, lbl]) => (
              <button key={k} onClick={() => set('handleType', k)}
                className={clsx(
                  'flex flex-col items-center gap-1 py-2 rounded-xl border text-center transition-all',
                  input.handleType === k
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-[var(--theme-border)] text-muted hover:border-accent/40'
                )}>
                <span className="text-sm font-mono">{HANDLE_VISUALS[k]?.emoji ?? '—'}</span>
                <span className="text-[9px] font-medium leading-tight">{lbl}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <F label="ลิ้นชัก"><Num value={input.drawerCount} onChange={v => set('drawerCount', v)} min={0} max={8} /></F>
          <F label="ชั้นวาง"><Num value={input.shelfCount} onChange={v => set('shelfCount', v)} min={0} max={10} /></F>
        </div>

        <div className="space-y-2.5 pt-1">
          <Toggle on={input.hasMirror} onToggle={() => set('hasMirror', !input.hasMirror)} label="กระจก" description="ติดกระจกด้านหน้าบาน" />
          <Toggle on={input.hasLED} onToggle={() => set('hasLED', !input.hasLED)} label="LED Strip" description="แถบไฟ LED ใต้ชั้นหรือขอบ" />
          <Toggle on={input.hasSoftClose} onToggle={() => set('hasSoftClose', !input.hasSoftClose)} label="Soft-close" description="บานซ้อนแบบปิดนุ่ม" />
          <Toggle on={input.hasHangingRail} onToggle={() => set('hasHangingRail', !input.hasHangingRail)} label="ราวแขวนเสื้อ" />
        </div>
      </ConfigSection>

      {/* ─ Section 5: Hardware ─ */}
      <ConfigSection
        id="hardware" title="อุปกรณ์ Hardware" icon={MdInventory}
        summary={HARDWARE_BRAND_LABELS[input.hardwareBrand]}
        openSections={openSections} toggle={toggleSection}
      >
        <F label="แบรนด์อุปกรณ์">
          <Sel value={input.hardwareBrand} onChange={v => set('hardwareBrand', v as CabinetInput['hardwareBrand'])} options={HARDWARE_BRAND_LABELS} />
        </F>
        <div className="space-y-2.5">
          <Toggle on={input.hasLiftSystem} onToggle={() => set('hasLiftSystem', !input.hasLiftSystem)} label="Lift System" description="ระบบยกบาน (ตู้บน)" />
          <Toggle on={input.hasSensorLight} onToggle={() => set('hasSensorLight', !input.hasSensorLight)} label="Sensor Light" description="ไฟ motion sensor" />
          <Toggle on={input.hasBasket} onToggle={() => set('hasBasket', !input.hasBasket)} label="ตะกร้าลวด" />
        </div>
      </ConfigSection>

      {/* ─ Section 6: Pricing Config ─ */}
      <ConfigSection
        id="pricing" title="ตั้งค่าราคา & Margin" icon={MdTrendingUp}
        summary={`Margin ${(input.targetMargin * 100).toFixed(0)}% · ส่วนลด ${input.discount}%`}
        openSections={openSections} toggle={toggleSection}
      >
        <div>
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className="font-semibold text-muted uppercase tracking-wide">Margin Target</span>
            <span className="font-bold text-accent">{(input.targetMargin * 100).toFixed(0)}%</span>
          </div>
          <input type="range" min="0.10" max="0.60" step="0.05" value={input.targetMargin}
            onChange={e => set('targetMargin', Number(e.target.value))}
            className="range-premium w-full"
            style={{ background: `linear-gradient(to right, rgb(var(--tw-accent)) ${((input.targetMargin - 0.10) / 0.50) * 100}%, var(--theme-border) 0%)` }}
          />
          <div className="flex justify-between text-[9px] text-subtle mt-1">
            <span>10%</span><span>35%</span><span>60%</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className="font-semibold text-muted uppercase tracking-wide">ส่วนลด</span>
            <span className="font-bold text-accent">{input.discount}%</span>
          </div>
          <input type="range" min="0" max="30" step="1" value={input.discount}
            onChange={e => set('discount', Number(e.target.value))}
            className="range-premium w-full"
            style={{ background: `linear-gradient(to right, rgb(var(--tw-accent)) ${(input.discount / 30) * 100}%, var(--theme-border) 0%)` }}
          />
        </div>

        <Toggle on={input.includeVAT} onToggle={() => set('includeVAT', !input.includeVAT)} label="รวม VAT 7%" />

        {/* Custom line items */}
        <div className="pt-2 border-t border-[var(--theme-border)]">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <MdLocalOffer size={10} className="text-accent" /> รายการพิเศษ
          </p>
          <AnimatePresence>
            {input.customOptions.map(opt => (
              <motion.div key={opt.id}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1.5 mb-1.5">
                <span className="flex-1 text-xs text-primary truncate bg-[var(--theme-surface)] rounded-xl px-2 py-1.5 border border-[var(--theme-border)]">
                  {opt.name}
                </span>
                <span className="text-xs text-accent font-bold whitespace-nowrap">×{opt.qty} {opt.price.toLocaleString()}฿</span>
                <button onClick={() => set('customOptions', input.customOptions.filter(o => o.id !== opt.id))}
                  className="text-subtle hover:text-danger transition-colors p-1 rounded-lg hover:bg-danger/8">
                  <MdClose size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="flex gap-1.5">
            <input placeholder="ชื่อรายการ..." value={newOption.name}
              onChange={e => setNewOption(p => ({ ...p, name: e.target.value }))}
              className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-[var(--theme-border)] rounded-xl focus:outline-none focus:ring-1 focus:ring-accent/25 bg-[var(--theme-card)] text-primary" />
            <input type="number" min={0} placeholder="฿" value={newOption.price || ''}
              onChange={e => setNewOption(p => ({ ...p, price: Number(e.target.value) }))}
              className="w-14 px-2 py-1.5 text-xs border border-[var(--theme-border)] rounded-xl focus:outline-none bg-[var(--theme-card)] text-primary" />
            <button disabled={!newOption.name || newOption.price <= 0}
              onClick={() => {
                set('customOptions', [...input.customOptions, { id: Date.now().toString(), ...newOption }])
                setNewOption({ name: '', price: 0, qty: 1 })
              }}
              className="px-2.5 py-1.5 bg-accent/10 text-accent rounded-xl hover:bg-accent/20 transition-colors disabled:opacity-40">
              <MdAdd size={13} />
            </button>
          </div>
        </div>
      </ConfigSection>

      {/* Reset */}
      <button onClick={() => { setInput(DEFAULT_INPUT); setResult(null) }}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-muted hover:text-primary hover:bg-[var(--theme-hover)] rounded-2xl transition-colors border border-[var(--theme-border)] border-dashed">
        <MdRefresh size={11} /> รีเซตทั้งหมด
      </button>
    </div>
  )

  // ── Result Panel ───────────────────────────────────────────────────────────
  const resultPanel = (
    <div className="p-3 space-y-3">

      {/* ─ Big Price Card ─ */}
      <div className="rounded-2xl overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-card)]">
        {/* Price hero */}
        <div className="p-4 pb-3">
          <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1">ราคาขาย (รวม VAT)</p>
          {result ? (
            <>
              <AnimatedNumber value={result.sellingPrice} prefix="฿ " className="text-3xl font-bold text-primary tracking-tight" />
              <p className="text-[10px] text-muted mt-1">{formatCurrency(result.pricePerSqm)} / ตร.ม.</p>
            </>
          ) : (
            <p className="text-3xl font-bold text-subtle">฿ —</p>
          )}
        </div>

        {/* Margin ring + stats row */}
        {result && (
          <div className="px-4 pb-4 flex items-center gap-4">
            <MarginRing percent={result.grossMarginPercent} color={marginColor} />
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted">ต้นทุน</span>
                <span className="font-semibold text-primary">{formatCurrency(result.netCost)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">กำไร</span>
                <span className="font-bold" style={{ color: '#00A86B' }}>{formatCurrency(result.sellingPrice - result.netCost)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">สถานะ</span>
                <span className="text-xs font-bold" style={{ color: marginColor }}>
                  {result.grossMarginPercent >= 30 ? '✓ Healthy' : result.grossMarginPercent >= 20 ? '⚠ Moderate' : '✗ Low'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─ Cost Breakdown bars ─ */}
      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4 space-y-3">
          <p className="text-[9px] font-bold text-muted uppercase tracking-widest">ต้นทุนรายหมวด</p>
          <CostBar emoji="📦" label="วัสดุแผ่นไม้" value={result.costBreakdown.boardMaterial} total={result.netCost} color="#3B82F6" />
          <CostBar emoji="🎨" label="ผิว + Edge" value={result.costBreakdown.surfaceFinish + result.costBreakdown.edgebanding} total={result.netCost} color="#8B5CF6" />
          <CostBar emoji="🔧" label="อุปกรณ์" value={result.costBreakdown.hardware} total={result.netCost} color="#F59E0B" />
          <CostBar emoji="👷" label="ค่าแรงรวม" value={result.costBreakdown.laborFactory + result.costBreakdown.laborInstallation} total={result.netCost} color="#10B981" />
        </motion.div>
      )}

      {/* ─ Suggestions ─ */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          {suggestions.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={clsx(
                'flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs leading-relaxed',
                s.type === 'warn'
                  ? 'bg-amber-500/8 border border-amber-500/20 text-amber-600'
                  : 'bg-blue-500/8 border border-blue-500/20 text-blue-600'
              )}>
              <span className="flex-shrink-0 mt-0.5">{s.type === 'warn' ? '⚠' : '💡'}</span>
              <span>{s.msg}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* ─ Action buttons ─ */}
      {result && (
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleCalculate} disabled={loading}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold gold-gradient text-white disabled:opacity-60 transition-all active:scale-95">
              {loading ? <MdRefresh size={12} className="animate-spin" /> : <MdBolt size={12} />} คำนวณ
            </button>
            <button onClick={handleSave} disabled={saved}
              className={clsx(
                'flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95',
                saved ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'border border-[var(--theme-border)] text-primary hover:bg-[var(--theme-hover)]'
              )}>
              {saved ? <MdCheckCircle size={12} /> : <MdSave size={12} />} {saved ? 'บันทึกแล้ว' : 'บันทึก'}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button onClick={handlePDF}
              className="flex items-center justify-center gap-1 py-2 border border-[var(--theme-border)] text-muted hover:text-primary hover:bg-[var(--theme-hover)] rounded-xl text-[11px] font-semibold transition-colors">
              <MdDownload size={11} /> PDF
            </button>
            <button onClick={handleBOQ}
              className="flex items-center justify-center gap-1 py-2 border border-accent/30 text-accent hover:bg-accent/5 rounded-xl text-[11px] font-semibold transition-colors">
              <MdDescription size={11} /> BOQ
            </button>
            <button onClick={handlePrint}
              className="flex items-center justify-center gap-1 py-2 border border-[var(--theme-border)] text-muted hover:text-primary hover:bg-[var(--theme-hover)] rounded-xl text-[11px] font-semibold transition-colors">
              <MdPrint size={11} /> พิมพ์
            </button>
          </div>
        </div>
      )}

      {/* ─ Structure Health ─ */}
      <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-3.5">
        <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
          <MdVerified size={10} className="text-accent" /> Structure Health
        </p>
        <StructureHealth input={input} />
      </div>

      {/* ─ Cutting Estimation ─ */}
      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-3.5">
          <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
            <MdContentCut size={10} className="text-accent" /> Cutting Estimation
          </p>
          <CuttingEstimation result={result} />
        </motion.div>
      )}

      {/* ─ AI Analysis ─ */}
      {result?.aiAnalysis && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[9px] font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
              <MdMemory size={10} className="text-accent" /> AI Analysis
            </p>
            <span className={clsx('text-xs px-2.5 py-0.5 rounded-full font-bold',
              result.aiAnalysis.score >= 70 ? 'bg-emerald-500/10 text-emerald-600'
                : result.aiAnalysis.score >= 40 ? 'bg-amber-500/10 text-amber-600'
                : 'bg-red-500/10 text-red-600')}>
              {result.aiAnalysis.score}/100
            </span>
          </div>
          <div className="space-y-1.5">
            {(result.aiAnalysis.warnings ?? []).map((w, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-600 bg-amber-500/8 rounded-xl p-2.5">
                <MdWarning size={10} className="flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{w.message}</span>
              </div>
            ))}
            {(result.aiAnalysis.suggestions ?? []).map((s, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-blue-600 bg-blue-500/8 rounded-xl p-2.5">
                <MdCheckCircle size={10} className="flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed"><strong>{s.title}:</strong> {s.description}</span>
              </div>
            ))}
            {(result.aiAnalysis.warnings ?? []).length === 0 && (result.aiAnalysis.suggestions ?? []).length === 0 && (
              <p className="text-[11px] text-emerald-600 flex items-center gap-1.5 p-2">
                <MdCheckCircle size={10} /> Margin ดี ไม่มีข้อแนะนำพิเศษ
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* ─ BOQ Mini ─ */}
      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-3.5">
          <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
            <MdInventory size={10} className="text-accent" /> BOQ ({(result.boqItems ?? []).length} รายการ)
          </p>
          <div className="max-h-44 overflow-y-auto space-y-1 scrollbar-thin">
            {(result.boqItems ?? []).map(item => (
              <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-[var(--theme-border)] last:border-0">
                <span className="text-[11px] text-muted truncate pr-2">{item.description}</span>
                <span className="text-[11px] font-bold text-primary flex-shrink-0">{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )

  // ── Visualizer Panel ───────────────────────────────────────────────────────
  const visualPanel = (
    <div className="flex flex-col h-full">
      {/* 3D Canvas — fills remaining height */}
      <div className="flex-1 relative overflow-hidden">
        {/* Gradient bg for the canvas area */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, rgba(var(--tw-accent), 0.06) 0%, transparent 70%), var(--theme-bg)',
          }}
        />
        <CabinetVisualizerWrapper input={input} />
      </div>

      {/* Dimension badge strip — editable */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-t border-[var(--theme-border)] bg-[var(--theme-card)]">
        <EditableDimChip label="W กว้าง" value={input.width}  unit="ซม." min={30}  max={600} onChange={v => set('width',  v)} />
        <div className="w-px h-6 bg-[var(--theme-border)]" />
        <EditableDimChip label="H สูง"   value={input.height} unit="ซม." min={30}  max={300} onChange={v => set('height', v)} />
        <div className="w-px h-6 bg-[var(--theme-border)]" />
        <EditableDimChip label="D ลึก"   value={input.depth}  unit="ซม." min={20}  max={100} onChange={v => set('depth',  v)} />
        <div className="w-px h-6 bg-[var(--theme-border)]" />
        <EditableDimChip label="×จำนวน" value={input.quantity} unit="ตู้" min={1} max={20}  onChange={v => set('quantity', v)} />

        {/* Material badge */}
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)]">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: SURFACE_SWATCHES[input.surfaceType]?.color ?? '#EDE8E0' }}
          />
          <span className="text-[9px] text-muted font-medium">{SURFACE_TYPE_LABELS[input.surfaceType]}</span>
        </div>
      </div>

      {/* Empty state when no result */}
      {!result && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4"
          >
            <MdCalculate size={28} className="text-accent" />
          </motion.div>
          <p className="text-sm font-semibold text-muted">กรอกชื่อโปรเจกต์เพื่อเริ่ม</p>
          <p className="text-xs text-subtle mt-1">ระบบจะ Auto-Calculate ทันที</p>
        </div>
      )}
    </div>
  )

  // ─── Root Layout ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 57px)', overflow: 'hidden', background: 'var(--theme-bg)' }}>

      {/* ── Top Bar ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-[var(--theme-card)] border-b border-[var(--theme-border)] z-10">

        {/* Project info */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">{PROJECT_TYPE_ICONS[input.projectType]?.emoji ?? '🪑'}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-primary truncate">
              {input.projectName || 'โปรเจกต์ใหม่'}
            </p>
            <p className="text-[10px] text-muted truncate">
              {PROJECT_TYPE_LABELS[input.projectType]} · W{input.width}×H{input.height}×D{input.depth} ซม.
            </p>
          </div>
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="flex-shrink-0 flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-500/8 border border-emerald-500/20 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Auto Live
            </motion.div>
          )}
        </div>

        {/* Quick price preview */}
        {result && (
          <div className="hidden sm:flex flex-col items-end flex-shrink-0">
            <AnimatedNumber value={result.sellingPrice} prefix="฿" className="text-sm font-bold text-primary" />
            <span className="text-[10px] font-semibold" style={{ color: marginColor }}>
              {result.grossMarginPercent.toFixed(1)}% margin
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleCalculate} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 gold-gradient text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60 active:scale-95">
            {loading ? <MdRefresh size={12} className="animate-spin" /> : <MdBolt size={12} />}
            <span className="hidden sm:inline">คำนวณ</span>
          </button>
        </div>
      </div>

      {/* ── Mobile Tab Bar ── */}
      <div className="xl:hidden flex-shrink-0 flex border-b border-[var(--theme-border)] bg-[var(--theme-card)]">
        {([
          ['form', '⚙️', 'ออกแบบ'],
          ['preview', '🎯', '3D View'],
          ['analysis', '📊', 'ราคา'],
        ] as const).map(([t, emoji, lbl]) => (
          <button key={t} onClick={() => setMobileTab(t as typeof mobileTab)}
            className={clsx(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all border-b-2',
              mobileTab === t ? 'border-accent text-accent' : 'border-transparent text-muted'
            )}>
            <span className="text-sm">{emoji}</span>
            {lbl}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden">

        {/* Mobile: single panel at a time */}
        <div className="xl:hidden h-full overflow-y-auto">
          {mobileTab === 'form'     && formPanel}
          {mobileTab === 'preview'  && <div className="h-full">{visualPanel}</div>}
          {mobileTab === 'analysis' && resultPanel}
        </div>

        {/* Desktop: 3-column layout */}
        <div className="hidden xl:flex h-full overflow-hidden">
          {/* Col 1 — Config form (scrollable) */}
          <div className="overflow-y-auto border-r border-[var(--theme-border)]" style={{ width: 288, minWidth: 288 }}>
            {formPanel}
          </div>

          {/* Col 2 — 3D Visualizer (fills remaining) */}
          <div className="flex-1 overflow-hidden relative">
            {visualPanel}
          </div>

          {/* Col 3 — Result / Analysis */}
          <div className="overflow-y-auto border-l border-[var(--theme-border)]" style={{ width: 320, minWidth: 320 }}>
            {resultPanel}
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom Bar ── */}
      {result && (
        <div className="xl:hidden flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-[var(--theme-card)] border-t border-[var(--theme-border)]">
          <div>
            <p className="text-[9px] text-muted font-semibold uppercase">ราคาขาย</p>
            <AnimatedNumber value={result.sellingPrice} prefix="฿" className="text-base font-bold text-primary" />
          </div>
          <div className="text-center">
            <p className="text-[9px] text-muted font-semibold uppercase">Margin</p>
            <p className="text-base font-bold" style={{ color: marginColor }}>
              {result.grossMarginPercent.toFixed(1)}%
            </p>
          </div>
          <button onClick={handleSave} disabled={saved}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95',
              saved ? 'bg-emerald-500/10 text-emerald-600' : 'gold-gradient text-white'
            )}>
            {saved ? <MdCheckCircle size={13} /> : <MdSave size={13} />}
            {saved ? 'บันทึกแล้ว' : 'บันทึก'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <MdRefresh size={28} className="animate-spin text-accent/40" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}
