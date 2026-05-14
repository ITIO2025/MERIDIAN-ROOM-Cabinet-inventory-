import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL
const API_KEY = process.env.APPS_SCRIPT_API_KEY

// ─── GET /api/projects ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // If no Apps Script configured, return empty array
  if (!APPS_SCRIPT_URL || !API_KEY) {
    return NextResponse.json({ data: [], source: 'local' })
  }

  try {
    const res = await fetch(
      `${APPS_SCRIPT_URL}?action=getAll&sheet=PROJECTS&api_key=${API_KEY}`,
      { next: { revalidate: 30 } }
    )
    const json = await res.json()
    return NextResponse.json({ data: json.data, source: 'sheets' })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch from Sheets', data: [] }, { status: 500 })
  }
}

// ─── POST /api/projects ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (!APPS_SCRIPT_URL || !API_KEY) {
    // Fallback: just return success (data handled client-side)
    return NextResponse.json({ success: true, source: 'local' })
  }

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveProject', api_key: API_KEY, data: body }),
    })
    const json = await res.json()
    return NextResponse.json(json)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save to Sheets' }, { status: 500 })
  }
}
