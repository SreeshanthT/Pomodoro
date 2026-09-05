import { app, BrowserWindow, crashReporter, dialog } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './windowManager'
import { initDb } from './db'
import { timerEngine } from './timerEngine'
import { initLogger, log } from './logger'
import { registerTaskHandlers } from './ipc/taskHandlers'
import { registerSettingsHandlers } from './ipc/settingsHandlers'
import { registerTimerHandlers } from './ipc/timerHandlers'
import { registerSessionHandlers } from './ipc/sessionHandlers'
import { registerWindowHandlers } from './ipc/windowHandlers'
import { registerProjectHandlers } from './ipc/projectHandlers'
import { registerBackupHandlers } from './ipc/backupHandlers'

// As early as possible, before anything else can fail: persisted logging (so field failures are
// diagnosable after the fact, not just visible in a terminal that's rarely attached in
// production) plus local-only native crash dumps (no upload server - just written to disk).
initLogger()
crashReporter.start({ uploadToServer: false })

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.ekagram.app')

  app.on('browser-window-created', (_event, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    await initDb()
    timerEngine.init()

    registerTaskHandlers()
    registerSettingsHandlers()
    registerSessionHandlers()
    registerTimerHandlers()
    registerWindowHandlers()
    registerProjectHandlers()
    registerBackupHandlers()

    createMainWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  } catch (error) {
    log.error('Ekagram failed to start:', error)
    dialog.showErrorBox('Ekagram failed to start', error instanceof Error ? error.message : String(error))
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
