---
name: verify
description: How to launch and drive this app locally for runtime verification (backend API + frontend UI) without Docker and without touching the remote dev MongoDB.
---

# Verifying changes at runtime (Banrakrod)

## Backend against an isolated in-memory MongoDB

`backend/.env` points `MONGODB_URI` at the shared remote dev DB — don't verify against it.
Instead launch the real server on an in-memory MongoDB (already a devDependency, hoisted to root `node_modules`):

```js
// run-backend.js — run with cwd = backend/, `node run-backend.js` in background
const { MongoMemoryServer } = require('D:/@loei-banrakrod/node_modules/mongodb-memory-server');
(async () => {
    const mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri('banrakrod_verify'); // set BEFORE require — dotenv won't override
    process.env.JWT_SECRET = 'verify-secret';
    process.env.FRONTEND_URL = 'http://localhost:8081';
    process.env.PORT = '8080';
    require('D:/@loei-banrakrod/backend/server.js');
})();
```

Wait for `GET /api/status` → `{"status":"Server Running","database":"Connected"}`.

- Bootstrap accounts through the real API: first `POST /api/auth/register` becomes owner (subsequent ones 403); `POST /api/auth/register-customer` for customers.
- **Rate limit gotcha:** 500 req/10min on `/api`. Repeated scripted runs will start returning 429 — kill the node on port 8080 and relaunch (also resets the DB).
- Seeding fixtures directly via mongoose models (connect to the printed memory URI) is fine for data the API can't easily create (e.g. bare Orders).

## Frontend

`frontend/.env.local` already points at `http://localhost:8080/api`. `cd frontend && npm run dev` (port 8081).

## Driving the UI with Playwright

No Playwright in the repo; install `playwright@1.61.x` into a scratch dir (browsers are already cached in `%LOCALAPPDATA%\ms-playwright`, chromium-1228).

Gotchas learned the hard way:

- **Pre-warm routes** (`goto` each page once) before the real flow — Next dev compiles on first hit and the Fast Refresh reload resets React state (open dialogs close, conditional fields disappear).
- **Don't hard-`goto` `/profile` (customer side)** — the page redirects to `/customer-login` when `customer` is null and it does NOT wait for zustand hydration, so a full reload races and often bounces. Navigate client-side instead: click the header avatar dropdown (`button:has-text("สมาชิก")`) then `getByRole('menuitem', { name: 'โปรไฟล์' })`. Admin layout DOES wait for `isHydrated`, so `goto('/admin/profile')` is safe.
- Framer-motion entrance animations make elements "not stable" — wait ~2s after load or click with `{ force: true }`.
- Login pages have no input ids; use `input[type="email"]` / `input[type="password"]` / `button[type="submit"]`.
- Error toasts are sonner: `waitForSelector('text=<thai message>')` works.
- **The axios interceptor (`lib/api.ts`) force-logs-out and redirects on ANY 401/403 response** — backend errors the user is meant to see must use 400.
