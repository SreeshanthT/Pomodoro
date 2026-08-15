import { create } from 'zustand'
import type { NewProject, Project } from '@shared/types'
import { platform } from '../adapters/electronAdapter'

interface ProjectStore {
  projects: Project[]
  loaded: boolean
  load: () => Promise<void>
  addProject: (input: NewProject) => Promise<void>
  removeProject: (id: string) => Promise<void>
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  loaded: false,

  load: async () => {
    const projects = await platform.projects.getAll()
    set({ projects, loaded: true })
  },

  addProject: async (input) => {
    const project = await platform.projects.create(input)
    set((state) => ({ projects: [...state.projects, project] }))
  },

  removeProject: async (id) => {
    await platform.projects.delete(id)
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }))
  }
}))
