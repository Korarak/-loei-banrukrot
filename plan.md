# Project Plan — Loei Banrakrod (E-commerce + POS)

อัปเดตล่าสุด: 2026-07-05

## สถานะปัจจุบัน: 🟢 PRODUCTION LIVE

- **เว็บ:** https://banrukrot.com (HTTP 200, API + DB connected)
- **VPS:** 103.107.53.112 (2 vCPU / 6GB RAM / 120GB SSD) — user `deploy`, SSH key only
- **Secrets/credentials:** ดูที่ `deploy-secrets.local.md` (ไม่ commit เข้า git)
- Owner account สมัครแล้ว, admin เข้าใช้งานได้แล้ว
- **งานที่กำลังทำ:** เจ้าของร้านกำลังนำเข้าข้อมูลสินค้าผ่านหน้า admin (ทีละรายการ — ยังไม่มีฟีเจอร์ bulk import)

### สถาปัตยกรรม production (เปลี่ยนจากแผนเดิม — ไม่ใช้ nginx เปล่าแล้ว)

```
Internet → Nginx Proxy Manager (:80/:443, Let's Encrypt)
             ├─ banrukrot.com, www → frontend (Next.js :8081)
             │    └─ /api/, /uploads/ → backend (Express :8080)
             └─ registry.banrukrot.com → registry:5000 (self-hosted Docker registry)
           mongodb (internal เท่านั้น)
```

- 5 containers: frontend, backend, mongodb, npm (Nginx Proxy Manager), registry
- NPM admin UI: `127.0.0.1:81` เท่านั้น — เข้าผ่าน SSH tunnel (ดูวิธีใน deploy-secrets)
- CI/CD: push `main` → GitHub Actions build → push image ไป registry.banrukrot.com
  → SSH เข้า VPS → sync compose → `pull` + `up -d` (ทดสอบแล้วหลายรอบ ทำงานดี)
- ตรวจ workflow: ไม่มี `gh` CLI ในเครื่อง — ใช้ GitHub API
  `https://api.github.com/repos/Korarak/-loei-banrukrot/actions/runs?per_page=1`

### Resource บน VPS (วัดล่าสุด 2026-07-05)

ทุก container ต่ำกว่า 20% ของ limit, ดิสก์ใช้ 6%, RAM เครื่องเหลือ ~5GB
(NPM เคยชน 85% ของ 256M — เพิ่ม limit เป็น 512M แล้ว)

## งานที่ทำเสร็จแล้ว (สรุปย่อ)

### ก่อน go-live (มิ.ย. – 2 ก.ค. 2026)
- Performance overhaul pass 1-6: Docker limits/healthchecks, compression,
  compound indexes, staleTime + useMemo/debounce ทั้ง frontend, ลด GPU effects
- Security: bootstrap-only registration (คนแรก = owner), cart ownership check,
  OWASP headers ครบ (CSP/HSTS/COOP), Zod v4 crash fix, HMAC timing-safe
- UX/UI ลูกค้า + admin: aria-labels, confirm dialog การเงิน, toast ภาษาไทย

### Go-live (3-5 ก.ค. 2026)
- เปลี่ยนสถาปัตยกรรม: self-hosted registry + Nginx Proxy Manager แทน nginx เปล่า (`928ad42`)
- Rebrand ธีม **Retro Vespa Italian** (ครีมอุ่น/แดง Vespa/ทองแอนทีค), Google account
  chooser, logout confirmation (`27491e5`)
- Deploy สำเร็จ, DNS + Let's Encrypt certs ทำงาน, owner สมัครแล้ว

### วันนี้ (5 ก.ค. 2026)
- **`b2a2cbf`** ปรับ contrast ข้อความทั้ง customer storefront ให้ผ่าน WCAG AA
  (15 ไฟล์: พื้นสว่าง gray-400/500→600, พื้นเข้ม footer ทำให้สว่างขึ้น,
  ล้างสี emerald ตกค้างจากธีมเก่า → แดง/ทอง Vespa, `--muted-foreground` 40%→32%)
