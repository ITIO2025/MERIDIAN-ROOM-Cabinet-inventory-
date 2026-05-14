'use client'
import { useMemo } from 'react'
import type { CabinetInput, SurfaceType, HandleType } from '@/lib/types'

// ─── Color Palettes ───────────────────────────────────────────────────────────

type Palette = { front: string; side: string; top: string }

const SURFACE_PALETTES: Record<SurfaceType, Palette> = {
  MELAMINE: { front: '#EDE8E0', side: '#CCCAC0', top: '#F5F2EC' },
  LAMINATE: { front: '#D8CEBC', side: '#B8AE9C', top: '#E8DECC' },
  ACRYLIC:  { front: '#E0EBF8', side: '#C0CBD8', top: '#EEF4FC' },
  VENEER:   { front: '#C8A478', side: '#A88458', top: '#D8B488' },
  HIGLOSS:  { front: '#F2F2F2', side: '#D4D4D4', top: '#FAFAFA' },
  PU_PAINT: { front: '#E4E4E4', side: '#C4C4C4', top: '#F0F0F0' },
  VACUUM:   { front: '#E2D8CC', side: '#C2B8AC', top: '#ECEAE4' },
}

const SURFACE_LABELS_TH: Record<SurfaceType, string> = {
  MELAMINE: 'เมลามีน',
  LAMINATE: 'ลามิเนต HPL',
  ACRYLIC:  'อะคริลิค',
  VENEER:   'วีเนียร์',
  HIGLOSS:  'Hi-Gloss',
  PU_PAINT: 'PU Paint',
  VACUUM:   'Vacuum',
}

const THAI_COLOR_MAP: Record<string, string> = {
  'ขาว':   '#FDFDFD',
  'ดำ':    '#2D2D2D',
  'เทา':   '#808080',
  'น้ำเงิน': '#1E40AF',
  'ฟ้า':   '#60A5FA',
  'เขียว': '#16A34A',
  'แดง':   '#DC2626',
  'ส้ม':   '#EA580C',
  'เหลือง': '#EAB308',
  'ชมพู':  '#EC4899',
  'ม่วง':  '#7C3AED',
  'ครีม':  '#FFF3CC',
  'เบจ':   '#F0E0C4',
}

const PROJECT_TYPE_LABELS_TH: Record<string, string> = {
  WARDROBE:         'ตู้เสื้อผ้า',
  WALK_IN:          'Walk-in Closet',
  TV_CABINET:       'ตู้ TV',
  KITCHEN:          'ครัว',
  PANTRY:           'แพนทรี่',
  VANITY:           'ตู้แต่งหน้า',
  COUNTER:          'เคาน์เตอร์',
  SHOE_CABINET:     'ตู้รองเท้า',
  DISPLAY_CABINET:  'ตู้โชว์',
  FLOATING_CABINET: 'ตู้ลอย',
  FULL_HEIGHT:      'ตู้เต็มความสูง',
  OFFICE:           'เฟอร์นิเจอร์สำนักงาน',
  LUXURY:           'งาน Luxury',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function blendColor(base: string, tint: string, ratio: number): string {
  // Simple hex blend: result = base*(1-ratio) + tint*ratio
  const parse = (hex: string) => {
    const h = hex.replace('#', '')
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ]
  }
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  const b = parse(base)
  const t = parse(tint)
  const r = b.map((v, i) => v * (1 - ratio) + t[i] * ratio)
  return `#${toHex(r[0])}${toHex(r[1])}${toHex(r[2])}`
}

function resolvePalette(surfaceType: SurfaceType, color: string): Palette {
  const base = { ...SURFACE_PALETTES[surfaceType] }
  if ((surfaceType === 'PU_PAINT' || surfaceType === 'HIGLOSS') && color) {
    const trimmed = color.trim()
    const tintHex =
      THAI_COLOR_MAP[trimmed] ??
      (trimmed.startsWith('#') ? trimmed : null)
    if (tintHex) {
      base.front = blendColor(base.front, tintHex, 0.45)
      base.side  = blendColor(base.side,  tintHex, 0.35)
      base.top   = blendColor(base.top,   tintHex, 0.30)
    }
  }
  return base
}

// ─── Geometry ─────────────────────────────────────────────────────────────────

interface Geo {
  // Front face origin (top-left of front rectangle)
  fx: number
  fy: number
  fw: number   // front face width
  fh: number   // front face height
  // Depth offsets for oblique projection
  dx: number
  dy: number
  // Float offset (floating cabinet)
  floatGap: number
  palette: Palette
}

