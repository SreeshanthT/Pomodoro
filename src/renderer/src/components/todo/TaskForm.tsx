import { useState } from 'react'
import type { RecurrenceRule, Subtask, Task, TaskUpdate } from '@shared/types'
import { todayIso, tomorrowIso } from '../../utils/dateGroups'
import { useProjectStore } from '../../state/projectStore'
import { useSessionStore } from '../../state/sessionStore'
import { Button } from '../shared/Button'
import { Select } from '../shared/Select'
import { CheckIcon, PlusIcon, StarIcon, TrashIcon } from '../shared/icons'
import { formatFocusDuration } from '../../utils/time'

interface TaskFormProps {
  task: Task
  onSave: (input: TaskUpdate) => void
  onClose: () => void
}

const RECURRENCE_OPTIONS: { value: 'none' | RecurrenceRule; label: string }[] = [
  { value: 'none', label: "Doesn't repeat" },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' }
]

export function TaskForm({ task, onSave, onClose }: TaskFormProps) {
  const projects = useProjectStore((s) => s.projects)
  const sessions = useSessionStore((s) => s.sessions)

  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes ?? '')
  const [dueDate, setDueDate] = useState(task.dueDate)
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(task.estimatedPomodoros)
  const [priority, setPriority] = useState(task.priority)
  const [recurrence, setRecurrence] = useState<'none' | RecurrenceRule>(task.recurrence ?? 'none')
  const [projectId, setProjectId] = useState(task.projectId ?? 'none')
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks)
  const [subtaskInput, setSubtaskInput] = useState('')

  const taskSessions = sessions.filter((s) => s.taskId === task.id)

  const addSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = subtaskInput.trim()
    if (!trimmed) return
    setSubtasks((prev) => [...prev, { id: crypto.randomUUID(), title: trimmed, completed: false }])
    setSubtaskInput('')
  }

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)))
  }

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      notes: notes.trim() || undefined,
      dueDate,
      estimatedPomodoros,
      priority,
      recurrence: recurrence === 'none' ? null : recurrence,
      projectId: projectId === 'none' ? null : projectId,
      subtasks
    })
  }

  return (
    <div className="task-form-overlay" onClick={onClose}>
      <form className="task-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="task-form-title-row">
          <h2 className="task-form-title">Edit task</h2>
          <button
            type="button"
            className={`task-form-priority-btn${priority ? ' active' : ''}`}
            onClick={() => setPriority((p) => !p)}
            aria-label={priority ? 'Unflag priority' : 'Flag priority'}
          >
            <StarIcon filled={priority} />
          </button>
        </div>

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
            <button
              type="button"
              className={dueDate === todayIso() ? 'active' : ''}
              onClick={() => setDueDate(todayIso())}
            >
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
          <input type="date" className="task-form-date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
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

        <div className="task-form-inline-select">
          <span>Repeat</span>
          <Select value={recurrence} options={RECURRENCE_OPTIONS} onChange={setRecurrence} />
        </div>

        <div className="task-form-inline-select">
          <span>Project</span>
          <Select
            value={projectId}
            options={[{ value: 'none', label: 'No project' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
            onChange={setProjectId}
          />
        </div>

        <div className="task-form-subtasks">
          <span className="task-form-subtasks-label">Subtasks</span>
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="task-form-subtask-row">
              <button
                type="button"
                className={`task-form-subtask-checkbox${subtask.completed ? ' completed' : ''}`}
                onClick={() => toggleSubtask(subtask.id)}
              >
                {subtask.completed && <CheckIcon />}
              </button>
              <span className={subtask.completed ? 'completed' : ''}>{subtask.title}</span>
              <button type="button" className="task-form-subtask-remove" onClick={() => removeSubtask(subtask.id)}>
                <TrashIcon />
              </button>
            </div>
          ))}
          <div className="task-form-subtask-add">
            <PlusIcon />
            <input
              type="text"
              placeholder="Add a subtask"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addSubtask(e)
              }}
            />
          </div>
        </div>

        {taskSessions.length > 0 && (
          <div className="task-form-sessions">
            <span className="task-form-subtasks-label">Focus sessions</span>
            {taskSessions
              .slice()
              .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
              .slice(0, 5)
              .map((session) => (
                <div key={session.id} className="task-form-session-row">
                  <span>
                    {new Date(session.startedAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span>{formatFocusDuration(session.durationSeconds)}</span>
                </div>
              ))}
          </div>
        )}

        <div className="task-form-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save
          </Button>
        </div>
      </form>
    </div>
  )
}
