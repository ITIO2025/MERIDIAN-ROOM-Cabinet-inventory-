import { NextRequest, NextResponse } from 'next/server'

const SCRIPT_URL = process.env.APPS_SCRIPT_URL
const API_KEY = process.env.APPS_SCRIPT_API_KEY ?? 'meridian-api-key-2026'

async function proxyGet(action: string) {
  if (!SCRIPT_URL) return NextResponse.json({ error: 'APPS_SCRIPT_URL not configured' }, { status: 503 })
  const url = new URL(SCRIPT_URL)
  url.searchParams.set('action', action)
  url.searchParams.set('key', API_KEY)
  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  const data = await res.json()
  return NextResponse.json(data)
}

async function proxyPost(action: string, body: unknown) {
  if (!SCRIPT_URL) return NextResponse.json({ error: 'APPS_SCRIPT_URL not configured' }, { status: 503 })
  const url = new URL(SCRIPT_URL)
  url.searchParams.set('action', action)
  url.searchParams.set('key', API_KEY)
  const res = await fetch(url.toString(), { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
  const data = await res.json()
  return NextResponse.json(data)
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') ?? 'health'
  return proxyGet(action)
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') ?? 'create'
  const body = await req.json()
  return proxyPost(action, body)
}
