import tickUrl from './tick.wav'
import rainUrl from './rain.wav'
import whiteNoiseUrl from './white-noise.wav'
import chimeBellUrl from './chime-bell.wav'
import chimeDigitalUrl from './chime-digital.wav'
import chimeSoftBellUrl from './chime-soft-bell.wav'
import type { ChimeChoice, SoundChoice } from '@shared/types'

export const AMBIENT_SOUND_URLS: Record<Exclude<SoundChoice, 'none'>, string> = {
  tick: tickUrl,
  rain: rainUrl,
  'white-noise': whiteNoiseUrl
}

export const CHIME_SOUND_URLS: Record<ChimeChoice, string> = {
  bell: chimeBellUrl,
  digital: chimeDigitalUrl,
  'soft-bell': chimeSoftBellUrl
}
