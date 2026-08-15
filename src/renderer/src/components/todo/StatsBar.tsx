interface StatsBarProps {
  estimatedMinutes: number
  tasksRemaining: number
  elapsedMinutes: number
  completedCount: number
}

export function StatsBar({ estimatedMinutes, tasksRemaining, elapsedMinutes, completedCount }: StatsBarProps) {
  return (
    <div className="stats-bar">
      <div className="stats-tile">
        <span className="stats-value">
          {estimatedMinutes}
          <small>m</small>
        </span>
        <span className="stats-label">Estimated Time</span>
      </div>
      <div className="stats-tile">
        <span className="stats-value">{tasksRemaining}</span>
        <span className="stats-label">Tasks to be Completed</span>
      </div>
      <div className="stats-tile">
        <span className="stats-value">
          {elapsedMinutes}
          <small>m</small>
        </span>
        <span className="stats-label">Elapsed Time</span>
      </div>
      <div className="stats-tile">
        <span className="stats-value">{completedCount}</span>
        <span className="stats-label">Completed Tasks</span>
      </div>
    </div>
  )
}
