'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { PricingResult } from '@/lib/types'
import { Loader2, Printer, X } from 'lucide-react'

function QuotationDocument({ result }: { result: PricingResult }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  const qNum = `QUO-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`

  const BOQ_CATEGORIES = ['MATERIAL','SURFACE','EDGE','HARDWARE','LABOR','INSTALLATION','OVERHEAD'] as const
  const CAT_LABELS: Record<string, string> = {
    MATERIAL: 'วัสดุหลัก', SURFACE: 'ผิวสัมผัส', EDGE: 'Edge Banding',
    HARDWARE: 'อุปกรณ์', LABOR: 'ค่าแรง', INSTALLATION: 'ติดตั้ง', OVERHEAD: 'ค่าใช้จ่ายทั่วไป'
  }

  const fmt = (v: number) => v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div id="print-doc" className="bg-white max-w-3xl mx-auto font-sans text-gray-900 text-sm">
      {/* Header */}
      <div className="bg-[#111111] text-white p-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#C6A969] flex items-center justify-center font-bold text-[#111111] text-lg">M</div>
            <div>
              <p className="font-bold text-lg tracking-wide">MERIDIAN ROOM</p>
              <p className="text-[#C6A969] text-xs tracking-widest">SMART BUILT-IN PRICING ENGINE</p>
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-3">เลขที่: {qNum}</p>
          <p className="text-gray-400 text-xs">วันที่: {dateStr}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-[#C6A969]">ใบเสนอราคา</p>
          <p className="text-gray-400 text-xs mt-2">QUOTATION</p>
        </div>
      </div>

      {/* Customer + Project Info */}
      <div className="p-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">ลูกค้า / Customer</p>
          <p className="font-semibold text-base">{result.input.customerName || '—'}</p>
          {result.input.projectName && <p className="text-gray-500 text-sm mt-1">{result.input.projectName}</p>}
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">รายละเอียดงาน</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-gray-500">ประเภท</span><span className="font-medium">{result.input.projectType}</span>
            <span className="text-gray-500">วัสดุหลัก</span><span className="font-medium">{result.input.boardType}</span>
            <span className="text-gray-500">ผิว</span><span className="font-medium">{result.input.surfaceType}</span>
            <span className="text-gray-500">ขนาด (กxสxล)</span>
            <span className="font-medium">{result.input.width}×{result.input.height}×{result.input.depth} ซม.</span>
          </div>
        </div>
      </div>

      {/* BOQ Table */}
      <div className="px-6 pb-4">
        <p className="font-bold text-sm mb-2 text-gray-700 uppercase tracking-wide border-b pb-1">รายการงาน (BOQ)</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left py-2 px-2 font-semibold text-gray-500">รายการ</th>
              <th className="text-right py-2 px-2 font-semibold text-gray-500">จำนวน</th>
              <th className="text-right py-2 px-2 font-semibold text-gray-500">หน่วย</th>
              <th className="text-right py-2 px-2 font-semibold text-gray-500">ราคา/หน่วย</th>
              <th className="text-right py-2 px-2 font-semibold text-gray-500">รวม (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {BOQ_CATEGORIES.map(cat => {
              const items = result.boqItems.filter(b => b.category === cat)
              if (!items.length) return null
              return (
                <>
                  <tr key={`cat-${cat}`} className="bg-gray-50">
                    <td colSpan={5} className="py-1.5 px-2 font-semibold text-gray-600">{CAT_LABELS[cat]}</td>
                  </tr>
                  {items.map(item => (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="py-1.5 px-2 pl-5 text-gray-700">{item.description}</td>
                      <td className="py-1.5 px-2 text-right">{item.quantity.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right text-gray-500">{item.unit}</td>
                      <td className="py-1.5 px-2 text-right">{fmt(item.unitPrice)}</td>
                      <td className="py-1.5 px-2 text-right font-medium">{fmt(item.totalPrice)}</td>
                    </tr>
                  ))}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Price Summary */}
      <div className="px-6 pb-4">
        <div className="bg-[#111111] text-white rounded-2xl p-5">
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <span className="text-gray-400">ต้นทุนรวม</span>
            <span className="text-right">{fmt(result.netCost)} บาท</span>
            <span className="text-gray-400">ค่าติดตั้ง</span>
            <span className="text-right">{fmt(result.costBreakdown.laborInstallation)} บาท</span>
            <span className="text-gray-400">ต้นทุนสุทธิ</span>
            <span className="text-right">{fmt(result.netCost)} บาท</span>
          </div>
          <div className="border-t border-white/20 pt-3 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">ราคาขายสุทธิ (รวม VAT 7%)</p>
              <p className="text-3xl font-bold text-[#C6A969]">{fmt(result.sellingPrice)} บาท</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Gross Margin</p>
              <p className={`text-2xl font-bold ${result.grossMarginPercent >= 25 ? 'text-green-400' : result.grossMarginPercent >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                {result.grossMarginPercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="px-6 pb-4">
        <div className="text-xs text-gray-500 space-y-1 border border-gray-100 rounded-xl p-4">
          <p className="font-semibold text-gray-700 mb-2">เงื่อนไขการเสนอราคา</p>
          <p>• ราคานี้มีอายุ 30 วัน นับจากวันที่ออกใบเสนอราคา</p>
          <p>• ราคารวมค่าวัสดุ ค่าแรงผลิต และค่าติดตั้งตามที่ระบุ</p>
          <p>• ไม่รวมค่าขนส่ง ค่าเดินทาง และค่าใช้จ่ายอื่นๆ ที่ไม่ได้ระบุในใบเสนอราคานี้</p>
          <p>• ชำระเงิน: มัดจำ 50% ก่อนเริ่มงาน ส่วนที่เหลือชำระเมื่อติดตั้งแล้วเสร็จ</p>
        </div>
      </div>

      {/* Signatures */}
      <div className="px-6 pb-8 grid grid-cols-2 gap-8 mt-4">
        {['ผู้เสนอราคา', 'ผู้รับราคา'].map(label => (
          <div key={label} className="text-center">
            <div className="border-b border-gray-300 mb-2 pb-8" />
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xs text-gray-400 mt-1">วันที่ ________________</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 text-center text-xs text-gray-400">
        MERIDIAN ROOM AI · Smart Built-In Pricing Engine · Generated {dateStr}
      </div>
    </div>
  )
}

function PrintPageInner() {
  const params = useSearchParams()
  const [result, setResult] = useState<PricingResult | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('meridian_print_quo')
    if (raw) setResult(JSON.parse(raw))
  }, [])

  useEffect(() => {
    if (!result) return
    const timer = setTimeout(() => window.print(), 800)
    return () => clearTimeout(timer)
  }, [result])

  if (!result) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={32} className="animate-spin text-gray-300" />
    </div>
  )

  return (
    <>
      {/* Toolbar — hidden on print */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-[#111111] text-white text-sm font-medium rounded-xl shadow-lg hover:bg-black transition-colors">
          <Printer size={14} /> พิมพ์
        </button>
        <button onClick={() => window.close()}
          className="p-2 bg-white border border-gray-200 rounded-xl shadow-lg hover:bg-gray-50 transition-colors text-gray-600">
          <X size={14} />
        </button>
      </div>

      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <QuotationDocument result={result} />
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #print-doc { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
          @page { margin: 1cm; size: A4 portrait; }
        }
      `}</style>
    </>
  )
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 size={32} className="animate-spin text-gray-300" /></div>}>
      <PrintPageInner />
    </Suspense>
  )
}
