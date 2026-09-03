import { useEffect, useMemo, useState } from 'react'
import type { Task, TaskGroup } from '@shared/types'
import { useTaskStore } from '../state/taskStore'
import { groupTasksByDate, sortTasks, todayIso } from '../utils/dateGroups'

const DATE_POLL_MS = 60_000

/** Today/Tomorrow/etc. bucketing depends on wall-clock date, not just task data — poll for the
 *  date rolling over so a task due "tomorrow" moves into "Today" without needing a reload. */
function useCurrentDate(): string {
  const [date, setDate] = useState(todayIso)
  useEffect(() => {
    const id = setInterval(() => {
      setDate((prev) => {
        const now = todayIso()
        return now === prev ? prev : now
      })
    }, DATE_POLL_MS)
    return () => clearInterval(id)
  }, [])
  return date
}

export function useTasks() {
  const tasks = useTaskStore((s) => s.tasks)
  const loaded = useTaskStore((s) => s.loaded)
  const load = useTaskStore((s) => s.load)
  const currentDate = useCurrentDate()

  useEffect(() => {
    if (!loaded) load()
  }, [loaded, load])

  const groups = useMemo(() => {
    const incomplete = tasks.filter((t) => !t.completed)
    const completed = tasks.filter((t) => t.completed)
    const dateBuckets = groupTasksByDate(incomplete)
    const result: Record<TaskGroup, Task[]> = {
      ...dateBuckets,
      all: sortTasks(incomplete),
      completed: [...completed].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    }
    return result
  }, [tasks, currentDate])

  return { tasks, groups, loaded }
}
