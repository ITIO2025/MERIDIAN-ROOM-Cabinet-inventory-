'use client'
import { useRef, useMemo, Suspense, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei'
import * as THREE from 'three'
import type { CabinetInput, SurfaceType } from '@/lib/types'

// ─── Material color map ───────────────────────────────────────────────────────

const SURFACE_COLORS: Record<SurfaceType, { base: string; roughness: number; metalness: number; clearcoat?: number }> = {
  MELAMINE:  { base: '#EDE8E0', roughness: 0.80, metalness: 0.00 },
  LAMINATE:  { base: '#D8CEBC', roughness: 0.75, metalness: 0.00 },
  ACRYLIC:   { base: '#D8E8F8', roughness: 0.10, metalness: 0.00, clearcoat: 1.0 },
  VENEER:    { base: '#C8A478', roughness: 0.70, metalness: 0.00 },
  HIGLOSS:   { base: '#F0F0F0', roughness: 0.05, metalness: 0.05, clearcoat: 1.0 },
  PU_PAINT:  { base: '#E4E4E4', roughness: 0.30, metalness: 0.00 },
  VACUUM:    { base: '#E2D8CC', roughness: 0.55, metalness: 0.00 },
}

const THAI_COLOR_MAP: Record<string, string> = {
  'ขาว': '#F8F8F8', 'ดำ': '#2D2D2D', 'เทา': '#808080',
  'น้ำเงิน': '#1E40AF', 'ฟ้า': '#60A5FA', 'เขียว': '#16A34A',
  'แดง': '#DC2626', 'ส้ม': '#EA580C', 'เหลือง': '#EAB308',
  'ชมพู': '#EC4899', 'ม่วง': '#7C3AED', 'ครีม': '#FFF3CC', 'เบจ': '#F0E0C4',
}

function resolveMaterial(surfaceType: SurfaceType, color: string) {
  const base = { ...SURFACE_COLORS[surfaceType] }
  if ((surfaceType === 'PU_PAINT' || surfaceType === 'HIGLOSS') && color) {
    const c = color.trim()
    const hex = THAI_COLOR_MAP[c] ?? (c.startsWith('#') ? c : null)
    if (hex) base.base = hex
  }
  return base
}

// ─── Board panel primitive ────────────────────────────────────────────────────

function Board({
  position, size, color, roughness, metalness,
}: {
  position: [number, number, number]
  size: [number, number, number]
  color: string
  roughness: number
  metalness: number
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  )
}

// ─── Shelf ────────────────────────────────────────────────────────────────────

function Shelf({ y, w, d, t, color, roughness }: { y: number; w: number; d: number; t: number; color: string; roughness: number }) {
  return (
    <mesh position={[0, y, 0]} receiveShadow>
      <boxGeometry args={[w - 0.04, t, d - 0.04]} />
      <meshStandardMaterial color={color} roughness={roughness + 0.1} metalness={0} />
    </mesh>
  )
}

// ─── Handle ──────────────────────────────────────────────────────────────────

function Handle({ handleType, x, y, z, doorW }: {
  handleType: string; x: number; y: number; z: number; doorW: number
}) {
  if (handleType === 'NONE' || handleType === 'INTEGRATED') return null
  const handleColor = '#8A8680'
  const hw = Math.min(doorW * 0.4, 0.12)

  if (handleType === 'KNOB') {
    return (
      <mesh position={[x, y, z]} castShadow>
        <sphereGeometry args={[0.015, 12, 12]} />
        <meshStandardMaterial color={handleColor} roughness={0.3} metalness={0.6} />
      </mesh>
    )
  }
  if (handleType === 'RECESSED') {
    return (
      <mesh position={[x, y, z]}>
        <boxGeometry args={[hw, 0.008, 0.012]} />
        <meshStandardMaterial color="#5A5650" roughness={0.7} metalness={0.1} />
      </mesh>
    )
  }
  // BAR
  return (
    <group position={[x, y, z]}>
      <mesh>
        <cylinderGeometry args={[0.006, 0.006, hw, 8]} />
        <meshStandardMaterial color={handleColor} roughness={0.25} metalness={0.65} />
      </mesh>
      {/* Bar end caps */}
      <mesh position={[-hw / 2, 0, 0.008]}>
        <cylinderGeometry args={[0.006, 0.006, 0.016, 8]} />
        <meshStandardMaterial color={handleColor} roughness={0.25} metalness={0.65} />
      </mesh>
      <mesh position={[hw / 2, 0, 0.008]}>
        <cylinderGeometry args={[0.006, 0.006, 0.016, 8]} />
        <meshStandardMaterial color={handleColor} roughness={0.25} metalness={0.65} />
      </mesh>
    </group>
  )
}

// ─── Door panel ───────────────────────────────────────────────────────────────

function Door({
  x, y, z, w, h, t,
  color, roughness, metalness, glass,
  handleType, isSliding,
}: {
  x: number; y: number; z: number; w: number; h: number; t: number
  color: string; roughness: number; metalness: number; glass: boolean
  handleType: string; isSliding?: boolean
}) {
  const zOffset = isSliding ? 0.01 : 0

  return (
    <group position={[x, y, z + zOffset]}>
      <mesh castShadow>
        <boxGeometry args={[w - 0.01, h - 0.01, t]} />
        {glass ? (
          <meshStandardMaterial color="#A8C8E8" roughness={0.05} metalness={0} transparent opacity={0.35} />
        ) : (
          <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
        )}
      </mesh>
      {/* Handle on door */}
      <Handle handleType={handleType} x={0} y={0} z={t / 2 + 0.008} doorW={w} />
    </group>
  )
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

function Drawer({ x, y, z, w, h, d, color, roughness, handleType }: {
  x: number; y: number; z: number; w: number; h: number; d: number
  color: string; roughness: number; handleType: string
}) {
  return (
    <group position={[x, y, z]}>
      {/* Drawer face */}
      <mesh castShadow>
        <boxGeometry args={[w - 0.01, h - 0.01, 0.022]} />
        <meshStandardMaterial color={color} roughness={roughness} metalness={0} />
      </mesh>
      {/* Drawer box body (recessed) */}
      <mesh position={[0, 0, -(d * 0.3)]} receiveShadow>
        <boxGeometry args={[w - 0.04, h - 0.04, d * 0.6]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
      </mesh>
      {/* Top shadow line */}
      <mesh position={[0, h / 2, 0.012]}>
        <boxGeometry args={[w, 0.003, 0.003]} />
        <meshStandardMaterial color="#00000030" transparent opacity={0.3} />
      </mesh>
      <Handle handleType={handleType} x={0} y={0} z={0.022} doorW={w} />
    </group>
  )
}

// ─── LED strip ────────────────────────────────────────────────────────────────

function LEDStrip({ y, w, z }: { y: number; w: number; z: number }) {
  return (
    <mesh position={[0, y, z]}>
      <boxGeometry args={[w * 0.85, 0.006, 0.006]} />
      <meshStandardMaterial color="#FFF4CC" emissive="#FFE080" emissiveIntensity={2.5} />
    </mesh>
  )
}

// ─── Cabinet mesh ─────────────────────────────────────────────────────────────

function CabinetMesh({ input }: { input: CabinetInput }) {
  // Scale: 1 unit = 60cm → dimensions in THREE units
  const S = 1 / 60
  const W = input.width  * S
  const H = input.height * S
  const D = input.depth  * S
  const T = 0.022 // board thickness 18mm ≈ 0.022 units

  const mat = resolveMaterial(input.surfaceType, input.color)
  const c   = mat.base
  const r   = mat.roughness
  const m   = mat.metalness

  // Darker shades for sides/top
  const sideColor = useMemo(() => {
    const col = new THREE.Color(c)
    col.multiplyScalar(0.82)
    return '#' + col.getHexString()
  }, [c])

  const topColor = useMemo(() => {
    const col = new THREE.Color(c)
    col.multiplyScalar(0.92)
    return '#' + col.getHexString()
  }, [c])

  const doorType   = input.doorType
  const doorCount  = Math.max(1, input.doorCount || 2)
  const shelfCount = Math.max(0, input.shelfCount || 0)
  const drawerCount = Math.max(0, input.drawerCount || 0)
  const handleType = input.handleType ?? 'BAR'
  const isGlass    = doorType === 'GLASS_SWING' || doorType === 'GLASS_SLIDING'
  const isSliding  = doorType === 'SLIDING' || doorType === 'GLASS_SLIDING'
  const isOpen     = doorType === 'OPEN_SHELF' || input.projectType === 'WALK_IN'
  const isKitchen  = input.projectType === 'KITCHEN'
  const isTV       = input.projectType === 'TV_CABINET'

  // Drawer zone height
  const drawerH = drawerCount > 0 ? Math.min(0.10, H * 0.22) : 0
  const totalDrawerH = drawerH * drawerCount
  const doorH = H - totalDrawerH

  // Half-dims for centering
  const hW = W / 2; const hH = H / 2; const hD = D / 2

  return (
    <group>
      {/* ── Shell panels ── */}
      {/* Left panel */}
      <Board position={[-hW + T / 2, 0, 0]} size={[T, H, D]} color={sideColor} roughness={r} metalness={m} />
      {/* Right panel */}
      <Board position={[hW - T / 2, 0, 0]} size={[T, H, D]} color={sideColor} roughness={r} metalness={m} />
      {/* Top panel */}
      <Board position={[0, hH - T / 2, 0]} size={[W - T * 2, T, D]} color={topColor} roughness={r} metalness={m} />
      {/* Bottom panel */}
      <Board position={[0, -hH + T / 2, 0]} size={[W - T * 2, T, D]} color={c} roughness={r + 0.1} metalness={m} />
      {/* Back panel */}
      <Board position={[0, 0, -hD + T / 2]} size={[W - T * 2, H - T * 2, T * 0.5]} color={sideColor} roughness={0.9} metalness={0} />

      {/* ── Shelves ── */}
      {shelfCount > 0 && Array.from({ length: shelfCount }).map((_, i) => {
        const shelfY = -hH + T + (doorH * (i + 1)) / (shelfCount + 1)
        return (
          <Shelf key={i} y={shelfY} w={W - T * 2} d={D - T * 1.5} t={T * 0.8} color={sideColor} roughness={r} />
        )
      })}

      {/* ── Doors ── */}
      {!isOpen && !isKitchen && !isTV && (() => {
        if (isSliding) {
          const panelW = (W - T * 2) * 0.56
          const frontZ = hD
          return (
            <>
              <Door x={-W * 0.12} y={hH - T - doorH / 2}
                z={frontZ} w={panelW} h={doorH - T} t={T * 0.8}
                color={c} roughness={r} metalness={m} glass={isGlass}
                handleType={handleType} isSliding />
              <Door x={W * 0.12} y={hH - T - doorH / 2}
                z={frontZ + 0.012} w={panelW} h={doorH - T} t={T * 0.8}
                color={c} roughness={r} metalness={m} glass={isGlass}
                handleType={input.hasMirror ? 'NONE' : handleType} isSliding />
              {/* Mirror on back panel */}
              {input.hasMirror && (
                <mesh position={[W * 0.12, hH - T - doorH / 2, frontZ + 0.014]}>
                  <boxGeometry args={[panelW - 0.03, doorH - T - 0.03, 0.004]} />
                  <meshStandardMaterial color="#C8D8E8" roughness={0.02} metalness={0.1} envMapIntensity={2} />
                </mesh>
              )}
            </>
          )
        }

        // Swing doors
        return Array.from({ length: doorCount }).map((_, di) => {
          const dw = (W - T * 2) / doorCount
          const dx = -W / 2 + T + dw * di + dw / 2
          const frontZ = hD
          const isMirror = input.hasMirror && di === 0
          return (
            <group key={di}>
              <Door x={dx} y={hH - T - doorH / 2}
                z={frontZ} w={dw} h={doorH - T} t={T * 0.9}
                color={isMirror ? '#D8E4EC' : c} roughness={isMirror ? 0.04 : r} metalness={isMirror ? 0.1 : m}
                glass={isGlass} handleType={isMirror ? 'BAR' : handleType} />
            </group>
          )
        })
      })()}

      {/* ── Kitchen layout ── */}
      {isKitchen && (() => {
        const upperH = H * 0.38
        const baseH  = H * 0.55
        const gapH   = H * 0.07
        const upperY = hH - upperH / 2
        const baseY  = -hH + baseH / 2
        const ctopY  = -hH + baseH + 0.015

        return (
          <>
            {/* Upper unit */}
            <Board position={[0, upperY, 0]} size={[W, upperH, D]} color={c} roughness={r} metalness={m} />
            {Array.from({ length: Math.max(doorCount, 2) }).map((_, di) => {
              const dw = W / Math.max(doorCount, 2)
              const dx = -W / 2 + dw * di + dw / 2
              return (
                <Door key={di} x={dx} y={upperY} z={hD}
                  w={dw - 0.01} h={upperH - T * 2} t={T * 0.8}
                  color={c} roughness={r} metalness={m} glass={isGlass}
                  handleType={handleType} />
              )
            })}

            {/* Countertop */}
            <Board position={[0, ctopY, 0.02]} size={[W + 0.06, 0.04, D + 0.04]} color={topColor} roughness={0.4} metalness={0.05} />

            {/* Base unit */}
            <Board position={[0, baseY, 0]} size={[W, baseH, D]} color={c} roughness={r} metalness={m} />
            {/* Base drawers left 35% */}
            {Array.from({ length: Math.max(drawerCount, 2) }).map((_, di) => {
              const lw = W * 0.35
              const dh = baseH / Math.max(drawerCount, 2)
              return (
                <Drawer key={di}
                  x={-W / 2 + lw / 2} y={-hH + dh * di + dh / 2} z={hD}
                  w={lw} h={dh} d={D * 0.7}
                  color={c} roughness={r} handleType={handleType} />
              )
            })}
            {/* Base doors right 65% */}
            {[0, 1].map(di => {
              const rw = W * 0.325
              const rx = W * 0.35 / 2 + rw * di + rw / 2 - W / 2
              return (
                <Door key={di} x={rx + W * 0.35 / 2} y={baseY} z={hD}
                  w={rw - 0.01} h={baseH - T * 2} t={T * 0.8}
                  color={c} roughness={r} metalness={m} glass={false}
                  handleType={handleType} />
              )
            })}
          </>
        )
      })()}

      {/* ── TV Cabinet layout ── */}
      {isTV && (() => {
        const lw = W * 0.28; const cw = W * 0.44; const rw = W * 0.28
        const lx = -W / 2 + lw / 2
        const cx = lx + lw / 2 + cw / 2
        const rx = cx + cw / 2 + rw / 2
        return (
          <>
            {/* Left door */}
            <Door x={lx} y={0} z={hD} w={lw - T} h={H - T * 2} t={T * 0.8}
              color={c} roughness={r} metalness={m} glass={false} handleType={handleType} />
            {/* Center open shelves */}
            {Array.from({ length: Math.max(shelfCount, 2) }).map((_, i) => (
              <Shelf key={i} y={-hH + T + (H - T * 2) * (i + 1) / (Math.max(shelfCount, 2) + 1)}
                w={cw - T} d={D - T} t={T * 0.8} color={sideColor} roughness={r} />
            ))}
            {/* Right door */}
            <Door x={rx} y={0} z={hD} w={rw - T} h={H - T * 2} t={T * 0.8}
              color={c} roughness={r} metalness={m} glass={false} handleType={handleType} />
          </>
        )
      })()}

      {/* ── Drawers (non-kitchen) ── */}
      {!isKitchen && drawerCount > 0 && Array.from({ length: drawerCount }).map((_, di) => (
        <Drawer key={di}
          x={0} y={-hH + T + drawerH * di + drawerH / 2} z={hD}
          w={W - T * 2} h={drawerH} d={D * 0.55}
          color={c} roughness={r} handleType={handleType} />
      ))}

      {/* ── LED strip ── */}
      {input.hasLED && (
        <LEDStrip y={-hH + T * 2} w={W} z={hD - 0.01} />
      )}
    </group>
  )
}

// ─── Auto-rotate wrapper ──────────────────────────────────────────────────────

function AutoRotate({ children, active }: { children: React.ReactNode; active: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (ref.current && active) {
      ref.current.rotation.y += delta * 0.3
    }
  })
  return <group ref={ref}>{children}</group>
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function Scene({ input }: { input: CabinetInput }) {
  const S = 1 / 60
  const H = input.height * S

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 8, 5]} intensity={1.2} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-3, 4, -3]} intensity={0.35} />
      <pointLight position={[0, 3, 3]} intensity={0.4} color="#FFF8E8" />

      <AutoRotate active={false}>
        <CabinetMesh input={input} />
      </AutoRotate>

      <ContactShadows
        position={[0, -H / 2 - 0.01, 0]}
        opacity={0.35} scale={3} blur={2.5} far={1} />

      {/* Floor grid */}
      <gridHelper args={[4, 20, '#E0DDD6', '#EAE8E3']} position={[0, -H / 2 - 0.005, 0]} />

      <Environment preset="apartment" />
    </>
  )
}

