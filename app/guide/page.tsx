'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  MdCalculate, MdFolderOpen, MdDescription, MdBarChart, MdWarehouse,
  MdInventory, MdPeople, MdTrendingUp, MdSettings, MdAutoFixHigh, MdStorage,
  MdChat, MdExpandMore, MdOpenInNew, MdBolt, MdSecurity,
  MdMemory, MdRefresh, MdDownload, MdLayers, MdStraighten, MdAttachMoney,
  MdCheckCircle, MdInfo, MdMenuBook,
} from 'react-icons/md'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

// ─── Module definitions ────────────────────────────────────────────────────────

const MODULES = [
  {
    id: 'pricing',
    icon: MdCalculate,
    emoji: '🧮',
    title: 'Smart Cabinet Configurator',
    subtitle: 'คิดราคาเฟอร์นิเจอร์แบบ Real-time',
    route: '/pricing',
    color: '#2563EB',
    features: [
      'Auto-calculate ทันทีที่ปรับค่า',
      'โมเดล 3D หมุนดูได้ทุกมุม (ลากเมาส์)',
      'ปรับ W/H/D ได้จากแถบด้านล่างโมเดล',
      'วัสดุ 7 แบบ พร้อม Color Swatch',
      'Structure Health Check อัตโนมัติ',
      'AI Analysis แนะนำ Margin และการออกแบบ',
      'Cutting Estimation วัดแผ่นไม้ + Waste %',
      'ออก PDF ใบเสนอราคาฟอนต์ TH Sarabun',
      'ออก BOQ รายละเอียดวัสดุ',
      'บันทึกโปรเจกต์ / ส่ง LINE Notify',
    ],
    tips: [
      'คลิกตัวเลข W / H / D ใต้โมเดล 3D เพื่อพิมพ์ขนาดโดยตรง',
      'กด ▶ Auto เพื่อให้โมเดลหมุนอัตโนมัติ',
      'ปรับ Margin Target เป็น 35-40% สำหรับงานมาตรฐาน',
    ],
  },
  {
    id: 'projects',
    icon: MdFolderOpen,
    emoji: '📁',
    title: 'จัดการโปรเจกต์',
    subtitle: 'ติดตามสถานะงานทุกโปรเจกต์',
    route: '/projects',
    color: '#059669',
    features: [
      'บันทึกและค้นหาโปรเจกต์ทั้งหมด',
      'ติดตามสถานะ: สร้างใหม่ → ผลิต → ติดตั้ง → เสร็จ',
      'ดูข้อมูล Margin และกำไรแต่ละงาน',
      'Filter ตามประเภทงาน วันที่ สถานะ',
      'ส่งออก / พิมพ์รายงาน',
    ],
    tips: [
      'โปรเจกต์จะถูกบันทึกอัตโนมัติเมื่อกด บันทึก ในหน้าคิดราคา',
    ],
  },
  {
    id: 'quotation',
    icon: MdDescription,
    emoji: '📄',
    title: 'ใบเสนอราคา Smart',
    subtitle: 'สร้างและจัดการเอกสาร',
    route: '/quotation',
    color: '#7C3AED',
    features: [
      'สร้างใบเสนอราคาจากโปรเจกต์ที่บันทึกไว้',
      'แนบภาพสินค้าอัตโนมัติ',
      'พิมพ์ A4 ฟอนต์ TH Sarabun พร้อมโลโก้บริษัท',
      'บันทึก PDF คุณภาพสูง',
    ],
    tips: [
      'โลโก้บริษัทตั้งค่าได้ที่ Settings → ข้อมูลบริษัท',
    ],
  },
  {
    id: 'analytics',
    icon: MdBarChart,
    emoji: '📊',
    title: 'วิเคราะห์ธุรกิจ',
    subtitle: 'Dashboard รายได้ กำไร Margin',
    route: '/analytics',
    color: '#0891B2',
    features: [
      'ภาพรวมรายได้ ต้นทุน กำไร',
      'แยกตามไตรมาส (Q1–Q4)',
      'Margin trend กราฟรายเดือน',
      'เปรียบเทียบประเภทงาน',
      'Top projects by revenue',
    ],
    tips: [
      'ข้อมูลอัปเดตอัตโนมัติเมื่อบันทึกโปรเจกต์ใหม่',
    ],
  },
  {
    id: 'stock',
    icon: MdInventory,
    emoji: '🏭',
    title: 'คลังวัสดุ',
    subtitle: 'จัดการ Stock วัตถุดิบการผลิต',
    route: '/stock',
    color: '#D97706',
    features: [
      'บันทึกรายการวัสดุและปริมาณ Stock',
      'แจ้งเตือนเมื่อวัสดุต่ำกว่าเกณฑ์',
      'กำหนดราคาต้นทุนต่อหน่วย',
      'Sync ข้อมูลไปยัง Google Sheets',
      'เพิ่ม / แก้ไข / ลบรายการวัสดุ',
    ],
    tips: [
      'กำหนด Min Stock เพื่อรับการแจ้งเตือนอัตโนมัติ',
    ],
  },
  {
    id: 'production',
    icon: MdWarehouse,
    emoji: '⚙️',
    title: 'การผลิต',
    subtitle: 'ติดตาม Production Order',
    route: '/production',
    color: '#374151',
    features: [
      'สร้างและติดตาม Production Order',
      'Kanban board สถานะการผลิต',
      'เชื่อมโยงกับ Stock วัตถุดิบ',
    ],
    tips: [],
  },
  {
    id: 'customers',
    icon: MdPeople,
    emoji: '👥',
    title: 'ฐานข้อมูลลูกค้า',
    subtitle: 'CRM เบื้องต้นสำหรับร้านเฟอร์นิเจอร์',
    route: '/customers',
    color: '#DB2777',
    features: [
      'บันทึกข้อมูลลูกค้า ชื่อ เบอร์ ที่อยู่',
      'ประวัติโปรเจกต์ต่อลูกค้า',
      'ค้นหาและกรองข้อมูล',
    ],
    tips: [],
  },
  {
    id: 'profit',
    icon: MdTrendingUp,
    emoji: '💰',
    title: 'กำไร & Margin',
    subtitle: 'รายงานการเงินเชิงลึก',
    route: '/profit',
    color: '#16A34A',
    features: [
      'สรุปกำไรแต่ละโปรเจกต์',
      'Margin distribution chart',
      'เปรียบเทียบต้นทุนกับรายได้',
    ],
    tips: [],
  },
  {
    id: 'settings',
    icon: MdSettings,
    emoji: '⚙️',
    title: 'ตั้งค่าระบบ',
    subtitle: 'กำหนดค่าทั้งหมดของระบบ',
    route: '/settings',
    color: '#64748B',
    features: [
      'อัปโหลดโลโก้แยก Light / Dark Mode',
      'ตั้งค่าราคาวัสดุ (Surface, Edge, Labor, Install)',
      'เชื่อมต่อ Google Sheets + Apps Script',
      'LINE Messaging API — Push / Broadcast',
      'ตั้งค่าการแจ้งเตือนในระบบ',
      'จัดการบัญชีผู้ใช้',
    ],
    tips: [
      'ราคาวัสดุที่ตั้งไว้มีผลกับการคำนวณทันที',
    ],
  },
]

