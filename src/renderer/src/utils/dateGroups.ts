import type { Task } from '@shared/types'

type DateBucket = 'today' | 'tomorrow' | 'thisWeek' | 'planned'

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDaysIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

export function todayIso(): string {
  return toIsoDate(new Date())
}

export function tomorrowIso(): string {
  return addDaysIso(1)
}

/** A date that always buckets as "this week" — used as the quick-add default while on that view. */
export function thisWeekDefaultIso(): string {
  return addDaysIso(3)
}

/** A date that always buckets as "planned" — used as the quick-add default while on that view. */
export function plannedDefaultIso(): string {
  return addDaysIso(8)
}

export function addDaysToIso(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

export function isToday(isoDateTime: string): boolean {
  return toIsoDate(new Date(isoDateTime)) === todayIso()
}

export function isOverdue(task: Pick<Task, 'completed' | 'dueDate'>): boolean {
  return !task.completed && task.dueDate < todayIso()
}

/** Buckets a due date relative to "now" — overdue tasks fall into Today so nothing gets lost. */
function bucketForDueDate(dueDate: string): DateBucket {
  const today = todayIso()
  const tomorrow = tomorrowIso()
  const weekEnd = addDaysIso(7)
  if (dueDate <= today) return 'today'
  if (dueDate === tomorrow) return 'tomorrow'
  if (dueDate <= weekEnd) return 'thisWeek'
  return 'planned'
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => Number(b.priority) - Number(a.priority) || a.order - b.order || a.dueDate.localeCompare(b.dueDate)
  )
}

/** Buckets incomplete tasks into the four date-based views (Today/Tomorrow/This Week/Planned). */
export function groupTasksByDate(tasks: Task[]): Record<DateBucket, Task[]> {
  const groups: Record<DateBucket, Task[]> = { today: [], tomorrow: [], thisWeek: [], planned: [] }
  for (const task of tasks) {
    groups[bucketForDueDate(task.dueDate)].push(task)
  }
  for (const key of Object.keys(groups) as DateBucket[]) {
    groups[key] = sortTasks(groups[key])
  }
  return groups
}

export { sortTasks }
