import { ipcMain } from 'electron'
import { completeRecurringTask, createTask, deleteTask, getTasks, restoreTask, softDeleteTask, updateTask } from '../db'
import type { NewTask, TaskUpdate } from '@shared/types'

export function registerTaskHandlers(): void {
  ipcMain.handle('tasks:getAll', () => getTasks())
  ipcMain.handle('tasks:create', (_event, input: NewTask) => createTask(input))
  ipcMain.handle('tasks:update', (_event, id: string, updates: TaskUpdate) => updateTask(id, updates))
  ipcMain.handle('tasks:delete', (_event, id: string) => softDeleteTask(id))
  ipcMain.handle('tasks:restore', (_event, id: string) => restoreTask(id))
  ipcMain.handle('tasks:purge', (_event, id: string) => deleteTask(id))
  ipcMain.handle('tasks:completeRecurring', (_event, id: string, completedAt: string, nextOccurrence: NewTask) =>
    completeRecurringTask(id, completedAt, nextOccurrence)
  )
}