const INTEGRATIONS = [
  {
    icon: MdStorage,
    title: 'Google Sheets',
    desc: 'Sync โปรเจกต์และ Stock ไปยัง Spreadsheet อัตโนมัติ ผ่าน Apps Script',
    setup: 'Settings → Google Sheets',
  },
  {
    icon: MdChat,
    title: 'LINE Messaging API',
    desc: 'รับการแจ้งเตือน โปรเจกต์ใหม่ / Stock ต่ำ / สถานะเปลี่ยน ผ่าน LINE Bot',
    setup: 'Settings → LINE OA',
  },
  {
    icon: MdAutoFixHigh,
    title: 'Theme Studio',
    desc: 'ปรับ Light / Dark / Night Mode และสี Accent ของระบบ',
    setup: 'Settings → Theme Studio',
  },
]

// ─── Expandable Module Card ────────────────────────────────────────────────────

function ModuleCard({ mod }: { mod: typeof MODULES[0] }) {
  const [open, setOpen] = useState(false)
  const Icon = mod.icon

  return (
    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-[var(--theme-hover)] transition-colors text-left"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: mod.color + '18' }}
        >
          {mod.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-primary">{mod.title}</p>
          <p className="text-[11px] text-muted mt-0.5 truncate">{mod.subtitle}</p>
        </div>
        <Link
          href={mod.route}
          onClick={e => e.stopPropagation()}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--theme-surface)] text-muted hover:text-accent transition-colors"
        >
          <MdOpenInNew size={13} />
        </Link>
        <MdExpandMore
          size={14}
          className={clsx('text-muted transition-transform duration-200 flex-shrink-0', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--theme-border)] px-4 py-3 space-y-3">
              <div>
                <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2">ฟีเจอร์</p>
                <ul className="space-y-1">
                  {mod.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-primary">
                      <MdCheckCircle size={11} className="text-accent flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              {mod.tips.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2">💡 เคล็ดลับ</p>
                  {mod.tips.map((t, i) => (
                    <p key={i} className="text-[11px] text-accent bg-accent/8 rounded-xl px-3 py-2 mb-1 leading-relaxed">
                      {t}
                    </p>
                  ))}
                </div>
              )}
              <Link
                href={mod.route}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
              >
                เปิดหน้า {mod.title} <MdOpenInNew size={10} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <MdMenuBook size={22} className="text-accent" /> คู่มือการใช้งานระบบ
        </h1>
        <p className="text-sm text-muted mt-1">MERIDIAN ROOM AI — ระบบจัดการโรงงานผลิตเฟอร์นิเจอร์แบบครบวงจร</p>
      </div>

      {/* System Overview */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <MdMemory size={22} className="text-accent" />
          </div>
          <div>
            <h2 className="font-bold text-primary text-base mb-2">ภาพรวมระบบ</h2>
            <p className="text-sm text-muted leading-relaxed">
              MERIDIAN ROOM AI เป็นระบบ All-in-One สำหรับธุรกิจเฟอร์นิเจอร์ Built-in
              ครอบคลุมตั้งแต่การออกแบบ คิดราคา ออกใบเสนอราคา จัดการโปรเจกต์
              ควบคุม Stock วัตถุดิบ ไปจนถึงวิเคราะห์กำไรและ Margin
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { icon: MdLayers,    label: '3D Configurator' },
                { icon: MdMemory,    label: 'AI Analysis'     },
                { icon: MdDownload,  label: 'PDF Export'      },
                { icon: MdStorage,   label: 'Google Sheets'   },
                { icon: MdChat,      label: 'LINE Notify'     },
                { icon: MdSecurity,  label: 'Auth System'     },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-accent/8 text-accent font-medium border border-accent/20">
                  <Icon size={10} /> {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-bold text-primary text-base mb-4 flex items-center gap-2">
          <MdBolt size={16} className="text-accent" /> เริ่มต้นใช้งาน (5 นาที)
        </h2>
        <div className="space-y-3">
          {[
            { n: 1, title: 'ตั้งค่าบริษัท', desc: 'Settings → ทั่วไป → กรอกชื่อบริษัท อัปโหลดโลโก้ Light/Dark Mode', route: '/settings' },
            { n: 2, title: 'กำหนดราคาวัสดุ', desc: 'Settings → ราคาวัสดุ → ปรับราคา Surface, Edge, Labor ตามต้นทุนจริง', route: '/settings' },
            { n: 3, title: 'คิดราคางานแรก', desc: 'คิดราคา → เลือกประเภทงาน กำหนดขนาด วัสดุ ระบบจะ Auto-Calculate', route: '/pricing' },
            { n: 4, title: 'บันทึกและออก PDF', desc: 'กด บันทึก เพื่อเก็บโปรเจกต์ กด PDF เพื่อออกใบเสนอราคา TH Sarabun', route: '/pricing' },
            { n: 5, title: 'เชื่อมต่อ Google Sheets', desc: 'Settings → Google Sheets → วาง Apps Script URL สำหรับ Auto-sync', route: '/settings' },
          ].map(s => (
            <div key={s.n} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {s.n}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-primary">{s.title}</p>
                  <Link href={s.route} className="text-[10px] text-accent hover:underline flex items-center gap-0.5">
                    เปิด <MdOpenInNew size={9} />
                  </Link>
                </div>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modules */}
      <div>
        <h2 className="font-bold text-primary text-base mb-3 flex items-center gap-2">
          <MdInventory size={16} className="text-accent" /> โมดูลทั้งหมด
          <span className="text-xs text-muted font-normal">(คลิกเพื่อดูรายละเอียด)</span>
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {MODULES.map(mod => (
            <ModuleCard key={mod.id} mod={mod} />
          ))}
        </div>
      </div>

      {/* Integrations */}
      <div>
        <h2 className="font-bold text-primary text-base mb-3 flex items-center gap-2">
          <MdRefresh size={16} className="text-accent" /> การเชื่อมต่อ
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {INTEGRATIONS.map(int => {
            const Icon = int.icon
            return (
              <div key={int.title} className="glass-card rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-accent" />
                  <p className="font-bold text-primary text-sm">{int.title}</p>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">{int.desc}</p>
                <Link href="/settings" className="text-[10px] text-accent hover:underline flex items-center gap-1">
                  <MdSettings size={9} /> {int.setup}
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Price Structure */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-bold text-primary text-base mb-4 flex items-center gap-2">
          <MdAttachMoney size={16} className="text-accent" /> โครงสร้างราคา (สูตรคำนวณ)
        </h2>
        <div className="space-y-2 text-sm">
          {[
            ['ต้นทุนวัสดุแผ่นไม้', 'พื้นที่ (ตร.ม.) × ราคาแผ่น × จำนวน + Waste 15–25%'],
            ['ต้นทุนผิวสัมผัส',    'พื้นที่ × ราคา Surface Type ที่เลือก'],
            ['Edge Banding',       'ความยาวขอบทั้งหมด × ราคา/เมตร'],
            ['อุปกรณ์ Hardware',   'คำนวณตาม Brand ที่เลือก + Options เพิ่ม'],
            ['ค่าแรงโรงงาน',      'ตัด + Edge + ประกอบ + QC + บรรจุ ต่อชุด'],
            ['ค่าติดตั้ง',         'พื้นที่ × อัตราค่าติดตั้งตาม Location Type'],
            ['ราคาขาย',           'ต้นทุนรวม ÷ (1 − Target Margin) × (1 + VAT)'],
          ].map(([l, v]) => (
            <div key={l} className="flex gap-3 py-1.5 border-b border-[var(--theme-border)] last:border-0">
              <span className="text-muted w-36 flex-shrink-0 text-xs">{l}</span>
              <span className="text-primary text-xs leading-relaxed">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-bold text-primary text-base mb-4 flex items-center gap-2">
          <MdInfo size={16} className="text-accent" /> เคล็ดลับ & ข้อแนะนำ
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { tip: 'ปรับราคาวัสดุใน Settings ก่อนใช้งาน', desc: 'ราคา Default เป็นราคากลาง ควรปรับตามต้นทุนจริงของร้าน' },
            { tip: 'Margin 35-40% สำหรับงานทั่วไป', desc: 'งาน Luxury / Custom เพิ่ม Margin ได้ถึง 50%' },
            { tip: 'ขนาด 60/120/240 ลด Waste', desc: 'ขนาดหาร 120 ลงตัวกับแผ่นมาตรฐาน 4×8 ฟุต ลด Waste ได้อีก ~12%' },
            { tip: 'แบ่งตู้เมื่อกว้างเกิน 300 ซม.', desc: 'ง่ายต่อขนส่งและลด Waste พร้อมเพิ่มความแข็งแรง' },
            { tip: 'โลโก้ใส่ 2 แบบ Light + Dark', desc: 'ระบบเลือกใช้โลโก้ที่เหมาะสมอัตโนมัติตาม Theme ที่เลือก' },
            { tip: 'LINE Bot รับแจ้งเตือนทันที', desc: 'ตั้ง User ID เพื่อรับ Push Notification โดยตรง ไม่ต้อง Broadcast' },
          ].map(({ tip, desc }) => (
            <div key={tip} className="flex gap-2.5 p-3 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)]">
              <span className="text-accent flex-shrink-0 mt-0.5"><MdCheckCircle size={14} /></span>
              <div>
                <p className="text-xs font-semibold text-primary">{tip}</p>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Version */}
      <div className="text-center py-3">
        <p className="text-xs text-subtle">MERIDIAN ROOM AI v2.0 · 2026 · Built with Next.js 14 + React Three Fiber</p>
      </div>

    </div>
  )
}
