import { useEffect, useRef } from 'react'

interface UseAmbientLoopOptions {
  volume?: number
}

interface AmbientLoopControls {
  play: () => void
  stop: () => void
  setVolume: (volume: number) => void
}

const VOLUME_RAMP_SECONDS = 0.05
const STOP_FADE_SECONDS = 0.05

// Segments overlap by this much at each loop boundary, one fading out while the
// next fades in, so a waveform discontinuity at the source file's loop point
// (the actual cause of an audible "restart" click) is masked rather than heard.
const CROSSFADE_FRACTION = 0.12
const MIN_CROSSFADE_SECONDS = 0.15
const MAX_CROSSFADE_SECONDS = 0.4
const SCHEDULE_LOOKAHEAD_SECONDS = 1
const SCHEDULE_INTERVAL_MS = 150

// A linear gain fade between two independent (uncorrelated) noise segments loses
// power at the midpoint — 0.5 + 0.5 linearly summed is only half the acoustic
// power, an audible ~3dB dip. An equal-power (constant-power) curve — sin/cos
// quarter-waves — keeps combined power constant through the crossfade so the
// loop boundary reads as continuous instead of a periodic "dip".
const FADE_CURVE_STEPS = 32
const FADE_IN_CURVE = new Float32Array(FADE_CURVE_STEPS)
const FADE_OUT_CURVE = new Float32Array(FADE_CURVE_STEPS)
for (let i = 0; i < FADE_CURVE_STEPS; i++) {
  const theta = (i / (FADE_CURVE_STEPS - 1)) * (Math.PI / 2)
  FADE_IN_CURVE[i] = Math.sin(theta)
  FADE_OUT_CURVE[i] = Math.cos(theta)
}

let sharedCtx: AudioContext | null = null
function getAudioContext(): AudioContext {
  if (!sharedCtx) sharedCtx = new AudioContext()
  return sharedCtx
}

// Decoded buffers are tied to the context they were decoded with; safe to share
// across hook instances/remounts since sharedCtx never changes once created.
const decodeCache = new Map<string, Promise<AudioBuffer>>()
function loadBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  let pending = decodeCache.get(url)
  if (!pending) {
    // XHR (not fetch) — fetch() on a file:// origin is unreliable across Chromium
    // versions in packaged Electron builds; XHR with arraybuffer response works.
    pending = new Promise<ArrayBuffer>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', url)
      xhr.responseType = 'arraybuffer'
      xhr.onload = () => resolve(xhr.response as ArrayBuffer)
      xhr.onerror = () => reject(new Error(`Failed to load audio: ${url}`))
      xhr.send()
    })
      .then((data) => ctx.decodeAudioData(data))
      .catch((err) => {
        decodeCache.delete(url)
        throw err
      })
    decodeCache.set(url, pending)
  }
  return pending
}

interface ActiveSegment {
  source: AudioBufferSourceNode
  gain: GainNode
}

/**
 * Ambient-loop playback via the Web Audio API instead of HTMLAudioElement.
 * Loops the buffer as a chain of overlapping segments, crossfading at each
 * boundary, so the loop reads as one continuous sound instead of restarting.
 */
