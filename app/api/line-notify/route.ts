import { NextRequest, NextResponse } from 'next/server'

// ── LINE Messaging API proxy ──────────────────────────────────────────────────
// Supports:
//   push      → POST /v2/bot/message/push      (ต้องมี userId)
//   broadcast → POST /v2/bot/message/broadcast  (ส่งให้ทุก follower)

export async function POST(req: NextRequest) {
  try {
    const { token, userId, message } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { ok: false, message: 'กรุณาตั้งค่า Channel Access Token ก่อน' },
        { status: 400 }
      )
    }
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ ok: false, message: 'ไม่มีข้อความ' }, { status: 400 })
    }

    const hasTarget = userId && typeof userId === 'string' && userId.trim().length > 0
    const endpoint = hasTarget
      ? 'https://api.line.me/v2/bot/message/push'
      : 'https://api.line.me/v2/bot/message/broadcast'

    const body = hasTarget
      ? { to: userId.trim(), messages: [{ type: 'text', text: message }] }
      : { messages: [{ type: 'text', text: message }] }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    // LINE Messaging API returns 200 with empty body on success
    if (res.ok) {
      return NextResponse.json({
        ok: true,
        message: hasTarget ? 'ส่ง LINE สำเร็จ (Push)' : 'ส่ง LINE สำเร็จ (Broadcast)',
        mode: hasTarget ? 'push' : 'broadcast',
      })
    }

    // Parse error details from LINE
    const errText = await res.text().catch(() => '')
    let errMsg = `LINE API Error ${res.status}`
    try {
      const errJson = JSON.parse(errText)
      errMsg = errJson.message ?? errMsg
    } catch { /* not JSON */ }

    return NextResponse.json(
      { ok: false, message: errMsg },
      { status: res.status }
    )
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: `Server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }
}
