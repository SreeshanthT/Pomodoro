import { useEffect, useState } from 'react'
import type { DialBackground, Settings } from '@shared/types'
import { useSettingsStore } from '../../state/settingsStore'
import { DIAL_BACKGROUND_LABELS, DIAL_BACKGROUND_URLS } from '../../assets/backgrounds'
import { platform } from '../../adapters/electronAdapter'
import { Select } from '../shared/Select'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { Button } from '../shared/Button'
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
  const [backupStatus, setBackupStatus] = useState<string | null>(null)
  const [confirmingRestore, setConfirmingRestore] = useState(false)
  const [restoring, setRestoring] = useState(false)

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

  const handleBackup = async () => {
    setBackupStatus(null)
    const result = await platform.backup.export()
    setBackupStatus(result.success ? `Backed up to ${result.path}` : null)
  }

  const handleRestore = async () => {
    setConfirmingRestore(false)
    setRestoring(true)
    // On success the main process relaunches the app, so this promise never resolves observably.
    const result = await platform.backup.import()
    if (!result.success) setRestoring(false)
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

        <div className="settings-inline-row">
          <span>Ambient sound during focus</span>
          <Select value={draft.ambientSound} options={AMBIENT_OPTIONS} onChange={(v) => patch({ ambientSound: v })} />
        </div>

        <label className="settings-slider-row">
          Ambient volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={draft.ambientVolume}
            style={{ ['--range-progress' as string]: `${draft.ambientVolume * 100}%` }}
            onChange={(e) => patch({ ambientVolume: Number(e.target.value) })}
          />
        </label>

        <div className="settings-inline-row">
          <span>Session-end chime</span>
          <Select value={draft.chimeSound} options={CHIME_OPTIONS} onChange={(v) => patch({ chimeSound: v })} />
        </div>

        <label className="settings-slider-row">
          Chime volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={draft.chimeVolume}
            style={{ ['--range-progress' as string]: `${draft.chimeVolume * 100}%` }}
            onChange={(e) => patch({ chimeVolume: Number(e.target.value) })}
          />
        </label>
      </section>

      <section className="settings-section">
        <h2>Data</h2>
        <p className="settings-data-hint">
          Your tasks, sessions, and settings live in a local SQLite database on this computer. Back it up to a file, or
          restore from one — restoring replaces everything currently saved.
        </p>

        <div className="settings-data-actions">
          <Button variant="secondary" onClick={handleBackup}>
            Backup data
          </Button>
          <Button variant="secondary" onClick={() => setConfirmingRestore(true)} disabled={restoring}>
            {restoring ? 'Restoring…' : 'Restore data'}
          </Button>
        </div>

        {backupStatus && <p className="settings-data-status">{backupStatus}</p>}
      </section>

      {confirmingRestore && (
        <ConfirmDialog
          title="Restore data?"
          message="This replaces all current tasks, sessions, projects, and settings with the contents of the backup file you choose. This can't be undone."
          confirmLabel="Choose file & restore"
          onConfirm={handleRestore}
          onCancel={() => setConfirmingRestore(false)}
        />
      )}
    </div>
  )
}
