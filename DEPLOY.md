# 🚀 วิธี Deploy MERIDIAN ROOM AI — ฟรี 100%

## ✅ ใช้ Vercel (แนะนำ — ฟรี ตลอดไป สำหรับ personal project)

---

## ขั้นตอนที่ 1 — สร้าง GitHub Repository

1. ไปที่ https://github.com → **New repository**
2. ตั้งชื่อ: `meridian-room`
3. เลือก **Private** (ถ้าไม่ต้องการให้คนอื่นเห็น code)
4. **อย่า** เติก Add README / .gitignore / license
5. คลิก **Create repository**

จากนั้นใน Terminal ที่โฟลเดอร์โปรเจกต์:

```bash
git remote add origin https://github.com/YOUR_USERNAME/meridian-room.git
git branch -M main
git push -u origin main
```

---

## ขั้นตอนที่ 2 — Deploy บน Vercel

1. ไปที่ https://vercel.com → **Sign up with GitHub** (ฟรี)
2. คลิก **Add New → Project**
3. เลือก repo `meridian-room` → คลิก **Import**
4. Framework preset: **Next.js** (auto-detect)
5. ใส่ **Environment Variables** (ดูด้านล่าง)
6. คลิก **Deploy** → รอ 2-3 นาที ✨

---

## 🔑 Environment Variables ที่ต้องใส่ใน Vercel

ไปที่ Project Settings → Environment Variables แล้วเพิ่ม:

| Key | Value | หมายเหตุ |
|-----|-------|---------|
| `NEXTAUTH_SECRET` | (สร้างเอง — ดูด้านล่าง) | **จำเป็น** |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | **จำเป็น** |
| `NEXT_PUBLIC_APP_NAME` | `MERIDIAN ROOM AI` | ใส่หรือไม่ก็ได้ |
| `NEXT_PUBLIC_GOOGLE_ENABLED` | `false` | ใส่หรือไม่ก็ได้ |

### วิธีสร้าง NEXTAUTH_SECRET

เปิด Terminal แล้วรัน:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
ได้ค่าอะไรมา → ใส่เป็น NEXTAUTH_SECRET

**หรือ** ใช้ค่านี้ได้เลย (เปลี่ยนตัวเลขบางส่วนให้ไม่ซ้ำ):
```
m3r1d14n-r00m-pr0d-2026-secure-k3y-change-this-now!
```

---

## ขั้นตอนที่ 3 — อัปเดต NEXTAUTH_URL

หลัง Deploy แล้ว Vercel จะให้ URL เช่น `https://meridian-room-abc123.vercel.app`

ไปที่ Vercel → Project Settings → Environment Variables:
- แก้ `NEXTAUTH_URL` → ใส่ URL จริงที่ได้จาก Vercel
- คลิก **Save** → **Redeploy**

---

## 👥 บัญชีผู้ใช้ Default

| Email | Password | Role |
|-------|----------|------|
| `admin@meridian.co` | `meridian2026` | Super Admin |
| `designer@meridian.co` | `design2026` | Designer |
| `sales@meridian.co` | `sales2026` | Sales |
| `production@meridian.co` | `prod2026` | Production |

> **หมายเหตุ**: เปลี่ยน password ที่ `lib/auth-users.ts` ก่อน deploy จริง!

---

## 🔄 วิธีอัปเดตโค้ด (ครั้งต่อไป)

```bash
git add .
git commit -m "update: อธิบายการเปลี่ยนแปลง"
git push
```
Vercel จะ deploy ให้อัตโนมัติทันที! ✅

---

## 🌐 Domain ฟรีที่ได้จาก Vercel

- `your-app.vercel.app` — ฟรีตลอด
- สามารถ custom domain ได้ฟรีถ้ามี domain อยู่แล้ว

---

## 📊 ขีดจำกัด Vercel Free Tier

| Feature | Free |
|---------|------|
| Bandwidth | 100 GB/เดือน |
| Deployments | ไม่จำกัด |
| Serverless Functions | 100GB-hours/เดือน |
| Projects | ไม่จำกัด |
| Custom Domains | ✅ ฟรี |

**เพียงพอ** สำหรับใช้ในบริษัท 10-20 คน

---

## ⚠️ สิ่งที่ต้องรู้

1. **ข้อมูลเก็บใน localStorage** — ข้อมูลอยู่ที่เครื่องผู้ใช้แต่ละคน ไม่ sync กัน
2. **ถ้าต้องการ sync ข้อมูล** → ตั้งค่า Google Sheets ที่หน้า Settings
3. **LINE Notification** → ตั้งค่า Channel Access Token ที่หน้า Settings

---

## 🆘 Troubleshooting

### Build ล้มเหลว
```
Error: NEXTAUTH_SECRET is not set
```
→ ใส่ `NEXTAUTH_SECRET` ใน Vercel Environment Variables

### หน้าเว็บ redirect loop
```
NEXTAUTH_URL ไม่ถูกต้อง
```
→ ตรวจสอบว่า `NEXTAUTH_URL` ตรงกับ URL จริงของ Vercel

### Login ไม่ได้
→ ตรวจสอบ `NEXTAUTH_SECRET` และ `NEXTAUTH_URL` อีกครั้ง
