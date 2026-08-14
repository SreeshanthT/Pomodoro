import { useEffect, useState } from 'react'
import type { TimerState } from '@shared/types'
import { platform } from '../adapters/electronAdapter'

const idleState: TimerState = {
  status: 'idle',
  phase: 'work',
  remainingSeconds: 25 * 60,
  durationSeconds: 25 * 60,
  sessionsCompleted: 0,
  linkedTaskId: null
}

/** Lightweight timer subscription for standalone windows (focus/mini) that don't need the full app state graph. */
export function useTimerState(): TimerState {
  const [state, setState] = useState<TimerState>(idleState)

  useEffect(() => {
    platform.timer.getState().then(setState)
    return platform.timer.onTick(setState)
  }, [])

  return state
}
