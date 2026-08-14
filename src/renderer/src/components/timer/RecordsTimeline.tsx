import type { FocusSession } from '@shared/types'
import { dayFraction } from '../../utils/time'

const HOUR_MARKS = [0, 6, 12, 18, 24]

interface RecordsTimelineProps {
  sessions: FocusSession[]
}

export function RecordsTimeline({ sessions }: RecordsTimelineProps) {
  return (
    <div className="records-timeline">
      <div className="records-timeline-track">
        {sessions.map((session) => {
          const start = dayFraction(session.startedAt) * 100
          const width = Math.max(0.6, (session.durationSeconds / 86400) * 100)
          return (
            <div
              key={session.id}
              className="records-timeline-mark"
              style={{ left: `${start}%`, width: `${width}%` }}
              title={new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            />
          )
        })}
      </div>
      <div className="records-timeline-labels">
        {HOUR_MARKS.map((h) => (
          <span key={h}>{String(h).padStart(2, '0')}:00</span>
        ))}
      </div>
    </div>
  )
}
