import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { DatabaseSync } from 'node:sqlite'

vi.mock('electron', () => ({
  app: { getPath: vi.fn() }
}))

import { app } from 'electron'
import * as db from './db'

let tempDirs: string[] = []

function useTempUserDataDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'pomodoro-db-test-'))
  tempDirs.push(dir)
  vi.mocked(app.getPath).mockReturnValue(dir)
  return dir
}

beforeEach(async () => {
  useTempUserDataDir()
  await db.initDb()
})

afterEach(() => {
  db.closeDb()
  for (const dir of tempDirs) {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      // Windows can briefly hold a memory-mapped sqlite file open past close() - harmless to
      // leave a scratch temp dir behind; each test gets its own freshly-named one regardless.
    }
  }
  tempDirs = []
})

describe('tasks CRUD', () => {
  it('createTask inserts a row that getTasks returns', async () => {
    const task = await db.createTask({ title: 'Write tests', dueDate: '2026-01-01' })
    expect(task.id).toBeTruthy()
    expect(task.title).toBe('Write tests')
    expect(task.completed).toBe(false)
    expect(task.subtasks).toEqual([])

    const all = db.getTasks()
    expect(all).toHaveLength(1)
    expect(all[0]).toEqual(task)
  })

  it('createTask applies defaults for omitted optional fields', async () => {
    const task = await db.createTask({ title: 'Minimal', dueDate: '2026-01-01' })
    expect(task.estimatedPomodoros).toBe(1)
    expect(task.priority).toBe(false)
    expect(task.recurrence).toBeNull()
    expect(task.projectId).toBeNull()
  })

  it('updateTask patches only the given fields and returns the full updated row', async () => {
    const task = await db.createTask({ title: 'A', dueDate: '2026-01-01' })
    const updated = await db.updateTask(task.id, {
      title: 'B',
      completed: true,
      completedAt: '2026-01-02T00:00:00.000Z'
    })
    expect(updated).toMatchObject({ id: task.id, title: 'B', completed: true, completedAt: '2026-01-02T00:00:00.000Z' })
    // untouched fields survive the patch
    expect(updated?.dueDate).toBe('2026-01-01')
  })

  it('updateTask returns null for a nonexistent id', async () => {
    const result = await db.updateTask('does-not-exist', { title: 'x' })
    expect(result).toBeNull()
  })

  it('updateTask silently ignores unknown/disallowed columns', async () => {
    const task = await db.createTask({ title: 'A', dueDate: '2026-01-01' })
    const updated = await db.updateTask(task.id, {
      // @ts-expect-error deliberately passing a field TaskUpdate doesn't declare
      id: 'attempted-id-overwrite'
    })
    expect(updated?.id).toBe(task.id)
  })

  it('softDeleteTask hides the task from getTasks; restoreTask brings the same row back', async () => {
    const task = await db.createTask({ title: 'A', dueDate: '2026-01-01', estimatedPomodoros: 3 })
    await db.softDeleteTask(task.id)
    expect(db.getTasks()).toHaveLength(0)

    const restored = await db.restoreTask(task.id)
    expect(restored?.id).toBe(task.id)
    expect(restored?.estimatedPomodoros).toBe(3)
    expect(db.getTasks()).toHaveLength(1)
  })

  it('restoreTask returns null for a task that was never soft-deleted or never existed', async () => {
    expect(await db.restoreTask('nope')).toBeNull()
  })

  it('deleteTask (purge) permanently removes the row, restore cannot bring it back', async () => {
    const task = await db.createTask({ title: 'A', dueDate: '2026-01-01' })
    await db.deleteTask(task.id)
    expect(db.getTasks()).toHaveLength(0)
    expect(await db.restoreTask(task.id)).toBeNull()
  })

  it('incrementCompletedPomodoro increments the counter and returns the updated task', async () => {
    const task = await db.createTask({ title: 'A', dueDate: '2026-01-01' })
    const once = await db.incrementCompletedPomodoro(task.id)
    const twice = await db.incrementCompletedPomodoro(task.id)
    expect(once?.completedPomodoros).toBe(1)
    expect(twice?.completedPomodoros).toBe(2)
  })

  it('incrementCompletedPomodoro returns null for a nonexistent task', async () => {
    expect(await db.incrementCompletedPomodoro('nope')).toBeNull()
  })
})

