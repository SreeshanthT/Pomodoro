import { ipcMain } from 'electron'
import { getSettings, saveSettings } from '../db'
import type { Settings } from '@shared/types'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:save', (_event, settings: Settings) => saveSettings(settings))
}
