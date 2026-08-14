import { useEffect, useRef } from 'react'
import { useTimerStore } from '../state/timerStore'
import { useSettingsStore } from '../state/settingsStore'
import { AMBIENT_SOUND_URLS, CHIME_SOUND_URLS } from '../assets/sounds'
import { useSound } from './useSound'

/** Wires the running timer's phase transitions to ambient + chime playback per the current settings. */
export function useTimerSounds(): void {
  const status = useTimerStore((s) => s.state.status)
  const phase = useTimerStore((s) => s.state.phase)
  const lastSessionEvent = useTimerStore((s) => s.lastSessionEvent)
  const settings = useSettingsStore((s) => s.settings)

  const ambientUrl = settings.ambientSound === 'none' ? null : AMBIENT_SOUND_URLS[settings.ambientSound]
  const ambient = useSound(ambientUrl, { loop: true, volume: settings.ambientVolume })
  const chime = useSound(CHIME_SOUND_URLS[settings.chimeSound], { volume: settings.chimeVolume })

  useEffect(() => {
    if (status === 'running' && phase === 'work' && ambientUrl) ambient.play()
    else ambient.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, phase, ambientUrl])

  const lastEventRef = useRef(lastSessionEvent)
  useEffect(() => {
    if (lastSessionEvent && lastSessionEvent !== lastEventRef.current) {
      chime.play()
      lastEventRef.current = lastSessionEvent
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSessionEvent])
}
