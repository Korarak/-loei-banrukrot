# แผนติดตั้งระบบแชท + Push Notification (manual steps)

อัปเดตล่าสุด: 2026-07-17

## สถานะโค้ด

Phase 1 (แชท realtime), Phase 2 (Web Push), Phase 3 (แนบรูป/typing indicator/
เสียงแจ้งเตือน staff/rate limit) เสร็จแล้วทั้งหมด — 70/70 backend tests ผ่าน,
frontend type-check/lint สะอาด, ลองจริงผ่าน Chrome สองเซสชันพร้อมกันแล้ว,
และ build production Docker image ทั้ง backend+frontend ผ่านแล้ว (ไม่ใช่แค่
`npm run dev`) — **commit + push ขึ้น main แล้ว** (ดู commit hash + ผล
deploy-check ท้ายไฟล์นี้)

ระบบ backward-compatible เต็มที่ — push โค้ดชุดนี้ขึ้น production ได้เลยตอนนี้
โดยไม่พังของเดิม (ทุก env var ใหม่เป็น optional)

**Step 1 (NPM websocket routing) ทำเสร็จแล้ว** (ดูรายละเอียด/เหตุการณ์ระหว่างทำ
ด้านล่าง) — พอ push โค้ดขึ้น backend จะต่อ socket ได้ทันทีไม่ต้องแก้ NPM เพิ่ม
เหลือแค่ **Step 2** (สร้าง VAPID key จริง) ที่ยังไม่ได้ทำ — push notification
จะยังไม่ทำงานจนกว่าจะทำ step นี้ (แต่แชทตัวข้อความ/รูปภาพใช้งานได้ปกติโดยไม่ต้องรอ)

## Step 1 — ตั้งค่า Nginx Proxy Manager ให้ route `/socket.io/` — ✅ เสร็จแล้ว (2026-07-17)

ผู้ใช้ไม่มีทาง SSH tunnel เข้า NPM GUI ได้ (127.0.0.1:81 บน VPS) จึงทำผ่าน
**NPM REST API แทน** (ตัว SSH เข้า VPS เองยังใช้ได้ปกติ — ที่เข้าไม่ได้คือ GUI
ของ NPM ที่ bind แค่ localhost บน VPS) วิธีที่ใช้จริง:

1. Login เอา JWT token: `POST http://127.0.0.1:81/api/tokens` (รันจากในเครื่อง
   VPS เอง ผ่าน `ssh deploy@103.107.53.112 "curl ..."`) ด้วย
   `admin@banrukrot.com` / รหัสผ่านใน `deploy-secrets.local.md`
2. ดึง config เดิมของ proxy host #1 (`GET /api/nginx/proxy-hosts/1`) มาดูก่อน
   ว่ามีอะไรอยู่บ้าง — พบว่า `allow_websocket_upgrade: true` ถูกเปิดไว้ที่ระดับ
   host **อยู่แล้ว** ตั้งแต่ก่อนหน้านี้
3. ยิง `PUT /api/nginx/proxy-hosts/1` เพิ่ม location `/socket.io/` → `backend:8080`
   เข้าไปใน `locations[]` (เก็บ location เดิม `/api/`, `/uploads/` ไว้ครบ)

### ⚠️ เหตุการณ์ที่เกิดขึ้นระหว่างทำ (สั้นๆ ไว้เตือนตัวเอง)

รอบแรกใส่ `advanced_config` ของ location ใหม่โดยเติม
`proxy_http_version`/`proxy_set_header Upgrade`/`Connection` เข้าไปเองด้วย —
กลายเป็น **ซ้ำ** กับที่ NPM auto-inject ให้อยู่แล้ว (เพราะ host-level
`allow_websocket_upgrade: true` ทำให้ NPM ใส่ 3 บรรทัดนี้ในทุก location block
โดยอัตโนมัติอยู่แล้ว — เห็นได้จาก `/api/` และ `/uploads/` ที่มีอยู่เดิม) ผลคือ
`nginx -t` fail (`"proxy_http_version" directive is duplicate`) → **เว็บดาวน์
ชั่วคราว (Cloudflare 525) ประมาณ 30-40 วินาที** ก่อนจะ rollback กลับไปที่ config
เดิม (2 locations) ทันทีที่เจอ แล้วลองใหม่แบบไม่ใส่ `advanced_config` เลย
(ปล่อยให้ NPM auto-inject header ให้เหมือน location อื่น) — รอบสองผ่านโดยไม่มี
downtime

**บทเรียน**: ถ้า host มี `allow_websocket_upgrade: true` อยู่แล้ว location ใหม่
ไม่ต้องใส่ WebSocket headers เอง — NPM ใส่ให้อัตโนมัติทุก location รอบต่อไปที่
ต้องแก้ config ผ่าน API ให้ `GET` แล้ว diff ดูก่อนว่า field ไหนซ้ำกับที่มี
template อยู่แล้วบ้าง

### Verify แล้ว (ทำงานถูกต้อง)

