'use client'
import { useEffect, useState, Suspense } from 'react'
import type { PricingResult } from '@/lib/types'
import { Loader2, Printer, ArrowLeft } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt  = (v: number) => `฿${Math.round(v).toLocaleString('th-TH')}`
const fmt2 = (v: number) => v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const BOQ_ORDER = ['MATERIAL','SURFACE','EDGE','HARDWARE','LABOR','INSTALLATION','OVERHEAD'] as const
const CAT_TH: Record<string, string> = {
  MATERIAL:     'วัสดุแผ่น',
  SURFACE:      'ผิวและลายไม้',
  EDGE:         'ขอบ Edge Banding',
  HARDWARE:     'อุปกรณ์ประกอบ',
  LABOR:        'ค่าแรงผลิต',
  INSTALLATION: 'ค่าติดตั้ง',
  OVERHEAD:     'ค่าดำเนินการ',
}

// ─── Document ─────────────────────────────────────────────────────────────────

function QuotationDocument({ result }: { result: PricingResult }) {
  const today      = new Date()
  const validUntil = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const dateTH = (d: Date) => d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  const qNum = `QUO-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*900)+100)}`

  const { input, costBreakdown, boqItems } = result

  const costRows = [
    { label: 'วัสดุแผ่น (Board)',      value: costBreakdown.boardMaterial },
    { label: 'ผิวและ Edge Banding',    value: costBreakdown.surfaceFinish + costBreakdown.edgebanding },
    { label: 'อุปกรณ์ประกอบ',          value: costBreakdown.hardware },
    { label: 'ค่าแรงผลิต',             value: costBreakdown.laborFactory },
    { label: 'ค่าติดตั้ง',             value: costBreakdown.laborInstallation },
    { label: 'ขนส่ง + ค่าดำเนินการ',   value: costBreakdown.transport + costBreakdown.overhead },
  ]

  return (
    <div id="print-doc" className="bg-white max-w-[760px] mx-auto text-[#111111] text-sm font-sans">

      {/* ── Header ── */}
      <div className="bg-[#111111] px-8 py-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#C6A969] flex items-center justify-center font-bold text-[#111111] text-lg flex-shrink-0">M</div>
            <div>
              <p className="font-bold text-white text-base tracking-wide leading-tight">MERIDIAN ROOM</p>
              <p className="text-[#C6A969] text-[10px] tracking-widest mt-0.5">SMART BUILT-IN FURNITURE</p>
            </div>
          </div>
          <p className="text-gray-500 text-[10px]">เลขที่: {qNum}</p>
          <p className="text-gray-500 text-[10px]">วันที่: {dateTH(today)}</p>
          <p className="text-gray-500 text-[10px]">ใช้ได้ถึง: {dateTH(validUntil)}</p>
        </div>
        <div className="text-right">
          <p className="text-[#C6A969] font-bold text-3xl tracking-tight">ใบเสนอราคา</p>
          <p className="text-gray-500 text-xs mt-1 tracking-widest">QUOTATION</p>
        </div>
      </div>

      {/* ── Customer + Project ── */}
      <div className="px-8 py-5 grid grid-cols-2 gap-4 border-b border-gray-100">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold mb-2">เสนอราคาแก่</p>
          <p className="font-bold text-base">{input.customerName || '—'}</p>
          {input.projectName && <p className="text-gray-500 text-xs mt-1">{input.projectName}</p>}
          {input.sales && <p className="text-gray-400 text-xs mt-0.5">Sales: {input.sales}</p>}
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold mb-2">รายละเอียดงาน</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <span className="text-gray-400">ประเภท</span>
            <span className="font-medium">{input.projectType}</span>
            <span className="text-gray-400">วัสดุหลัก</span>
            <span className="font-medium">{input.boardType} {input.boardThickness}mm</span>
            <span className="text-gray-400">ผิว</span>
            <span className="font-medium">{input.surfaceType}</span>
            <span className="text-gray-400">ขนาด (กว×สูง×ลึก)</span>
            <span className="font-medium">{input.width}×{input.height}×{input.depth} ซม.</span>
            {input.quantity > 1 && <>
              <span className="text-gray-400">จำนวน</span>
              <span className="font-medium">{input.quantity} ชิ้น</span>
            </>}
          </div>
        </div>
      </div>

      {/* ── BOQ Table ── */}
      <div className="px-8 py-5">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-3">รายการงาน (Bill of Quantities)</p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#111111] text-white">
              <th className="text-left py-2 px-3 font-medium rounded-tl-lg">รายการ</th>
              <th className="text-right py-2 px-3 font-medium w-16">จำนวน</th>
              <th className="text-right py-2 px-3 font-medium w-12">หน่วย</th>
              <th className="text-right py-2 px-3 font-medium w-24">ราคา/หน่วย</th>
              <th className="text-right py-2 px-3 font-medium w-24 rounded-tr-lg">รวม (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {BOQ_ORDER.map(cat => {
              const items = boqItems.filter(b => b.category === cat)
              if (!items.length) return null
              const subtotal = items.reduce((s, i) => s + i.totalPrice, 0)
              return (
                <>
                  <tr key={`h-${cat}`} className="bg-gray-50">
                    <td colSpan={4} className="py-1.5 px-3 font-semibold text-[11px] text-gray-600">{CAT_TH[cat]}</td>
                    <td className="py-1.5 px-3 text-right font-semibold text-[11px] text-gray-600">{fmt(subtotal)}</td>
                  </tr>
                  {items.map(item => (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="py-1.5 px-3 pl-6 text-gray-700 leading-tight">
                        {item.description}
                        {item.spec && <span className="block text-[9px] text-gray-400">{item.spec}</span>}
                      </td>
                      <td className="py-1.5 px-3 text-right text-gray-600">{item.quantity.toFixed(2)}</td>
                      <td className="py-1.5 px-3 text-right text-gray-400">{item.unit}</td>
                      <td className="py-1.5 px-3 text-right">{fmt2(item.unitPrice)}</td>
                      <td className="py-1.5 px-3 text-right font-medium">{fmt2(item.totalPrice)}</td>
                    </tr>
                  ))}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Price Summary ── */}
      <div className="px-8 pb-6">
        <div className="grid grid-cols-2 gap-4 items-start">

          {/* Cost breakdown */}
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold mb-3">รายละเอียดต้นทุน</p>
            {costRows.map(({ label, value }) => (
              value > 0 && (
                <div key={label} className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium">{fmt(value)}</span>
                </div>
              )
            ))}
            <div className="flex justify-between text-xs pt-2 mt-1 border-t border-gray-200">
              <span className="font-semibold">ต้นทุนสุทธิ</span>
              <span className="font-bold">{fmt(result.netCost)}</span>
            </div>
          </div>

          {/* Final price */}
          <div>
            <div className="bg-[#111111] text-white rounded-xl p-5 mb-3">
              <div className="space-y-2 text-xs mb-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">ต้นทุนสุทธิ</span>
                  <span>{fmt(result.netCost)}</span>
                </div>
                {result.discountAmount > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>ส่วนลด</span>
                    <span>- {fmt(result.discountAmount)}</span>
                  </div>
                )}
                {result.vatAmount > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>VAT 7%</span>
                    <span>{fmt(result.vatAmount)}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-white/15 pt-3 flex items-end justify-between">
                <div>
                  <p className="text-gray-400 text-[9px] uppercase tracking-wider">ราคาขายสุทธิ</p>
                  <p className="text-2xl font-bold text-[#C6A969] leading-tight">
                    {fmt(result.totalWithVAT > 0 ? result.totalWithVAT : result.sellingPrice)}
                  </p>
                  <p className="text-gray-500 text-[9px] mt-0.5">บาท (รวม VAT)</p>
                </div>
                <div className={`text-right px-3 py-2 rounded-lg ${
                  result.grossMarginPercent >= 30 ? 'bg-green-500/20 text-green-400'
                  : result.grossMarginPercent >= 20 ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
                }`}>
                  <p className="text-[9px] opacity-70">GP Margin</p>
                  <p className="text-xl font-bold">{result.grossMarginPercent.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Payment terms */}
            <div className="bg-gray-50 rounded-xl p-3 text-[10px] text-gray-500 space-y-1">
              <p className="font-semibold text-gray-600 text-xs mb-1.5">เงื่อนไขการชำระเงิน</p>
              <p>• มัดจำ 50% ก่อนเริ่มผลิต</p>
              <p>• 40% ก่อนส่งมอบ / ติดตั้ง</p>
              <p>• ส่วนที่เหลือ 10% เมื่อเสร็จสิ้น</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Terms ── */}
      <div className="px-8 pb-5">
        <div className="border border-gray-100 rounded-xl p-4 text-[10px] text-gray-500">
          <p className="font-semibold text-gray-600 text-xs mb-2">เงื่อนไขการเสนอราคา</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <p>• ใบเสนอราคามีอายุ 30 วัน</p>
            <p>• ราคารวมค่าวัสดุ ค่าแรง และค่าติดตั้ง</p>
            <p>• ไม่รวมค่าขนส่งที่ไม่ได้ระบุ</p>
            <p>• กำหนดแล้วเสร็จ 30–45 วันทำการ</p>
          </div>
        </div>
      </div>

      {/* ── Signatures ── */}
      <div className="px-8 pb-8 grid grid-cols-2 gap-10">
        {['ผู้เสนอราคา / MERIDIAN ROOM', 'ผู้รับราคา / ลูกค้า'].map(label => (
          <div key={label} className="text-center">
            <div className="border-b border-dashed border-gray-300 mb-2 pb-10" />
            <p className="text-[10px] text-gray-500">{label}</p>
            <p className="text-[9px] text-gray-400 mt-1">วันที่ …………………………</p>
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="bg-gray-50 px-8 py-3 border-t border-gray-100 flex items-center justify-between">
        <p className="text-[9px] text-gray-400">MERIDIAN ROOM · Smart Built-In Furniture</p>
        <p className="text-[9px] text-gray-400">สร้างเมื่อ {dateTH(today)}</p>
      </div>

    </div>
  )
}

// ─── Print Page ───────────────────────────────────────────────────────────────

function PrintPageInner() {
  const [result, setResult] = useState<PricingResult | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('meridian_print_quo')
    if (raw) {
      try { setResult(JSON.parse(raw)) }
      catch { setNotFound(true) }
    } else {
      setNotFound(true)
    }
  }, [])

  if (notFound) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-gray-400">
      <p className="text-lg font-medium">ไม่พบข้อมูลใบเสนอราคา</p>
      <p className="text-sm">กรุณาคิดราคาในหน้า Pricing แล้วกดปุ่ม "พิมพ์"</p>
      <button onClick={() => window.close()}
        className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
        <ArrowLeft size={14} /> ปิดหน้านี้
      </button>
    </div>
  )

  if (!result) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={28} className="animate-spin text-gray-300" />
    </div>
  )

  return (
    <>
      {/* Toolbar */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-[#111111] text-white text-sm font-medium rounded-xl shadow-lg hover:bg-black transition-colors"
        >
          <Printer size={14} /> พิมพ์ / บันทึก PDF
        </button>
        <button
          onClick={() => window.close()}
          className="px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-lg hover:bg-gray-50 transition-colors text-gray-500 text-sm"
        >
          ปิด
        </button>
      </div>

      <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0">
        <QuotationDocument result={result} />
      </div>

      <style>{`
        @media print {
          /* Hide everything except the document */
          .no-print { display: none !important; }
          nav, aside, header { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          #print-doc {
            box-shadow: none !important;
            margin: 0 !important;
            max-width: 100% !important;
            border-radius: 0 !important;
          }
          /* Force background colors to print */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 0.8cm; size: A4 portrait; }
        }
      `}</style>
    </>
  )
}

export default function PrintPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={28} className="animate-spin text-gray-300" />
      </div>
    }>
      <PrintPageInner />
    </Suspense>
  )
}
