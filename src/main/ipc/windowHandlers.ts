import { ipcMain } from 'electron'
import { openFocusWindow, openMiniWindow } from '../windowManager'

export function registerWindowHandlers(): void {
  ipcMain.handle('windows:openFocus', () => openFocusWindow())
  ipcMain.handle('windows:openMini', () => openMiniWindow())
}
