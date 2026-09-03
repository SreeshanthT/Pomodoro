import { join } from 'path'
import { BrowserWindow, shell } from 'electron'
import { is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow | null = null
let focusWindow: BrowserWindow | null = null
let miniWindow: BrowserWindow | null = null

function loadPage(win: BrowserWindow, page: string): void {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/${page}`)
  } else {
    win.loadFile(join(__dirname, `../renderer/${page}`))
  }
}

const basePreferences = {
  preload: join(__dirname, '../preload/index.js'),
  sandbox: false,
  // Already Electron's default, but pinned explicitly: with sandbox deliberately overridden
  // above, leaving these two undeclared would mean the renderer's isolation from Node depends
  // on whatever Electron's default happens to be in a future version, not on anything in code.
  contextIsolation: true,
  nodeIntegration: false,
  // Keep the countdown accurate even when a window is minimized/hidden/unfocused.
  backgroundThrottling: false
}

export function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1040,
    height: 680,
    minWidth: 760,
    minHeight: 520,
    show: false,
    autoHideMenuBar: true,
    webPreferences: basePreferences
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    if (is.dev) mainWindow?.webContents.openDevTools({ mode: 'detach' })
  })
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F12') mainWindow?.webContents.toggleDevTools()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  loadPage(mainWindow, 'index.html')
  return mainWindow
}

export function openFocusWindow(): void {
  // The mini widget represents a "minimized" focus session — maximizing it (from anywhere)
  // should restore that same session's window, not leave the mini widget floating alongside a new one.
  // destroy() (not close()) so this happens immediately, not dependent on the close-event lifecycle.
  if (miniWindow && !miniWindow.isDestroyed()) {
    miniWindow.destroy()
  }
  miniWindow = null

  if (focusWindow && !focusWindow.isDestroyed()) {
    focusWindow.focus()
    return
  }
  focusWindow = new BrowserWindow({
    width: 1000,
    height: 650,
    minWidth: 480,
    minHeight: 380,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: basePreferences
  })

  focusWindow.on('ready-to-show', () => focusWindow?.show())
  focusWindow.on('closed', () => {
    focusWindow = null
  })
  focusWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F12') focusWindow?.webContents.toggleDevTools()
  })

  loadPage(focusWindow, 'focus.html')
}

export function openMiniWindow(): void {
  if (focusWindow && !focusWindow.isDestroyed()) {
    focusWindow.destroy()
  }
  focusWindow = null

  if (miniWindow && !miniWindow.isDestroyed()) {
    miniWindow.focus()
    return
  }
  miniWindow = new BrowserWindow({
    width: 228,
    height: 68,
    show: false,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    fullscreenable: false,
    transparent: true,
    backgroundColor: '#00000000',
    skipTaskbar: true,
    webPreferences: basePreferences
  })

  miniWindow.on('ready-to-show', () => miniWindow?.show())
  miniWindow.on('closed', () => {
    miniWindow = null
  })

  loadPage(miniWindow, 'mini.html')
}

/** Sends an event to every currently open window (main, focus, mini) that's listening. */
export function broadcast(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, payload)
  }
}