function computeGeo(input: CabinetInput): Geo {
  const MAX_FW = 260
  const MAX_FH = 225

  const rawW = Math.max(input.width,  30)
  const rawH = Math.max(input.height, 30)
  const rawD = Math.max(input.depth,  20)

  const scale = Math.min(MAX_FW / rawW, MAX_FH / rawH, 1)

  const fw = rawW * scale
  const fh = rawH * scale
  const dep = rawD * scale

  const dx = dep * 0.65
  const dy = dep * 0.32

  // SVG canvas: 480×340
  // Total bounding width including depth offset: fw + dx
  // Total bounding height including depth offset: fh + dy
  const totalW = fw + dx
  const totalH = fh + dy

  // Centre the cabinet in the canvas, leave room for labels
  const canvasCentreX = 480 / 2 - 10
  const canvasCentreY = 340 / 2

  const floatGap = input.projectType === 'FLOATING_CABINET' ? 30 : 0

  // Front face top-left
  const fx = canvasCentreX - totalW / 2
  const fy = canvasCentreY - totalH / 2 + dy / 2 - floatGap / 2

  const palette = resolvePalette(input.surfaceType, input.color)

  return { fx, fy, fw, fh, dx, dy, floatGap, palette }
}

// Polygon point string helper
function pts(points: [number, number][]): string {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
}

