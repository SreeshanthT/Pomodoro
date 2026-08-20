import { create } from 'zustand'
import type { SessionCompleteEvent, TimerState } from '@shared/types'
import { platform } from '../adapters/electronAdapter'
import { useTaskStore } from './taskStore'
import { useSessionStore } from './sessionStore'
import { useToastStore } from './toastStore'

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
  mode: 'countdown',
  displaySeconds: 25 * 60,
  durationSeconds: 25 * 60,
  sessionsCompleted: 0,
  linkedTaskId: null
}

async function runTimerAction(action: () => Promise<void>, errorMessage: string): Promise<void> {
  try {
    await action()
  } catch (err) {
    console.error(errorMessage, err)
    useToastStore.getState().pushError(errorMessage)
  }
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  state: idleState,
  selectedTaskId: null,
  subscribed: false,
  lastSessionEvent: null,

  subscribe: () => {
    if (get().subscribed) return
    set({ subscribed: true })

    platform.timer.getState().then(
      (state) => set({ state }),
      (err) => {
        console.error('Failed to load timer state', err)
        useToastStore.getState().pushError('Failed to load timer state.')
      }
    )

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
    await runTimerAction(() => platform.timer.start(get().selectedTaskId), 'Failed to start timer.')
  },
  pause: async () => {
    await runTimerAction(() => platform.timer.pause(), 'Failed to pause timer.')
  },
  resume: async () => {
    await runTimerAction(() => platform.timer.resume(), 'Failed to resume timer.')
  },
  skip: async () => {
    await runTimerAction(() => platform.timer.skip(), 'Failed to skip phase.')
  },
  reset: async () => {
    await runTimerAction(() => platform.timer.reset(), 'Failed to reset timer.')
  }
}))
