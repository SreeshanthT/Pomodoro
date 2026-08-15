import type { Task } from '@shared/types'
import { isOverdue } from '../../utils/dateGroups'
import { CheckIcon, DragHandleIcon, StarIcon, TrashIcon } from '../shared/icons'
import { IconButton } from '../shared/IconButton'

interface TaskItemProps {
  task: Task
  selectMode: boolean
  selected: boolean
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onToggleSelect: (id: string) => void
  onTogglePriority: (id: string) => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
}

export function TaskItem({
  task,
  selectMode,
  selected,
  onToggle,
  onEdit,
  onDelete,
  onToggleSelect,
  onTogglePriority,
  onDragStart,
  onDragOver,
  onDrop
}: TaskItemProps) {
  const overdue = isOverdue(task)
  const subtaskDone = task.subtasks.filter((s) => s.completed).length

  const handleCheckboxClick = () => {
    if (selectMode) onToggleSelect(task.id)
    else onToggle(task.id)
  }

  return (
    <li
      className={`task-item${task.completed ? ' completed' : ''}${overdue ? ' overdue' : ''}`}
      draggable={!selectMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {!selectMode && (
        <span className="task-drag-handle">
          <DragHandleIcon />
        </span>
      )}

      <button
        className={`task-checkbox${selectMode ? ' select-mode' : ''}`}
        onClick={handleCheckboxClick}
        aria-label={selectMode ? 'Select task' : 'Toggle complete'}
      >
        {(selectMode ? selected : task.completed) && <CheckIcon />}
      </button>

      <button className="task-body" onClick={() => (selectMode ? onToggleSelect(task.id) : onEdit(task))}>
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          {task.subtasks.length > 0 && (
            <span className="task-subtask-count">
              {subtaskDone}/{task.subtasks.length}
            </span>
          )}
          {overdue && <span className="task-overdue-tag">Overdue</span>}
          <span className="task-pomodoros">
            🍅 {task.completedPomodoros}/{task.estimatedPomodoros}
          </span>
        </span>
      </button>

      {!selectMode && (
        <IconButton
          label={task.priority ? 'Unflag priority' : 'Flag priority'}
          className={`task-priority-btn${task.priority ? ' active' : ''}`}
          onClick={() => onTogglePriority(task.id)}
        >
          <StarIcon filled={task.priority} />
        </IconButton>
      )}

      {!selectMode && (
        <IconButton label="Delete task" onClick={() => onDelete(task.id)}>
          <TrashIcon />
        </IconButton>
      )}
    </li>
  )
}