// ─── Handle Renderer ───────────────────────────────────────────────────────────
// cx,cy = centre of handle area; doorW = door panel width; doorH = door panel height
function renderHandle(
  handleType: HandleType | undefined,
  cx: number, cy: number, doorW: number, _doorH: number,
  color = '#9E9990'
) {
  if (!handleType || handleType === 'NONE') return null
  if (handleType === 'INTEGRATED') return null  // no visible handle

  if (handleType === 'RECESSED') {
    // Groove at bottom of panel
    const gw = Math.min(doorW * 0.55, 48)
    return (
      <g>
        <rect x={cx - gw / 2} y={cy - 2} width={gw} height={4} rx="2"
          fill="none" stroke={color} strokeWidth="1.2" opacity="0.7" />
        <rect x={cx - gw / 2} y={cy - 1} width={gw} height={2} rx="1"
          fill="#00000015" />
      </g>
    )
  }

  if (handleType === 'KNOB') {
    // Round knob
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill={color} opacity="0.9" />
        <circle cx={cx - 1} cy={cy - 1} r={1.5} fill="white" opacity="0.4" />
      </g>
    )
  }

  // BAR — horizontal bar (default)
  const bw = Math.min(doorW * 0.48, 40)
  return (
    <g>
      <rect x={cx - bw / 2} y={cy - 2} width={bw} height={4} rx="2"
        fill={color} opacity="0.9" />
      <rect x={cx - bw / 2} y={cy - 2} width={bw * 0.35} height={2} rx="1"
        fill="white" opacity="0.25" />
    </g>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CabinetVisualizer({ input }: { input: CabinetInput }) {
  const geo = useMemo(() => computeGeo(input), [input])

  const {
    fx, fy, fw, fh, dx, dy, floatGap, palette,
  } = geo

  const pt = input.projectType
  const isKitchen  = pt === 'KITCHEN'
  const isWalkIn   = pt === 'WALK_IN'
  const isTV       = pt === 'TV_CABINET'
  const isFloat    = pt === 'FLOATING_CABINET'
  const isVanity   = pt === 'VANITY'
  const isPantry   = pt === 'PANTRY'
  const isAcrylic  = input.surfaceType === 'ACRYLIC'
  const isVeneer   = input.surfaceType === 'VENEER'
  const isHigloss  = input.surfaceType === 'HIGLOSS'
  const isVacuum   = input.surfaceType === 'VACUUM'

  const handleType = input.handleType ?? 'BAR'

  // Bottom of front face (the visible lower edge)
  const frontBottom = fy + fh
  const frontRight  = fx + fw

  // Shadow ellipse sits at the actual bottom of the cabinet
  const shadowY = frontBottom + (isFloat ? floatGap : 0) + 6
  const shadowCX = fx + fw / 2 + dx * 0.35

  // Top face (parallelogram, going right+up from the top of the front face)
  // top-left → top-right → top-right+dx,top-right-dy → top-left+dx,top-left-dy
  const topFace: [number, number][] = [
    [fx,        fy],
    [fx + fw,   fy],
    [fx + fw + dx, fy - dy],
    [fx + dx,      fy - dy],
  ]

  // Right side face (parallelogram)
  const sideFace: [number, number][] = [
    [fx + fw,        fy],
    [fx + fw + dx,   fy - dy],
    [fx + fw + dx,   fy - dy + fh],
    [fx + fw,        fy + fh],
  ]

  // Transition style for all fill-changing elements
  const transition = { transition: 'fill 0.4s ease, opacity 0.4s ease' }

  // ── Door rendering helpers ────────────────────────────────────────────────

  const doorType   = input.doorType
  const doorCount  = Math.max(1, input.doorCount || 2)

  // Drawer zone at bottom of front face
  const drawerH   = Math.min(60, fh * 0.22)
  const drawerCount = Math.max(0, input.drawerCount || 0)
  const totalDrawerH = drawerCount > 0 ? Math.min(drawerH * drawerCount, fh * 0.45) : 0
  const singleDrawerH = drawerCount > 0 ? totalDrawerH / drawerCount : 0

  // Door zone (above drawers)
  const doorZoneY  = fy
  const doorZoneH  = fh - totalDrawerH
  const doorZoneBottom = fy + doorZoneH

  const isGlass = doorType === 'GLASS_SWING' || doorType === 'GLASS_SLIDING'
  const isSliding = doorType === 'SLIDING' || doorType === 'GLASS_SLIDING'
  const isOpen  = doorType === 'OPEN_SHELF' || isWalkIn

  // ── Shelf lines ───────────────────────────────────────────────────────────
  const shelfCount = Math.max(0, input.shelfCount || 0)

  // ── Kitchen split ─────────────────────────────────────────────────────────
  const upperH   = fh * 0.38
  const gapH     = fh * 0.07
  const baseH    = fh * 0.55
  const upperY   = fy
  const gapY     = fy + upperH
  const baseY    = gapY + gapH
  const countertopH = 8

  return (
    <svg
      viewBox="0 0 480 340"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Cabinet visualizer: ${PROJECT_TYPE_LABELS_TH[pt] ?? pt}`}
    >
      {/* ── Background: subtle dot grid ── */}
      <defs>
        <pattern id="dotGrid" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="0.8" fill="#C6A969" fillOpacity="0.10" />
        </pattern>
        {/* Vignette gradient */}
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%"   stopColor="transparent" />
          <stop offset="100%" stopColor="#F0EDE8" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <rect width="480" height="340" fill="url(#dotGrid)" />
      <rect width="480" height="340" fill="url(#vignette)" />

      <defs>
        {/* LED glow filter */}
        <filter id="ledGlow" x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Mirror gradient */}
        <linearGradient id="mirrorGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#C8CDD4" />
          <stop offset="50%"  stopColor="#E8EDF4" />
          <stop offset="100%" stopColor="#C8CDD4" />
        </linearGradient>

        {/* Acrylic gloss gradient */}
        <linearGradient id="acrylicGloss" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="white" stopOpacity="0" />
          <stop offset="30%"  stopColor="white" stopOpacity="0.35" />
          <stop offset="45%"  stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Hi-gloss reflection */}
        <linearGradient id="higlossMirror" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0.5" />
          <stop offset="40%"  stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Veneer wood grain gradient */}
        <pattern id="woodGrain" x="0" y="0" width="8" height={fh} patternUnits="userSpaceOnUse">
          <rect width="8" height={fh} fill="none" />
          <line x1="2" y1="0" x2="2" y2={fh} stroke="#00000010" strokeWidth="1.5" />
          <line x1="5" y1="0" x2="5" y2={fh} stroke="#00000008" strokeWidth="1" />
        </pattern>

        {/* Drawer inner shadow */}
        <linearGradient id="drawerShad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#00000018" />
          <stop offset="20%"  stopColor="transparent" />
        </linearGradient>

        {/* Side face shading */}
        <linearGradient id="sideShade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#00000020" />
          <stop offset="100%" stopColor="#00000040" />
        </linearGradient>
      </defs>

      {/* ── Shadow ── */}
      <ellipse
        cx={shadowCX}
        cy={shadowY}
        rx={fw * 0.55}
        ry={8}
        fill="#00000018"
        style={transition}
      />

      {/* ── Mount animation wrapper ── */}
      <g style={{
        animation: 'cabinetIn 0.45s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600&display=swap');
          @keyframes cabinetIn {
            from { opacity: 0; transform-origin: 50% 55%; transform: scale(0.94) translateY(4px); }
            to   { opacity: 1; transform-origin: 50% 55%; transform: scale(1)    translateY(0px); }
          }
          @keyframes infoPanelIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* ════════════════════════════════════════════════
            WALK-IN CLOSET LAYOUT
            ════════════════════════════════════════════════ */}
        {isWalkIn ? (
          <>
            {/* Top face */}
            <polygon points={pts(topFace)} fill={palette.top} stroke="#B0A898" strokeWidth="0.8" style={transition} />
            {/* Side face */}
            <polygon points={pts(sideFace)} fill={palette.side} stroke="#B0A898" strokeWidth="0.8" style={transition} />
            {/* Front face — open, very light */}
            <rect x={fx} y={fy} width={fw} height={fh}
              fill="#F8F6F2" fillOpacity="0.35" stroke="#C8C4BC" strokeWidth="0.8" style={transition} />

            {/* 3 bays vertical dividers */}
            {[1, 2].map(i => (
              <line key={i}
                x1={fx + (fw / 3) * i} y1={fy}
                x2={fx + (fw / 3) * i} y2={fy + fh}
                stroke="#B0A898" strokeWidth="1" strokeDasharray="none" />
            ))}

            {/* Shelf lines in each bay */}
            {Array.from({ length: Math.max(shelfCount, 3) }).map((_, si) => {
              const sy = fy + (fh / (Math.max(shelfCount, 3) + 1)) * (si + 1)
              return (
                <line key={si} x1={fx + 2} y1={sy} x2={fx + fw - 2} y2={sy}
                  stroke="#C8C4BC" strokeWidth="0.8" strokeDasharray="4 3" />
              )
            })}

            {/* Hanging rail at top of each bay */}
            {[0, 1, 2].map(bay => {
              const bx = fx + (fw / 3) * bay + 8
              const bw = fw / 3 - 16
              const railY = fy + fh * 0.18
              return (
                <g key={bay}>
                  <rect x={bx} y={railY - 2} width={bw} height={4} rx="2"
                    fill="#A0A0A0" fillOpacity="0.7" />
                  {/* Cross-section circle at end */}
                  <ellipse cx={bx + bw} cy={railY} rx="4" ry="4"
                    fill="#B8B8B8" stroke="#909090" strokeWidth="0.8" />
                </g>
              )
            })}

            {/* Frame outline */}
            <rect x={fx} y={fy} width={fw} height={fh}
              fill="none" stroke="#B0A898" strokeWidth="1.2" />
          </>
        ) : isKitchen ? (
          /* ════════════════════════════════════════════════
             KITCHEN LAYOUT
             ════════════════════════════════════════════════ */
          <>
            {/* Upper cabinet top face */}
            <polygon points={pts(topFace)} fill={palette.top} stroke="#B0A898" strokeWidth="0.8" style={transition} />
            {/* Upper cabinet side face */}
            <polygon
              points={pts([
                [fx + fw,        upperY],
                [fx + fw + dx,   upperY - dy],
                [fx + fw + dx,   upperY - dy + upperH],
                [fx + fw,        upperY + upperH],
              ])}
              fill={palette.side} stroke="#B0A898" strokeWidth="0.8" style={transition}
            />
            {/* Upper cabinet front */}
            <rect x={fx} y={upperY} width={fw} height={upperH}
              fill={palette.front} stroke="#B0A898" strokeWidth="0.8" style={transition} />
            {/* Upper cabinet doors */}
            {Array.from({ length: doorCount }).map((_, di) => {
              const dw = fw / doorCount
              const dx_ = fx + dw * di
              return (
                <g key={di}>
                  <rect x={dx_ + 3} y={upperY + 3} width={dw - 6} height={upperH - 6}
                    fill={isGlass ? '#D8E8F8' : palette.front}
                    fillOpacity={isGlass ? 0.45 : 0.3}
                    stroke="#C0BAB0" strokeWidth="0.8" rx="1" style={transition} />
                  {/* Handle */}
                  {renderHandle(handleType, dx_ + dw * 0.5, upperY + upperH * 0.58, dw, upperH)}
                </g>
              )
            })}
            {/* Veneer overlay upper */}
            {isVeneer && (
              <rect x={fx} y={upperY} width={fw} height={upperH} fill="url(#woodGrain)" fillOpacity="0.6" />
            )}

            {/* Gap / hood space */}
            {/* (no fill, just empty) */}

            {/* Countertop */}
            <rect
              x={fx - 10} y={baseY - countertopH}
              width={fw + 20} height={countertopH}
              fill={blendColor(palette.top, '#888880', 0.15)}
              stroke="#A8A49C" strokeWidth="0.8" rx="1" style={transition}
            />
            {/* Countertop top parallelogram */}
            <polygon
              points={pts([
                [fx - 10,            baseY - countertopH],
                [fx - 10 + fw + 20,  baseY - countertopH],
                [fx - 10 + fw + 20 + dx, baseY - countertopH - dy],
                [fx - 10 + dx,           baseY - countertopH - dy],
              ])}
              fill={blendColor(palette.top, '#888880', 0.20)}
              stroke="#A8A49C" strokeWidth="0.8" style={transition}
            />

            {/* Base cabinet side face */}
            <polygon
              points={pts([
                [fx + fw,        baseY],
                [fx + fw + dx,   baseY - dy],
                [fx + fw + dx,   baseY - dy + baseH],
                [fx + fw,        baseY + baseH],
              ])}
              fill={palette.side} stroke="#B0A898" strokeWidth="0.8" style={transition}
            />
            {/* Base cabinet front */}
            <rect x={fx} y={baseY} width={fw} height={baseH}
              fill={palette.front} stroke="#B0A898" strokeWidth="0.8" style={transition} />

            {/* Base cabinet: drawers on left 35%, doors on right 65% */}
            {(() => {
              const leftW  = fw * 0.35
              const rightW = fw * 0.65
              const rightX = fx + leftW
              const dCount = Math.max(1, drawerCount || 2)
              const dH = baseH / dCount
              return (
                <>
                  {/* Drawers (left side) */}
                  {Array.from({ length: dCount }).map((_, di) => (
                    <g key={di}>
                      <rect x={fx + 2} y={baseY + dH * di + 2} width={leftW - 4} height={dH - 4}
                        fill="url(#drawerShad)" stroke="#B8B4AC" strokeWidth="0.8" rx="1" />
                      {/* Drawer handle */}
                      {renderHandle(handleType, fx + leftW / 2, baseY + dH * di + dH / 2, leftW, dH)}
                    </g>
                  ))}
                  {/* Divider line */}
                  <line x1={rightX} y1={baseY} x2={rightX} y2={baseY + baseH}
                    stroke="#B0A898" strokeWidth="1" />
                  {/* Doors (right side) */}
                  {Array.from({ length: 2 }).map((_, di) => {
                    const doorW = rightW / 2
                    const doorX = rightX + doorW * di
                    return (
                      <g key={di}>
                        <rect x={doorX + 2} y={baseY + 3} width={doorW - 4} height={baseH - 6}
                          fill={palette.front} fillOpacity="0.3"
                          stroke="#C0BAB0" strokeWidth="0.8" rx="1" style={transition} />
                        {renderHandle(handleType, doorX + doorW * 0.5, baseY + baseH * 0.42, doorW, baseH)}
                      </g>
                    )
                  })}
                </>
              )
            })()}

            {/* Veneer overlay base */}
            {isVeneer && (
              <rect x={fx} y={baseY} width={fw} height={baseH} fill="url(#woodGrain)" fillOpacity="0.6" />
            )}

            {/* LED strip at base bottom */}
            {input.hasLED && (
              <line x1={fx + 4} y1={baseY + baseH - 3} x2={fx + fw - 4} y2={baseY + baseH - 3}
                stroke="#FFF4CC" strokeWidth="2" filter="url(#ledGlow)" />
            )}
          </>
        ) : isTV ? (
          /* ════════════════════════════════════════════════
             TV CABINET LAYOUT — wide & low, open center
             ════════════════════════════════════════════════ */
          <>
            <polygon points={pts(topFace)} fill={palette.top} stroke="#B0A898" strokeWidth="0.8" style={transition} />
            <polygon points={pts(sideFace)} fill={palette.side} stroke="#B0A898" strokeWidth="0.8" style={transition} />
            <rect x={fx} y={fy} width={fw} height={fh}
              fill={palette.front} stroke="#B0A898" strokeWidth="0.8" style={transition} />

            {/* Left closed section (30%) */}
            {(() => {
              const leftW = fw * 0.30
              return (
                <>
                  <rect x={fx + 2} y={fy + 3} width={leftW - 4} height={fh - 6}
                    fill={palette.front} fillOpacity="0.25" stroke="#C0BAB0" strokeWidth="0.8" rx="1" style={transition} />
                  {renderHandle(handleType, fx + leftW * 0.5, fy + fh * 0.5, leftW, fh)}
                </>
              )
            })()}

            {/* Center open section (40%) */}
            {(() => {
              const leftW  = fw * 0.30
              const centreW = fw * 0.40
              const centreX = fx + leftW
              // shelf lines in center
              const sCount = Math.max(shelfCount, 2)
              return (
                <>
                  <rect x={centreX} y={fy} width={centreW} height={fh}
                    fill="#F8F6F2" fillOpacity="0.5" />
                  {/* Divider lines */}
                  <line x1={centreX} y1={fy} x2={centreX} y2={fy + fh} stroke="#B0A898" strokeWidth="1" />
                  <line x1={centreX + centreW} y1={fy} x2={centreX + centreW} y2={fy + fh} stroke="#B0A898" strokeWidth="1" />
                  {/* Shelf lines in center */}
                  {Array.from({ length: sCount }).map((_, si) => {
                    const sy = fy + (fh / (sCount + 1)) * (si + 1)
                    return (
                      <line key={si} x1={centreX + 2} y1={sy} x2={centreX + centreW - 2} y2={sy}
                        stroke="#C8C4BC" strokeWidth="0.8" strokeDasharray="4 3" />
                    )
                  })}
                </>
              )
            })()}

            {/* Right closed section (30%) */}
            {(() => {
              const rightX = fx + fw * 0.70
              const rightW = fw * 0.30
              return (
                <>
                  <rect x={rightX + 2} y={fy + 3} width={rightW - 4} height={fh - 6}
                    fill={palette.front} fillOpacity="0.25" stroke="#C0BAB0" strokeWidth="0.8" rx="1" style={transition} />
                  {renderHandle(handleType, rightX + rightW * 0.5, fy + fh * 0.5, rightW, fh)}
                </>
              )
            })()}

            {/* Veneer overlay */}
            {isVeneer && (
              <rect x={fx} y={fy} width={fw} height={fh} fill="url(#woodGrain)" fillOpacity="0.55" />
            )}
          </>
        ) : (
          /* ════════════════════════════════════════════════
             DEFAULT / WARDROBE / PANTRY / VANITY /
             FLOATING / FULL_HEIGHT / SHOE / etc.
             ════════════════════════════════════════════════ */
          <>
            {/* Top face */}
            <polygon points={pts(topFace)} fill={palette.top} stroke="#B0A898" strokeWidth="0.8" style={transition} />
            {/* Side face */}
            <polygon points={pts(sideFace)} fill="url(#sideShade)" stroke="#B0A898" strokeWidth="0.8" />
            <polygon points={pts(sideFace)} fill={palette.side} fillOpacity="0.88" stroke="none" style={transition} />

            {/* Front face base */}
            <rect x={fx} y={fy} width={fw} height={fh}
              fill={palette.front} stroke="#B0A898" strokeWidth="0.8" style={transition} />

            {/* Veneer wood grain */}
            {isVeneer && (
              <rect x={fx} y={fy} width={fw} height={fh} fill="url(#woodGrain)" fillOpacity="0.6" />
            )}

            {/* Acrylic gloss stripe */}
            {isAcrylic && (
              <rect x={fx} y={fy} width={fw} height={fh} fill="url(#acrylicGloss)" />
            )}

            {/* Hi-gloss reflection */}
            {isHigloss && (
              <rect x={fx} y={fy} width={fw} height={fh * 0.4} fill="url(#higlossMirror)" />
            )}

            {/* Vacuum membrane — soft curved highlight edge */}
            {isVacuum && (
              <>
                <rect x={fx + 2} y={fy + 2} width={fw - 4} height={fh - 4}
                  fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.18" rx="3" />
                <rect x={fx + 1} y={fy + 1} width={fw * 0.45} height={fh * 0.15}
                  fill="white" fillOpacity="0.12" rx="2" />
              </>
            )}

            {/* ── Doors ── */}
            {!isOpen && (() => {
              if (isSliding) {
                // 2 overlapping panels
                const panelW = fw * 0.58
                const panels = [
                  { x: fx + 2,              y: doorZoneY + 2, z: 0 },
                  { x: fx + fw - panelW - 2 + 8, y: doorZoneY + 2, z: 1 },
                ]
                return (
                  <>
                    {panels.map((p, pi) => (
                      <g key={pi}>
                        <rect
                          x={p.x} y={p.y}
                          width={panelW} height={doorZoneH - 4}
                          fill={isGlass ? '#C8DCF0' : palette.front}
                          fillOpacity={isGlass ? 0.38 : 0.28}
                          stroke="#B8B4AA" strokeWidth="0.8" rx="1"
                          style={transition}
                        />
                        {/* Mirror on first panel */}
                        {input.hasMirror && pi === 0 && (
                          <rect x={p.x + 4} y={p.y + 4} width={panelW - 8} height={doorZoneH - 12}
                            fill="url(#mirrorGrad)" fillOpacity="0.75" rx="1" />
                        )}
                        {/* Handle */}
                        {renderHandle(
                          input.hasMirror && pi === 0 ? 'BAR' : handleType,
                          p.x + panelW * 0.55,
                          p.y + doorZoneH * 0.42,
                          panelW, doorZoneH - 4
                        )}
                      </g>
                    ))}
                    {/* Sliding track lines */}
                    <line x1={fx + 1} y1={doorZoneY + 1} x2={fx + fw - 1} y2={doorZoneY + 1}
                      stroke="#B0A898" strokeWidth="0.6" />
                    <line x1={fx + 1} y1={doorZoneBottom - 1} x2={fx + fw - 1} y2={doorZoneBottom - 1}
                      stroke="#B0A898" strokeWidth="0.6" />
                  </>
                )
              }

              // Swing / push-open / glass-swing
              return Array.from({ length: doorCount }).map((_, di) => {
                const dw = fw / doorCount
                const doorX = fx + dw * di
                const isMirrorDoor = input.hasMirror && di === 0
                return (
                  <g key={di}>
                    <rect
                      x={doorX + 3} y={doorZoneY + 3}
                      width={dw - 6} height={doorZoneH - 6}
                      fill={isGlass ? '#C8DCF0' : palette.front}
                      fillOpacity={isGlass ? 0.35 : 0.22}
                      stroke="#C0BAB0" strokeWidth="0.8" rx="1"
                      style={transition}
                    />
                    {/* Mirror fill */}
                    {isMirrorDoor && (
                      <rect x={doorX + 6} y={doorZoneY + 6} width={dw - 12} height={doorZoneH - 12}
                        fill="url(#mirrorGrad)" fillOpacity="0.78" rx="1" />
                    )}
                    {/* Handle */}
                    {isMirrorDoor ? (
                      renderHandle('BAR', doorX + dw * 0.5, doorZoneY + doorZoneH * 0.6, dw, doorZoneH)
                    ) : (
                      renderHandle(handleType, doorX + dw * 0.5, doorZoneY + doorZoneH * 0.42, dw, doorZoneH)
                    )}
                    {/* Vertical divider line */}
                    {di > 0 && (
                      <line x1={doorX} y1={doorZoneY} x2={doorX} y2={doorZoneBottom}
                        stroke="#B0A898" strokeWidth="0.8" />
                    )}
                  </g>
                )
              })
            })()}

            {/* ── Open shelf lines (OPEN_SHELF or WALK_IN implied) ── */}
            {(isOpen || isPantry) && shelfCount > 0 && Array.from({ length: shelfCount }).map((_, si) => {
              const sy = fy + (fh / (shelfCount + 1)) * (si + 1)
              return (
                <line key={si} x1={fx + 2} y1={sy} x2={fx + fw - 2} y2={sy}
                  stroke="#C8C4BC" strokeWidth="0.8" strokeDasharray="4 3" />
              )
            })}

            {/* ── Drawers ── */}
            {drawerCount > 0 && Array.from({ length: drawerCount }).map((_, di) => {
              const drawerY = doorZoneBottom + singleDrawerH * di
              return (
                <g key={di}>
                  <rect x={fx + 2} y={drawerY + 1} width={fw - 4} height={singleDrawerH - 2}
                    fill={palette.front} fillOpacity="0.15"
                    stroke="#B8B4AC" strokeWidth="0.8" rx="1" style={transition} />
                  <rect x={fx + 2} y={drawerY + 1} width={fw - 4} height={Math.min(6, singleDrawerH * 0.15)}
                    fill="url(#drawerShad)" rx="1" />
                  {/* Drawer handle */}
                  {renderHandle(handleType, fx + fw / 2, drawerY + singleDrawerH / 2, fw, singleDrawerH)}
                  {/* Separator line */}
                  <line x1={fx} y1={drawerY} x2={fx + fw} y2={drawerY}
                    stroke="#B8B4AC" strokeWidth="0.6" />
                </g>
              )
            })}

            {/* ── LED strip ── */}
            {input.hasLED && (
              <line x1={fx + 6} y1={fy + fh - 4} x2={fx + fw - 6} y2={fy + fh - 4}
                stroke="#FFF4CC" strokeWidth="2" filter="url(#ledGlow)" />
            )}

            {/* ── Float gap visual ── */}
            {isFloat && (
              <rect x={fx} y={fy + fh} width={fw} height={floatGap}
                fill="white" fillOpacity="0.0" />
            )}

            {/* ── Vanity countertop ── */}
            {isVanity && (
              <>
                <rect x={fx - 8} y={fy - 8} width={fw + 16} height={10}
                  fill={blendColor(palette.top, '#888880', 0.12)}
                  stroke="#A8A49C" strokeWidth="0.8" rx="1" style={transition} />
                <polygon
                  points={pts([
                    [fx - 8,            fy - 8],
                    [fx - 8 + fw + 16,  fy - 8],
                    [fx - 8 + fw + 16 + dx, fy - 8 - dy],
                    [fx - 8 + dx,           fy - 8 - dy],
                  ])}
                  fill={blendColor(palette.top, '#888880', 0.18)}
                  stroke="#A8A49C" strokeWidth="0.8" style={transition}
                />
              </>
            )}
          </>
        )}

        {/* ── Dimension Labels ── */}
        <g>
          {/* Width tick lines */}
          <line x1={fx} y1={frontBottom + 14} x2={fx} y2={frontBottom + 22} stroke="#D4D0C8" strokeWidth="0.8" />
          <line x1={fx + fw} y1={frontBottom + 14} x2={fx + fw} y2={frontBottom + 22} stroke="#D4D0C8" strokeWidth="0.8" />
          <line x1={fx + 1} y1={frontBottom + 18} x2={fx + fw - 1} y2={frontBottom + 18} stroke="#D4D0C8" strokeWidth="0.7" strokeDasharray="3 2" />
          {/* Height tick */}
          <line x1={fx - 8} y1={fy} x2={fx - 14} y2={fy} stroke="#D4D0C8" strokeWidth="0.7" />
          <line x1={fx - 8} y1={frontBottom} x2={fx - 14} y2={frontBottom} stroke="#D4D0C8" strokeWidth="0.7" />
          <line x1={fx - 11} y1={fy + 1} x2={fx - 11} y2={frontBottom - 1} stroke="#D4D0C8" strokeWidth="0.7" strokeDasharray="3 2" />
          {/* Dimension text — Prompt font */}
          <text
            x={fx + fw / 2}
            y={frontBottom + 31}
            textAnchor="middle"
            fontSize="9.5"
            fontFamily="'Prompt', sans-serif"
            fontWeight="500"
            letterSpacing="0.3"
            fill="#B0AB9F"
          >
            W{input.width} × H{input.height} × D{input.depth} ซม.
          </text>
        </g>

        {/* ── Smart Info Panel (bottom) ── */}
        {(() => {
          const PROMPT = "'Prompt', sans-serif"
          const panelY = Math.min(frontBottom + 44, 310)

          // Surface chip
          const surfLabel = SURFACE_LABELS_TH[input.surfaceType]
          const surfChipW = surfLabel.length * 6.5 + 22
          const surfX = 12

          // Color resolved
          const colorStr = input.color?.trim() ?? ''
          const colorHex = THAI_COLOR_MAP[colorStr] ?? (colorStr.startsWith('#') ? colorStr : null)

          // Handle type label
          const HANDLE_LABELS_TH: Record<string, string> = {
            BAR: 'มือจับบาร์', KNOB: 'มือจับปุ่ม',
            RECESSED: 'เซาะร่อง', INTEGRATED: 'Push Open', NONE: 'ไม่มีมือจับ',
          }
          const handleLabel = HANDLE_LABELS_TH[handleType] ?? handleType
          const handleChipW = handleLabel.length * 6.2 + 18
          const handleX = surfX + surfChipW + (colorHex ? 22 : 8)

          // Spec summary: "2 บาน · 2 ลิ้นชัก · 3 ชั้น"
          const specParts: string[] = []
          if (input.doorType !== 'OPEN_SHELF') {
            specParts.push(`${input.doorCount || 2} บาน`)
          }
          if ((input.drawerCount || 0) > 0) specParts.push(`${input.drawerCount} ลิ้นชัก`)
          if ((input.shelfCount || 0) > 0) specParts.push(`${input.shelfCount} ชั้น`)
          if (input.hasLED) specParts.push('LED')
          if (input.hasMirror) specParts.push('กระจก')
          const specText = specParts.join(' · ')

          return (
            <g>
              {/* Surface chip */}
              <rect x={surfX} y={panelY - 1} width={surfChipW} height={17} rx="8.5"
                fill={palette.front} fillOpacity="0.35" stroke={palette.side} strokeWidth="0.7" />
              {/* Material dot (palette color) */}
              <circle cx={surfX + 8} cy={panelY + 7.5} r={3.5} fill={palette.front} stroke={palette.side} strokeWidth="0.7" />
              <text x={surfX + 15} y={panelY + 11.5} fontSize="8.5" fontFamily={PROMPT} fontWeight="500" fill="#7A7570">
                {surfLabel}
              </text>

              {/* Color swatch (if color set) */}
              {colorHex && (
                <>
                  <circle cx={surfX + surfChipW + 11} cy={panelY + 7.5} r={6}
                    fill={colorHex} stroke="#C8C4BC" strokeWidth="0.8" />
                  <circle cx={surfX + surfChipW + 11} cy={panelY + 7.5} r={3}
                    fill="white" fillOpacity="0.28" />
                </>
              )}

              {/* Handle type chip */}
              {handleType !== 'NONE' && (
                <>
                  <rect x={handleX} y={panelY - 1} width={handleChipW} height={17} rx="8.5"
                    fill="#F0EDE8" stroke="#D8D4CC" strokeWidth="0.7" />
                  {/* Mini handle icon */}
                  {handleType === 'KNOB' ? (
                    <circle cx={handleX + 8} cy={panelY + 7.5} r={3} fill="#A0A098" fillOpacity="0.8" />
                  ) : handleType === 'RECESSED' ? (
                    <rect x={handleX + 5} y={panelY + 6} width={6} height={3} rx="1.5"
                      fill="none" stroke="#A0A098" strokeWidth="1.2" />
                  ) : (
                    <rect x={handleX + 5} y={panelY + 6.5} width={6} height={2} rx="1"
                      fill="#A0A098" fillOpacity="0.85" />
                  )}
                  <text x={handleX + 14} y={panelY + 11.5} fontSize="8.5" fontFamily={PROMPT} fontWeight="400" fill="#8A8580">
                    {handleLabel}
                  </text>
                </>
              )}

              {/* Spec summary row */}
              {specText.length > 0 && (
                <text x={12} y={panelY + 27} fontSize="8" fontFamily={PROMPT} fontWeight="300" fill="#B8B4AC" letterSpacing="0.2">
                  {specText}
                </text>
              )}

              {/* LED indicator glow dot */}
              {input.hasLED && (
                <circle cx={466} cy={panelY + 7} r={4} fill="#FFF4CC" filter="url(#ledGlow)" fillOpacity="0.9" />
              )}
            </g>
          )
        })()}

        {/* ── Type label (top-left) — Prompt bold ── */}
        <g>
          {/* Gold accent bar */}
          <rect x={12} y={fy - dy - 22} width={2.5} height={14} rx="1.2" fill="#C6A969" fillOpacity="0.8" />
          <text
            x={18}
            y={fy - dy - 12}
            fontSize="10"
            fontFamily="'Prompt', sans-serif"
            fontWeight="600"
            fill="#8A8480"
            letterSpacing="0.2"
          >
            {PROJECT_TYPE_LABELS_TH[pt] ?? pt}
          </text>
        </g>

        {/* ── Live Preview chip (top-right) ── */}
        <g>
          <rect x={390} y={10} width={78} height={16} rx="8" fill="#F5F3EF" stroke="#E0DDD6" strokeWidth="0.7" />
          <circle cx={399} cy={18} r={3} fill="#C6A969" fillOpacity="0.85" />
          <text x={405} y={22} fontSize="8.5" fontFamily="'Prompt', sans-serif" fontWeight="500" fill="#A8A49C">
            Live Preview
          </text>
        </g>
      </g>
    </svg>
  )
}
