import { useState } from 'react'
import type { NewTask, Task, TaskGroup, TaskUpdate } from '@shared/types'
import { useTasks } from '../../hooks/useTasks'
import { useTaskStore } from '../../state/taskStore'
import { todayIso, tomorrowIso } from '../../utils/dateGroups'
import { TaskGroupTabs } from './TaskGroupTabs'
import { TaskList } from './TaskList'
import { TaskForm } from './TaskForm'
import { PlusIcon } from '../shared/icons'
import './todo.css'

const EMPTY_LABEL: Record<TaskGroup, string> = {
  today: 'Nothing due today. Add a task to get focused.',
  tomorrow: 'Nothing due tomorrow yet.',
  upcoming: 'No upcoming tasks.'
}

export function TodoScreen() {
  const { groups } = useTasks()
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const toggleComplete = useTaskStore((s) => s.toggleComplete)
  const removeTask = useTaskStore((s) => s.removeTask)

  const [activeGroup, setActiveGroup] = useState<TaskGroup>('today')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const counts: Record<TaskGroup, number> = {
    today: groups.today.length,
    tomorrow: groups.tomorrow.length,
    upcoming: groups.upcoming.length
  }

  const defaultDueDate = activeGroup === 'tomorrow' ? tomorrowIso() : todayIso()

  const openNewTaskForm = () => {
    setEditingTask(null)
    setFormOpen(true)
  }

  const openEditForm = (task: Task) => {
    setEditingTask(task)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingTask(null)
  }

  const handleSave = (input: NewTask | TaskUpdate) => {
    if (editingTask) {
      updateTask(editingTask.id, input)
    } else {
      addTask(input as NewTask)
    }
    closeForm()
  }

  return (
    <div className="screen todo-screen">
      <div className="todo-header">
        <h1 className="screen-title">Tasks</h1>
        <button className="todo-add-btn" onClick={openNewTaskForm} aria-label="Add task">
          <PlusIcon />
        </button>
      </div>

      <TaskGroupTabs active={activeGroup} counts={counts} onChange={setActiveGroup} />

      <TaskList
        tasks={groups[activeGroup]}
        emptyLabel={EMPTY_LABEL[activeGroup]}
        onToggle={toggleComplete}
        onEdit={openEditForm}
        onDelete={removeTask}
      />

      {formOpen && (
        <TaskForm task={editingTask} defaultDueDate={defaultDueDate} onSave={handleSave} onClose={closeForm} />
      )}
    </div>
  )
}
