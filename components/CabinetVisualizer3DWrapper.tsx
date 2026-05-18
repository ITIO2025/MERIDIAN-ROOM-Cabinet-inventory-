'use client'
// Dynamic import wrapper — prevents SSR crash for WebGL/Three.js
import dynamic from 'next/dynamic'
import type { CabinetInput } from '@/lib/types'

const CabinetVisualizer3D = dynamic(
  () => import('./CabinetVisualizer3D'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ minHeight: 280 }}>
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-subtle">กำลังโหลด 3D...</p>
      </div>
    ),
  }
)

export default function CabinetVisualizerWrapper({ input }: { input: CabinetInput }) {
  return <CabinetVisualizer3D input={input} />
}
