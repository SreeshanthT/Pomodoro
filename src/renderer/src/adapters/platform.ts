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

/**
 * The only surface renderer components/hooks are allowed to talk to for
 * platform access. Swapping `electronAdapter` for a future `webAdapter`
 * (same shape, backed by REST calls) is the entire Phase-2 web app port.
 */
export interface PlatformApi {
  tasks: {
    getAll(): Promise<Task[]>
    create(input: NewTask): Promise<Task>
    update(id: string, updates: TaskUpdate): Promise<Task | null>
    delete(id: string): Promise<void>
    completeRecurring(
      id: string,
      completedAt: string,
      nextOccurrence: NewTask
    ): Promise<{ completedTask: Task; nextTask: Task } | null>
  }
  settings: {
    get(): Promise<Settings>
    save(settings: Settings): Promise<Settings>
  }
  sessions: {
    getAll(): Promise<FocusSession[]>
  }
  projects: {
    getAll(): Promise<Project[]>
    create(input: NewProject): Promise<Project>
    delete(id: string): Promise<void>
  }
  windows: {
    openFocus(): Promise<void>
    openMini(): Promise<void>
  }
  backup: {
    export(): Promise<BackupResult>
    import(): Promise<BackupResult>
  }
  timer: {
    getState(): Promise<TimerState>
    start(taskId: string | null): Promise<void>
    pause(): Promise<void>
    resume(): Promise<void>
    skip(): Promise<void>
    reset(): Promise<void>
    onTick(callback: (state: TimerState) => void): () => void
    onSessionComplete(callback: (event: SessionCompleteEvent) => void): () => void
  }
}
