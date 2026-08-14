import { useMemo, useRef, useState } from 'react'
import type { Task } from '@shared/types'

interface TaskSearchBarProps {
  tasks: Task[]
  selectedTaskId: string | null
  disabled: boolean
  onSelect: (taskId: string | null) => void
}

export function TaskSearchBar({ tasks, selectedTaskId, disabled, onSelect }: TaskSearchBarProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const incomplete = tasks.filter((t) => !t.completed)
  const selectedTask = incomplete.find((t) => t.id === selectedTaskId) ?? null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return incomplete
    return incomplete.filter((t) => t.title.toLowerCase().includes(q))
  }, [incomplete, query])

  const handleFocus = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current)
    setQuery('')
    setOpen(true)
  }

  const handleBlur = () => {
    blurTimeout.current = setTimeout(() => setOpen(false), 120)
  }

  const handlePick = (task: Task | null) => {
    onSelect(task ? task.id : null)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="task-search-bar">
      <input
        type="text"
        value={open ? query : (selectedTask?.title ?? '')}
        placeholder="Select a task…"
        disabled={disabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={(e) => setQuery(e.target.value)}
      />

      {selectedTask && !open && (
        <button
          type="button"
          className="task-search-clear"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handlePick(null)}
          aria-label="Clear selected task"
        >
          ×
        </button>
      )}

      {open && (
        <ul className="task-search-dropdown">
          <li>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handlePick(null)}>
              No task
            </button>
          </li>
          {filtered.length === 0 && <li className="task-search-empty">No matching tasks</li>}
          {filtered.map((task) => (
            <li key={task.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handlePick(task)}>
                {task.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
