import { useEffect } from 'react'
import { useTimerStore } from '../../state/timerStore'
import { PauseIcon, PlayIcon } from '../shared/icons'
import './miniTimerBar.css'

const SIZE = 34
const STROKE = 3
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const PHASE_LABEL: Record<string, string> = {
  work: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break'
}

interface MiniTimerBarProps {
  onExpand: () => void
}

export function MiniTimerBar({ onExpand }: MiniTimerBarProps) {
  const state = useTimerStore((s) => s.state)
  const subscribe = useTimerStore((s) => s.subscribe)
  const pause = useTimerStore((s) => s.pause)
  const resume = useTimerStore((s) => s.resume)

  useEffect(() => {
    subscribe()
  }, [subscribe])

  const colorVar =
    state.phase === 'work' ? 'var(--work)' : state.phase === 'shortBreak' ? 'var(--short-break)' : 'var(--long-break)'

  // Countdown: ring drains as time runs out. Countup: ring sweeps once per hour of elapsed time, repeating.
  const progress =
    state.mode === 'countdown'
      ? state.durationSeconds > 0
        ? 1 - state.displaySeconds / state.durationSeconds
        : 0
      : (state.displaySeconds % 3600) / 3600
  const offset = CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progress)))

  const handlePlayPause = () => {
    if (state.status === 'running') pause()
    else if (state.status === 'paused') resume()
  }

  return (
    <div className="mini-timer-bar" style={{ ['--phase-color' as string]: colorVar }}>
      <button className="mini-timer-bar-main" onClick={onExpand} aria-label="Expand timer">
        <span className="mini-timer-bar-ring">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={STROKE}
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={colorVar}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          </svg>
        </span>
        <span className="mini-timer-bar-time">{formatTime(state.displaySeconds)}</span>
        <span className="mini-timer-bar-phase">{PHASE_LABEL[state.phase]}</span>
      </button>

      {state.status !== 'idle' && (
        <button
          className="mini-timer-bar-play"
          onClick={handlePlayPause}
          aria-label={state.status === 'running' ? 'Pause' : 'Resume'}
        >
          {state.status === 'running' ? <PauseIcon /> : <PlayIcon />}
        </button>
      )}
    </div>
  )
}
