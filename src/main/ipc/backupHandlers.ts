import { app, dialog, ipcMain } from 'electron'
import { copyFileSync, existsSync } from 'fs'
import { backupDatabaseTo, closeDb, getActiveDbPath, isValidBackupFile } from '../db'
import type { BackupResult } from '@shared/types'

export function registerBackupHandlers(): void {
  ipcMain.handle('backup:export', async (): Promise<BackupResult> => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Backup Ekagram data',
      defaultPath: `ekagram-backup-${new Date().toISOString().slice(0, 10)}.sqlite`,
      filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }]
    })
    if (canceled || !filePath) return { success: false }

    backupDatabaseTo(filePath)
    return { success: true, path: filePath }
  })

  ipcMain.handle('backup:import', async (): Promise<BackupResult> => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Restore Ekagram data',
      filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return { success: false }

    const source = filePaths[0]
    if (!existsSync(source)) return { success: false, error: 'Selected file no longer exists.' }
    if (!isValidBackupFile(source)) {
      return { success: false, error: 'Selected file is not a valid Ekagram backup.' }
    }

    // Snapshot the current db before touching it, so a restore that turns out to be
    // unwanted (or a later problem discovered with the imported data) still has a
    // recovery path — this must happen before closeDb(), which VACUUM INTO needs open.
    const safetySnapshotPath = `${getActiveDbPath()}.pre-restore-${Date.now()}.bak`
    backupDatabaseTo(safetySnapshotPath)

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
