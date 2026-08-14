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

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  load: async () => {
    const settings = await platform.settings.get()
    set({ settings, loaded: true })
  },

  save: async (settings) => {
    const saved = await platform.settings.save(settings)
    set({ settings: saved })
  }
}))
