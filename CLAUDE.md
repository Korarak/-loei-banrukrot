# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

E-commerce + POS (Point of Sale) system for "Banrakrod" — a Thai retail business. This is a Node.js/Express backend + Next.js frontend monorepo with MongoDB.

## Common Commands

### Local Development (without Docker)
```bash
# Run both backend and frontend concurrently
npm run dev

# Run separately
npm run backend    # Express API on port 8080
npm run frontend   # Next.js on port 8081
```

### Docker Development (recommended)
```bash
docker-compose -f docker-compose.dev.yml up        # Start with hot-reload
docker-compose -f docker-compose.dev.yml down       # Stop
docker-compose -f docker-compose.dev.yml logs -f    # Stream logs
```

### Frontend
```bash
cd frontend
npm run dev       # Dev server (port 8081)
npm run build     # Production build
npm run lint      # ESLint
```

### Backend
```bash
cd backend
npm run dev       # nodemon hot-reload
npm start         # Production
npm test          # Run tests
```

### Production Docker
```bash
npm run docker:up    # docker-compose up -d
npm run docker:down  # docker-compose down
./deploy.sh          # Full automated deployment
```

## Architecture

### Monorepo Structure
- `backend/` — Express.js REST API
- `frontend/` — Next.js 16 (App Router) web app
- `docker-compose*.yml` — Three compose files: `dev`, `local`, production (root)

### Backend (`backend/`)
Express app organized as: `controllers/` → `routes/` → `models/` → `middleware/`

**Entry point:** `server.js` — enforces env vars (`MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`) on startup, applies security middleware stack (helmet, cors, rate-limit, mongo-sanitize, hpp), then mounts routes under `/api`.

**Security stack:** Helmet headers → CORS (strict, FRONTEND_URL only) → 500 req/10min rate limit → 10KB body limit → mongo-sanitize → hpp.

**Models** (15 Mongoose collections): User, Customer, CustomerAddress, Store, Product, ProductVariant, ProductImage, Category, Cart, CartItem, Order, OrderDetail, Payment, ShippingMethod, StockMovement, Setting. All exported from `backend/models/index.js`. See `backend/models/README.md` for schema diagrams.

**Validation:** Zod schemas in `models/validationSchemas.js`, express-validator in route middleware.

**Stock management:** All stock changes must go through `backend/utils/stockUtils.js` (`changeStock`, `deductStock`, `addStock`). This ensures every change is logged in `StockMovement`. Movement types: `sale_pos`, `sale_online`, `cancel_online`, `stock_in`, `adjustment`.

### Frontend (`frontend/src/`)
Next.js App Router with three route groups:
- `(admin)/admin/` — Staff/owner dashboard (requires `userToken`)
- `(auth)/` — Staff login/register
- `(customer)/` — Customer-facing storefront (requires `customerToken`)

**API client:** `lib/api.ts` — Axios instance with base URL from `NEXT_PUBLIC_API_URL`. Request interceptor selects token based on URL path prefix (`/admin` → `userToken`, otherwise `customerToken`). Response interceptor redirects on 401/403.

**State management:**
- Zustand (`stores/useAuthStore.ts`) — persisted auth state, two separate auth contexts: staff (`loginUser`/`logoutUser`) and customer (`loginCustomer`/`logoutCustomer`)
- React Query — server/async state for all API data
- React Hook Form + Zod — form validation

**UI stack:** TailwindCSS 4 + Radix UI headless components + Lucide React icons + Framer Motion + Recharts (dashboard charts) + dnd-kit (drag-and-drop).

**Order status flow:** `pending` → `confirmed` → `processing` → `shipped` → `delivered`/`completed`. Cancelled is terminal. Labels/colors defined in `lib/order-status.ts`.

### Authentication System
Two completely separate auth flows sharing the same JWT infrastructure:
- **Staff/Owner:** POST `/api/auth/login` → `userToken` in localStorage → routes under `/(admin)`
- **Customer:** POST `/api/auth/customer/login` → `customerToken` in localStorage → routes under `/(customer)`
- **Google OAuth (customers only):** Handled by `config/passport.js` using `passport-google-oauth20`. Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars (optional — disabled if absent).

JWT payload includes a `type` field (`'user'` or `'customer'`). The `authenticateToken` middleware uses this to populate either `req.user` (staff) or `req.customer`. Staff access control uses `requireRole('owner', 'staff', 'admin')`. Combined customer+staff access uses `checkCustomerAccess`.

### Environment Variables
Root `.env` is used by Docker Compose. Backend reads its own `.env`. Frontend reads `.env.local`.

Critical variables:
- `NEXT_PUBLIC_API_URL` — frontend API base URL (e.g., `http://localhost:8080/api`)
- `MONGODB_URI` — full MongoDB connection string with auth
- `JWT_SECRET` — shared secret for all token signing
- `FRONTEND_URL` — backend CORS allowlist (comma-separated for multiple origins)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — optional, enables Google OAuth for customers

### API Structure
All endpoints under `/api`. Route groups: `/auth`, `/products`, `/categories`, `/cart`, `/orders`, `/pos`, `/users`, `/customer`, `/dashboard`, `/reports`, `/upload`, `/shipping-methods`, `/inventory`, `/status`.

See `backend/API_DOCUMENTATION.md` for full endpoint reference.

### Image Uploads
Multer handles file uploads to `backend/public/uploads/`. In Docker production, this directory is bind-mounted to persist images across container restarts.

### Next.js Configuration
`next.config.ts` enables: standalone output (for Docker), React Compiler, Turbopack, webpack polling (for Docker dev with `WATCHPACK_POLLING=true`). Remote image domains configured for `localhost` and `loeitech.org`.
