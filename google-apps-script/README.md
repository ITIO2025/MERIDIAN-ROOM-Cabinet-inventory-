# MERIDIAN ROOM — Google Apps Script Setup

## วิธีติดตั้ง

### 1. สร้าง Google Spreadsheet ใหม่
- ไปที่ sheets.google.com → สร้าง Spreadsheet ใหม่
- ตั้งชื่อว่า "MERIDIAN ROOM Database"

### 2. เปิด Apps Script
- Extensions > Apps Script
- ลบโค้ดเดิมออกทั้งหมด
- วาง Code.gs ลงไป

### 3. Save และ Deploy
```
1. กด Ctrl+S เพื่อ Save
2. คลิก Deploy > New Deployment
3. Select type: Web App
4. Execute as: Me
5. Who has access: Anyone
6. คลิก Deploy
7. Copy URL ที่ได้
```

### 4. Initialize Sheets
```
1. กลับไปที่ Spreadsheet
2. Refresh หน้า
3. จะมีเมนู "🏠 MERIDIAN ROOM" ปรากฏขึ้น
4. คลิก > Initialize All Sheets
5. ระบบจะสร้าง 10 Sheets ให้อัตโนมัติ
```

### 5. ตั้งค่าใน .env.local
```bash
APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
APPS_SCRIPT_API_KEY=meridian-api-key-2026
GOOGLE_SHEETS_ID=your-spreadsheet-id-from-url
```

⚠️ เปลี่ยน API_KEY ใน Code.gs ให้ตรงกับ .env.local

## Sheets ที่จะถูกสร้าง

| Sheet | ข้อมูล |
|-------|--------|
| PROJECTS | โปรเจกต์ทั้งหมด |
| CUSTOMERS | ข้อมูลลูกค้า |
| BOQ_HISTORY | ประวัติ BOQ |
| MATERIAL_MASTER | ราคาวัสดุ |
| HARDWARE_MASTER | ราคา Hardware |
| COST_CONFIG | ค่าตั้งต้น (Margin, Overhead) |
| SALES | รายงานการขาย |
| USERS | ผู้ใช้งาน |
| STOCK | คลังวัสดุ |
| SUPPLIERS | ผู้จำหน่าย |

## API Endpoints (GET)

```
?action=health                    → Health check
?action=getAll&sheet=PROJECTS     → ดึงทุก project
?action=getById&sheet=PROJECTS&id=P001  → ดึง project เดียว
?action=getMaterials              → ราคาวัสดุทั้งหมด
?action=getHardware               → ราคา Hardware
?action=getCostConfig             → ค่า Config ราคา
?action=getStats                  → Dashboard stats
```

## API Endpoints (POST)

```json
{ "action": "saveProject", "api_key": "...", "data": {...} }
{ "action": "saveBOQ", "api_key": "...", "data": {...} }
{ "action": "updateStock", "api_key": "...", "data": {...} }
{ "action": "create", "sheet": "CUSTOMERS", "data": {...} }
{ "action": "update", "sheet": "CUSTOMERS", "id": "C001", "data": {...} }
{ "action": "delete", "sheet": "CUSTOMERS", "id": "C001" }
```
