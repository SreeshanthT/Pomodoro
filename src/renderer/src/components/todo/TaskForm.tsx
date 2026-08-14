import { useState } from 'react'
import type { NewTask, Task, TaskUpdate } from '@shared/types'
import { todayIso, tomorrowIso } from '../../utils/dateGroups'
import { Button } from '../shared/Button'

interface TaskFormProps {
  task: Task | null
  defaultDueDate: string
  onSave: (input: NewTask | TaskUpdate) => void
  onClose: () => void
}

export function TaskForm({ task, defaultDueDate, onSave, onClose }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? defaultDueDate)
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(task?.estimatedPomodoros ?? 1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ title: title.trim(), notes: notes.trim() || undefined, dueDate, estimatedPomodoros })
  }

  return (
    <div className="task-form-overlay" onClick={onClose}>
      <form className="task-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 className="task-form-title">{task ? 'Edit task' : 'New task'}</h2>

        <input
          className="task-form-input"
          placeholder="What needs doing?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <textarea
          className="task-form-textarea"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />

        <div className="task-form-row">
          <div className="task-form-quick-dates">
            <button type="button" className={dueDate === todayIso() ? 'active' : ''} onClick={() => setDueDate(todayIso())}>
              Today
            </button>
            <button
              type="button"
              className={dueDate === tomorrowIso() ? 'active' : ''}
              onClick={() => setDueDate(tomorrowIso())}
            >
              Tomorrow
            </button>
          </div>
          <input
            type="date"
            className="task-form-date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <label className="task-form-pomodoro-label">
          Estimated pomodoros
          <input
            type="number"
            min={1}
            max={20}
            value={estimatedPomodoros}
            onChange={(e) => setEstimatedPomodoros(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>

        <div className="task-form-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {task ? 'Save' : 'Add task'}
          </Button>
        </div>
      </form>
    </div>
  )
}
