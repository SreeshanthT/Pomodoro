export interface Task {
  id: string
  title: string
  notes?: string
  /** ISO date, "YYYY-MM-DD" — drives Today/Tomorrow/Upcoming bucketing */
  dueDate: string
  completed: boolean
  createdAt: string
  completedAt: string | null
  estimatedPomodoros: number
  completedPomodoros: number
}

export type NewTask = Pick<Task, 'title' | 'dueDate'> & Partial<Pick<Task, 'notes' | 'estimatedPomodoros'>>

export type TaskUpdate = Partial<Omit<Task, 'id' | 'createdAt'>>

export type TaskGroup = 'today' | 'tomorrow' | 'upcoming'

export type SessionPhase = 'work' | 'shortBreak' | 'longBreak'

export type TimerStatus = 'idle' | 'running' | 'paused'

export interface TimerState {
  status: TimerStatus
  phase: SessionPhase
  /** seconds remaining in the current phase */
  remainingSeconds: number
  /** total seconds for the current phase, for progress calculation */
  durationSeconds: number
  /** how many work sessions completed since the last long break */
  sessionsCompleted: number
  linkedTaskId: string | null
}

export type SoundChoice = 'none' | 'tick' | 'rain' | 'white-noise'
export type ChimeChoice = 'bell' | 'digital' | 'soft-bell'
export type TimerStyle = 'ring' | 'dial' | 'flip'
export type DialBackground = 'forest' | 'dusk' | 'ocean' | 'midnight'

export interface Settings {
  workDurationMin: number
  shortBreakDurationMin: number
  longBreakDurationMin: number
  sessionsBeforeLongBreak: number
  ambientSound: SoundChoice
  chimeSound: ChimeChoice
  ambientVolume: number
  chimeVolume: number
  timerStyle: TimerStyle
  dialBackground: DialBackground
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
  timerStyle: 'ring',
  dialBackground: 'forest'
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
