# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`wellness-tracker` is a Vite + React 19 + TypeScript single-page app — the frontend for the `wellness-backend` FastAPI service (sibling repo). It's an installable **PWA** (via `vite-plugin-pwa`, `autoUpdate`) deployed on **Vercel**. Mobile-first personal wellness tracker with a bottom tab bar.

## Commands

```bash
npm run dev      # Vite dev server with HMR (PWA service worker is enabled in dev too)
npm run build    # tsc -b (type-check both project refs) then vite build to dist/
npm run lint     # ESLint (flat config) over the repo
npm run preview  # serve the built dist/ locally
```

No test runner is configured. `npm run build` runs `tsc -b`, so a type error in either `tsconfig.app.json` (src) or `tsconfig.node.json` (Vite config) fails the build.

## Backend connection

The app calls the FastAPI backend through a single axios instance in [src/services/api.ts](src/services/api.ts), whose `baseURL` is `import.meta.env.VITE_API_URL`:

- `.env.local` → `http://127.0.0.1:8000` (local backend)
- `.env.production` → `https://wellness-backend-i1hv.onrender.com` (Render)

Per-feature service modules (`skincareApi.ts`, `skincareHistoryApi.ts`, `skincareStatsApi.ts`, `reminderSettingsApi.ts`) wrap the endpoints and export the request/response **TypeScript interfaces**. These interfaces use the backend's **`snake_case`** field names (`face_wash`, `morning_time`, …). Components hold state in **`camelCase`** and map to/from snake_case at the API boundary (see `Skincare.tsx`). Keep the two spellings in sync when adding fields, and mirror the backend's route prefixes (`/api/v1/skincare`, `/api/v1/settings/reminders`).

## Architecture

- **Bootstrap:** `index.html` → [src/main.tsx](src/main.tsx) wraps `<App />` in `<BrowserRouter>` inside `<StrictMode>`.
- **Routing:** [src/App.tsx](src/App.tsx) renders a persistent `<Header />` and `<BottomNavigation />` around a `<Routes>` block. Seven routes: `/` (Dashboard), `/food`, `/skincare`, `/weight`, `/water`, `/history`, `/settings`. Adding a page = create it in `src/pages/`, add a `<Route>` here, and add a `<NavLink>` in [src/components/BottomNavigation.tsx](src/components/BottomNavigation.tsx).
- **Layers:** `pages/` = route screens (own their data fetching via `useEffect` + service calls and local `useState`); `services/` = axios API wrappers + types; `components/` = shared/presentational (e.g. `skincare/RoutineItem`, `RoutineSection`, `ProgressBar`); `utils/` = misc (e.g. `notifications.ts`, a browser-`Notification` test trigger).
- **SPA on Vercel:** [vercel.json](vercel.json) rewrites all paths to `/index.html` so client-side routes deep-link correctly.
- **Static assets:** `public/` files (`favicon.svg`, `icons.svg`) are served from root (`/favicon.svg`); `src/assets/` files are imported and bundler-hashed.

## Feature status (not all pages are built)

Only some screens are real; treat the rest as stubs when planning work:

- **Fully wired to the backend:** `Skincare.tsx` (loads/saves today's routine; persists on every checkbox toggle), `Settings.tsx` (reminder times + notifications toggle), and `History.tsx` (loads `/history` via `skincareHistoryApi.ts`, renders per-day completion cards with progress bars).
- **Stubs — return a bare heading:** `Food.tsx`, `Water.tsx`, `Weight.tsx`.
- **Available but not yet consumed by a page:** `skincareStatsApi.ts` (`getStats` → `/api/v1/skincare/stats`, returning `current_streak`/`best_streak`/`total_days`/`average_completion`).
- **Partial:** `Dashboard.tsx` reads a `localStorage` key `"skincareRoutine"` to show skincare progress, but `Skincare.tsx` persists to the API (not localStorage), so that key is never written and Dashboard's skincare progress currently always reads 0%. Reconcile this (read from the API) if touching either.

## Notes

- `README.md` is the stock Vite template readme — not project-specific truth.
- ESLint is flat config ([eslint.config.js](eslint.config.js)): JS recommended + `typescript-eslint` recommended + React Hooks + React Refresh. Type-aware lint rules are not enabled.
