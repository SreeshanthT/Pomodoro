# Contributing to Ekagram

Thanks for your interest in improving Ekagram! This is an Electron + React + TypeScript desktop app.

## Getting set up

```bash
npm install
npm run dev
```

`npm run dev` starts electron-vite in watch mode and launches the app with hot reload.

## Before opening a PR

Run the same checks CI runs:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

`npm run lint:fix` and `npm run format` will auto-fix most issues.

## Project layout

- `src/main` — Electron main process: windows, the timer engine, SQLite persistence, IPC handlers.
- `src/preload` — the context-bridge API exposed to the renderer.
- `src/renderer` — the React UI (timer, todo list, settings, mini widget, focus window).
- `src/shared` — types shared between main and renderer.

## Guidelines

- Keep PRs focused — one feature or fix per PR is easier to review than a bundle of unrelated changes.
- Match the existing code style — ESLint and Prettier are configured and enforced in CI, and `npm run lint:fix`/`npm run format` will handle most of it for you.
- Add or update tests under `src/renderer/src/utils` (or wherever you're changing pure logic) when you change behavior.
- Use the PR template's test plan checklist to describe how you verified your change.

## Reporting bugs / requesting features

Open an issue using the appropriate template — it'll prompt you for the details that make triage faster.
