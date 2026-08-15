import forestUrl from './forest.svg'
import duskUrl from './dusk.svg'
import oceanUrl from './ocean.svg'
import midnightUrl from './midnight.svg'
import blueGalaxyUrl from './dark_blue_galaxy.png'
import ambientUrl from './ambient.svg'
import type { DialBackground } from '@shared/types'

export const DIAL_BACKGROUND_URLS: Record<DialBackground, string> = {
  blueGalaxy: blueGalaxyUrl,
  ambient: ambientUrl,
  forest: forestUrl,
  dusk: duskUrl,
  ocean: oceanUrl,
  midnight: midnightUrl
}

export const DIAL_BACKGROUND_LABELS: Record<DialBackground, string> = {
  blueGalaxy: 'Blue Galaxy',
  ambient: 'Ambient',
  forest: 'Forest',
  dusk: 'Dusk',
  ocean: 'Ocean',
  midnight: 'Midnight'
}
