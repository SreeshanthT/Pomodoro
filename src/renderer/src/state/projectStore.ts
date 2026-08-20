import { create } from 'zustand'
import type { NewProject, Project } from '@shared/types'
import { platform } from '../adapters/electronAdapter'
import { useToastStore } from './toastStore'

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
    try {
      const projects = await platform.projects.getAll()
      set({ projects, loaded: true })
    } catch (err) {
      console.error('Failed to load projects', err)
      useToastStore.getState().pushError('Failed to load projects.')
    }
  },

  addProject: async (input) => {
    try {
      const project = await platform.projects.create(input)
      set((state) => ({ projects: [...state.projects, project] }))
    } catch (err) {
      console.error('Failed to create project', err)
      useToastStore.getState().pushError('Failed to create project.')
    }
  },

  removeProject: async (id) => {
    try {
      await platform.projects.delete(id)
      set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }))
    } catch (err) {
      console.error('Failed to delete project', err)
      useToastStore.getState().pushError('Failed to delete project.')
    }
  }
}))
