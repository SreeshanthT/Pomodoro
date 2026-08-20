export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export type RecurrenceRule = 'daily' | 'weekly'

export interface Task {
  id: string
  title: string
  notes?: string
  /** ISO date, "YYYY-MM-DD" — drives Today/Tomorrow/This Week/Planned bucketing */
  dueDate: string
  completed: boolean
  createdAt: string
  completedAt: string | null
  estimatedPomodoros: number
  completedPomodoros: number
  priority: boolean
  subtasks: Subtask[]
  /** null = one-off. On completion, the next occurrence is auto-created and this instance stays completed. */
  recurrence: RecurrenceRule | null
  projectId: string | null
  /** manual sort position within whatever list it's shown in; lower sorts first */
  order: number
}

export type NewTask = Pick<Task, 'title' | 'dueDate'> &
  Partial<Pick<Task, 'notes' | 'estimatedPomodoros' | 'priority' | 'recurrence' | 'projectId' | 'subtasks'>>

export type TaskUpdate = Partial<Omit<Task, 'id' | 'createdAt'>>

export type TaskGroup = 'today' | 'tomorrow' | 'thisWeek' | 'planned' | 'completed' | 'all'

export interface Project {
  id: string
  name: string
  color: string
  createdAt: string
}

export type NewProject = Pick<Project, 'name' | 'color'>

export type SessionPhase = 'work' | 'shortBreak' | 'longBreak'

export type TimerStatus = 'idle' | 'running' | 'paused'

/** countdown: counts down to 00:00 then advances the phase. countup: counts up from 00:00 until stopped manually. */
export type TimerCountMode = 'countdown' | 'countup'

export interface TimerState {
  status: TimerStatus
  phase: SessionPhase
  mode: TimerCountMode
  /** the number on the clock: seconds remaining (countdown) or seconds elapsed (countup) */
  displaySeconds: number
  /** total seconds for the current phase; 0 in countup mode, where there's no fixed target */
  durationSeconds: number
  /** how many work sessions completed since the last long break */
  sessionsCompleted: number
  linkedTaskId: string | null
}

export type SoundChoice = 'none' | 'tick' | 'rain' | 'white-noise'
export type ChimeChoice = 'bell' | 'digital' | 'soft-bell'
export type DialBackground = 'forest' | 'dusk' | 'ocean' | 'midnight' | 'blueGalaxy' | 'ambient'

export interface Settings {
  workDurationMin: number
  shortBreakDurationMin: number
  longBreakDurationMin: number
  sessionsBeforeLongBreak: number
  ambientSound: SoundChoice
  chimeSound: ChimeChoice
  ambientVolume: number
  chimeVolume: number
  dialBackground: DialBackground
  countMode: TimerCountMode
}

export const DEFAULT_SETTINGS: Settings = {
  workDurationMin: 25,
  shortBreakDurationMin: 5,
  longBreakDurationMin: 15,
  sessionsBeforeLongBreak: 4,
  ambientSound: 'none',
  chimeSound: 'bell',
  ambientVolume: 0.5,
  chimeVolume: 0.6,
  dialBackground: 'blueGalaxy',
  countMode: 'countdown'
}

/** Emitted by the main-process timer engine when a phase completes and the next one starts. */
export interface SessionCompleteEvent {
  completedPhase: SessionPhase
  nextPhase: SessionPhase
  linkedTaskId: string | null
}

/** A logged record of one completed work (focus) session, for daily focus-time stats. */
export interface FocusSession {
  id: string
  taskId: string | null
  startedAt: string
  durationSeconds: number
}

export interface BackupResult {
  success: boolean
  path?: string
  error?: string
}
