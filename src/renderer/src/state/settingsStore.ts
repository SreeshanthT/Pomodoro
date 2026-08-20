import { create } from 'zustand'
import type { Settings } from '@shared/types'
import { DEFAULT_SETTINGS } from '@shared/types'
import { platform } from '../adapters/electronAdapter'
import { useToastStore } from './toastStore'

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
    try {
      const settings = await platform.settings.get()
      set({ settings, loaded: true })
    } catch (err) {
      console.error('Failed to load settings', err)
      useToastStore.getState().pushError('Failed to load settings.')
    }
  },

  save: async (settings) => {
    const requestId = ++latestSaveRequestId
    try {
      const saved = await platform.settings.save(settings)
      if (requestId === latestSaveRequestId) set({ settings: saved })
    } catch (err) {
      console.error('Failed to save settings', err)
      // Only surface one toast for the latest request in a burst (e.g. a fast slider
      // drag) — otherwise every failed intermediate save would spam its own toast.
      if (requestId === latestSaveRequestId) useToastStore.getState().pushError('Failed to save settings.')
    }
  }
}))
