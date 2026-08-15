import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addDaysToIso, groupTasksByDate, isOverdue, isToday, sortTasks, todayIso, tomorrowIso } from './dateGroups'
import type { Task } from '@shared/types'

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? Math.random().toString(36),
    title: 'Task',
    dueDate: todayIso(),
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
    estimatedPomodoros: 1,
    completedPomodoros: 0,
    priority: false,
    subtasks: [],
    recurrence: null,
    projectId: null,
    order: 0,
    ...overrides
  }
}

// Fixed "now" so date bucketing is deterministic: Wednesday 2026-01-14.
const FIXED_NOW = new Date('2026-01-14T12:00:00')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('todayIso / tomorrowIso', () => {
  it('reflects the current system date', () => {
    expect(todayIso()).toBe('2026-01-14')
    expect(tomorrowIso()).toBe('2026-01-15')
  })
})

describe('addDaysToIso', () => {
  it('adds days without drifting across month boundaries', () => {
    expect(addDaysToIso('2026-01-30', 3)).toBe('2026-02-02')
  })

  it('supports negative offsets', () => {
    expect(addDaysToIso('2026-01-14', -1)).toBe('2026-01-13')
  })
})

describe('isToday', () => {
  it('is true for a timestamp on the current date', () => {
    expect(isToday('2026-01-14T08:00:00')).toBe(true)
  })

  it('is false for a timestamp on a different date', () => {
    expect(isToday('2026-01-13T23:59:59')).toBe(false)
  })
})

describe('isOverdue', () => {
  it('is true for an incomplete task due before today', () => {
    expect(isOverdue({ completed: false, dueDate: '2026-01-13' })).toBe(true)
  })

  it('is false for a completed task due before today', () => {
    expect(isOverdue({ completed: true, dueDate: '2026-01-13' })).toBe(false)
  })

  it('is false for a task due today or later', () => {
    expect(isOverdue({ completed: false, dueDate: '2026-01-14' })).toBe(false)
    expect(isOverdue({ completed: false, dueDate: '2026-01-15' })).toBe(false)
  })
})

describe('groupTasksByDate', () => {
  it('buckets overdue tasks into today so nothing gets lost', () => {
    const overdue = makeTask({ dueDate: '2026-01-10' })
    const groups = groupTasksByDate([overdue])
    expect(groups.today).toContain(overdue)
  })

  it('buckets tasks into today/tomorrow/thisWeek/planned', () => {
    const today = makeTask({ id: 'today', dueDate: '2026-01-14' })
    const tomorrow = makeTask({ id: 'tomorrow', dueDate: '2026-01-15' })
    const thisWeek = makeTask({ id: 'thisWeek', dueDate: '2026-01-18' })
    const planned = makeTask({ id: 'planned', dueDate: '2026-02-01' })

    const groups = groupTasksByDate([today, tomorrow, thisWeek, planned])

    expect(groups.today.map((t) => t.id)).toEqual(['today'])
    expect(groups.tomorrow.map((t) => t.id)).toEqual(['tomorrow'])
    expect(groups.thisWeek.map((t) => t.id)).toEqual(['thisWeek'])
    expect(groups.planned.map((t) => t.id)).toEqual(['planned'])
  })
})

describe('sortTasks', () => {
  it('sorts priority tasks first, then by manual order, then by due date', () => {
    const low = makeTask({ id: 'low', priority: false, order: 1, dueDate: '2026-01-14' })
    const high = makeTask({ id: 'high', priority: true, order: 2, dueDate: '2026-01-20' })
    const earlierLow = makeTask({ id: 'earlierLow', priority: false, order: 1, dueDate: '2026-01-13' })

    const sorted = sortTasks([low, high, earlierLow])

    expect(sorted.map((t) => t.id)).toEqual(['high', 'earlierLow', 'low'])
  })
})
