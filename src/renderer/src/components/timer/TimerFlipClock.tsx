import { useEffect, useState } from 'react'
import './flipClock.css'

const FLIP_DURATION_MS = 400

function FlipUnit({ value }: { value: string }) {
  const [current, setCurrent] = useState(value)
  const [previous, setPrevious] = useState(value)
  const [flipping, setFlipping] = useState(false)

  useEffect(() => {
    if (value === current) return
    setPrevious(current)
    setCurrent(value)
    setFlipping(true)
    const timeout = setTimeout(() => setFlipping(false), FLIP_DURATION_MS)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="flip-unit">
      <div className="flip-half flip-half-top">
        <span className="flip-digit">{current}</span>
      </div>
      <div className="flip-half flip-half-bottom">
        <span className="flip-digit">{current}</span>
      </div>

      {flipping && (
        <>
          <div className="flip-half flip-half-top flip-leaf-top">
            <span className="flip-digit">{previous}</span>
          </div>
          <div className="flip-half flip-half-bottom flip-leaf-bottom">
            <span className="flip-digit">{current}</span>
          </div>
        </>
      )}
    </div>
  )
}

interface TimerFlipClockProps {
  totalSeconds: number
}

export function TimerFlipClock({ totalSeconds }: TimerFlipClockProps) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return (
    <div className="flip-clock">
      <FlipUnit value={String(minutes).padStart(2, '0')} />
      <FlipUnit value={String(seconds).padStart(2, '0')} />
    </div>
  )
}
