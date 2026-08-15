import { ipcMain } from 'electron'
import { createProject, deleteProject, getProjects } from '../db'
import type { NewProject } from '@shared/types'

export function registerProjectHandlers(): void {
  ipcMain.handle('projects:getAll', () => getProjects())
  ipcMain.handle('projects:create', (_event, input: NewProject) => createProject(input))
  ipcMain.handle('projects:delete', (_event, id: string) => deleteProject(id))
}
