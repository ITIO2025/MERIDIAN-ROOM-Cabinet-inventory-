import { MdHome, MdSearch } from 'react-icons/md'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-surface)' }}>
      <div className="max-w-md text-center">
        <div className="text-6xl font-black text-accent mb-4">404</div>

        <h1 className="text-2xl font-bold text-primary mb-2">หน้าไม่พบ</h1>
        <p className="text-sm text-gray-500 mb-6">
          ขออภัยค่ะ ไม่พบหน้าที่คุณกำลังมองหา
        </p>

        <div className="space-y-3">
          <Link href="/"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:scale-105 active:scale-100"
            style={{ background: '#C6A969', color: '#111111' }}
          >
            <MdHome size={14} /> กลับหน้าหลัก
          </Link>

          <Link href="/pricing"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold border rounded-xl transition-colors hover:bg-gray-50"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--color-primary)' }}
          >
            <MdSearch size={14} /> ไปที่คิดราคา
          </Link>
        </div>
      </div>
    </div>
  )
}
