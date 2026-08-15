import { useTimerState } from './hooks/useTimerState'
import { platform } from './adapters/electronAdapter'
import { CloseIcon, ExpandIcon, PauseIcon, PlayIcon } from './components/shared/icons'
import './styles/mini.css'

const SIZE = 40
const STROKE = 3
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function MiniApp() {
  const state = useTimerState()

  const handlePlayPause = () => {
    if (state.status === 'running') platform.timer.pause()
    else if (state.status === 'paused') platform.timer.resume()
    else platform.timer.start(state.linkedTaskId)
  }

  // Countdown: arc drains as time runs out. Countup: arc sweeps once per hour of elapsed time, repeating.
  const progress =
    state.mode === 'countdown'
      ? state.durationSeconds > 0
        ? 1 - state.displaySeconds / state.durationSeconds
        : 0
      : (state.displaySeconds % 3600) / 3600
  const offset = CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progress)))
  const minutesLeft = Math.floor(state.displaySeconds / 60)

  const colorVar =
    state.phase === 'work' ? 'var(--work)' : state.phase === 'shortBreak' ? 'var(--short-break)' : 'var(--long-break)'

  const handleMaximize = () => {
    platform.windows.openFocus()
    window.close()
  }

  return (
    <div className="mini-widget" style={{ ['--phase-color' as string]: colorVar }}>
      <div className="mini-ring">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={STROKE} />
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
        <span className="mini-ring-value">{minutesLeft}</span>
      </div>

      <div className="mini-actions">
        <button className="mini-btn" onClick={handlePlayPause} aria-label={state.status === 'running' ? 'Pause' : 'Play'}>
          {state.status === 'running' ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button className="mini-btn" onClick={handleMaximize} aria-label="Maximize">
          <ExpandIcon />
        </button>
        <button className="mini-btn" onClick={() => window.close()} aria-label="Close">
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}
