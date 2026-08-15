import { app, dialog, ipcMain } from 'electron'
import { copyFileSync, existsSync } from 'fs'
import { backupDatabaseTo, closeDb, getActiveDbPath } from '../db'
import type { BackupResult } from '@shared/types'

export function registerBackupHandlers(): void {
  ipcMain.handle('backup:export', async (): Promise<BackupResult> => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Backup Pomodoro Todo data',
      defaultPath: `pomodoro-todo-backup-${new Date().toISOString().slice(0, 10)}.sqlite`,
      filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }]
    })
    if (canceled || !filePath) return { success: false }

    backupDatabaseTo(filePath)
    return { success: true, path: filePath }
  })

  ipcMain.handle('backup:import', async (): Promise<BackupResult> => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Restore Pomodoro Todo data',
      filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return { success: false }

    const source = filePaths[0]
    if (!existsSync(source)) return { success: false }

    // Replacing the live db file requires the current connection closed first; relaunching
    // afterward guarantees every window/process starts clean against the restored data
    // instead of trying to reconcile already-loaded renderer state with it.
    closeDb()
    copyFileSync(source, getActiveDbPath())
    app.relaunch()
    app.exit()
    return { success: true }
  })
}
