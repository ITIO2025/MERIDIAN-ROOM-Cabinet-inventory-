// ════════════════════════════════════════════════════════════════════════════
//  MERIDIAN ROOM AI — Google Apps Script v2.0
//  วิธีใช้: Extensions → Apps Script → วางโค้ดนี้ → Deploy → Web app
//  Execute as: Me  |  Who has access: Anyone
// ════════════════════════════════════════════════════════════════════════════

const API_KEY       = 'meridian-api-key-2026'
const SHEET_PROJECTS  = 'Projects'
const SHEET_STOCK     = 'Stock'
const SHEET_QUOTATION = 'Quotations'

function doGet(e) {
  const action = e.parameter.action
  if (action === 'health') {
    return json({ ok: true, message: 'MERIDIAN ROOM Connected', timestamp: new Date().toISOString() })
  }
  if (action === 'getProjects') return json(getSheetData(SHEET_PROJECTS))
  if (action === 'getStock')    return json(getSheetData(SHEET_STOCK))
  return json({ error: 'Unknown action' })
}

function doPost(e) {
  try {
    const data   = JSON.parse(e.postData.contents)
    if (data.key !== API_KEY) return json({ error: 'Unauthorized' })
    const action = data.action
    if (action === 'saveProject')   return json(handleSaveProject(data.project))
    if (action === 'updateStatus')  return json(handleUpdateStatus(data.id, data.status))
    if (action === 'syncStock')     return json(handleSyncStock(data.items))
    if (action === 'saveQuotation') return json(handleSaveQuotation(data.quotation))
    return json({ error: 'Unknown action: ' + action })
  } catch (err) {
    return json({ error: err.toString() })
  }
}

function handleSaveProject(project) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = getOrCreateSheet(ss, SHEET_PROJECTS, [
    'ID','ชื่อโปรเจกต์','ลูกค้า','ประเภท','สถานะ',
    'ราคาขาย','ต้นทุน','Margin %','วันที่สร้าง','อัปเดต'
  ])
  const p   = project
  const row = findRow(sheet, p.id)
  const vals = [p.id,p.projectName,p.customerName,p.projectType,p.status,
                p.sellingPrice,p.netCost,p.margin,p.createdAt,new Date().toISOString()]
  if (row > 0) {
    sheet.getRange(row, 1, 1, 10).setValues([vals])
    return { ok: true, action: 'updated' }
  }
  sheet.appendRow(vals)
  return { ok: true, action: 'created' }
}

function handleUpdateStatus(id, status) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(SHEET_PROJECTS)
  if (!sheet) return { error: 'No Projects sheet' }
  const row = findRow(sheet, id)
  if (row < 0) return { error: 'Not found' }
  sheet.getRange(row, 5).setValue(status)
  sheet.getRange(row, 10).setValue(new Date().toISOString())
  return { ok: true }
}

function handleSyncStock(items) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = getOrCreateSheet(ss, SHEET_STOCK, [
    'ID','ชื่อวัสดุ','หมวดหมู่','หน่วย','จำนวน','ขั้นต่ำ',
    'ราคา/หน่วย','มูลค่ารวม','ผู้จัดจำหน่าย','สถานะ','อัปเดต'
  ])
  const last = sheet.getLastRow()
  if (last > 1) sheet.getRange(2, 1, last - 1, 11).clearContent()
  const rows = items.map(function(i) {
    return [i.id,i.name,i.category,i.unit,i.qty,i.minQty,
            i.unitCost,i.qty*i.unitCost,i.supplier||'-',i.status,new Date().toISOString()]
  })
  if (rows.length > 0) sheet.getRange(2, 1, rows.length, 11).setValues(rows)
  return { ok: true, synced: rows.length }
}

function handleSaveQuotation(q) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = getOrCreateSheet(ss, SHEET_QUOTATION, [
    'เลขที่','โปรเจกต์','ลูกค้า','ราคา','ต้นทุน','Margin %','วันที่','สถานะ'
  ])
  sheet.appendRow([q.id,q.projectName,q.customerName,q.sellingPrice,
                   q.netCost,q.margin,q.createdAt,q.status])
  return { ok: true }
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name)
  if (!sheet) {
    sheet = ss.insertSheet(name)
    var hRange = sheet.getRange(1, 1, 1, headers.length)
    hRange.setValues([headers])
    hRange.setFontWeight('bold')
    hRange.setBackground('#1C2433')
    hRange.setFontColor('#C6A969')
    sheet.setFrozenRows(1)
  }
  return sheet
}

function findRow(sheet, id) {
  var data = sheet.getDataRange().getValues()
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) return i + 1
  }
  return -1
}

function getSheetData(sheetName) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(sheetName)
  if (!sheet) return { error: 'Sheet not found: ' + sheetName }
  var all     = sheet.getDataRange().getValues()
  var headers = all[0]
  var rows    = all.slice(1).map(function(row) {
    var obj = {}
    headers.forEach(function(h, i) { obj[h] = row[i] })
    return obj
  })
  return { ok: true, data: rows, count: rows.length }
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}
