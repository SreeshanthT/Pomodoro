import { addFocusSession, getSettings, incrementCompletedPomodoro } from './db'
import { log } from './logger'
import type { SessionCompleteEvent, SessionPhase, TimerCountMode, TimerState, TimerStatus } from '@shared/types'

type TickListener = (state: TimerState) => void
type CompleteListener = (event: SessionCompleteEvent) => void

/**
 * Timestamp-based, elapsed-time tracking so the displayed number is always
 * derived from wall-clock time rather than decremented/incremented by
 * setInterval — avoids drift and survives renderer/main throttling since this
 * runs entirely in the main process. Both timer modes share the same elapsed
 * clock: countdown displays (duration - elapsed), countup displays elapsed
 * directly and never auto-completes.
 */
export class TimerEngine {
  private status: TimerStatus = 'idle'
  private phase: SessionPhase = 'work'
  private mode: TimerCountMode = 'countdown'
  private durationSeconds = 0
  private elapsedAtRunStart = 0
  private runStartTimestamp: number | null = null
  private sessionsCompleted = 0
  private linkedTaskId: string | null = null
  private intervalId: ReturnType<typeof setInterval> | null = null
  private workPhaseStartedAt: number | null = null

  private tickListeners = new Set<TickListener>()
  private completeListeners = new Set<CompleteListener>()

  init(): void {
    this.mode = getSettings().countMode
    this.durationSeconds = this.mode === 'countdown' ? this.durationForPhase('work') : 0
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
    const elapsed = this.computeElapsed()
    const displaySeconds =
      this.mode === 'countdown' ? Math.ceil(Math.max(0, this.durationSeconds - elapsed)) : Math.floor(elapsed)
    return {
      status: this.status,
      phase: this.phase,
      mode: this.mode,
      displaySeconds,
      durationSeconds: this.durationSeconds,
      sessionsCompleted: this.sessionsCompleted,
      linkedTaskId: this.linkedTaskId
    }
  }

  start(taskId: string | null): void {
    this.linkedTaskId = taskId
    this.mode = getSettings().countMode
    this.phase = 'work'
    this.durationSeconds = this.mode === 'countdown' ? this.durationForPhase('work') : 0
    this.elapsedAtRunStart = 0
    this.status = 'running'
    this.runStartTimestamp = Date.now()
    this.workPhaseStartedAt = Date.now()
    this.startTicking()
    this.emitTick()
  }

  pause(): void {
    if (this.status !== 'running') return
    this.elapsedAtRunStart = this.computeElapsed()
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

  /** Advances to the next phase now — the natural "done" action for countup mode, or a manual skip in countdown mode. */
  async skip(): Promise<void> {
    if (this.status === 'idle') return
    await this.completeCurrentPhase()
  }

  reset(): void {
    this.stopTicking()
    this.mode = getSettings().countMode
    this.status = 'idle'
    this.phase = 'work'
    this.durationSeconds = this.mode === 'countdown' ? this.durationForPhase('work') : 0
    this.elapsedAtRunStart = 0
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

  private computeElapsed(): number {
    if (this.status !== 'running' || this.runStartTimestamp === null) {
      return this.elapsedAtRunStart
    }
    return this.elapsedAtRunStart + (Date.now() - this.runStartTimestamp) / 1000
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
    if (this.mode === 'countdown' && this.computeElapsed() >= this.durationSeconds) {
      void this.completeCurrentPhase().catch((err) => log.error('Failed to complete timer phase', err))
    } else {
      this.emitTick()
    }
  }

  private async completeCurrentPhase(): Promise<void> {
    const stayPaused = this.status === 'paused'
    const completedPhase = this.phase
    const completedDurationSeconds =
      this.mode === 'countdown' ? this.durationSeconds : Math.floor(this.computeElapsed())
    const settings = getSettings()

    if (completedPhase === 'work') {
      this.sessionsCompleted += 1
      if (this.linkedTaskId) {
        try {
          await incrementCompletedPomodoro(this.linkedTaskId)
        } catch (err) {
          // best-effort: session already advances even if the task was deleted mid-session
          log.error('Failed to increment completed pomodoro count', err)
        }
      }
      try {
        await addFocusSession({
          taskId: this.linkedTaskId,
          startedAt: new Date(
            this.workPhaseStartedAt ?? Date.now() - completedDurationSeconds * 1000
          ).toISOString(),
          durationSeconds: completedDurationSeconds
        })
      } catch (err) {
        // best-effort: stats logging shouldn't block the timer from advancing
        log.error('Failed to record focus session', err)
      }
    }

    const nextPhase: SessionPhase =
      completedPhase === 'work'
        ? this.sessionsCompleted % settings.sessionsBeforeLongBreak === 0
          ? 'longBreak'
          : 'shortBreak'
        : 'work'

    this.mode = settings.countMode
    this.phase = nextPhase
    this.durationSeconds = this.mode === 'countdown' ? this.durationForPhase(nextPhase) : 0
    this.elapsedAtRunStart = 0
    this.runStartTimestamp = stayPaused ? null : Date.now()
    this.workPhaseStartedAt = nextPhase === 'work' ? Date.now() : null
    this.status = stayPaused ? 'paused' : 'running'
    if (!stayPaused) this.startTicking()

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
