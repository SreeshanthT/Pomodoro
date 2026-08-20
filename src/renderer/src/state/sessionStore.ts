import { create } from 'zustand'
import type { FocusSession } from '@shared/types'
import { platform } from '../adapters/electronAdapter'
import { useToastStore } from './toastStore'

interface SessionStore {
  sessions: FocusSession[]
  loaded: boolean
  load: () => Promise<void>
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessions: [],
  loaded: false,

  load: async () => {
    try {
      const sessions = await platform.sessions.getAll()
      set({ sessions, loaded: true })
    } catch (err) {
      console.error('Failed to load focus sessions', err)
      useToastStore.getState().pushError('Failed to load focus history.')
    }
  }
}))
