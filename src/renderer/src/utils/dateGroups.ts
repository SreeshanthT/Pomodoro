import type { Task, TaskGroup } from '@shared/types'

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayIso(): string {
  return toIsoDate(new Date())
}

export function tomorrowIso(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return toIsoDate(d)
}

/** A date that always buckets as "upcoming" — used as the quick-add default while on that tab. */
export function upcomingDefaultIso(): string {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  return toIsoDate(d)
}

export function isToday(isoDateTime: string): boolean {
  return toIsoDate(new Date(isoDateTime)) === todayIso()
}

/** Buckets a due date relative to "now" — overdue tasks fall into Today so nothing gets lost. */
export function groupForDueDate(dueDate: string): TaskGroup {
  const today = todayIso()
  const tomorrow = tomorrowIso()
  if (dueDate <= today) return 'today'
  if (dueDate === tomorrow) return 'tomorrow'
  return 'upcoming'
}

export function groupTasks(tasks: Task[]): Record<TaskGroup, Task[]> {
  const groups: Record<TaskGroup, Task[]> = { today: [], tomorrow: [], upcoming: [] }
  for (const task of tasks) {
    groups[groupForDueDate(task.dueDate)].push(task)
  }
  for (const group of Object.values(groups)) {
    group.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.createdAt.localeCompare(b.createdAt))
  }
  return groups
}
