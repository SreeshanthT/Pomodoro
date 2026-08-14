import { ipcMain } from 'electron'
import { createTask, deleteTask, getTasks, updateTask } from '../db'
import type { NewTask, TaskUpdate } from '@shared/types'

export function registerTaskHandlers(): void {
  ipcMain.handle('tasks:getAll', () => getTasks())
  ipcMain.handle('tasks:create', (_event, input: NewTask) => createTask(input))
  ipcMain.handle('tasks:update', (_event, id: string, updates: TaskUpdate) => updateTask(id, updates))
  ipcMain.handle('tasks:delete', (_event, id: string) => deleteTask(id))
}
