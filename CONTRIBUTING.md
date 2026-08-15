# Contributing to PomodoroTodo

Thanks for your interest in improving PomodoroTodo! This is an Electron + React + TypeScript desktop app.

## Getting set up

```bash
npm install
npm run dev
```

`npm run dev` starts electron-vite in watch mode and launches the app with hot reload.

## Before opening a PR

Run the same checks CI runs:

```bash
npm run typecheck
npm test
npm run build
```

## Project layout

- `src/main` — Electron main process: windows, the timer engine, SQLite persistence, IPC handlers.
- `src/preload` — the context-bridge API exposed to the renderer.
- `src/renderer` — the React UI (timer, todo list, settings, mini widget, focus window).
- `src/shared` — types shared between main and renderer.

## Guidelines

- Keep PRs focused — one feature or fix per PR is easier to review than a bundle of unrelated changes.
- Match the existing code style (the codebase has no linter configured yet, so follow the conventions already in the file you're editing).
- Add or update tests under `src/renderer/src/utils` (or wherever you're changing pure logic) when you change behavior.
- Use the PR template's test plan checklist to describe how you verified your change.

## Reporting bugs / requesting features

Open an issue using the appropriate template — it'll prompt you for the details that make triage faster.
