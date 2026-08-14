import { useTimerState } from './hooks/useTimerState'
import { platform } from './adapters/electronAdapter'
import { TimerFlipClock } from './components/timer/TimerFlipClock'
import { CloseIcon, CollapseIcon, PauseIcon, PlayIcon } from './components/shared/icons'
import './styles/focus.css'

const PHASE_LABEL: Record<string, string> = {
  work: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break'
}

export function FocusApp() {
  const state = useTimerState()

  const handlePlayPause = () => {
    if (state.status === 'running') platform.timer.pause()
    else if (state.status === 'paused') platform.timer.resume()
    else platform.timer.start(state.linkedTaskId)
  }

  const handleCollapse = () => {
    platform.windows.openMini()
    window.close()
  }

  const colorVar =
    state.phase === 'work' ? 'var(--work)' : state.phase === 'shortBreak' ? 'var(--short-break)' : 'var(--long-break)'

  return (
    <div className="focus-page" style={{ ['--phase-color' as string]: colorVar }}>
      <div className="focus-titlebar">
        <span className="focus-phase-label">{PHASE_LABEL[state.phase]}</span>
        <div className="focus-titlebar-actions">
          <button className="focus-icon-btn" onClick={handleCollapse} aria-label="Collapse to mini widget" title="Collapse to mini widget">
            <CollapseIcon />
          </button>
          <button className="focus-icon-btn" onClick={() => window.close()} aria-label="Close" title="Close">
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className="focus-center">
        <TimerFlipClock remainingSeconds={state.remainingSeconds} />

        <button className="focus-play-pause" onClick={handlePlayPause} aria-label={state.status === 'running' ? 'Pause' : 'Play'}>
          {state.status === 'running' ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
    </div>
  )
}
