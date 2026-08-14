import { ipcMain } from 'electron'
import { timerEngine } from '../timerEngine'
import { broadcast } from '../windowManager'

export function registerTimerHandlers(): void {
  timerEngine.onTick((state) => broadcast('timer:tick', state))
  timerEngine.onSessionComplete((event) => broadcast('timer:sessionComplete', event))

  ipcMain.handle('timer:getState', () => timerEngine.getState())
  ipcMain.handle('timer:start', (_event, taskId: string | null) => timerEngine.start(taskId))
  ipcMain.handle('timer:pause', () => timerEngine.pause())
  ipcMain.handle('timer:resume', () => timerEngine.resume())
  ipcMain.handle('timer:skip', () => timerEngine.skip())
  ipcMain.handle('timer:reset', () => timerEngine.reset())
}
