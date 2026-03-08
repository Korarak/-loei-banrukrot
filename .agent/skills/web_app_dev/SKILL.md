---
name: Web App Development
description: Specialized skill for building and maintaining the Banrakrod web application (Next.js + Express Monorepo).
---

# Web App Development Skill

This skill provides context and workflows for working on the Banrakrod web application.

## Project Overview
- **Type**: Monorepo
- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, Shadcn/UI, Lucide React, Framer Motion. Located in `/frontend`.
- **Backend**: Express.js, MongoDB (Mongoose), JWT Authentication. Located in `/backend`.
- **Docker**: Docker Compose for orchestration.

## Tech Stack & versions
- **Node.js**: v20+
- **Next.js**: v16.0.6
- **React**: v19.2.0
- **Tailwind CSS**: v4.0.0
- **Mongoose**: v8.9.3

## Key Workflows

### 1. Development
To run the full stack locally:
```powershell
npm run dev
# Starts both frontend (port 8081) and backend (port 8080)
```

To run individually:
- **Frontend**: `cd frontend; npm run dev`
- **Backend**: `cd backend; npm run dev`

### 2. Frontend Development (Next.js)
- **UI Components**: Use `frontend/components/ui` (Shadcn).
- **Icons**: Use `lucide-react`.
- **Styling**: use Tailwind utility classes.
- **Routing**: App Router (`frontend/app`).
- **Data Fetching**: Use `axios` or `fetch` with `NEXT_PUBLIC_API_URL` (client) or `INTERNAL_API_URL` (server).

### 3. Backend Development (Express)
- **Structure**:
    - `models/`: Mongoose schemas.
    - `controllers/`: Logic handlers.
    - `routes/`: API endpoints.
    - `config/`: Database connection etc.
- **Auth**: JWT based. Middleware in `middleware/auth.js`.

### 4. Database
- **ODM**: Mongoose.
- **Connection**: `config/db.js`.
- **Env Var**: `MONGODB_URI` in `backend/.env`.

### 5. Docker
- **Up**: `npm run docker:up` (builds and starts containers).
- **Down**: `npm run docker:down`.
- **Logs**: `npm run docker:logs`.

## Coding Standards
- **General**: Use ES6+ syntax. Async/Await preferred over promises.
- **Frontend**: Functional components with hooks. Strong typing with TypeScript is enabled/preferred if .ts/.tsx files exist (currently project seems mixed or JS, check file extensions). *Correction: Project uses TypeScript in frontend.*
- **Backend**: CommonJS (`require`).
- **Naming**: PascalCase for React components, camelCase for functions/variables.


## High Performance UX/UI Guidelines
- **Images**: MUST use `next/image` with proper sizing and formats (WebP/AVIF).
- **Code Splitting**: Use `next/dynamic` for heavy components (charts, maps, complex modals).
- **Animations**:
    -   Use `framer-motion` efficiently. Avoid animating layout properties (`width`, `height`, `top`, `left`) where possible; prefer `transform` and `opacity`.
    -   Use CSS variables for dynamic values to avoid re-renders.
- **Accessibility (A11y)**:
    -   All interactive elements must have `aria-label` or visible label.
    -   Semantic HTML (`<header>`, `<main>`, `<footer>`, `<article>`) is mandatory.
    -   Ensure sufficient color contrast.

## API Security Best Practices
- **Validation**: Strict `zod` validation for ALL inputs on both Frontend and Backend. Trust nothing.
- **Rate Limiting**: Implement `express-rate-limit` on all public routes (auth, search).
- **Sanitization**: Use `express-mongo-sanitize` to prevent NoSQL injection.
- **Headers**: `helmet` usage is mandatory for secure HTTP headers.
- **Error Handling**:
    -   Return standardized error responses `{ success: false, error: "message" }`.
    -   **NEVER** leak stack traces or internal details in production responses.

## Common Tasks
- **New Feature**:
    1.  Define Model (Backend)
    2.  Create Controller & Route (Backend)
    3.  Create UI Component (Frontend)
    4.  Connect UI to API (Frontend)
- **Debugging**: check `backend/.env` and `frontend/.env.local` for correct ports and URIs.
