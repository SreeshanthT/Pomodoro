import { useEffect, useMemo, useRef, useState } from 'react'
import type { Task, TaskGroup, TaskUpdate } from '@shared/types'
import { useTasks } from '../../hooks/useTasks'
import { useTaskStore } from '../../state/taskStore'
import { useProjectStore } from '../../state/projectStore'
import { useSessionStore } from '../../state/sessionStore'
import { useSettingsStore } from '../../state/settingsStore'
import { todayIso, tomorrowIso, thisWeekDefaultIso, plannedDefaultIso } from '../../utils/dateGroups'
import { TaskSidebar } from './TaskSidebar'
import { TaskQuickAdd } from './TaskQuickAdd'
import { TaskList } from './TaskList'
import { TaskForm } from './TaskForm'
import { StatsBar } from './StatsBar'
import { TaskBulkToolbar } from './TaskBulkToolbar'
import { UndoToast } from './UndoToast'
import { ChecklistIcon } from '../shared/icons'
import './todo.css'

const GROUP_LABEL: Record<TaskGroup, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  thisWeek: 'This Week',
  planned: 'Planned',
  completed: 'Completed',
  all: 'Tasks'
}

const GROUP_DEFAULT_DUE_DATE: Record<TaskGroup, () => string> = {
  today: todayIso,
  tomorrow: tomorrowIso,
  thisWeek: thisWeekDefaultIso,
  planned: plannedDefaultIso,
  completed: todayIso,
  all: todayIso
}

const EMPTY_LABEL: Record<TaskGroup, string> = {
  today: 'Nothing due today. Add a task to get focused.',
  tomorrow: 'Nothing due tomorrow yet.',
  thisWeek: 'Nothing due this week.',
  planned: 'Nothing planned further out.',
  completed: 'No completed tasks yet.',
  all: 'No tasks yet.'
}

const UNDO_WINDOW_MS = 6000

