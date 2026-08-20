import { create } from 'zustand'
import type { Settings } from '@shared/types'
import { DEFAULT_SETTINGS } from '@shared/types'
import { platform } from '../adapters/electronAdapter'

interface SettingsStore {
  settings: Settings
  loaded: boolean
  load: () => Promise<void>
  save: (settings: Settings) => Promise<void>
}

// Concurrent unawaited save() calls (e.g. one settings:save IPC round-trip per
// slider drag tick) can resolve out of order. Track the latest request and
// drop any response that isn't from it, so a stale reply can never overwrite
// a value the user has already dragged past.
let latestSaveRequestId = 0

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  load: async () => {
    const settings = await platform.settings.get()
    set({ settings, loaded: true })
  },

  save: async (settings) => {
    const requestId = ++latestSaveRequestId
    const saved = await platform.settings.save(settings)
    if (requestId === latestSaveRequestId) set({ settings: saved })
  }
}))
