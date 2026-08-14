interface TimerRingProps {
  progress: number // 0..1, fraction of the phase elapsed
  color: string
  softColor: string
  label: string
  sublabel: string
}

const SIZE = 280
const STROKE = 14
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function TimerRing({ progress, color, softColor, label, sublabel }: TimerRingProps) {
  const offset = CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progress)))

  return (
    <div className="timer-ring" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={softColor}
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: 'stroke-dashoffset 0.3s linear' }}
        />
      </svg>
      <div className="timer-ring-content">
        <span className="timer-ring-time">{label}</span>
        <span className="timer-ring-sublabel">{sublabel}</span>
      </div>
    </div>
  )
}
