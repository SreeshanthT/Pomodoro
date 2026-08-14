import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createWindow } from './window'
import { initDb } from './db'
import { timerEngine } from './timerEngine'
import { registerTaskHandlers } from './ipc/taskHandlers'
import { registerSettingsHandlers } from './ipc/settingsHandlers'
import { registerTimerHandlers } from './ipc/timerHandlers'
import { registerSessionHandlers } from './ipc/sessionHandlers'

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

  const mainWindow = createWindow()
  registerTimerHandlers(mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
