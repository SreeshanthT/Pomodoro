import { ipcMain } from 'electron'
import { getSettings, saveSettings } from '../db'
import { DEFAULT_SETTINGS, type Settings, type SoundChoice, type ChimeChoice, type DialBackground, type TimerCountMode } from '@shared/types'

// Mirrors the min/max already enforced by the settings UI's number inputs
// (SettingsScreen.tsx) — re-checked here since IPC input can't be trusted to
// have gone through that UI at all.
const AMBIENT_SOUND_CHOICES = new Set<SoundChoice>(['none', 'tick', 'rain', 'white-noise'])
const CHIME_CHOICES = new Set<ChimeChoice>(['bell', 'digital', 'soft-bell'])
const DIAL_BACKGROUNDS = new Set<DialBackground>(['forest', 'dusk', 'ocean', 'midnight', 'blueGalaxy', 'ambient'])
const COUNT_MODES = new Set<TimerCountMode>(['countdown', 'countup'])

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function clampVolume(value: unknown, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(1, Math.max(0, n))
}

function sanitizeSettings(input: Settings): Settings {
  return {
    workDurationMin: clampInt(input.workDurationMin, 1, 180, DEFAULT_SETTINGS.workDurationMin),
    shortBreakDurationMin: clampInt(input.shortBreakDurationMin, 1, 60, DEFAULT_SETTINGS.shortBreakDurationMin),
    longBreakDurationMin: clampInt(input.longBreakDurationMin, 1, 90, DEFAULT_SETTINGS.longBreakDurationMin),
    sessionsBeforeLongBreak: clampInt(input.sessionsBeforeLongBreak, 2, 12, DEFAULT_SETTINGS.sessionsBeforeLongBreak),
    ambientSound: AMBIENT_SOUND_CHOICES.has(input.ambientSound) ? input.ambientSound : DEFAULT_SETTINGS.ambientSound,
    chimeSound: CHIME_CHOICES.has(input.chimeSound) ? input.chimeSound : DEFAULT_SETTINGS.chimeSound,
    ambientVolume: clampVolume(input.ambientVolume, DEFAULT_SETTINGS.ambientVolume),
    chimeVolume: clampVolume(input.chimeVolume, DEFAULT_SETTINGS.chimeVolume),
    dialBackground: DIAL_BACKGROUNDS.has(input.dialBackground) ? input.dialBackground : DEFAULT_SETTINGS.dialBackground,
    countMode: COUNT_MODES.has(input.countMode) ? input.countMode : DEFAULT_SETTINGS.countMode
  }
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:save', (_event, settings: Settings) => saveSettings(sanitizeSettings(settings)))
}
