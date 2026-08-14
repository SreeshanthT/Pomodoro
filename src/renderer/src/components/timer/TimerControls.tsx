import type { TimerStatus } from '@shared/types'
import { PauseIcon, PlayIcon, ResetIcon, SkipIcon } from '../shared/icons'
import { IconButton } from '../shared/IconButton'

interface TimerControlsProps {
  status: TimerStatus
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onSkip: () => void
  onReset: () => void
}

export function TimerControls({ status, onStart, onPause, onResume, onSkip, onReset }: TimerControlsProps) {
  return (
    <div className="timer-controls">
      {status !== 'idle' && (
        <IconButton label="Reset" onClick={onReset}>
          <ResetIcon />
        </IconButton>
      )}

      {status === 'idle' && (
        <button className="timer-pill-btn" onClick={onStart}>
          <PlayIcon className="timer-pill-btn-icon" />
          Start focusing
        </button>
      )}
      {status === 'running' && (
        <button className="timer-pill-btn" onClick={onPause}>
          <PauseIcon className="timer-pill-btn-icon" />
          Pause
        </button>
      )}
      {status === 'paused' && (
        <button className="timer-pill-btn" onClick={onResume}>
          <PlayIcon className="timer-pill-btn-icon" />
          Resume
        </button>
      )}

      {status !== 'idle' && (
        <IconButton label="Skip" onClick={onSkip}>
          <SkipIcon />
        </IconButton>
      )}
    </div>
  )
}