- `docker exec loei-banrakrod-npm cat /data/nginx/proxy_host/1.conf` → location
  `/socket.io/` มีครบ `proxy_pass http://backend:8080;` +
  `proxy_set_header Upgrade/Connection` + `proxy_http_version 1.1;` เหมือน
  location อื่นทุกประการ
- `curl https://banrukrot.com/socket.io/?EIO=4&transport=polling` → ได้
  `{"success":false,"message":"Route ... not found"}` ซึ่งเป็นรูปแบบ 404 ของ
  Express เอง (ไม่ใช่ nginx 404) — **ยืนยันว่า routing ไปถึง backend:8080
  จริง** แค่ตอนนี้ backend ที่ deploy อยู่ยังไม่มีโค้ด Socket.io (ยังไม่ได้
  push) พอ push โค้ดแชทขึ้นจริงแล้ว path เดียวกันนี้จะ upgrade เป็น WebSocket
  ได้ทันที ไม่ต้องแก้ NPM อะไรเพิ่ม
- `https://banrukrot.com` และ `/api/status` กลับมา 200 ปกติหลัง fix

## Step 2 — สร้าง VAPID key จริงสำหรับ push notification (ไม่บล็อกการ push แค่ทำให้ push ใช้งานได้)

1. รันบนเครื่อง dev (ไม่ต้องต่อ production DB ก็รันได้):
   ```
   cd backend && npx web-push generate-vapid-keys
   ```
   จะได้ Public Key + Private Key คู่หนึ่ง — **เก็บ private key ให้ดี** ถ้า
   rotate ทีหลัง subscription เดิมทั้งหมดของลูกค้า/staff จะใช้ไม่ได้ทันที

2. เพิ่มในไฟล์ `.env` บน VPS (`/home/deploy/loei-banrakrod/.env` — ไฟล์เดียวกับที่
   `docker-compose.yml` อ่านตอน deploy):
   ```
   WEB_PUSH_VAPID_PUBLIC_KEY=<public key>
   WEB_PUSH_VAPID_PRIVATE_KEY=<private key>
   WEB_PUSH_VAPID_SUBJECT=mailto:<อีเมลจริงของร้าน>
   ```

3. เพิ่ม GitHub Actions secret ชื่อ `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = public key
   ค่าเดียวกับข้อ 2 (Settings → Secrets and variables → Actions ของ repo) —
   ค่านี้ถูกฝังเข้า frontend ตอน build (เหมือน `NEXT_PUBLIC_API_URL`) ไม่ใช่อ่านตอน
   runtime ดังนั้นถ้าลืมเพิ่ม secret นี้ build จะ "สำเร็จ" แต่ปุ่มเปิดการแจ้งเตือน
   จะใช้งานไม่ได้เงียบๆ จนกว่าจะ build ใหม่

4. Redeploy (push commit ใหม่ หรือ re-run workflow ใน GitHub Actions) เพื่อให้
   frontend build ใหม่โดยมี key ฝังเข้าไป และ backend container ต้อง restart
   เพื่ออ่าน env ใหม่ (`docker compose up -d backend` บน VPS หรือรอรอบ deploy ถัดไป)

### วิธี verify ว่า push ทำงานจริง

- เข้าแชทในฐานะลูกค้า ส่งข้อความ 1 ครั้ง → จะเห็นแถบ "เปิดการแจ้งเตือน" โผล่มา
  กดแล้วต้อง prompt ขอ permission จริงจากเบราว์เซอร์ได้ (ถ้าไม่มี prompt ขึ้นเลย
  แปลว่า public key ยังไม่ถูกฝังเข้า build — เช็ค GitHub secret + redeploy)
- Grant permission แล้วปิดแท็บ/เบราว์เซอร์ของลูกค้าทั้งหมด (หรือ log out) แล้วให้
  staff ตอบข้อความในนั้น → รอ 5-10 วินาที ควรมี system notification เด้งขึ้น

## Step 3 — หลัง push code ขึ้น main แล้ว

1. ใช้ `deploy-check` skill เช็ค GitHub Actions run + container health ตามปกติ
2. ~~ทำ Step 1~~ — เสร็จแล้ว ไม่ต้องทำอะไรเพิ่มฝั่ง NPM
3. ทดสอบแชทจริงบนเว็บ (สองเบราว์เซอร์/สอง account) ว่าข้อความขึ้นแบบ real-time
4. Push notification จะ no-op เงียบๆ (ไม่ error) จนกว่าจะทำ Step 2 ครบ

## หมายเหตุ

- ไฟล์นี้ตั้งใจให้ไม่มี credential จริงอยู่ในนี้เลย — login/SSH key ดูที่
  `deploy-secrets.local.md` (ไม่ commit เข้า git) เท่านั้น
- ลบไฟล์นี้ทิ้งได้เมื่อทำ Step 1-2 เสร็จแล้ว หรือจะเก็บไว้เป็น runbook สำหรับ
  รอบ deploy ถัดไปที่ VAPID key ต้อง rotate ก็ได้
