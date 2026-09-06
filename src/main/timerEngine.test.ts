import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Settings } from '@shared/types'

vi.mock('./db', () => ({
  getSettings: vi.fn(),
  incrementCompletedPomodoro: vi.fn(),
  addFocusSession: vi.fn()
}))

vi.mock('./logger', () => ({
  log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() }
}))

import { getSettings, incrementCompletedPomodoro, addFocusSession } from './db'
import { TimerEngine } from './timerEngine'

const mockSettings: Settings = {
  workDurationMin: 1,
  shortBreakDurationMin: 1,
  longBreakDurationMin: 2,
  sessionsBeforeLongBreak: 2,
  ambientSound: 'none',
  chimeSound: 'bell',
  ambientVolume: 0.5,
  chimeVolume: 0.6,
  dialBackground: 'blueGalaxy',
  countMode: 'countdown'
}

const FIXED_NOW = new Date('2026-01-14T12:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
  mockSettings.workDurationMin = 1
  mockSettings.shortBreakDurationMin = 1
  mockSettings.longBreakDurationMin = 2
  mockSettings.sessionsBeforeLongBreak = 2
  mockSettings.countMode = 'countdown'
  vi.mocked(getSettings).mockReturnValue(mockSettings)
  vi.mocked(incrementCompletedPomodoro).mockResolvedValue(null)
  vi.mocked(addFocusSession).mockResolvedValue({ id: 'session-1', taskId: null, startedAt: '', durationSeconds: 0 })
})

afterEach(() => {
  vi.useRealTimers()
  vi.mocked(getSettings).mockReset()
  vi.mocked(incrementCompletedPomodoro).mockReset()
  vi.mocked(addFocusSession).mockReset()
})

describe('computeElapsed (via getState)', () => {
  it('is zero right after start', () => {
    const engine = new TimerEngine()
    engine.init()
    engine.start(null)
    expect(engine.getState().displaySeconds).toBe(60)
  })

  it('advances with wall-clock time while running', async () => {
    const engine = new TimerEngine()
    engine.init()
    engine.start(null)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(engine.getState().displaySeconds).toBe(50)
  })

  it('freezes while paused, ignoring time that passes during the pause', async () => {
    const engine = new TimerEngine()
    engine.init()
    engine.start(null)
    await vi.advanceTimersByTimeAsync(10_000)
    engine.pause()
    await vi.advanceTimersByTimeAsync(30_000) // must not count towards elapsed
    expect(engine.getState().displaySeconds).toBe(50)
  })

  it('resumes accumulating from where it was paused, not from zero', async () => {
    const engine = new TimerEngine()
    engine.init()
    engine.start(null)
    await vi.advanceTimersByTimeAsync(10_000)
    engine.pause()
    await vi.advanceTimersByTimeAsync(30_000)
    engine.resume()
    await vi.advanceTimersByTimeAsync(5_000)
    // 10s before pause + 5s after resume = 15s elapsed, out of a 60s countdown
    expect(engine.getState().displaySeconds).toBe(45)
  })

  it('counts up (never auto-completing) in countup mode', async () => {
    mockSettings.countMode = 'countup'
    const engine = new TimerEngine()
    engine.init()
    engine.start(null)
    await vi.advanceTimersByTimeAsync(90_000)
    const state = engine.getState()
    expect(state.displaySeconds).toBe(90)
    expect(state.status).toBe('running') // countup never auto-completes
  })
})

describe('completeCurrentPhase (via reaching the countdown target)', () => {
  it('advances work -> shortBreak when not yet due for a long break', async () => {
    const engine = new TimerEngine()
    engine.init()
    engine.start(null)
    await vi.advanceTimersByTimeAsync(60_000) // full 1-minute work phase elapses
    const state = engine.getState()
    expect(state.phase).toBe('shortBreak')
    expect(state.status).toBe('running')
    expect(state.sessionsCompleted).toBe(1)
    expect(state.durationSeconds).toBe(60) // shortBreakDurationMin: 1
  })

  it('advances work -> longBreak once sessionsBeforeLongBreak is reached', async () => {
    const engine = new TimerEngine()
    engine.init()
    engine.start(null)
    await vi.advanceTimersByTimeAsync(60_000) // 1st work session -> shortBreak
    await engine.skip() // finish the break, back to work
    await vi.advanceTimersByTimeAsync(60_000) // 2nd work session -> should hit longBreak (sessionsBeforeLongBreak: 2)
    const state = engine.getState()
    expect(state.phase).toBe('longBreak')
    expect(state.sessionsCompleted).toBe(2)
    expect(state.durationSeconds).toBe(120) // longBreakDurationMin: 2
  })

  it('advances any break phase back to work', async () => {
    const engine = new TimerEngine()
    engine.init()
    engine.start(null)
    await vi.advanceTimersByTimeAsync(60_000) // -> shortBreak
    await vi.advanceTimersByTimeAsync(60_000) // full break elapses -> back to work
    expect(engine.getState().phase).toBe('work')
  })

  it('logs completed pomodoros and focus sessions only for work phases, not breaks', async () => {
    const engine = new TimerEngine()
    engine.init()
    engine.start('task-1')
    await vi.advanceTimersByTimeAsync(60_000) // completes a work phase
    await vi.waitFor(() => expect(incrementCompletedPomodoro).toHaveBeenCalledWith('task-1'))
    expect(addFocusSession).toHaveBeenCalledWith(expect.objectContaining({ taskId: 'task-1', durationSeconds: 60 }))

    vi.mocked(incrementCompletedPomodoro).mockClear()
    vi.mocked(addFocusSession).mockClear()
    await vi.advanceTimersByTimeAsync(60_000) // completes the shortBreak that followed
    expect(incrementCompletedPomodoro).not.toHaveBeenCalled()
    expect(addFocusSession).not.toHaveBeenCalled()
  })

  it('still advances the phase even if logging the pomodoro/session fails', async () => {
    vi.mocked(incrementCompletedPomodoro).mockRejectedValue(new Error('db error'))
    vi.mocked(addFocusSession).mockRejectedValue(new Error('db error'))
    const engine = new TimerEngine()
    engine.init()
    engine.start('task-1')
    await vi.advanceTimersByTimeAsync(60_000)
    await vi.waitFor(() => expect(engine.getState().phase).toBe('shortBreak'))
  })

  it('stays paused across a manual skip instead of resuming', async () => {
    const engine = new TimerEngine()
    engine.init()
    engine.start(null)
    engine.pause()
    await engine.skip()
    const state = engine.getState()
    expect(state.phase).toBe('shortBreak')
    expect(state.status).toBe('paused')
  })

  it('emits a session-complete event with the completed and next phase', async () => {
    const engine = new TimerEngine()
    engine.init()
    const events: unknown[] = []
    engine.onSessionComplete((event) => events.push(event))
    engine.start('task-9')
    await vi.advanceTimersByTimeAsync(60_000)
    expect(events).toEqual([{ completedPhase: 'work', nextPhase: 'shortBreak', linkedTaskId: 'task-9' }])
  })
})

describe('reset', () => {
  it('returns to idle work with a fresh duration, regardless of prior phase/progress', async () => {
    const engine = new TimerEngine()
    engine.init()
    engine.start(null)
    await vi.advanceTimersByTimeAsync(60_000) // -> shortBreak
    engine.reset()
    const state = engine.getState()
    // sessionsCompleted deliberately isn't zeroed - reset() clears the current countdown, not the
    // day's completed-pomodoro count.
    expect(state).toMatchObject({ status: 'idle', phase: 'work', durationSeconds: 60, sessionsCompleted: 1 })
  })
})