export function TodoScreen() {
  const { tasks, groups } = useTasks()
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const toggleComplete = useTaskStore((s) => s.toggleComplete)
  const togglePriority = useTaskStore((s) => s.togglePriority)
  const removeTask = useTaskStore((s) => s.removeTask)
  const restoreTask = useTaskStore((s) => s.restoreTask)
  const purgeTask = useTaskStore((s) => s.purgeTask)
  const reorderTasks = useTaskStore((s) => s.reorderTasks)

  const projects = useProjectStore((s) => s.projects)
  const projectsLoaded = useProjectStore((s) => s.loaded)
  const loadProjects = useProjectStore((s) => s.load)
  const addProject = useProjectStore((s) => s.addProject)
  const removeProject = useProjectStore((s) => s.removeProject)

  const sessions = useSessionStore((s) => s.sessions)
  const sessionsLoaded = useSessionStore((s) => s.loaded)
  const loadSessions = useSessionStore((s) => s.load)
  const settings = useSettingsStore((s) => s.settings)

  useEffect(() => {
    if (!projectsLoaded) loadProjects()
    if (!sessionsLoaded) loadSessions()
  }, [projectsLoaded, loadProjects, sessionsLoaded, loadSessions])

  const [activeGroup, setActiveGroup] = useState<TaskGroup>('today')
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [undoTask, setUndoTask] = useState<Task | null>(null)
  const undoTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const counts: Record<TaskGroup, number> = {
    today: groups.today.length,
    tomorrow: groups.tomorrow.length,
    thisWeek: groups.thisWeek.length,
    planned: groups.planned.length,
    completed: groups.completed.length,
    all: groups.all.length
  }

  const projectTasks = useMemo(() => {
    if (!activeProjectId) return null
    return tasks
      .filter((t) => t.projectId === activeProjectId)
      .sort((a, b) => Number(a.completed) - Number(b.completed) || a.order - b.order)
  }, [tasks, activeProjectId])

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return null
    return tasks.filter((t) => t.title.toLowerCase().includes(query))
  }, [tasks, searchQuery])

  const displayedTasks = searchResults ?? projectTasks ?? groups[activeGroup]
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null

  const title = searchResults
    ? `Search: "${searchQuery.trim()}"`
    : activeProject
      ? activeProject.name
      : GROUP_LABEL[activeGroup]

  const emptyLabel = searchResults
    ? 'No matching tasks.'
    : activeProject
      ? 'No tasks in this project yet.'
      : EMPTY_LABEL[activeGroup]

  const showQuickAdd = !searchResults && activeGroup !== 'completed'

  const incompleteInView = displayedTasks.filter((t) => !t.completed)
  const completedInView = displayedTasks.filter((t) => t.completed)
  const estimatedMinutes = incompleteInView.reduce((sum, t) => sum + t.estimatedPomodoros, 0) * settings.workDurationMin
  const viewTaskIds = new Set(displayedTasks.map((t) => t.id))
  const elapsedMinutes = Math.round(
    sessions.filter((s) => s.taskId && viewTaskIds.has(s.taskId)).reduce((sum, s) => sum + s.durationSeconds, 0) / 60
  )

  const openEditForm = (task: Task) => setEditingTask(task)
  const closeForm = () => setEditingTask(null)

  const handleQuickAdd = (title: string) =>
    addTask({
      title,
      dueDate: activeProject ? todayIso() : GROUP_DEFAULT_DUE_DATE[activeGroup](),
      projectId: activeProjectId ?? undefined
    })

  const handleSave = (input: TaskUpdate) => {
    if (!editingTask) return
    updateTask(editingTask.id, input)
    closeForm()
  }

  const handleChangeView = (group: TaskGroup) => {
    setActiveGroup(group)
    setSearchQuery('')
  }

  // Deletes are soft: the row survives until either handleUndo restores it or the undo window
  // lapses and it's purged for real. Replacing a still-pending undo purges the superseded task
  // immediately, since its own undo window is being cut short.
  const scheduleUndo = (task: Task) => {
    if (undoTimeout.current) {
      clearTimeout(undoTimeout.current)
      if (undoTask) purgeTask(undoTask.id)
    }
    setUndoTask(task)
    undoTimeout.current = setTimeout(() => {
      setUndoTask(null)
      purgeTask(task.id)
    }, UNDO_WINDOW_MS)
  }

  const handleDelete = async (id: string) => {
    const removed = await removeTask(id)
    if (removed) scheduleUndo(removed)
  }

  const handleUndo = () => {
    if (!undoTask) return
    if (undoTimeout.current) clearTimeout(undoTimeout.current)
    restoreTask(undoTask.id)
    setUndoTask(null)
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const handleBulkComplete = () => {
    for (const id of selectedIds) toggleComplete(id)
    exitSelectMode()
  }

  const handleBulkDelete = () => {
    // Purges directly rather than going through the soft-delete + undo-toast path (which only
    // ever tracks one pending task), so bulk-deleted rows don't linger soft-deleted forever.
    for (const id of selectedIds) purgeTask(id)
    exitSelectMode()
  }

  return (
    <div className="screen screen-wide todo-screen">
      <TaskSidebar
        active={activeGroup}
        counts={counts}
        onChangeView={handleChangeView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onAddProject={(name, color) => addProject({ name, color })}
        onDeleteProject={(id) => {
          if (activeProjectId === id) setActiveProjectId(null)
          removeProject(id)
        }}
      />

      <div className="todo-main">
        <div className="todo-header">
          <h1 className="screen-title">{title}</h1>
          <button
            className={`todo-select-toggle${selectMode ? ' active' : ''}`}
            onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            aria-label="Toggle select mode"
            title="Select tasks"
          >
            <ChecklistIcon />
          </button>
        </div>

        <StatsBar
          estimatedMinutes={estimatedMinutes}
          tasksRemaining={incompleteInView.length}
          elapsedMinutes={elapsedMinutes}
          completedCount={completedInView.length}
        />

        {showQuickAdd && (
          <TaskQuickAdd groupLabel={activeProject ? activeProject.name : GROUP_LABEL[activeGroup]} onAdd={handleQuickAdd} />
        )}

        <TaskList
          tasks={displayedTasks}
          emptyLabel={emptyLabel}
          selectMode={selectMode}
          selectedIds={selectedIds}
          onToggle={toggleComplete}
          onEdit={openEditForm}
          onDelete={handleDelete}
          onToggleSelect={toggleSelected}
          onTogglePriority={togglePriority}
          onReorder={reorderTasks}
        />
      </div>

      {editingTask && <TaskForm task={editingTask} onSave={handleSave} onClose={closeForm} />}

      <TaskBulkToolbar count={selectedIds.size} onComplete={handleBulkComplete} onDelete={handleBulkDelete} onCancel={exitSelectMode} />

      {undoTask && <UndoToast message={`"${undoTask.title}" deleted`} onUndo={handleUndo} />}
    </div>
  )
}
