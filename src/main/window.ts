import { join } from 'path'
import { BrowserWindow, shell } from 'electron'
import { is } from '@electron-toolkit/utils'

export function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1040,
    height: 680,
    minWidth: 760,
    minHeight: 520,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      // Keep the countdown accurate even when the window is minimized/hidden.
      backgroundThrottling: false
    }
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}
