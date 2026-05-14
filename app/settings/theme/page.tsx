'use client'
import { useState, useRef } from 'react'
import {
  Palette, Sun, Moon, Wand2, Type, Layers, RotateCcw,
  Download, Upload, Check, Sparkles, Monitor, Zap,
  ChevronRight, Info,
} from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import {
  THEMES, FONT_OPTIONS, RADIUS_OPTIONS, DENSITY_OPTIONS, ACCENT_PRESETS,
  type ThemeId, type FontId, type RadiusSize, type DensityMode,
} from '@/lib/theme'
import { useToast } from '@/context/ToastContext'
import clsx from 'clsx'

// ── Section wrapper ───────────────────────────────────────────────
function Section({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="glass-card rounded-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(var(--tw-accent),0.12)' }}>
          <Icon size={15} style={{ color: 'var(--color-accent)' }} />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ── Theme card ────────────────────────────────────────────────────
function ThemeCard({ theme, active, onClick }: {
  theme: typeof THEMES[0]; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative group rounded-xl p-0.5 transition-all duration-200',
        active
          ? 'ring-2 scale-[1.03]'
          : 'ring-1 hover:scale-[1.02]'
      )}
      style={{
        ringColor: active ? 'var(--color-accent)' : 'var(--theme-border)',
        '--tw-ring-color': active ? 'var(--color-accent)' : 'var(--theme-border)',
      } as React.CSSProperties}
    >
      {/* Color preview */}
      <div
        className="rounded-[10px] overflow-hidden h-[68px] flex"
        style={{ background: theme.palette.bg }}
      >
        {/* Sidebar sliver */}
        <div className="w-8 h-full flex-shrink-0 flex flex-col items-center py-2 gap-1"
          style={{ background: theme.palette.sidebar }}>
          {[1,2,3].map(i => (
            <div key={i} className={clsx('rounded-full', i === 1 ? 'w-4 h-1.5' : 'w-2.5 h-1')}
              style={{ background: i === 1 ? theme.palette.accent : 'rgba(255,255,255,0.25)' }} />
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 p-2 space-y-1.5">
          {/* Card mock */}
          <div className="rounded-md p-1.5 h-8 flex items-center gap-1.5"
            style={{ background: theme.palette.card, border: '1px solid rgba(128,128,128,0.1)' }}>
            <div className="w-4 h-4 rounded flex-shrink-0"
              style={{ background: theme.palette.accent, opacity: 0.85 }} />
            <div className="flex-1 space-y-1">
              <div className="h-1 rounded-full w-3/4"
                style={{ background: theme.palette.text, opacity: 0.7 }} />
              <div className="h-0.5 rounded-full w-1/2"
                style={{ background: theme.palette.text, opacity: 0.3 }} />
            </div>
          </div>
          {/* Accent bar */}
          <div className="rounded-full h-1.5"
            style={{ background: theme.palette.accent }} />
        </div>
      </div>

      {/* Active badge */}
      {active && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
          style={{ background: 'var(--color-accent)' }}>
          <Check size={10} color="white" strokeWidth={3} />
        </div>
      )}

      {/* Label */}
      <div className="mt-2 px-1 pb-1">
        <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--theme-text)' }}>
          {theme.emoji} {theme.name}
        </p>
        <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--theme-text-muted)' }}>
          {theme.desc}
        </p>
      </div>
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function ThemeStudioPage() {
  const { prefs, setTheme, setFont, setRadius, setDensity, setAccentHex, resetPrefs } = useTheme()
  const { success, error } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [customHex, setCustomHex] = useState(prefs.accentHex || '')

  // ── Export theme JSON ─────────────────────────────────────────
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(prefs, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `meridian-theme-${prefs.theme}.json`
    a.click()
    URL.revokeObjectURL(url)
    success('Export สำเร็จ!')
  }

  // ── Import theme JSON ─────────────────────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target!.result as string)
        if (data.theme)   setTheme(data.theme)
        if (data.font)    setFont(data.font)
        if (data.radius)  setRadius(data.radius)
        if (data.density) setDensity(data.density)
        if (data.accentHex) { setAccentHex(data.accentHex); setCustomHex(data.accentHex) }
        success('Import สำเร็จ!')
      } catch { error('ไฟล์ไม่ถูกต้อง') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleReset = () => {
    resetPrefs()
    setCustomHex('')
    success('รีเซ็ต Theme แล้ว')
  }

  const applyCustomHex = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(customHex)) {
      setAccentHex(customHex)
      success('อัปเดต Accent สีเรียบร้อย')
    } else {
      error('กรอก HEX code ให้ถูกต้อง เช่น #FF6B35')
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/settings"
              className="text-sm transition-colors hover:opacity-70"
              style={{ color: 'var(--theme-text-muted)' }}>
              ตั้งค่า
            </Link>
            <ChevronRight size={13} style={{ color: 'var(--theme-text-muted)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>Theme Studio</span>
          </div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
            <Wand2 size={22} style={{ color: 'var(--color-accent)' }} />
            Theme Studio
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
            ปรับแต่งหน้าตาระบบ แบบ Real-time — บันทึกอัตโนมัติ
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-btn border transition-all hover:opacity-80"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
            <Download size={13} /> Export
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-btn border transition-all hover:opacity-80"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}>
            <Upload size={13} /> Import
          </button>
          <button onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-btn border border-danger/30 text-danger transition-all hover:bg-danger/5">
            <RotateCcw size={13} /> Reset
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {/* ── Current theme info bar ─────────────────────────────── */}
      <div className="glass-card rounded-card p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: 'rgba(var(--tw-accent),0.12)' }}>
            {THEMES.find(t => t.id === prefs.theme)?.emoji}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
              {THEMES.find(t => t.id === prefs.theme)?.name}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
              {FONT_OPTIONS.find(f => f.id === prefs.font)?.name} · Radius {RADIUS_OPTIONS.find(r => r.id === prefs.radius)?.name} · {DENSITY_OPTIONS.find(d => d.id === prefs.density)?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full ring-2 ring-white/20"
            style={{ background: 'var(--color-accent)' }} />
          <span className="text-xs font-mono" style={{ color: 'var(--theme-text-muted)' }}>
            {prefs.accentHex || THEMES.find(t => t.id === prefs.theme)?.palette.accent}
          </span>
        </div>
      </div>

      {/* ── Theme Modes ────────────────────────────────────────── */}
      <Section title="Theme Mode" icon={Palette}>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {THEMES.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              active={prefs.theme === theme.id}
              onClick={() => setTheme(theme.id as ThemeId)}
            />
          ))}
        </div>
      </Section>

      {/* ── Accent Color ───────────────────────────────────────── */}
      <Section title="Accent Color" icon={Sparkles}>
        <div className="space-y-3">
          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {ACCENT_PRESETS.map(p => (
              <button
                key={p.hex}
                onClick={() => { setAccentHex(p.hex); setCustomHex(p.hex) }}
                title={p.name}
                className="group relative w-8 h-8 rounded-full transition-all hover:scale-110 active:scale-95"
                style={{
                  background: p.hex,
                  boxShadow: prefs.accentHex === p.hex
                    ? `0 0 0 2px var(--theme-bg), 0 0 0 4px ${p.hex}`
                    : undefined,
                }}
              >
                {prefs.accentHex === p.hex && (
                  <Check size={12} color="white" strokeWidth={3}
                    className="absolute inset-0 m-auto drop-shadow" />
                )}
                {/* Tooltip */}
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[10px]
                                  rounded bg-gray-900 text-white whitespace-nowrap
                                  opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {p.name}
                </span>
              </button>
            ))}

            {/* Reset to theme default */}
            <button
              onClick={() => { setAccentHex(''); setCustomHex('') }}
              className="w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center text-xs transition-all hover:scale-110"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
              title="ใช้ค่าเริ่มต้นของ Theme"
            >
              ✕
            </button>
          </div>

          {/* Custom hex */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono"
                style={{ color: 'var(--theme-text-muted)' }}>#</span>
              <input
                type="text"
                maxLength={7}
                value={customHex.replace('#', '')}
                onChange={e => setCustomHex('#' + e.target.value.replace('#', ''))}
                onKeyDown={e => e.key === 'Enter' && applyCustomHex()}
                placeholder="C6A969"
                className="w-full pl-6 pr-3 py-2 text-sm rounded-input border focus:outline-none"
                style={{
                  background: 'var(--theme-input-bg)',
                  color: 'var(--theme-input-text)',
                  borderColor: 'var(--theme-input-border)',
                  fontFamily: 'monospace',
                }}
              />
            </div>
            {/* Color swatch */}
            <input
              type="color"
              value={customHex || '#C6A969'}
              onChange={e => { setCustomHex(e.target.value); setAccentHex(e.target.value) }}
              className="w-10 h-10 rounded-input border cursor-pointer"
              style={{ borderColor: 'var(--theme-border)', padding: '2px' }}
              title="เลือกสี"
            />
            <button
              onClick={applyCustomHex}
              className="px-3 py-2 text-xs font-semibold rounded-btn transition-all hover:opacity-80"
              style={{ background: 'rgba(var(--tw-accent),0.12)', color: 'var(--color-accent)' }}
            >
              ใช้งาน
            </button>
          </div>
        </div>
      </Section>

      {/* ── Font ───────────────────────────────────────────────── */}
      <Section title="Font Family" icon={Type}>
        <div className="grid grid-cols-3 gap-3">
          {FONT_OPTIONS.map(font => (
            <button
              key={font.id}
              onClick={() => setFont(font.id as FontId)}
              className={clsx(
                'p-3 rounded-card border text-left transition-all hover:opacity-80',
                prefs.font === font.id && 'ring-2'
              )}
              style={{
                background: prefs.font === font.id ? 'rgba(var(--tw-accent),0.08)' : 'var(--theme-card)',
                borderColor: prefs.font === font.id ? 'var(--color-accent)' : 'var(--theme-border)',
                '--tw-ring-color': 'var(--color-accent)',
                fontFamily: font.css,
              } as React.CSSProperties}
            >
              <p className="text-lg font-semibold leading-tight" style={{ color: 'var(--theme-text)' }}>
                {font.sample}
              </p>
              <p className="text-xs mt-1 font-normal" style={{ color: 'var(--theme-text-muted)' }}>
                {font.name}
              </p>
              {prefs.font === font.id && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold"
                  style={{ color: 'var(--color-accent)' }}>
                  <Check size={10} strokeWidth={3} /> ใช้งานอยู่
                </div>
              )}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Radius ─────────────────────────────────────────────── */}
      <Section title="Border Radius" icon={Layers}>
        <div className="flex gap-2 flex-wrap">
          {RADIUS_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setRadius(opt.id as RadiusSize)}
              className={clsx(
                'flex-1 min-w-[80px] py-2.5 px-3 text-xs font-semibold border transition-all hover:opacity-80',
                prefs.radius === opt.id ? 'ring-2' : ''
              )}
              style={{
                borderRadius: opt.px,
                background: prefs.radius === opt.id ? 'rgba(var(--tw-accent),0.10)' : 'var(--theme-card)',
                borderColor: prefs.radius === opt.id ? 'var(--color-accent)' : 'var(--theme-border)',
                color: prefs.radius === opt.id ? 'var(--color-accent)' : 'var(--theme-text-muted)',
                '--tw-ring-color': 'var(--color-accent)',
              } as React.CSSProperties}
            >
              {opt.name}
              <span className="block text-[10px] font-normal mt-0.5 opacity-60">{opt.px}</span>
            </button>
          ))}
        </div>
        {/* Preview */}
        <div className="flex items-center gap-2 p-3 rounded-card"
          style={{ background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
          <div className="w-8 h-8 flex-shrink-0"
            style={{ background: 'var(--color-accent)', borderRadius: 'var(--r-card)' }} />
          <input
            readOnly
            value="ตัวอย่าง Input Field"
            className="flex-1 px-3 py-1.5 text-sm border"
            style={{
              background: 'var(--theme-input-bg)',
              borderColor: 'var(--theme-input-border)',
              color: 'var(--theme-text)',
              borderRadius: 'var(--r-input)',
            }}
          />
          <button
            className="px-3 py-1.5 text-xs font-semibold text-white flex-shrink-0"
            style={{ background: 'var(--color-accent)', borderRadius: 'var(--r-btn)' }}>
            ปุ่ม
          </button>
        </div>
      </Section>

      {/* ── Density ────────────────────────────────────────────── */}
      <Section title="Layout Density" icon={Monitor}>
        <div className="grid grid-cols-3 gap-3">
          {DENSITY_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setDensity(opt.id as DensityMode)}
              className={clsx(
                'p-3 rounded-card border text-left transition-all hover:opacity-80',
                prefs.density === opt.id && 'ring-2'
              )}
              style={{
                background: prefs.density === opt.id ? 'rgba(var(--tw-accent),0.08)' : 'var(--theme-card)',
                borderColor: prefs.density === opt.id ? 'var(--color-accent)' : 'var(--theme-border)',
                '--tw-ring-color': 'var(--color-accent)',
              } as React.CSSProperties}
            >
              <p className="text-xl leading-none mb-1">{opt.icon}</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>{opt.name}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* ── Live Component Preview ──────────────────────────────── */}
      <Section title="ตัวอย่างหน้าตา (Live Preview)" icon={Zap}>
        <div className="rounded-card overflow-hidden border"
          style={{ borderColor: 'var(--theme-border)' }}>
          {/* Mock header */}
          <div className="flex items-center justify-between px-4 py-3 border-b"
            style={{ background: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg" style={{ background: 'var(--color-accent)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>MERIDIAN ROOM</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full" style={{ background: 'rgba(var(--tw-accent),0.15)' }} />
              <div className="w-16 h-2 rounded-full" style={{ background: 'var(--theme-border)' }} />
            </div>
          </div>

          {/* Mock content */}
          <div className="p-4 space-y-3" style={{ background: 'var(--theme-bg)' }}>
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-2">
              {['฿895k', '36.7%', '5'].map((v, i) => (
                <div key={i} className="rounded-card p-3"
                  style={{
                    background: 'var(--theme-card)',
                    border: '1px solid var(--theme-border)',
                  }}>
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    {['รายได้', 'Margin', 'โปรเจกต์'][i]}
                  </p>
                  <p className="text-base font-bold mt-0.5" style={{
                    color: i === 2 ? 'var(--theme-text)' : 'var(--color-accent)',
                  }}>{v}</p>
                </div>
              ))}
            </div>

            {/* Mock table row */}
            <div className="rounded-card overflow-hidden"
              style={{ border: '1px solid var(--theme-border)' }}>
              <div className="px-3 py-2 flex items-center justify-between"
                style={{ background: 'var(--theme-surface)', borderBottom: '1px solid var(--theme-border)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--theme-text-muted)' }}>โปรเจกต์ล่าสุด</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(var(--tw-accent),0.12)', color: 'var(--color-accent)' }}>
                  ดูทั้งหมด
                </span>
              </div>
              {['Walk-in Closet Luxury', 'ครัว Island Kitchen'].map((name, i) => (
                <div key={i} className="px-3 py-2 flex items-center justify-between"
                  style={{
                    background: 'var(--theme-card)',
                    borderBottom: i === 0 ? '1px solid var(--theme-border)' : undefined,
                  }}>
                  <span className="text-xs" style={{ color: 'var(--theme-text)' }}>{name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: i === 0 ? 'rgba(var(--tw-warning),0.10)' : 'rgba(var(--tw-success),0.10)',
                      color: i === 0 ? 'rgb(var(--tw-warning))' : 'rgb(var(--tw-success))',
                    }}>
                    {i === 0 ? 'กำลังผลิต' : 'ยืนยันแล้ว'}
                  </span>
                </div>
              ))}
            </div>

            {/* Mock buttons */}
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-xs font-semibold rounded-btn text-white"
                style={{ background: 'var(--color-accent)', borderRadius: 'var(--r-btn)' }}>
                Primary Button
              </button>
              <button className="px-4 py-2 text-xs font-semibold rounded-btn border"
                style={{
                  borderColor: 'var(--color-accent)',
                  color: 'var(--color-accent)',
                  borderRadius: 'var(--r-btn)',
                  background: 'transparent',
                }}>
                Outline Button
              </button>
              <button className="px-4 py-2 text-xs rounded-btn"
                style={{
                  background: 'var(--theme-surface)',
                  color: 'var(--theme-text-muted)',
                  border: '1px solid var(--theme-border)',
                  borderRadius: 'var(--r-btn)',
                }}>
                Ghost
              </button>
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2 p-3 rounded-card"
          style={{ background: 'rgba(var(--tw-info),0.06)', border: '1px solid rgba(var(--tw-info),0.15)' }}>
          <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'rgb(var(--tw-info))' }} />
          <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            การเปลี่ยน Theme ใช้งานทันทีทั่วทั้งแอปและบันทึกอัตโนมัติ
            ผู้ใช้แต่ละคนสามารถมี Theme ของตัวเองได้
          </p>
        </div>
      </Section>

    </div>
  )
}
