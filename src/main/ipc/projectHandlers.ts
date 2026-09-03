import { ipcMain } from 'electron'
import { createProject, deleteProject, getProjects } from '../db'
import { projectSchemas } from './validation'

export function registerProjectHandlers(): void {
  ipcMain.handle('projects:getAll', () => getProjects())
  ipcMain.handle('projects:create', (_event, input: unknown) => createProject(projectSchemas.newProject.parse(input)))
  ipcMain.handle('projects:delete', (_event, id: unknown) => deleteProject(projectSchemas.id.parse(id)))
}
