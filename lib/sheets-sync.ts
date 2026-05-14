export interface SheetsSyncConfig {
  spreadsheetId: string
  scriptUrl: string
  apiKey: string
}

function getConfig(): SheetsSyncConfig | null {
  if (typeof window === 'undefined') return null
  return {
    spreadsheetId: localStorage.getItem('sheets_id') ?? '',
    scriptUrl: localStorage.getItem('sheets_url') ?? '',
    apiKey: localStorage.getItem('sheets_key') ?? '',
  }
}

async function callScript(action: string, payload?: Record<string, unknown>) {
  const cfg = getConfig()
  if (!cfg?.scriptUrl || !cfg?.apiKey) throw new Error('Google Sheets ยังไม่ได้ตั้งค่า')

  const url = new URL(cfg.scriptUrl)
  url.searchParams.set('action', action)
  url.searchParams.set('key', cfg.apiKey)

  const res = payload
    ? await fetch(url.toString(), { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
    : await fetch(url.toString())

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const data = await callScript('health')
    return { ok: true, message: data.message ?? 'เชื่อมต่อสำเร็จ' }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'เชื่อมต่อไม่ได้' }
  }
}

export async function syncProjectToSheets(project: Record<string, unknown>) {
  return callScript('saveProject', { project })
}

export async function fetchSheetsConfig() {
  return callScript('getConfig')
}

export async function fetchMaterials() {
  return callScript('getMaterials')
}
