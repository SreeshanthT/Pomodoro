import { create } from 'zustand'
import type { SessionCompleteEvent, TimerState } from '@shared/types'
import { platform } from '../adapters/electronAdapter'
import { useTaskStore } from './taskStore'
import { useSessionStore } from './sessionStore'

interface TimerStore {
  state: TimerState
  selectedTaskId: string | null
  subscribed: boolean
  lastSessionEvent: SessionCompleteEvent | null
  subscribe: () => void
  selectTask: (taskId: string | null) => void
  start: () => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  skip: () => Promise<void>
  reset: () => Promise<void>
}

const idleState: TimerState = {
  status: 'idle',
  phase: 'work',
  remainingSeconds: 25 * 60,
  durationSeconds: 25 * 60,
  sessionsCompleted: 0,
  linkedTaskId: null
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  state: idleState,
  selectedTaskId: null,
  subscribed: false,
  lastSessionEvent: null,

  subscribe: () => {
    if (get().subscribed) return
    set({ subscribed: true })

    platform.timer.getState().then((state) => set({ state }))

    platform.timer.onTick((state) => set({ state }))

    platform.timer.onSessionComplete((event) => {
      set({ lastSessionEvent: event })
      if (event.completedPhase === 'work') {
        // main process already incremented the task's pomodoro count and logged the session
        useTaskStore.getState().load()
        useSessionStore.getState().load()
      }
    })
  },

  selectTask: (taskId) => set({ selectedTaskId: taskId }),

  start: async () => {
    await platform.timer.start(get().selectedTaskId)
  },
  pause: async () => {
    await platform.timer.pause()
  },
  resume: async () => {
    await platform.timer.resume()
  },
  skip: async () => {
    await platform.timer.skip()
  },
  reset: async () => {
    await platform.timer.reset()
  }
}))
