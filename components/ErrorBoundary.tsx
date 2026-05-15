'use client'
import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack?.slice(0, 300))
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--theme-bg,#F7F7F7)] p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-100 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-sm text-gray-500 mb-1">ระบบพบปัญหาที่ไม่คาดคิด</p>
            <p className="text-xs text-red-400 font-mono mb-6 break-all">
              {this.state.error?.message?.slice(0, 120)}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
              className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              <RefreshCw size={14} />
              รีโหลดหน้า
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
