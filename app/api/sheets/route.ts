import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

const SCRIPT_URL = process.env.APPS_SCRIPT_URL
const API_KEY = process.env.APPS_SCRIPT_API_KEY

// Only allow these actions to reach the Apps Script proxy
const ALLOWED_GET_ACTIONS  = new Set(['health', 'getAll', 'getStock', 'getProjects'])
const ALLOWED_POST_ACTIONS = new Set(['create', 'syncStock', 'saveProject', 'updateProject'])

async function proxyGet(action: string) {
  if (!SCRIPT_URL || !API_KEY) return NextResponse.json({ error: 'Sheets integration not configured' }, { status: 503 })
  const url = new URL(SCRIPT_URL)
  url.searchParams.set('action', action)
  url.searchParams.set('key', API_KEY)
  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  const data = await res.json()
  return NextResponse.json(data)
}

async function proxyPost(action: string, body: unknown) {
  if (!SCRIPT_URL || !API_KEY) return NextResponse.json({ error: 'Sheets integration not configured' }, { status: 503 })
  const url = new URL(SCRIPT_URL)
  url.searchParams.set('action', action)
  url.searchParams.set('key', API_KEY)
  const res = await fetch(url.toString(), { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
  const data = await res.json()
  return NextResponse.json(data)
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const action = req.nextUrl.searchParams.get('action') ?? 'health'
  if (!ALLOWED_GET_ACTIONS.has(action)) {
    return NextResponse.json({ error: `Action '${action}' not allowed` }, { status: 400 })
  }
  return proxyGet(action)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const action = req.nextUrl.searchParams.get('action') ?? 'create'
  if (!ALLOWED_POST_ACTIONS.has(action)) {
    return NextResponse.json({ error: `Action '${action}' not allowed` }, { status: 400 })
  }
  const body = await req.json()
  return proxyPost(action, body)
}
