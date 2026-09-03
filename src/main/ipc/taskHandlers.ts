import { ipcMain } from 'electron'
import { completeRecurringTask, createTask, deleteTask, getTasks, restoreTask, softDeleteTask, updateTask } from '../db'
import { taskSchemas } from './validation'

export function registerTaskHandlers(): void {
  ipcMain.handle('tasks:getAll', () => getTasks())
  ipcMain.handle('tasks:create', (_event, input: unknown) => createTask(taskSchemas.newTask.parse(input)))
  ipcMain.handle('tasks:update', (_event, id: unknown, updates: unknown) =>
    updateTask(taskSchemas.id.parse(id), taskSchemas.taskUpdate.parse(updates))
  )
  ipcMain.handle('tasks:delete', (_event, id: unknown) => softDeleteTask(taskSchemas.id.parse(id)))
  ipcMain.handle('tasks:restore', (_event, id: unknown) => restoreTask(taskSchemas.id.parse(id)))
  ipcMain.handle('tasks:purge', (_event, id: unknown) => deleteTask(taskSchemas.id.parse(id)))
  ipcMain.handle('tasks:completeRecurring', (_event, id: unknown, completedAt: unknown, nextOccurrence: unknown) => {
    const parsed = taskSchemas.completeRecurring.parse({ id, completedAt, nextOccurrence })
    return completeRecurringTask(parsed.id, parsed.completedAt, parsed.nextOccurrence)
  })
}
