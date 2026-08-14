import { ipcMain } from 'electron'
import { getSessions } from '../db'

export function registerSessionHandlers(): void {
  ipcMain.handle('sessions:getAll', () => getSessions())
}
