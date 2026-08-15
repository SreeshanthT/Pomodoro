# PomodoroTodo

A desktop Pomodoro timer and to-do list, built with Electron, React, and TypeScript. Tasks and focus sessions live in a local SQLite database — no account, no cloud, no tracking.

[![CI](https://github.com/SreeshanthT/Pomodoro/actions/workflows/ci.yml/badge.svg)](https://github.com/SreeshanthT/Pomodoro/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/SreeshanthT/Pomodoro)](https://github.com/SreeshanthT/Pomodoro/releases/latest)
[![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-blue)](https://github.com/SreeshanthT/Pomodoro/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Features

**Timer**
- Classic Pomodoro flow — work sessions, short breaks, and long breaks with a configurable cadence.
- Switch between countdown (work toward a set duration) and count-up (run until you stop) modes.
- Timestamp-based engine that runs in the main process, so the clock stays accurate even when a window is minimized, hidden, or the OS throttles background timers.
- Link a session to a task so completed pomodoros roll up onto that task automatically.
- Ambient sounds (rain, white noise, ticking clock) and a choice of completion chimes, each with independent volume control.
- Custom dial backgrounds, including an animated ambient background.
- A frameless, always-on-top **mini widget** for glanceable progress while you work in other apps, plus a dedicated **focus window** for a distraction-free full view. Opening one automatically closes the other.

**Tasks**
- Today / Tomorrow / This Week / Planned views, bucketed automatically from each task's due date — overdue tasks surface under Today so nothing gets lost.
- Subtasks, priority flagging, manual reordering, and projects (with color labels) to group related work.
- Daily and weekly recurring tasks — completing one auto-creates the next occurrence.
- Bulk actions for multi-select edits, quick-add for fast capture, and a focus-time stats bar backed by logged sessions.

**Data**
- Everything is stored locally in SQLite — nothing leaves your machine.
- One-click backup/export and restore/import of the database file, from Settings.

## Screenshots

_Coming soon — contributions welcome! See [Contributing](#contributing) if you'd like to add screenshots or a GIF of the app in action._

## Installation

Download the latest build for your platform from the [Releases page](https://github.com/SreeshanthT/Pomodoro/releases/latest):

- **Windows** — `PomodoroTodo-<version>-setup.exe` (NSIS installer)
- **macOS** — `.dmg`

Linux builds (AppImage) can be produced from source — see [Building](#building) below.

## Development

Requires Node.js 22+.

```bash
npm install
npm run dev
```

`npm run dev` starts [electron-vite](https://electron-vite.org/) in watch mode with hot reload for the renderer.

### Useful scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Run the app in development mode with hot reload |
| `npm run typecheck` | Type-check both the main and renderer projects |
| `npm test` | Run the unit test suite (Vitest) |
| `npm run build` | Build the renderer and main process for production |
| `npm start` | Preview a production build |

## Building

```bash
npm run build:win     # Windows (NSIS)
npm run build:mac     # macOS (DMG)
npm run build:unpack  # Unpacked build for the current platform, no installer
```

Releases are built and published automatically by [GitHub Actions](.github/workflows/release.yml) when a `v*.*.*` tag is pushed.

## Tech stack

- [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/) + [electron-builder](https://www.electron.build/)
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Zustand](https://github.com/pmndrs/zustand) for renderer state
- SQLite for local persistence
- [Vitest](https://vitest.dev/) for unit tests

## Project structure

```
src/
├── main/          # Electron main process: windows, timer engine, SQLite, IPC handlers
├── preload/       # Context-bridge API exposed to the renderer
├── renderer/      # React UI — timer, todo list, settings, mini widget, focus window
└── shared/        # Types shared between main and renderer
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, the checks to run before opening a PR, and an overview of the codebase layout.

## License

[MIT](LICENSE) © Sreeshanth T
