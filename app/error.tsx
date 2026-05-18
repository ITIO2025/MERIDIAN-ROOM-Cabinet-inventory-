'use client'
import { useEffect } from 'react'
import { MdWarning, MdHome } from 'react-icons/md'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[App Error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-surface)' }}>
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
          <MdWarning size={28} className="text-danger" />
        </div>

        <h1 className="text-xl font-bold text-primary mb-2">มีข้อผิดพลาด</h1>
        <p className="text-sm text-gray-500 mb-6">
          ระบบพบปัญหาบางอย่าง กรุณาลองใหม่หรือกลับไปหน้าหลัก
        </p>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors"
            style={{ background: '#C6A969', color: '#111111' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            ลองใหม่
          </button>

          <Link href="/"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold border rounded-xl transition-colors hover:bg-gray-50"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--color-primary)' }}
          >
            <MdHome size={14} /> กลับหน้าหลัก
          </Link>
        </div>

        {error.digest && (
          <p className="text-xs text-gray-400 mt-4">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
