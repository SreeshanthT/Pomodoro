import { useEffect, useState } from 'react'
import type { DialBackground, Settings } from '@shared/types'
import { useSettingsStore } from '../../state/settingsStore'
import { DIAL_BACKGROUND_LABELS, DIAL_BACKGROUND_URLS } from '../../assets/backgrounds'
import './settings.css'

const AMBIENT_OPTIONS: { value: Settings['ambientSound']; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'tick', label: 'Ticking clock' },
  { value: 'rain', label: 'Rain' },
  { value: 'white-noise', label: 'White noise' }
]

const CHIME_OPTIONS: { value: Settings['chimeSound']; label: string }[] = [
  { value: 'bell', label: 'Bell' },
  { value: 'digital', label: 'Digital' },
  { value: 'soft-bell', label: 'Soft bell' }
]

const DIAL_BACKGROUND_OPTIONS = Object.keys(DIAL_BACKGROUND_URLS) as DialBackground[]

export function SettingsScreen() {
  const stored = useSettingsStore((s) => s.settings)
  const loaded = useSettingsStore((s) => s.loaded)
  const load = useSettingsStore((s) => s.load)
  const save = useSettingsStore((s) => s.save)

  const [draft, setDraft] = useState<Settings>(stored)

  useEffect(() => {
    if (!loaded) load()
  }, [loaded, load])

  useEffect(() => {
    setDraft(stored)
  }, [stored])

  const patch = (updates: Partial<Settings>) => {
    const next = { ...draft, ...updates }
    setDraft(next)
    save(next)
  }

  return (
    <div className="screen settings-screen">
      <h1 className="screen-title">Settings</h1>

      <section className="settings-section">
        <h2>Timer background</h2>

        <div className="settings-bg-row">
          <span className="settings-bg-label">Dial background</span>
          <div className="settings-bg-swatches">
            {DIAL_BACKGROUND_OPTIONS.map((bg) => (
              <button
                key={bg}
                className={`settings-bg-swatch${draft.dialBackground === bg ? ' active' : ''}`}
                style={{ backgroundImage: `url(${DIAL_BACKGROUND_URLS[bg]})` }}
                onClick={() => patch({ dialBackground: bg })}
                aria-label={DIAL_BACKGROUND_LABELS[bg]}
                title={DIAL_BACKGROUND_LABELS[bg]}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2>Durations (minutes)</h2>
        <div className="settings-duration-row">
          <label>
            Focus
            <input
              type="number"
              min={1}
              max={180}
              value={draft.workDurationMin}
              onChange={(e) => patch({ workDurationMin: Math.max(1, Number(e.target.value) || 1) })}
            />
          </label>
          <label>
            Short break
            <input
              type="number"
              min={1}
              max={60}
              value={draft.shortBreakDurationMin}
              onChange={(e) => patch({ shortBreakDurationMin: Math.max(1, Number(e.target.value) || 1) })}
            />
          </label>
          <label>
            Long break
            <input
              type="number"
              min={1}
              max={90}
              value={draft.longBreakDurationMin}
              onChange={(e) => patch({ longBreakDurationMin: Math.max(1, Number(e.target.value) || 1) })}
            />
          </label>
        </div>

        <label className="settings-inline-row">
          Sessions before long break
          <input
            type="number"
            min={2}
            max={12}
            value={draft.sessionsBeforeLongBreak}
            onChange={(e) => patch({ sessionsBeforeLongBreak: Math.max(2, Number(e.target.value) || 2) })}
          />
        </label>
      </section>

      <section className="settings-section">
        <h2>Sound</h2>

        <label className="settings-inline-row">
          Ambient sound during focus
          <select
            value={draft.ambientSound}
            onChange={(e) => patch({ ambientSound: e.target.value as Settings['ambientSound'] })}
          >
            {AMBIENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="settings-slider-row">
          Ambient volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={draft.ambientVolume}
            onChange={(e) => patch({ ambientVolume: Number(e.target.value) })}
          />
        </label>

        <label className="settings-inline-row">
          Session-end chime
          <select
            value={draft.chimeSound}
            onChange={(e) => patch({ chimeSound: e.target.value as Settings['chimeSound'] })}
          >
            {CHIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="settings-slider-row">
          Chime volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={draft.chimeVolume}
            onChange={(e) => patch({ chimeVolume: Number(e.target.value) })}
          />
        </label>
      </section>
    </div>
  )
}
