import { useEffect, useMemo } from 'react'
import { useTaskStore } from '../state/taskStore'
import { groupTasks } from '../utils/dateGroups'

export function useTasks() {
  const tasks = useTaskStore((s) => s.tasks)
  const loaded = useTaskStore((s) => s.loaded)
  const load = useTaskStore((s) => s.load)

  useEffect(() => {
    if (!loaded) load()
  }, [loaded, load])

  const groups = useMemo(() => groupTasks(tasks.filter((t) => !t.completed)), [tasks])

  return { tasks, groups, loaded }
}
