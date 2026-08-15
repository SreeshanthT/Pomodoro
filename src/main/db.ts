import { app } from 'electron'
import { join } from 'path'
import { JSONFilePreset } from 'lowdb/node'
import type { Low } from 'lowdb'
import { randomUUID } from 'crypto'
import type { FocusSession, NewProject, NewTask, Project, Settings, Task, TaskUpdate } from '@shared/types'
import { DEFAULT_SETTINGS } from '@shared/types'

interface DbSchema {
  tasks: Task[]
  settings: Settings
  sessions: FocusSession[]
  projects: Project[]
}

const defaultData: DbSchema = { tasks: [], settings: DEFAULT_SETTINGS, sessions: [], projects: [] }

let db: Low<DbSchema>

export async function initDb(): Promise<void> {
  const file = join(app.getPath('userData'), 'db.json')
  db = await JSONFilePreset<DbSchema>(file, defaultData)
  // merge in any settings keys added since a user's db.json was created
  db.data.settings = { ...DEFAULT_SETTINGS, ...db.data.settings }
  if (!db.data.sessions) db.data.sessions = []
  if (!db.data.projects) db.data.projects = []
  // backfill fields added to Task after some users' db.json was created
  for (const task of db.data.tasks) {
    if (task.priority === undefined) task.priority = false
    if (task.subtasks === undefined) task.subtasks = []
    if (task.recurrence === undefined) task.recurrence = null
    if (task.projectId === undefined) task.projectId = null
    if (task.order === undefined) task.order = new Date(task.createdAt).getTime()
  }
  await db.write()
}

export function getTasks(): Task[] {
  return db.data.tasks
}

export async function createTask(input: NewTask): Promise<Task> {
  const now = new Date().toISOString()
  const task: Task = {
    id: randomUUID(),
    title: input.title,
    notes: input.notes,
    dueDate: input.dueDate,
    completed: false,
    createdAt: now,
    completedAt: null,
    estimatedPomodoros: input.estimatedPomodoros ?? 1,
    completedPomodoros: 0,
    priority: input.priority ?? false,
    subtasks: input.subtasks ?? [],
    recurrence: input.recurrence ?? null,
    projectId: input.projectId ?? null,
    order: Date.now()
  }
  db.data.tasks.push(task)
  await db.write()
  return task
}

export async function updateTask(id: string, updates: TaskUpdate): Promise<Task | null> {
  const task = db.data.tasks.find((t) => t.id === id)
  if (!task) return null
  Object.assign(task, updates)
  await db.write()
  return task
}

export async function deleteTask(id: string): Promise<void> {
  db.data.tasks = db.data.tasks.filter((t) => t.id !== id)
  await db.write()
}

export async function incrementCompletedPomodoro(id: string): Promise<Task | null> {
  const task = db.data.tasks.find((t) => t.id === id)
  if (!task) return null
  task.completedPomodoros += 1
  await db.write()
  return task
}

export function getSettings(): Settings {
  return db.data.settings
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  db.data.settings = settings
  await db.write()
  return db.data.settings
}

export function getSessions(): FocusSession[] {
  return db.data.sessions
}

export async function addFocusSession(input: Omit<FocusSession, 'id'>): Promise<FocusSession> {
  const session: FocusSession = { id: randomUUID(), ...input }
  db.data.sessions.push(session)
  await db.write()
  return session
}

export function getProjects(): Project[] {
  return db.data.projects
}

export async function createProject(input: NewProject): Promise<Project> {
  const project: Project = { id: randomUUID(), name: input.name, color: input.color, createdAt: new Date().toISOString() }
  db.data.projects.push(project)
  await db.write()
  return project
}

export async function deleteProject(id: string): Promise<void> {
  db.data.projects = db.data.projects.filter((p) => p.id !== id)
  for (const task of db.data.tasks) {
    if (task.projectId === id) task.projectId = null
  }
  await db.write()
}
