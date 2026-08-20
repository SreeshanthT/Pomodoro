import { create } from 'zustand'
import type { NewTask, Task, TaskUpdate } from '@shared/types'
import { platform } from '../adapters/electronAdapter'
import { addDaysToIso } from '../utils/dateGroups'
import { useToastStore } from './toastStore'

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
    try {
      const tasks = await platform.tasks.getAll()
      set({ tasks, loaded: true })
    } catch (err) {
      console.error('Failed to load tasks', err)
      useToastStore.getState().pushError('Failed to load tasks.')
    }
  },

  addTask: async (input) => {
    try {
      const task = await platform.tasks.create(input)
      set((state) => ({ tasks: [...state.tasks, task] }))
    } catch (err) {
      console.error('Failed to create task', err)
      useToastStore.getState().pushError('Failed to create task.')
    }
  },

  // Swallows its own errors (toasting instead) so callers that delegate to it
  // (togglePriority, reorderTasks, toggleComplete's non-recurring path) don't
  // each need their own try/catch to stay safe from unhandled rejections.
  updateTask: async (id, updates) => {
    try {
      const updated = await platform.tasks.update(id, updates)
      if (!updated) return
      set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? updated : t)) }))
    } catch (err) {
      console.error('Failed to update task', err)
      useToastStore.getState().pushError('Failed to update task.')
    }
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
        useToastStore.getState().pushError('Failed to complete task.')
      }
      return
    }

    // updateTask handles/toasts its own errors, so no try/catch needed here.
    await get().updateTask(id, { completed, completedAt: completed ? new Date().toISOString() : null })
  },

  togglePriority: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    await get().updateTask(id, { priority: !task.priority })
  },

  removeTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    try {
      await platform.tasks.delete(id)
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
      return task
    } catch (err) {
      console.error('Failed to delete task', err)
      useToastStore.getState().pushError('Failed to delete task.')
      return undefined
    }
  },

  reorderTasks: async (orderedIds) => {
    await Promise.all(orderedIds.map((id, index) => get().updateTask(id, { order: index })))
  }
}))
