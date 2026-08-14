import { useEffect, useState } from 'react'
import type { TimerCountMode } from '@shared/types'
import { CheckIcon } from '../shared/icons'

interface TimerModeDialogProps {
  currentMode: TimerCountMode
  workDurationMin: number
  onCancel: () => void
  onConfirm: (mode: TimerCountMode) => void
}

export function TimerModeDialog({ currentMode, workDurationMin, onCancel, onConfirm }: TimerModeDialogProps) {
  const [draft, setDraft] = useState<TimerCountMode>(currentMode)

  useEffect(() => {
    setDraft(currentMode)
  }, [currentMode])

  const workLabel = `${String(workDurationMin).padStart(2, '0')}:00`

  return (
    <div className="timer-mode-overlay" onClick={onCancel}>
      <div className="timer-mode-dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="timer-mode-title">Timer Mode</h2>

        <button
          className={`timer-mode-option${draft === 'countdown' ? ' active' : ''}`}
          onClick={() => setDraft('countdown')}
        >
          <div className="timer-mode-option-head">
            <span className="timer-mode-option-range">
              {workLabel} <span className="timer-mode-arrow">→</span> 00:00
            </span>
            {draft === 'countdown' && <CheckIcon className="timer-mode-check" />}
          </div>
          <p>Count down from {workLabel} until the end of the time.</p>
        </button>

        <button
          className={`timer-mode-option${draft === 'countup' ? ' active' : ''}`}
          onClick={() => setDraft('countup')}
        >
          <div className="timer-mode-option-head">
            <span className="timer-mode-option-range">
              00:00 <span className="timer-mode-arrow">→</span> ∞
            </span>
            {draft === 'countup' && <CheckIcon className="timer-mode-check" />}
          </div>
          <p>Start counting from 00:00 until stop manually.</p>
        </button>

        <div className="timer-mode-actions">
          <button className="timer-mode-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="timer-mode-ok" onClick={() => onConfirm(draft)}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