- **`7eae81f`** เพิ่ม NPM memory limit 256M→512M (กัน OOM kill = เว็บล่มทั้งโดเมน)
- **`120da90`** แก้ปุ่ม "ช้อปเลย" hero แคบผิดปกติ — `has-[>svg]:px-4` ของ shadcn
  Button ทับ `px-8` เมื่อมีไอคอน (แก้ด้วย `has-[>svg]:px-8`)
- **`0981f1a`** แก้ 502 site-wide: อัปโหลดรูปโปรไฟล์ทำ backend crash
  (EACCES ตอน mkdir บน bind mount ที่เป็นของ root → uncaught throw ฆ่า process)
  - โค้ด: `upload.js` ใช้ absolute path (`__dirname`) + try/catch ส่ง error เข้า
    multer cb แทน throw
  - VPS: `chown -R 1000:1000 ~/loei-banrakrod/backend/public/uploads` ทำแล้ว
- Favicon ใหม่: `frontend/src/app/icon.svg` (กล่องแดง Vespa + V ขาว + แถบทอง)
  ลบ favicon.ico เดิม

## บทเรียน/ข้อควรรู้สำหรับงานครั้งต่อไป

1. **shadcn Button มี `has-[>svg]:px-*` ใน size variants** — ถ้า override padding
   ปุ่มที่มีไอคอน ต้องใส่ `has-[>svg]:px-*` ด้วย ไม่งั้นโดนทับ
2. **Backend รันเป็น user `node` (uid 1000)** — โฟลเดอร์ bind mount ใหม่บน VPS
   ต้อง chown 1000:1000 เสมอ
3. **การเช็ค Docker/VPS:** `ssh deploy@103.107.53.112` ใช้ได้ตรงๆ (key ตั้งแล้ว)
4. หลัง push รอ CI ~3-5 นาที เช็คผ่าน GitHub API แล้วตรวจ container บน VPS ว่า
   ถูก recreate + ทดสอบ https://banrukrot.com/api/status

## สิ่งที่ควรทำต่อไป (เรียงตามความสำคัญ)

1. **เฝ้าดูการนำเข้าสินค้า** — เจ้าของกำลังเพิ่มสินค้าจริง ถ้าเจอ bug จะรายงานมา
   (พิจารณาทำ bulk import CSV/Excel ถ้าสินค้าเยอะ)
2. **เปลี่ยนรหัส NPM admin** (`admin@banrukrot.com`) — ยังเป็นรหัสที่ generate ตอน setup
3. **Backup MongoDB อัตโนมัติออกนอกเครื่อง** — มี backupController แล้ว
   ต้องต่อ cron + ส่งออก (S3/FTP/rclone)
4. **ทดสอบ flow จริงครบวงจร** บน production: ลูกค้าสั่งซื้อ → แนบสลิป →
   admin ยืนยัน → แนบเลขพัสดุ → POS ขายหน้าร้าน → สต็อกตัดถูกต้อง
5. **อัปโหลดรูปโปรไฟล์/สินค้า/สลิป ทดสอบซ้ำหลัง deploy `0981f1a`**

## Backlog

### ความปลอดภัย
- Rate-limit เฉพาะ endpoint อัปโหลด/login ให้เข้มกว่า global
- พิจารณา Cloudflare ครอบหน้า (ตอนนี้ NPM รับตรง + Let's Encrypt)
- Audit log ระดับ "ใครยืนยันสลิป/ใครลบข้อมูล"

### ฟีเจอร์
- Bulk import สินค้า (CSV/Excel) — ยังไม่มี รอดูว่าจำเป็นไหมจากปริมาณสินค้า
- Empty/error state ฝั่งลูกค้าหน้า orders

### เทคนิค
- CI เพิ่มขั้น lint + tsc ก่อน build image
- หน้า admin: review responsive บน tablet (md:)
- focus-trap จริงใน custom modal (ตอนนี้มีแค่ Escape)
