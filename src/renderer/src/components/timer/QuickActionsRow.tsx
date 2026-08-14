import { ExpandIcon, HourglassIcon, SoundWaveIcon } from '../shared/icons'

interface QuickActionsRowProps {
  onFullscreen: () => void
  onTimerMode: () => void
  whiteNoiseOn: boolean
  onToggleWhiteNoise: () => void
}

export function QuickActionsRow({ onFullscreen, onTimerMode, whiteNoiseOn, onToggleWhiteNoise }: QuickActionsRowProps) {
  return (
    <div className="quick-actions-row">
      <button className="quick-action" onClick={onFullscreen}>
        <ExpandIcon />
        <span>Fullscreen</span>
      </button>
      <button className="quick-action" onClick={onTimerMode}>
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
