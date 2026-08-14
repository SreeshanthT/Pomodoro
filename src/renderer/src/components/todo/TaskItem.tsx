import type { Task } from '@shared/types'
import { TrashIcon } from '../shared/icons'
import { IconButton } from '../shared/IconButton'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

export function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  return (
    <li className={`task-item${task.completed ? ' completed' : ''}`}>
      <button className="task-checkbox" onClick={() => onToggle(task.id)} aria-label="Toggle complete">
        {task.completed && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </button>

      <button className="task-body" onClick={() => onEdit(task)}>
        <span className="task-title">{task.title}</span>
        <span className="task-pomodoros">
          🍅 {task.completedPomodoros}/{task.estimatedPomodoros}
        </span>
      </button>

      <IconButton label="Delete task" onClick={() => onDelete(task.id)}>
        <TrashIcon />
      </IconButton>
    </li>
  )
}
