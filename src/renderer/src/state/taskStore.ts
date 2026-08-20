import { create } from 'zustand'
import type { NewTask, Task, TaskUpdate } from '@shared/types'
import { platform } from '../adapters/electronAdapter'
import { addDaysToIso } from '../utils/dateGroups'

interface TaskStore {
  tasks: Task[]
  loaded: boolean
  load: () => Promise<void>
  addTask: (input: NewTask) => Promise<void>
  updateTask: (id: string, updates: TaskUpdate) => Promise<void>
  toggleComplete: (id: string) => Promise<void>
  togglePriority: (id: string) => Promise<void>
  removeTask: (id: string) => Promise<Task | undefined>
  reorderTasks: (orderedIds: string[]) => Promise<void>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loaded: false,

  load: async () => {
    const tasks = await platform.tasks.getAll()
    set({ tasks, loaded: true })
  },

  addTask: async (input) => {
    const task = await platform.tasks.create(input)
    set((state) => ({ tasks: [...state.tasks, task] }))
  },

  updateTask: async (id, updates) => {
    const updated = await platform.tasks.update(id, updates)
    if (!updated) return
    set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? updated : t)) }))
  },

  toggleComplete: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    const completed = !task.completed

    // Completing a recurring task spawns the next occurrence; this instance stays completed for
    // history/stats. Both writes happen as one atomic main-process operation so a failure spawning
    // the next occurrence can't leave the task completed with no successor ever created.
    if (completed && task.recurrence) {
      const daysToAdd = task.recurrence === 'daily' ? 1 : 7
      try {
        const result = await platform.tasks.completeRecurring(id, new Date().toISOString(), {
          title: task.title,
          notes: task.notes,
          dueDate: addDaysToIso(task.dueDate, daysToAdd),
          estimatedPomodoros: task.estimatedPomodoros,
          priority: task.priority,
          recurrence: task.recurrence,
          projectId: task.projectId,
          subtasks: task.subtasks.map((s) => ({ ...s, completed: false }))
        })
        if (!result) return
        set((state) => ({
          tasks: [...state.tasks.map((t) => (t.id === id ? result.completedTask : t)), result.nextTask]
        }))
      } catch (err) {
        console.error('Failed to complete recurring task', err)
      }
      return
    }

    try {
      await get().updateTask(id, { completed, completedAt: completed ? new Date().toISOString() : null })
    } catch (err) {
      console.error('Failed to toggle task completion', err)
    }
  },

  togglePriority: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    await get().updateTask(id, { priority: !task.priority })
  },

  removeTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    await platform.tasks.delete(id)
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
    return task
  },

  reorderTasks: async (orderedIds) => {
    await Promise.all(orderedIds.map((id, index) => get().updateTask(id, { order: index })))
  }
}))
