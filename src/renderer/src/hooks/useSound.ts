import { useEffect, useRef } from 'react'

interface UseSoundOptions {
  loop?: boolean
  volume?: number
}

interface SoundControls {
  play: () => void
  stop: () => void
  setVolume: (volume: number) => void
}

/** Wraps a single HTMLAudioElement per url/loop combination for ambient or one-shot playback. */
export function useSound(url: string | null, options: UseSoundOptions = {}): SoundControls {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!url) {
      audioRef.current = null
      return
    }
    const audio = new Audio(url)
    audio.loop = options.loop ?? false
    audio.volume = options.volume ?? 1
    audioRef.current = audio
    return () => {
      audio.pause()
      audioRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, options.loop])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = options.volume ?? 1
  }, [options.volume])

  return {
    play: () => {
      const audio = audioRef.current
      if (!audio) return
      audio.currentTime = 0
      void audio.play().catch(() => {
        // playback can be rejected before the first user gesture — safe to ignore
      })
    },
    stop: () => {
      const audio = audioRef.current
      if (!audio) return
      audio.pause()
      audio.currentTime = 0
    },
    setVolume: (volume: number) => {
      if (audioRef.current) audioRef.current.volume = volume
    }
  }
}
