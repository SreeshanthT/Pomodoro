import { describe, expect, it } from 'vitest'
import { dayFraction, formatFocusDuration } from './time'

describe('formatFocusDuration', () => {
  it('formats sub-hour durations as minutes only', () => {
    expect(formatFocusDuration(0)).toBe('0m')
    expect(formatFocusDuration(90)).toBe('2m')
    expect(formatFocusDuration(59 * 60)).toBe('59m')
  })

  it('formats hour-plus durations as hours and minutes', () => {
    expect(formatFocusDuration(60 * 60)).toBe('1h 0m')
    expect(formatFocusDuration(90 * 60)).toBe('1h 30m')
    expect(formatFocusDuration(125 * 60)).toBe('2h 5m')
  })

  it('rounds to the nearest minute', () => {
    expect(formatFocusDuration(29)).toBe('0m')
    expect(formatFocusDuration(31)).toBe('1m')
  })
})

describe('dayFraction', () => {
  it('returns 0 at midnight', () => {
    expect(dayFraction('2026-01-01T00:00:00')).toBe(0)
  })

  it('returns 0.5 at noon', () => {
    expect(dayFraction('2026-01-01T12:00:00')).toBe(0.5)
  })

  it('returns a value approaching 1 near end of day', () => {
    expect(dayFraction('2026-01-01T23:59:59')).toBeCloseTo(1, 4)
  })
})
