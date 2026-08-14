import type { Task } from '@shared/types'
import { TaskItem } from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  emptyLabel: string
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

export function TaskList({ tasks, emptyLabel, onToggle, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="task-list-empty">{emptyLabel}</p>
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  )
}
