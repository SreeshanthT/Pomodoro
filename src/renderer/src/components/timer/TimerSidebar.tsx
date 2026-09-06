import type { FocusSession, Task } from '@shared/types'
import { formatFocusDuration } from '../../utils/time'
import { RecordsTimeline } from './RecordsTimeline'

interface TimerSidebarProps {
  todayFocusSeconds: number
  todaySessions: FocusSession[]
  todayTasks: Task[]
  onToggleTask: (id: string) => void
}

export function TimerSidebar({ todayFocusSeconds, todaySessions, todayTasks, onToggleTask }: TimerSidebarProps) {
  return (
    <aside className="timer-sidebar">
      <div className="sidebar-card">
        <span className="sidebar-card-label">Focus time of today</span>
        <span className="sidebar-card-value">{formatFocusDuration(todayFocusSeconds)}</span>
      </div>

      <div className="sidebar-card">
        <span className="sidebar-card-label">Today</span>
        {todayTasks.length === 0 ? (
          <p className="sidebar-empty">No tasks for today</p>
        ) : (
          <ul className="sidebar-task-list">
            {todayTasks.slice(0, 5).map((task) => (
              <li key={task.id}>
                <button
                  className="sidebar-task-checkbox"
                  onClick={() => onToggleTask(task.id)}
                  aria-label="Toggle complete"
                />
                <span>{task.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sidebar-card">
        <span className="sidebar-card-label">Today's focus records</span>
        <RecordsTimeline sessions={todaySessions} />
      </div>
    </aside>
  )
}
