import { useEffect, useMemo } from 'react'
import type { Task, TaskGroup } from '@shared/types'
import { useTaskStore } from '../state/taskStore'
import { groupTasksByDate, sortTasks } from '../utils/dateGroups'

export function useTasks() {
  const tasks = useTaskStore((s) => s.tasks)
  const loaded = useTaskStore((s) => s.loaded)
  const load = useTaskStore((s) => s.load)

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
  }, [tasks])

  return { tasks, groups, loaded }
}
