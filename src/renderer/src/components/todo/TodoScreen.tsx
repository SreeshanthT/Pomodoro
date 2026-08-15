import { useState } from 'react'
import type { Task, TaskGroup, TaskUpdate } from '@shared/types'
import { useTasks } from '../../hooks/useTasks'
import { useTaskStore } from '../../state/taskStore'
import { todayIso, tomorrowIso, upcomingDefaultIso } from '../../utils/dateGroups'
import { TaskGroupTabs } from './TaskGroupTabs'
import { TaskQuickAdd } from './TaskQuickAdd'
import { TaskList } from './TaskList'
import { TaskForm } from './TaskForm'
import './todo.css'

const GROUP_LABEL: Record<TaskGroup, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  upcoming: 'Upcoming'
}

const GROUP_DEFAULT_DUE_DATE: Record<TaskGroup, () => string> = {
  today: todayIso,
  tomorrow: tomorrowIso,
  upcoming: upcomingDefaultIso
}

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

  const counts: Record<TaskGroup, number> = {
    today: groups.today.length,
    tomorrow: groups.tomorrow.length,
    upcoming: groups.upcoming.length
  }

  const openEditForm = (task: Task) => setEditingTask(task)
  const closeForm = () => setEditingTask(null)

  const handleQuickAdd = (title: string) => addTask({ title, dueDate: GROUP_DEFAULT_DUE_DATE[activeGroup]() })

  const handleSave = (input: TaskUpdate) => {
    if (!editingTask) return
    updateTask(editingTask.id, input)
    closeForm()
  }

  return (
    <div className="screen todo-screen">
      <div className="todo-header">
        <h1 className="screen-title">Tasks</h1>
      </div>

      <TaskGroupTabs active={activeGroup} counts={counts} onChange={setActiveGroup} />

      <TaskQuickAdd groupLabel={GROUP_LABEL[activeGroup]} onAdd={handleQuickAdd} />

      <TaskList
        tasks={groups[activeGroup]}
        emptyLabel={EMPTY_LABEL[activeGroup]}
        onToggle={toggleComplete}
        onEdit={openEditForm}
        onDelete={removeTask}
      />

      {editingTask && <TaskForm task={editingTask} onSave={handleSave} onClose={closeForm} />}
    </div>
  )
}
