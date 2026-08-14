import type { TimerStyle } from '@shared/types'
import { ExpandIcon, HourglassIcon, SoundWaveIcon } from '../shared/icons'

const STYLE_CYCLE: TimerStyle[] = ['ring', 'dial', 'flip']

interface QuickActionsRowProps {
  onFullscreen: () => void
  timerStyle: TimerStyle
  onCycleStyle: (next: TimerStyle) => void
  whiteNoiseOn: boolean
  onToggleWhiteNoise: () => void
}

export function QuickActionsRow({
  onFullscreen,
  timerStyle,
  onCycleStyle,
  whiteNoiseOn,
  onToggleWhiteNoise
}: QuickActionsRowProps) {
  const cycleStyle = () => {
    const nextIndex = (STYLE_CYCLE.indexOf(timerStyle) + 1) % STYLE_CYCLE.length
    onCycleStyle(STYLE_CYCLE[nextIndex])
  }

  return (
    <div className="quick-actions-row">
      <button className="quick-action" onClick={onFullscreen}>
        <ExpandIcon />
        <span>Fullscreen</span>
      </button>
      <button className="quick-action" onClick={cycleStyle}>
        <HourglassIcon />
        <span>Timer Mode</span>
      </button>
      <button className={`quick-action${whiteNoiseOn ? ' active' : ''}`} onClick={onToggleWhiteNoise}>
        <SoundWaveIcon />
        <span>White Noise</span>
      </button>
    </div>
  )
}
