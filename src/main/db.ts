import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'crypto'
import type { FocusSession, NewProject, NewTask, Project, Settings, Task, TaskUpdate } from '@shared/types'
import { DEFAULT_SETTINGS } from '@shared/types'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  notes TEXT,
  dueDate TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  completedAt TEXT,
  estimatedPomodoros INTEGER NOT NULL DEFAULT 1,
  completedPomodoros INTEGER NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 0,
  subtasks TEXT NOT NULL DEFAULT '[]',
  recurrence TEXT,
  projectId TEXT,
  "order" INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  taskId TEXT,
  startedAt TEXT NOT NULL,
  durationSeconds INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`

let db: DatabaseSync

interface TaskRow {
  id: string
  title: string
  notes: string | null
  dueDate: string
  completed: number
  createdAt: string
  completedAt: string | null
  estimatedPomodoros: number
  completedPomodoros: number
  priority: number
  subtasks: string
  recurrence: string | null
  projectId: string | null
  order: number
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? undefined,
    dueDate: row.dueDate,
    completed: !!row.completed,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    estimatedPomodoros: row.estimatedPomodoros,
    completedPomodoros: row.completedPomodoros,
    priority: !!row.priority,
    subtasks: JSON.parse(row.subtasks),
    recurrence: row.recurrence as Task['recurrence'],
    projectId: row.projectId,
    order: row.order
  }
}

function getDbPath(): string {
  return join(app.getPath('userData'), 'data.sqlite')
}

/** One-time import from the pre-SQLite lowdb JSON file, if this is a fresh SQLite db and the old file exists. */
function migrateFromLegacyJson(): void {
  const legacyPath = join(app.getPath('userData'), 'db.json')
  if (!existsSync(legacyPath)) return

  try {
    const legacy = JSON.parse(readFileSync(legacyPath, 'utf-8')) as {
      tasks?: Task[]
      settings?: Settings
      sessions?: FocusSession[]
      projects?: Project[]
    }

    const insertTask = db.prepare(
      `INSERT INTO tasks (id, title, notes, dueDate, completed, createdAt, completedAt, estimatedPomodoros, completedPomodoros, priority, subtasks, recurrence, projectId, "order")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    for (const t of legacy.tasks ?? []) {
      insertTask.run(
        t.id,
        t.title,
        t.notes ?? null,
        t.dueDate,
        t.completed ? 1 : 0,
        t.createdAt,
        t.completedAt,
        t.estimatedPomodoros ?? 1,
        t.completedPomodoros ?? 0,
        t.priority ? 1 : 0,
        JSON.stringify(t.subtasks ?? []),
        t.recurrence ?? null,
        t.projectId ?? null,
        t.order ?? Date.now()
      )
    }

    const insertProject = db.prepare('INSERT INTO projects (id, name, color, createdAt) VALUES (?, ?, ?, ?)')
    for (const p of legacy.projects ?? []) insertProject.run(p.id, p.name, p.color, p.createdAt)

    const insertSession = db.prepare('INSERT INTO sessions (id, taskId, startedAt, durationSeconds) VALUES (?, ?, ?, ?)')
    for (const s of legacy.sessions ?? []) insertSession.run(s.id, s.taskId, s.startedAt, s.durationSeconds)

    if (legacy.settings) {
      db.prepare('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)').run('settings', JSON.stringify(legacy.settings))
    }
  } catch (err) {
    console.error('Failed to migrate legacy db.json into SQLite', err)
  }
}

export async function initDb(): Promise<void> {
  const dbPath = getDbPath()
  const isNewDb = !existsSync(dbPath)

  db = new DatabaseSync(dbPath)
  db.exec(SCHEMA)

  if (isNewDb) migrateFromLegacyJson()

  const settingsRow = db.prepare('SELECT value FROM kv WHERE key = ?').get('settings') as { value: string } | undefined
  const saved = settingsRow ? (JSON.parse(settingsRow.value) as Partial<Settings>) : {}
  // rebuilding from DEFAULT_SETTINGS' own keys merges in new fields and drops stale ones no longer part of Settings
  const merged = Object.fromEntries(
    (Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]).map((key) => [key, saved[key] ?? DEFAULT_SETTINGS[key]])
  ) as unknown as Settings
  db.prepare('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)').run('settings', JSON.stringify(merged))
}