describe('completeRecurringTask', () => {
  it('marks the task completed and spawns the next occurrence as one atomic result', async () => {
    const task = await db.createTask({ title: 'Daily standup', dueDate: '2026-01-01', recurrence: 'daily' })
    const result = await db.completeRecurringTask(task.id, '2026-01-01T09:00:00.000Z', {
      title: 'Daily standup',
      dueDate: '2026-01-02',
      recurrence: 'daily'
    })

    expect(result?.completedTask).toMatchObject({
      id: task.id,
      completed: true,
      completedAt: '2026-01-01T09:00:00.000Z'
    })
    expect(result?.nextTask).toMatchObject({ completed: false, dueDate: '2026-01-02', recurrence: 'daily' })
    expect(result?.nextTask.id).not.toBe(task.id)

    const all = db.getTasks()
    expect(all).toHaveLength(2)
  })

  it('returns null without creating a next occurrence if the task does not exist', async () => {
    const result = await db.completeRecurringTask('nope', '2026-01-01T00:00:00.000Z', {
      title: 'x',
      dueDate: '2026-01-01'
    })
    expect(result).toBeNull()
    expect(db.getTasks()).toHaveLength(0)
  })
})

describe('projects CRUD', () => {
  it('createProject/getProjects round-trip', async () => {
    const project = await db.createProject({ name: 'Work', color: '#3555db' })
    expect(db.getProjects()).toEqual([project])
  })

  it('deleteProject removes it and nulls projectId on any tasks that referenced it', async () => {
    const project = await db.createProject({ name: 'Work', color: '#3555db' })
    const task = await db.createTask({ title: 'A', dueDate: '2026-01-01', projectId: project.id })

    await db.deleteProject(project.id)

    expect(db.getProjects()).toHaveLength(0)
    const [reloaded] = db.getTasks()
    expect(reloaded.id).toBe(task.id)
    expect(reloaded.projectId).toBeNull()
  })
})

describe('settings', () => {
  it('getSettings returns the defaults on a fresh db', () => {
    const settings = db.getSettings()
    expect(settings.workDurationMin).toBe(25)
    expect(settings.countMode).toBe('countdown')
  })

  it('saveSettings persists changes that a later getSettings reflects', async () => {
    const current = db.getSettings()
    await db.saveSettings({ ...current, workDurationMin: 50 })
    expect(db.getSettings().workDurationMin).toBe(50)
  })
})

describe('sessions', () => {
  it('addFocusSession/getSessions round-trip', async () => {
    const session = await db.addFocusSession({
      taskId: null,
      startedAt: '2026-01-01T09:00:00.000Z',
      durationSeconds: 1500
    })
    expect(db.getSessions()).toEqual([session])
  })
})

