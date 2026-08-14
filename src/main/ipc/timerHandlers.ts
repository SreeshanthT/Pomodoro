import { ipcMain, type BrowserWindow } from 'electron'
import { timerEngine } from '../timerEngine'

export function registerTimerHandlers(win: BrowserWindow): void {
  timerEngine.onTick((state) => {
    if (!win.isDestroyed()) win.webContents.send('timer:tick', state)
  })
  timerEngine.onSessionComplete((event) => {
    if (!win.isDestroyed()) win.webContents.send('timer:sessionComplete', event)
  })

  ipcMain.handle('timer:getState', () => timerEngine.getState())
  ipcMain.handle('timer:start', (_event, taskId: string | null) => timerEngine.start(taskId))
  ipcMain.handle('timer:pause', () => timerEngine.pause())
  ipcMain.handle('timer:resume', () => timerEngine.resume())
  ipcMain.handle('timer:skip', () => timerEngine.skip())
  ipcMain.handle('timer:reset', () => timerEngine.reset())
}
