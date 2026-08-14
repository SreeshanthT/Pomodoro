import { addFocusSession, getSettings, incrementCompletedPomodoro } from './db'
import type { SessionCompleteEvent, SessionPhase, TimerState, TimerStatus } from '@shared/types'

type TickListener = (state: TimerState) => void
type CompleteListener = (event: SessionCompleteEvent) => void

/**
 * Timestamp-based countdown so remaining time is always derived from wall-clock
 * time rather than decremented by setInterval — avoids drift and survives
 * renderer/main throttling since this runs entirely in the main process.
 */
class TimerEngine {
  private status: TimerStatus = 'idle'
  private phase: SessionPhase = 'work'
  private durationSeconds = 0
  private remainingAtRunStart = 0
  private runStartTimestamp: number | null = null
  private sessionsCompleted = 0
  private linkedTaskId: string | null = null
  private intervalId: ReturnType<typeof setInterval> | null = null
  private workPhaseStartedAt: number | null = null

  private tickListeners = new Set<TickListener>()
  private completeListeners = new Set<CompleteListener>()

  init(): void {
    this.durationSeconds = this.durationForPhase('work')
    this.remainingAtRunStart = this.durationSeconds
  }

  onTick(listener: TickListener): () => void {
    this.tickListeners.add(listener)
    return () => this.tickListeners.delete(listener)
  }

  onSessionComplete(listener: CompleteListener): () => void {
    this.completeListeners.add(listener)
    return () => this.completeListeners.delete(listener)
  }

  getState(): TimerState {
    return {
      status: this.status,
      phase: this.phase,
      remainingSeconds: Math.ceil(this.computeRemaining()),
      durationSeconds: this.durationSeconds,
      sessionsCompleted: this.sessionsCompleted,
      linkedTaskId: this.linkedTaskId
    }
  }

  start(taskId: string | null): void {
    this.linkedTaskId = taskId
    this.phase = 'work'
    this.durationSeconds = this.durationForPhase('work')
    this.remainingAtRunStart = this.durationSeconds
    this.status = 'running'
    this.runStartTimestamp = Date.now()
    this.workPhaseStartedAt = Date.now()
    this.startTicking()
    this.emitTick()
  }

  pause(): void {
    if (this.status !== 'running') return
    this.remainingAtRunStart = this.computeRemaining()
    this.runStartTimestamp = null
    this.status = 'paused'
    this.stopTicking()
    this.emitTick()
  }

  resume(): void {
    if (this.status !== 'paused') return
    this.runStartTimestamp = Date.now()
    this.status = 'running'
    this.startTicking()
    this.emitTick()
  }

  skip(): void {
    if (this.status === 'idle') return
    this.completeCurrentPhase()
  }

  reset(): void {
    this.stopTicking()
    this.status = 'idle'
    this.phase = 'work'
    this.durationSeconds = this.durationForPhase('work')
    this.remainingAtRunStart = this.durationSeconds
    this.runStartTimestamp = null
    this.workPhaseStartedAt = null
    this.emitTick()
  }

  private durationForPhase(phase: SessionPhase): number {
    const settings = getSettings()
    switch (phase) {
      case 'work':
        return settings.workDurationMin * 60
      case 'shortBreak':
        return settings.shortBreakDurationMin * 60
      case 'longBreak':
        return settings.longBreakDurationMin * 60
      default:
        return phase satisfies never
    }
  }

  private computeRemaining(): number {
    if (this.status !== 'running' || this.runStartTimestamp === null) {
      return this.remainingAtRunStart
    }
    const elapsed = (Date.now() - this.runStartTimestamp) / 1000
    return Math.max(0, this.remainingAtRunStart - elapsed)
  }

  private startTicking(): void {
    if (this.intervalId !== null) return
    this.intervalId = setInterval(() => this.tick(), 1000)
  }

  private stopTicking(): void {
    if (this.intervalId === null) return
    clearInterval(this.intervalId)
    this.intervalId = null
  }

  private tick(): void {
    if (this.computeRemaining() <= 0) {
      this.completeCurrentPhase()
    } else {
      this.emitTick()
    }
  }

  private completeCurrentPhase(): void {
    const completedPhase = this.phase
    const settings = getSettings()

    if (completedPhase === 'work') {
      this.sessionsCompleted += 1
      if (this.linkedTaskId) {
        incrementCompletedPomodoro(this.linkedTaskId).catch(() => {
          // best-effort: session already advances even if the task was deleted mid-session
        })
      }
      addFocusSession({
        taskId: this.linkedTaskId,
        startedAt: new Date(this.workPhaseStartedAt ?? Date.now() - this.durationSeconds * 1000).toISOString(),
        durationSeconds: this.durationSeconds
      }).catch(() => {
        // best-effort: stats logging shouldn't block the timer from advancing
      })
    }

    const nextPhase: SessionPhase =
      completedPhase === 'work'
        ? this.sessionsCompleted % settings.sessionsBeforeLongBreak === 0
          ? 'longBreak'
          : 'shortBreak'
        : 'work'

    this.phase = nextPhase
    this.durationSeconds = this.durationForPhase(nextPhase)
    this.remainingAtRunStart = this.durationSeconds
    this.runStartTimestamp = Date.now()
    this.workPhaseStartedAt = nextPhase === 'work' ? Date.now() : null
    this.status = 'running'
    this.startTicking()

    this.emitSessionComplete({ completedPhase, nextPhase, linkedTaskId: this.linkedTaskId })
    this.emitTick()
  }

  private emitTick(): void {
    const state = this.getState()
    for (const listener of this.tickListeners) listener(state)
  }

  private emitSessionComplete(event: SessionCompleteEvent): void {
    for (const listener of this.completeListeners) listener(event)
  }
}

export const timerEngine = new TimerEngine()