describe('schema migration', () => {
  it('a brand-new db is stamped at the latest schema version without re-running migrations', async () => {
    // initDb() already ran once in beforeEach against a fresh dir; read user_version directly.
    const raw = new DatabaseSync(join(vi.mocked(app.getPath).mock.results.at(-1)!.value, 'data.sqlite'), {
      readOnly: true
    })
    const { user_version: version } = raw.prepare('PRAGMA user_version').get() as { user_version: number }
    raw.close()
    expect(version).toBeGreaterThan(0)
  })

  it('upgrades an existing pre-migration db (no deleted column, user_version 0) in place', async () => {
    db.closeDb()
    const dir = useTempUserDataDir()
    const dbPath = join(dir, 'data.sqlite')

    const legacy = new DatabaseSync(dbPath)
    legacy.exec(`
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, notes TEXT, dueDate TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, completedAt TEXT,
        estimatedPomodoros INTEGER NOT NULL DEFAULT 1, completedPomodoros INTEGER NOT NULL DEFAULT 0,
        priority INTEGER NOT NULL DEFAULT 0, subtasks TEXT NOT NULL DEFAULT '[]',
        recurrence TEXT, projectId TEXT, "order" INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL, createdAt TEXT NOT NULL);
      CREATE TABLE sessions (id TEXT PRIMARY KEY, taskId TEXT, startedAt TEXT NOT NULL, durationSeconds INTEGER NOT NULL);
      CREATE TABLE kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `)
    legacy
      .prepare(
        `INSERT INTO tasks (id, title, notes, dueDate, completed, createdAt, completedAt, estimatedPomodoros, completedPomodoros, priority, subtasks, recurrence, projectId, "order")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        'legacy-1',
        'Pre-existing task',
        null,
        '2026-01-01',
        0,
        '2026-01-01T00:00:00.000Z',
        null,
        1,
        0,
        0,
        '[]',
        null,
        null,
        0
      )
    legacy.close()

    await db.initDb()

    const tasks = db.getTasks()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].id).toBe('legacy-1')

    const raw = new DatabaseSync(dbPath, { readOnly: true })
    const columns = (raw.prepare('PRAGMA table_info(tasks)').all() as { name: string }[]).map((c) => c.name)
    const { user_version: version } = raw.prepare('PRAGMA user_version').get() as { user_version: number }
    raw.close()
    expect(columns).toContain('deleted')
    expect(version).toBeGreaterThan(0)
  })

  it('purges any row left mid soft-delete by a previous run (undo window can not survive a restart)', async () => {
    const task = await db.createTask({ title: 'A', dueDate: '2026-01-01' })
    await db.softDeleteTask(task.id)

    // Simulate an app restart against the same db file: re-run initDb without wiping the directory.
    await db.initDb()

    const raw = new DatabaseSync(join(vi.mocked(app.getPath).mock.results.at(-1)!.value, 'data.sqlite'), {
      readOnly: true
    })
    const remaining = raw.prepare('SELECT COUNT(*) as c FROM tasks').get() as { c: number }
    raw.close()
    expect(remaining.c).toBe(0)
  })
})

describe('backup validation', () => {
  it('isValidBackupFile accepts a real Pomodoro Todo database', async () => {
    const dir = vi.mocked(app.getPath).mock.results.at(-1)!.value
    expect(db.isValidBackupFile(join(dir, 'data.sqlite'))).toBe(true)
  })

  it('isValidBackupFile rejects a file missing the expected tables', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pomodoro-db-test-'))
    tempDirs.push(dir)
    const garbagePath = join(dir, 'not-a-backup.sqlite')
    const garbage = new DatabaseSync(garbagePath)
    garbage.exec('CREATE TABLE unrelated (id TEXT)')
    garbage.close()

    expect(db.isValidBackupFile(garbagePath)).toBe(false)
  })

  it('isValidBackupFile rejects a path that is not a sqlite database at all', () => {
    expect(db.isValidBackupFile(join(tmpdir(), 'definitely-does-not-exist.sqlite'))).toBe(false)
  })

  it('backupDatabaseTo writes a snapshot that is itself a valid backup file', async () => {
    await db.createTask({ title: 'A', dueDate: '2026-01-01' })
    const dir = mkdtempSync(join(tmpdir(), 'pomodoro-db-test-'))
    tempDirs.push(dir)
    const snapshotPath = join(dir, 'snapshot.sqlite')

    db.backupDatabaseTo(snapshotPath)

    expect(existsSync(snapshotPath)).toBe(true)
    expect(db.isValidBackupFile(snapshotPath)).toBe(true)
  })
})