// ─── Loading fallback ─────────────────────────────────────────────────────────

function LoadingFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-subtle">กำลังโหลด 3D...</p>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function CabinetVisualizer3D({ input }: { input: CabinetInput }) {
  // Default: manual orbit ON (drag to rotate, scroll to zoom)
  // Toggle to auto-rotate mode
  const [autoMode, setAutoMode] = useState(false)

  const S = 1 / 60
  const H = input.height * S

  // Camera distance based on cabinet size
  const maxDim = Math.max(input.width, input.height, input.depth) * S
  const camDist = maxDim * 2.0

  return (
    <div className="relative w-full h-full" style={{ minHeight: 280 }}>

      {/* Controls overlay */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
        {/* Hint label */}
        {!autoMode && (
          <span className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] text-subtle font-medium"
            style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
            🖱️ ลากหมุน · เลื่อน Zoom
          </span>
        )}
        <button
          onClick={() => setAutoMode(v => !v)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border ${
            autoMode
              ? 'bg-accent text-white border-accent shadow-sm'
              : 'bg-[var(--theme-card)] text-muted border-[var(--theme-border)] hover:border-accent hover:text-accent'
          }`}
        >
          {autoMode ? '⏸ Auto' : '▶ Auto'}
        </button>
      </div>

      {/* Dimension badge */}
      <div className="absolute bottom-2 left-2 z-10 px-2 py-1 rounded-lg text-[9px] text-subtle font-medium"
        style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)' }}>
        W{input.width} × H{input.height} × D{input.depth} ซม.
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          shadows
          camera={{
            position: [camDist * 0.9, H * 0.5, camDist],
            fov: 38,
            near: 0.01,
            far: 50,
          }}
          style={{ background: 'transparent' }}
          gl={{ antialias: true, alpha: true }}
        >
          <Scene input={input} />
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            enableRotate={true}
            autoRotate={autoMode}
            autoRotateSpeed={1.2}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.1}
            target={[0, 0, 0]}
            dampingFactor={0.08}
            enableDamping={true}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}
