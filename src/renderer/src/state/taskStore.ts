import { create } from 'zustand'
import type { NewTask, Task, TaskUpdate } from '@shared/types'
import { platform } from '../adapters/electronAdapter'

interface TaskStore {
  tasks: Task[]
  loaded: boolean
  load: () => Promise<void>
  addTask: (input: NewTask) => Promise<void>
  updateTask: (id: string, updates: TaskUpdate) => Promise<void>
  toggleComplete: (id: string) => Promise<void>
  removeTask: (id: string) => Promise<void>
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
    await get().updateTask(id, { completed, completedAt: completed ? new Date().toISOString() : null })
  },

  removeTask: async (id) => {
    await platform.tasks.delete(id)
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
  }
}))
