import { ExpandIcon, SoundWaveIcon } from '../shared/icons'

interface QuickActionsRowProps {
  onFullscreen: () => void
  whiteNoiseOn: boolean
  onToggleWhiteNoise: () => void
}

export function QuickActionsRow({ onFullscreen, whiteNoiseOn, onToggleWhiteNoise }: QuickActionsRowProps) {
  return (
    <div className="quick-actions-row">
      <button className="quick-action" onClick={onFullscreen}>
        <ExpandIcon />
        <span>Fullscreen</span>
      </button>
      <button className={`quick-action${whiteNoiseOn ? ' active' : ''}`} onClick={onToggleWhiteNoise}>
        <SoundWaveIcon />
        <span>White Noise</span>
      </button>
    </div>
  )
}
