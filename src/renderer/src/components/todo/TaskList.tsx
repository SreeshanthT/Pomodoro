import { useRef } from 'react'
import type { Task } from '@shared/types'
import { TaskItem } from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  emptyLabel: string
  selectMode: boolean
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onToggleSelect: (id: string) => void
  onTogglePriority: (id: string) => void
  onReorder: (orderedIds: string[]) => void
}

export function TaskList({
  tasks,
  emptyLabel,
  selectMode,
  selectedIds,
  onToggle,
  onEdit,
  onDelete,
  onToggleSelect,
  onTogglePriority,
  onReorder
}: TaskListProps) {
  const dragIndex = useRef<number | null>(null)

  if (tasks.length === 0) {
    return <p className="task-list-empty">{emptyLabel}</p>
  }

  const handleDrop = (index: number) => {
    const from = dragIndex.current
    dragIndex.current = null
    if (from === null || from === index) return
    const reordered = [...tasks]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(index, 0, moved)
    onReorder(reordered.map((t) => t.id))
  }

  return (
    <ul className="task-list">
      {tasks.map((task, index) => (
        <TaskItem
          key={task.id}
          task={task}
          selectMode={selectMode}
          selected={selectedIds.has(task.id)}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleSelect={onToggleSelect}
          onTogglePriority={onTogglePriority}
          onDragStart={() => (dragIndex.current = index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(index)}
        />
      ))}
    </ul>
  )
}
