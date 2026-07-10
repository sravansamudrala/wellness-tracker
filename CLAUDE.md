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

Both env files also set `VITE_VAPID_PUBLIC_KEY` (the Web Push public key — not secret; used by `pushApi.ts`). `api.ts` has a 60s timeout + one-shot retry on cold-start-shaped failures (Render free tier spins down; see PWA & Push below).

Per-feature service modules (`skincareApi.ts`, `skincareHistoryApi.ts`, `skincareStatsApi.ts`, `reminderSettingsApi.ts`, `pushApi.ts`) wrap the endpoints and export the request/response **TypeScript interfaces**. These interfaces use the backend's **`snake_case`** field names (`face_wash`, `morning_time`, …). Components hold state in **`camelCase`** and map to/from snake_case at the API boundary (see `Skincare.tsx`). Keep the two spellings in sync when adding fields, and mirror the backend's route prefixes (`/api/v1/skincare`, `/api/v1/settings/reminders`).

## Architecture

- **Bootstrap:** `index.html` → [src/main.tsx](src/main.tsx) wraps `<App />` in `<BrowserRouter>` inside `<StrictMode>`.
- **Routing:** [src/App.tsx](src/App.tsx) renders a persistent `<Header />` and `<BottomNavigation />` around a `<Routes>` block. Seven routes: `/` (Dashboard), `/food`, `/skincare`, `/weight`, `/water`, `/history`, `/settings`. Adding a page = create it in `src/pages/`, add a `<Route>` here, and add a `<NavLink>` in [src/components/BottomNavigation.tsx](src/components/BottomNavigation.tsx).
- **Layers:** `pages/` = route screens (own their data fetching via `useEffect` + service calls and local `useState`); `services/` = axios API wrappers + types; `components/` = shared/presentational (e.g. `skincare/RoutineItem`, `RoutineSection`, `ProgressBar`); `utils/` = misc (e.g. `notifications.ts`, a browser-`Notification` test trigger).
- **SPA on Vercel:** [vercel.json](vercel.json) rewrites all paths to `/index.html` so client-side routes deep-link correctly.
- **Static assets:** `public/` files (`favicon.svg`, `icons.svg`) are served from root (`/favicon.svg`); `src/assets/` files are imported and bundler-hashed.

## PWA & Push notifications

Installable PWA via `vite-plugin-pwa` (`registerType: "autoUpdate"`). Two SW-related pieces:

- **Auto-update:** [src/registerPWA.ts](src/registerPWA.ts) (imported in `main.tsx`) self-registers the SW and calls `registration.update()` hourly and on `visibilitychange → visible` — the latter is what makes an installed mobile PWA pick up new deploys (it resumes from a frozen state rather than reloading). A detected update auto-reloads the page.
- **Push handler:** [public/push-sw.js](public/push-sw.js) holds the `push` + `notificationclick` handlers; it's pulled into the generated SW via `workbox.importScripts: ["push-sw.js"]` in [vite.config.ts](vite.config.ts). Don't move it into the precache path — it must stay a served file.

**Push subscription flow:** [pushApi.ts](src/services/pushApi.ts) `subscribeToPush()` requests Notification permission **first** (iOS requires it inside a user gesture — hence it's called from the Settings toggle's `onChange`), then `pushManager.subscribe()` with `VITE_VAPID_PUBLIC_KEY` and POSTs the subscription to `/api/v1/push/subscribe`. The backend cron then delivers reminders (see the backend repo's CLAUDE.md). iOS caveat: push works **only** in the home-screen-installed PWA (16.4+); after a deploy that changes the SW, the phone may need one kill/relaunch (or reinstall) to pick it up. `utils/notifications.ts` is a separate one-off "Test Notification" button (foreground only), unrelated to push.

## Feature status (not all pages are built)

Only some screens are real; treat the rest as stubs when planning work:

- **Fully wired to the backend:** `Skincare.tsx` (loads/saves today's routine; persists on every checkbox toggle; shows stats + streak `message` via `skincareStatsApi.ts`), `Settings.tsx` (reminder times + notifications toggle — enabling it registers a Web Push subscription, see below), `History.tsx` (per-day completion cards), and `Dashboard.tsx` (fetches today's entry via `getToday` and shows real % — previously read a never-written localStorage key).
- **Stubs — return a bare heading:** `Food.tsx`, `Water.tsx`, `Weight.tsx`.
- All backend-fetching pages use a loading/error/retry pattern (retry via a `reloadKey` that re-runs the fetch effect) — added for graceful cold-start handling.

## Notes

- `README.md` is the stock Vite template readme — not project-specific truth.
- ESLint is flat config ([eslint.config.js](eslint.config.js)): JS recommended + `typescript-eslint` recommended + React Hooks + React Refresh. Type-aware lint rules are not enabled.
