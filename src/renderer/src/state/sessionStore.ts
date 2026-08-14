import { create } from 'zustand'
import type { FocusSession } from '@shared/types'
import { platform } from '../adapters/electronAdapter'

interface SessionStore {
  sessions: FocusSession[]
  loaded: boolean
  load: () => Promise<void>
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessions: [],
  loaded: false,

  load: async () => {
    const sessions = await platform.sessions.getAll()
    set({ sessions, loaded: true })
  }
}))
