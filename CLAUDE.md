# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

`wellness-tracker` is a Vite + React 19 + TypeScript single-page app. It is currently the **default Vite starter scaffold** — `src/App.tsx` still contains the template landing page (Vite/React logos, a counter button). None of the actual wellness-tracking features have been built yet; expect to create the real UI, state, and domain logic from scratch.

## Commands

```bash
npm run dev      # start Vite dev server with HMR
npm run build    # type-check (tsc -b) then production build to dist/
npm run lint     # ESLint over the repo
npm run preview  # serve the built dist/ locally
```

There is no test runner configured yet. If tests are needed, one must be added (e.g. Vitest, which pairs naturally with Vite).

## Architecture

- **Entry:** `index.html` → `src/main.tsx` mounts `<App />` into `#root` inside React `<StrictMode>`.
- **TypeScript project references:** `tsconfig.json` composes `tsconfig.app.json` (browser/`src`) and `tsconfig.node.json` (Vite config). `npm run build` uses `tsc -b`, so both must type-check.
- **Static assets:** files in `public/` (e.g. `icons.svg`, `favicon.svg`) are served from the site root — reference them as absolute paths like `/icons.svg`. Assets under `src/assets/` are imported into components and hashed by the bundler.
- **ESLint:** flat config (`eslint.config.js`) extending JS recommended, `typescript-eslint` recommended, and the React Hooks + React Refresh plugins. Type-aware lint rules are not enabled.

## Notes

- `README.md` is the stock Vite template readme (setup boilerplate, not project docs) — don't treat it as a source of project-specific truth.
