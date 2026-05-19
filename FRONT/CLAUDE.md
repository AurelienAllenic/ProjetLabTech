# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start Vite dev server
npm run build        # TypeScript check + production build
npm run lint         # ESLint
npm run test         # run all tests once (Vitest)
npm run test:watch   # Vitest in watch mode
npm run test:coverage # coverage report (v8)
npm run ci           # lint + test + build (used in CI)
```

Run a single test file:
```bash
npx vitest run src/test/unit/UiButton.test.tsx
```

## Environment

Copy `.env.example` to `.env` and set `VITE_API_URL` to the backend URL (default: `http://localhost:3001`). The variable is read at runtime via `import.meta.env.VITE_API_URL`.

## Architecture

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router v7. Animations via GSAP (`ScrollTrigger`). PDF export via `jsPDF` + `html2canvas`.

**Routing** (`src/router.tsx`): All routes share a single `RootLayout` (which only adds `<ScrollToTop>`). The two main user flows are:
1. **PDF upload flow**: `/upload` → POST `${VITE_API_URL}/analyse` with `multipart/form-data` → stores `AnalysisApiResult` in `localStorage` → `/results`
2. **Manual entry flow**: `/manual` (pick tests + patient info) → `/manual/values` (enter values, client-side classification) → `/results` (same localStorage key)

`/results` always reads `localStorage.getItem("analysisResult")` — both flows converge here.

**Types** (`src/types/index.ts`): Central type definitions. `AnalysisApiResult` / `ApiElement` mirror the backend response shape. `MedicalResult` is the UI-facing mapped type. `ManualNavigationState` is passed via React Router location state from `Manual` → `ManualValues`.

**Shared components:**
- `UiButton` — styled button with `bg` (`raspberry` | `raspberryLight` | `white`) and `text` (`white` | `black` | `raspberry`) variant props
- `Card` — clickable card with icon/title/description, used in the upload dropzone
- `TestValueCard` — form card for a single lab test (value, unit, min, max)
- `Header` / `Footer` / `FooterAnalisys` — layout shell

**Hooks:**
- `useScrollAnimations` — GSAP scroll-triggered entrance animations. Elements get `data-animate` (individual) or `data-animate-group` / `data-animate-child` (staggered). Respects `prefers-reduced-motion`. Tests mock `matchMedia` to return `prefers-reduced-motion: reduce` so animated elements render visible.
- `usePageTitle` — sets `document.title`

**Styling:** Tailwind v4 (configured via the Vite plugin, not PostCSS). The `raspberry` color palette is mapped to blue shades in `tailwind.config.js` (the name is semantic, not literal).

**Tests:** Split into `src/test/unit/` (component tests) and `src/test/integration/` (page-level tests with mocked navigation and fetch). `src/test/setup.ts` mocks `matchMedia` globally so GSAP animations don't hide elements under test.

**Deployment:** Vercel. `vercel.json` rewrites all routes to `/` for SPA client-side routing.
