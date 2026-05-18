'use client'
import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/pricing-engine'
import type { PricingResult } from '@/lib/types'
import type { CabinetInput } from '@/lib/types'
import {
  PROJECT_TYPE_LABELS, SURFACE_TYPE_LABELS, BOARD_TYPE_LABELS,
  DOOR_TYPE_LABELS, HARDWARE_BRAND_LABELS,
} from '@/lib/types'

// ─── Logo from localStorage ───────────────────────────────────────────────────
function CompanyLogo() {
  const [logo, setLogo] = useState('')
  useEffect(() => {
    setLogo(
      localStorage.getItem('company_logo_light') ||
      localStorage.getItem('company_logo') || ''
    )
  }, [])
  if (!logo) return null
  return <img src={logo} alt="logo" style={{ height: 48, objectFit: 'contain', maxWidth: 140 }} />
}

// ─── Company info from localStorage ──────────────────────────────────────────
function useCompanyInfo() {
  const [info, setInfo] = useState({ name: 'MERIDIAN ROOM', taxId: '', phone: '', address: '' })
  useEffect(() => {
    const s = localStorage.getItem('company_info')
    if (s) setInfo(JSON.parse(s))
  }, [])
  return info
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PricingPrintPage() {
  const [data, setData] = useState<{ result: PricingResult; input: CabinetInput } | null>(null)
  const company = useCompanyInfo()

  useEffect(() => {
    const raw = sessionStorage.getItem('meridian_pricing_print')
    if (raw) setData(JSON.parse(raw))
  }, [])

  const today    = new Date()
  const dateStr  = today.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  const validStr = new Date(today.getTime() + 30 * 86400000)
    .toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  const quoNo = `QUO-${today.getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400 font-sarabun text-sm">
        ไม่พบข้อมูล กรุณากลับหน้า คิดราคา และกด PDF อีกครั้ง
      </div>
    )
  }

  const { result, input } = data
  const marginColor = result.grossMarginPercent >= 30 ? '#00A86B'
    : result.grossMarginPercent >= 20 ? '#D97706' : '#DC2626'

  return (
    <>
      {/* ── Google Font: Sarabun ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,600;0,700;0,800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Sarabun', sans-serif;
          font-size: 13px;
          color: #111;
          background: #fff;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 14mm 14mm 12mm;
          background: #fff;
        }

        @media print {
          @page { margin: 0; size: A4; }
          body { margin: 0; }
          .page { margin: 0; padding: 14mm 14mm 12mm; box-shadow: none; }
          .no-print { display: none !important; }
        }

        @media screen {
          body { background: #f3f4f6; }
          .page {
            margin: 20px auto;
            box-shadow: 0 4px 40px rgba(0,0,0,0.12);
            border-radius: 4px;
          }
        }

        /* ── Typography ── */
        h1 { font-size: 22px; font-weight: 800; }
        h2 { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
        .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.06em; }
        .value { font-size: 13px; font-weight: 600; color: #111; }

        /* ── Layout ── */
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10mm; }
        .header-brand { display: flex; flex-direction: column; gap: 2px; }
        .header-meta { text-align: right; }
        .header-meta p { font-size: 11px; color: #555; line-height: 1.7; }

        .gold-bar { height: 3px; background: linear-gradient(90deg, #B8943A, #EAC96E, #B8943A); border-radius: 2px; margin: 6mm 0 8mm; }

        .section { margin-bottom: 8mm; }
        .section-title {
          font-size: 9px; font-weight: 700; color: #999;
          text-transform: uppercase; letter-spacing: 0.1em;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 4px; margin-bottom: 6px;
        }

        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; }
        .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 12px; }
        .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px 8px; }

        .row { display: flex; justify-content: space-between; align-items: baseline; padding: 3px 0; border-bottom: 1px dashed #f0f0f0; }
        .row:last-child { border-bottom: none; }

        /* ── Price Card ── */
        .price-card {
          background: #111;
          color: #fff;
          border-radius: 8px;
          padding: 6mm 8mm;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6mm;
        }
        .price-main { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .price-sub { font-size: 10px; color: rgba(255,255,255,0.55); margin-top: 2px; }
        .price-meta { text-align: right; }
        .price-meta .margin-val { font-size: 20px; font-weight: 800; }

        /* ── BOQ table ── */
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        thead th { background: #111; color: #fff; padding: 5px 8px; font-weight: 600; font-size: 10px; }
        tbody tr:nth-child(even) td { background: #fafafa; }
        tbody td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; color: #333; }
        tbody td:last-child { text-align: right; font-weight: 600; }
        tfoot td { padding: 6px 8px; font-weight: 700; border-top: 2px solid #111; }
        tfoot td:last-child { text-align: right; color: #111; font-size: 13px; }

        /* ── Cost bars ── */
        .bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
        .bar-label { font-size: 10px; color: #555; width: 90px; flex-shrink: 0; }
        .bar-track { flex: 1; height: 5px; background: #eee; border-radius: 99px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 99px; }
        .bar-value { font-size: 10px; font-weight: 600; color: #111; width: 70px; text-align: right; flex-shrink: 0; }

        /* ── Spec pills ── */
        .spec-pill {
          display: inline-flex; align-items: center; gap: 4px;
          background: #f5f5f5; border-radius: 6px; padding: 3px 8px;
          font-size: 10px; color: #333;
        }

        /* ── Footer ── */
        .footer { margin-top: 10mm; border-top: 1px solid #e5e7eb; padding-top: 5mm; display: flex; justify-content: space-between; align-items: flex-end; }
        .footer p { font-size: 10px; color: #999; }
        .sig-box { width: 50mm; border-top: 1px solid #ccc; margin-top: 10mm; text-align: center; padding-top: 3mm; font-size: 10px; color: #888; }
      `}</style>

      {/* ── Print / Back Toolbar (screen only) ── */}
      <div className="no-print" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: '#111', borderBottom: '3px solid #D4AF60',
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
      }}>
        <button onClick={() => window.history.back()} style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
          fontFamily: 'Sarabun, sans-serif',
        }}>← กลับ</button>
        <span style={{ flex: 1, color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Sarabun, sans-serif' }}>
          ใบเสนอราคา {quoNo} — ฟอนต์ TH Sarabun
        </span>
        <button onClick={() => window.print()} style={{
          background: 'linear-gradient(135deg, #B8943A, #D4AF60)',
          border: 'none', color: '#111', padding: '8px 20px',
          borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
          fontFamily: 'Sarabun, sans-serif',
        }}>🖨️ พิมพ์ / บันทึก PDF</button>
      </div>

      <div style={{ paddingTop: 52 }} className="no-print" />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* A4 PAGE                                                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="page">

        {/* ── Header ── */}
        <div className="header">
          <div className="header-brand">
            <CompanyLogo />
            <div style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  display: 'inline-block', width: 28, height: 28, borderRadius: 7,
                  background: 'linear-gradient(145deg,#B8943A,#EAC96E)',
                  textAlign: 'center', lineHeight: '28px',
                  fontSize: 13, fontWeight: 900, color: '#111',
                }}>M</span>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1 }}>
                    {company.name}
                  </p>
                  <p style={{ fontSize: 9, color: '#C6A969', letterSpacing: '0.2em', marginTop: 1 }}>
                    LUXURY BUILT-IN · PRECISION ENGINEERING
                  </p>
                </div>
              </div>
              {company.address && <p style={{ fontSize: 10, color: '#666', marginTop: 4 }}>{company.address}</p>}
              {company.phone   && <p style={{ fontSize: 10, color: '#666' }}>โทร {company.phone}</p>}
              {company.taxId   && <p style={{ fontSize: 10, color: '#666' }}>เลขที่ผู้เสียภาษี {company.taxId}</p>}
            </div>
          </div>

          <div className="header-meta">
            <p style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 4 }}>ใบเสนอราคา</p>
            <p><span style={{ color: '#888' }}>เลขที่: </span><strong>{quoNo}</strong></p>
            <p><span style={{ color: '#888' }}>วันที่: </span>{dateStr}</p>
            <p><span style={{ color: '#888' }}>ใช้ได้ถึง: </span>{validStr}</p>
          </div>
        </div>

        <div className="gold-bar" />

        {/* ── Project Info ── */}
        <div className="section">
          <p className="section-title">ข้อมูลโปรเจกต์</p>
          <div className="grid2">
            {[
              ['ชื่อโปรเจกต์', input.projectName || '—'],
              ['ชื่อลูกค้า',   input.customerName || '—'],
              ['ประเภทงาน',    PROJECT_TYPE_LABELS[input.projectType] || input.projectType],
              ['ประเภทติดตั้ง', input.installationType === 'CONDO' ? '🏢 คอนโด' : input.installationType === 'HOUSE' ? '🏠 บ้าน' : input.installationType === 'OFFICE' ? '💼 ออฟฟิศ' : '🏪 ตึกแถว'],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="label">{l}</p>
                <p className="value">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Dimensions ── */}
        <div className="section">
          <p className="section-title">ขนาดและวัสดุ</p>
          <div className="grid4">
            {[
              ['กว้าง (W)', `${input.width} ซม.`],
              ['สูง (H)',   `${input.height} ซม.`],
              ['ลึก (D)',   `${input.depth} ซม.`],
              ['จำนวน',    `${input.quantity} ตู้`],
            ].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center', background: '#f8f8f6', borderRadius: 8, padding: '6px 4px' }}>
                <p className="label" style={{ textAlign: 'center' }}>{l}</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#111', textAlign: 'center' }}>{v}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              [`วัสดุ: ${BOARD_TYPE_LABELS[input.boardType]}`],
              [`ผิว: ${SURFACE_TYPE_LABELS[input.surfaceType]}`],
              [`ประตู: ${DOOR_TYPE_LABELS[input.doorType]} ${input.doorCount} บาน`],
              [`ลิ้นชัก: ${input.drawerCount}`],
              [`ชั้นวาง: ${input.shelfCount}`],
              [`Hardware: ${HARDWARE_BRAND_LABELS[input.hardwareBrand]}`],
              ...(input.hasSoftClose   ? ['✓ Soft-close']  : []),
              ...(input.hasLED         ? ['✓ LED Strip']    : []),
              ...(input.hasMirror      ? ['✓ กระจก']        : []),
              ...(input.hasHangingRail ? ['✓ ราวแขวน']      : []),
              ...(input.hasLiftSystem  ? ['✓ Lift System']  : []),
            ].map((item, i) => (
              <span key={i} className="spec-pill">{item[0]}</span>
            ))}
          </div>
        </div>

        {/* ── Price Card ── */}
        <div className="price-card">
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>ราคาขาย{input.includeVAT ? ' (รวม VAT 7%)' : ''}</p>
            <p className="price-main" style={{ color: '#EAC96E' }}>฿{result.sellingPrice.toLocaleString('th-TH')}</p>
            <p className="price-sub">≈ {formatCurrency(result.pricePerSqm)} / ตร.ม.</p>
          </div>
          <div className="price-meta">
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Gross Margin</p>
            <p className="margin-val" style={{ color: result.grossMarginPercent >= 30 ? '#4ADE80' : result.grossMarginPercent >= 20 ? '#FCD34D' : '#F87171' }}>
              {result.grossMarginPercent.toFixed(1)}%
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
              ต้นทุน {formatCurrency(result.netCost)}
            </p>
            <p style={{ fontSize: 10, color: '#4ADE80' }}>
              กำไร {formatCurrency(result.sellingPrice - result.netCost)}
            </p>
          </div>
        </div>

        {/* ── Cost Breakdown ── */}
        <div className="section">
          <p className="section-title">ต้นทุนรายหมวด</p>
          {[
            { label: '📦 วัสดุแผ่นไม้',  val: result.costBreakdown.boardMaterial, color: '#3B82F6' },
            { label: '🎨 ผิว + Edge',     val: result.costBreakdown.surfaceFinish + result.costBreakdown.edgebanding, color: '#8B5CF6' },
            { label: '🔧 อุปกรณ์',       val: result.costBreakdown.hardware, color: '#F59E0B' },
            { label: '👷 ค่าแรงโรงงาน',  val: result.costBreakdown.laborFactory, color: '#10B981' },
            { label: '🚚 ค่าติดตั้ง',    val: result.costBreakdown.laborInstallation, color: '#06B6D4' },
          ].map(b => {
            const pct = result.netCost > 0 ? (b.val / result.netCost) * 100 : 0
            return (
              <div key={b.label} className="bar-row">
                <span className="bar-label">{b.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${pct}%`, background: b.color }} />
                </div>
                <span className="bar-value">{formatCurrency(b.val)}</span>
              </div>
            )
          })}
        </div>

        {/* ── BOQ Table ── */}
        {(result.boqItems ?? []).length > 0 && (
          <div className="section">
            <p className="section-title">รายการ BOQ ({result.boqItems!.length} รายการ)</p>
            <table>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>#</th>
                  <th style={{ textAlign: 'left', width: '50%' }}>รายการ</th>
                  <th>จำนวน</th>
                  <th>หน่วย</th>
                  <th>ราคา/หน่วย</th>
                  <th>รวม</th>
                </tr>
              </thead>
              <tbody>
                {result.boqItems!.map((item, i) => (
                  <tr key={item.id}>
                    <td style={{ color: '#aaa' }}>{i + 1}</td>
                    <td>{item.description}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'center' }}>{item.unit}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                    <td>{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ textAlign: 'right', fontSize: 12 }}>ต้นทุนรวม</td>
                  <td>{formatCurrency(result.netCost)}</td>
                </tr>
                {input.includeVAT && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'right', fontSize: 12 }}>VAT 7%</td>
                    <td>{formatCurrency(result.sellingPrice * 0.07 / 1.07)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={5} style={{ textAlign: 'right', fontSize: 13 }}>ราคาขายสุทธิ</td>
                  <td style={{ fontSize: 15, color: '#111' }}>฿{result.sellingPrice.toLocaleString('th-TH')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── Terms ── */}
        <div className="section" style={{ background: '#f9f9f7', borderRadius: 8, padding: '8px 12px' }}>
          <p className="section-title">เงื่อนไขและข้อตกลง</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px', fontSize: 11, color: '#555' }}>
            {[
              ['ระยะเวลาผลิต', '30–45 วันทำการหลังวางมัดจำ'],
              ['การชำระเงิน',  'มัดจำ 50% · เมื่อติดตั้ง 50%'],
              ['การรับประกัน',  '1 ปี วัสดุและการประกอบ'],
              ['ราคามีผล',     `ถึง ${validStr}`],
            ].map(([l, v]) => (
              <div key={l} style={{ marginBottom: 3 }}>
                <span style={{ fontWeight: 600, color: '#333' }}>{l}: </span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Signature ── */}
        <div className="footer">
          <div>
            <p style={{ fontSize: 11, color: '#555' }}>ขอบคุณที่ไว้วางใจ {company.name}</p>
            <p style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
              เอกสารนี้ออกโดยระบบ MERIDIAN ROOM AI · {dateStr}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div className="sig-box">ลายมือชื่อผู้เสนอราคา</div>
            <div className="sig-box">ลายมือชื่อลูกค้า</div>
          </div>
        </div>

      </div>
    </>
  )
}
