import { contextBridge, ipcRenderer } from 'electron'
import type {
  BackupResult,
  FocusSession,
  NewProject,
  NewTask,
  Project,
  SessionCompleteEvent,
  Settings,
  Task,
  TaskUpdate,
  TimerState
} from '@shared/types'

const api = {
  tasks: {
    getAll: (): Promise<Task[]> => ipcRenderer.invoke('tasks:getAll'),
    create: (input: NewTask): Promise<Task> => ipcRenderer.invoke('tasks:create', input),
    update: (id: string, updates: TaskUpdate): Promise<Task | null> =>
      ipcRenderer.invoke('tasks:update', id, updates),
    delete: (id: string): Promise<void> => ipcRenderer.invoke('tasks:delete', id),
    restore: (id: string): Promise<Task | null> => ipcRenderer.invoke('tasks:restore', id),
    purge: (id: string): Promise<void> => ipcRenderer.invoke('tasks:purge', id),
    completeRecurring: (
      id: string,
      completedAt: string,
      nextOccurrence: NewTask
    ): Promise<{ completedTask: Task; nextTask: Task } | null> =>
      ipcRenderer.invoke('tasks:completeRecurring', id, completedAt, nextOccurrence)
  },
  settings: {
    get: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
    save: (settings: Settings): Promise<Settings> => ipcRenderer.invoke('settings:save', settings)
  },
  sessions: {
    getAll: (): Promise<FocusSession[]> => ipcRenderer.invoke('sessions:getAll')
  },
  projects: {
    getAll: (): Promise<Project[]> => ipcRenderer.invoke('projects:getAll'),
    create: (input: NewProject): Promise<Project> => ipcRenderer.invoke('projects:create', input),
    delete: (id: string): Promise<void> => ipcRenderer.invoke('projects:delete', id)
  },
  windows: {
    openFocus: (): Promise<void> => ipcRenderer.invoke('windows:openFocus'),
    openMini: (): Promise<void> => ipcRenderer.invoke('windows:openMini')
  },
  backup: {
    export: (): Promise<BackupResult> => ipcRenderer.invoke('backup:export'),
    import: (): Promise<BackupResult> => ipcRenderer.invoke('backup:import')
  },
  timer: {
    getState: (): Promise<TimerState> => ipcRenderer.invoke('timer:getState'),
    start: (taskId: string | null): Promise<void> => ipcRenderer.invoke('timer:start', taskId),
    pause: (): Promise<void> => ipcRenderer.invoke('timer:pause'),
    resume: (): Promise<void> => ipcRenderer.invoke('timer:resume'),
    skip: (): Promise<void> => ipcRenderer.invoke('timer:skip'),
    reset: (): Promise<void> => ipcRenderer.invoke('timer:reset'),
    onTick: (callback: (state: TimerState) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, state: TimerState): void => callback(state)
      ipcRenderer.on('timer:tick', listener)
      return () => ipcRenderer.removeListener('timer:tick', listener)
    },
    onSessionComplete: (callback: (event: SessionCompleteEvent) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: SessionCompleteEvent): void =>
        callback(payload)
      ipcRenderer.on('timer:sessionComplete', listener)
      return () => ipcRenderer.removeListener('timer:sessionComplete', listener)
    }
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
