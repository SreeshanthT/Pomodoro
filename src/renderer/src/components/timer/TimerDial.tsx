interface TimerDialProps {
  progress: number // 0..1, fraction of the phase elapsed
  color: string
  label: string
}

const SIZE = 260
const TICK_COUNT = 60
const TICK_RADIUS_OUTER = SIZE / 2 - 6
const TICK_RADIUS_INNER_MINOR = SIZE / 2 - 16
const TICK_RADIUS_INNER_MAJOR = SIZE / 2 - 22
const HAND_LENGTH = SIZE / 2 - 30

function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

export function TimerDial({ progress, color, label }: TimerDialProps) {
  const cx = SIZE / 2
  const cy = SIZE / 2
  const handAngle = Math.min(1, Math.max(0, progress)) * 360

  return (
    <div className="timer-dial" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {Array.from({ length: TICK_COUNT }).map((_, i) => {
          const angle = (i / TICK_COUNT) * 360
          const isMajor = i % 5 === 0
          const [x1, y1] = polar(cx, cy, TICK_RADIUS_OUTER, angle)
          const [x2, y2] = polar(cx, cy, isMajor ? TICK_RADIUS_INNER_MAJOR : TICK_RADIUS_INNER_MINOR, angle)
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={isMajor ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          )
        })}
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - HAND_LENGTH}
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          style={{
            transform: `rotate(${handAngle}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: 'transform 0.3s linear'
          }}
        />
        <circle cx={cx} cy={cy} r={4} fill={color} />
      </svg>
      <div className="timer-dial-time">{label}</div>
    </div>
  )
}
