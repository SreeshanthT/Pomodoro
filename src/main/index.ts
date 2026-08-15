import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './windowManager'
import { initDb } from './db'
import { timerEngine } from './timerEngine'
import { registerTaskHandlers } from './ipc/taskHandlers'
import { registerSettingsHandlers } from './ipc/settingsHandlers'
import { registerTimerHandlers } from './ipc/timerHandlers'
import { registerSessionHandlers } from './ipc/sessionHandlers'
import { registerWindowHandlers } from './ipc/windowHandlers'
import { registerProjectHandlers } from './ipc/projectHandlers'
import { registerBackupHandlers } from './ipc/backupHandlers'

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.pomodorotodo.app')

  app.on('browser-window-created', (_event, window) => {
    optimizer.watchWindowShortcuts(window)
  })

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
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