export function getTasks(): Task[] {
  const rows = db.prepare('SELECT * FROM tasks').all() as unknown as TaskRow[]
  return rows.map(rowToTask)
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
  db.prepare(
    `INSERT INTO tasks (id, title, notes, dueDate, completed, createdAt, completedAt, estimatedPomodoros, completedPomodoros, priority, subtasks, recurrence, projectId, "order")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    task.id,
    task.title,
    task.notes ?? null,
    task.dueDate,
    task.completed ? 1 : 0,
    task.createdAt,
    task.completedAt,
    task.estimatedPomodoros,
    task.completedPomodoros,
    task.priority ? 1 : 0,
    JSON.stringify(task.subtasks),
    task.recurrence,
    task.projectId,
    task.order
  )
  return task
}

const BOOLEAN_TASK_FIELDS = new Set<keyof TaskUpdate>(['completed', 'priority'])

const ALLOWED_TASK_COLUMNS = new Set<keyof TaskUpdate>([
  'title',
  'notes',
  'dueDate',
  'completed',
  'completedAt',
  'estimatedPomodoros',
  'completedPomodoros',
  'priority',
  'subtasks',
  'recurrence',
  'projectId',
  'order'
])

export async function updateTask(id: string, updates: TaskUpdate): Promise<Task | null> {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as unknown as TaskRow | undefined
  if (!existing) return null

  const sets: string[] = []
  const values: unknown[] = []
  for (const [key, value] of Object.entries(updates) as [keyof TaskUpdate, unknown][]) {
    if (!ALLOWED_TASK_COLUMNS.has(key)) continue
    const column = key === 'order' ? '"order"' : key
    sets.push(`${column} = ?`)
    if (BOOLEAN_TASK_FIELDS.has(key)) values.push(value ? 1 : 0)
    else if (key === 'subtasks') values.push(JSON.stringify(value))
    else values.push(value ?? null)
  }

  if (sets.length > 0) {
    values.push(id)
    db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...(values as (string | number | null)[]))
  }

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as unknown as TaskRow
  return rowToTask(updated)
}

export async function deleteTask(id: string): Promise<void> {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
}

export async function incrementCompletedPomodoro(id: string): Promise<Task | null> {
  db.prepare('UPDATE tasks SET completedPomodoros = completedPomodoros + 1 WHERE id = ?').run(id)
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as unknown as TaskRow | undefined
  return row ? rowToTask(row) : null
}

export function getSettings(): Settings {
  const row = db.prepare('SELECT value FROM kv WHERE key = ?').get('settings') as { value: string }
  return JSON.parse(row.value)
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  db.prepare('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)').run('settings', JSON.stringify(settings))
  return settings
}

export function getSessions(): FocusSession[] {
  return db.prepare('SELECT * FROM sessions').all() as unknown as FocusSession[]
}

export async function addFocusSession(input: Omit<FocusSession, 'id'>): Promise<FocusSession> {
  const session: FocusSession = { id: randomUUID(), ...input }
  db.prepare('INSERT INTO sessions (id, taskId, startedAt, durationSeconds) VALUES (?, ?, ?, ?)').run(
    session.id,
    session.taskId,
    session.startedAt,
    session.durationSeconds
  )
  return session
}

export function getProjects(): Project[] {
  return db.prepare('SELECT * FROM projects').all() as unknown as Project[]
}

export async function createProject(input: NewProject): Promise<Project> {
  const project: Project = { id: randomUUID(), name: input.name, color: input.color, createdAt: new Date().toISOString() }
  db.prepare('INSERT INTO projects (id, name, color, createdAt) VALUES (?, ?, ?, ?)').run(
    project.id,
    project.name,
    project.color,
    project.createdAt
  )
  return project
}

export async function deleteProject(id: string): Promise<void> {
  db.prepare('DELETE FROM projects WHERE id = ?').run(id)
  db.prepare('UPDATE tasks SET projectId = NULL WHERE projectId = ?').run(id)
}

/** Writes a consistent snapshot of the live database to destPath, safe to call while the app is running. */
export function backupDatabaseTo(destPath: string): void {
  const escaped = destPath.replace(/'/g, "''")
  db.exec(`VACUUM INTO '${escaped}'`)
}

const REQUIRED_TABLES = ['tasks', 'projects', 'sessions', 'kv']

/** Opens candidatePath read-only and checks it has the tables this app expects, without touching the live db. */
export function isValidBackupFile(candidatePath: string): boolean {
  let candidate: DatabaseSync | undefined
  try {
    candidate = new DatabaseSync(candidatePath, { readOnly: true })
    const tables = new Set(
      (candidate.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map(
        (row) => row.name
      )
    )
    return REQUIRED_TABLES.every((name) => tables.has(name))
  } catch {
    return false
  } finally {
    candidate?.close()
  }
}

export function getActiveDbPath(): string {
  return getDbPath()
}

export function closeDb(): void {
  db.close()
}