export function useAmbientLoop(url: string | null, options: UseAmbientLoopOptions = {}): AmbientLoopControls {
  const ctxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const urlRef = useRef(url)
  const volumeRef = useRef(options.volume ?? 1)
  const playRequestedRef = useRef(false)

  const activeSegmentsRef = useRef<ActiveSegment[]>([])
  const nextStartTimeRef = useRef(0)
  const crossfadeRef = useRef(0)
  const schedulerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  urlRef.current = url

  const rampGainTo = (value: number): void => {
    const ctx = ctxRef.current
    const gain = gainRef.current
    if (!ctx || !gain) return
    const now = ctx.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(value, now + VOLUME_RAMP_SECONDS)
  }

  const scheduleSegment = (buffer: AudioBuffer, startTime: number): void => {
    const ctx = ctxRef.current
    const masterGain = gainRef.current
    if (!ctx || !masterGain) return
    const crossfade = crossfadeRef.current
    const duration = buffer.duration

    const source = ctx.createBufferSource()
    source.buffer = buffer
    const segmentGain = ctx.createGain()
    source.connect(segmentGain)
    segmentGain.connect(masterGain)

    segmentGain.gain.setValueCurveAtTime(FADE_IN_CURVE, startTime, crossfade)
    segmentGain.gain.setValueCurveAtTime(FADE_OUT_CURVE, startTime + duration - crossfade, crossfade)

    source.start(startTime)
    source.stop(startTime + duration + 0.05)

    const entry: ActiveSegment = { source, gain: segmentGain }
    activeSegmentsRef.current.push(entry)
    source.onended = () => {
      source.disconnect()
      segmentGain.disconnect()
      activeSegmentsRef.current = activeSegmentsRef.current.filter((e) => e !== entry)
    }
  }

  const runScheduler = (buffer: AudioBuffer): void => {
    const ctx = ctxRef.current
    if (!ctx) return
    const advance = buffer.duration - crossfadeRef.current
    while (nextStartTimeRef.current < ctx.currentTime + SCHEDULE_LOOKAHEAD_SECONDS) {
      scheduleSegment(buffer, nextStartTimeRef.current)
      nextStartTimeRef.current += advance
    }
  }

  const startLoop = (buffer: AudioBuffer): void => {
    if (schedulerRef.current || activeSegmentsRef.current.length > 0) return
    const ctx = ctxRef.current
    if (!ctx) return
    crossfadeRef.current = Math.min(
      MAX_CROSSFADE_SECONDS,
      Math.max(MIN_CROSSFADE_SECONDS, buffer.duration * CROSSFADE_FRACTION),
      buffer.duration / 2
    )
    nextStartTimeRef.current = ctx.currentTime + 0.05
    runScheduler(buffer)
    schedulerRef.current = setInterval(() => runScheduler(buffer), SCHEDULE_INTERVAL_MS)
  }

  const stopLoop = (): void => {
    if (schedulerRef.current) {
      clearInterval(schedulerRef.current)
      schedulerRef.current = null
    }
    const ctx = ctxRef.current
    const segments = activeSegmentsRef.current
    activeSegmentsRef.current = []
    if (!ctx) return
    const now = ctx.currentTime
    for (const { source, gain } of segments) {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(gain.gain.value, now)
      gain.gain.linearRampToValueAtTime(0, now + STOP_FADE_SECONDS)
      try {
        source.stop(now + STOP_FADE_SECONDS)
      } catch {
        // already scheduled to stop — ignore
      }
    }
  }

  useEffect(() => {
    const ctx = getAudioContext()
    const gain = ctx.createGain()
    gain.gain.value = volumeRef.current
    gain.connect(ctx.destination)
    ctxRef.current = ctx
    gainRef.current = gain
    return () => {
      stopLoop()
      gain.disconnect()
      gainRef.current = null
      ctxRef.current = null
    }
  }, [])

  useEffect(() => {
    stopLoop()
    bufferRef.current = null
    if (!url) return
    const ctx = ctxRef.current
    if (!ctx) return
    let cancelled = false
    loadBuffer(ctx, url)
      .then((buffer) => {
        if (cancelled || urlRef.current !== url) return
        bufferRef.current = buffer
        if (playRequestedRef.current) startLoop(buffer)
      })
      .catch(() => {
        // load/decode failure — leave silent
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  useEffect(() => {
    volumeRef.current = options.volume ?? 1
    rampGainTo(volumeRef.current)
  }, [options.volume])

  return {
    play: () => {
      const ctx = ctxRef.current
      if (!ctx || !url) return
      if (ctx.state === 'suspended') {
        void ctx.resume().catch(() => {
          // autoplay policy may reject resume before a user gesture — safe to ignore
        })
      }
      playRequestedRef.current = true
      if (bufferRef.current) startLoop(bufferRef.current)
    },
    stop: () => {
      playRequestedRef.current = false
      stopLoop()
    },
    setVolume: (volume: number) => {
      volumeRef.current = volume
      rampGainTo(volume)
    }
  }
}
