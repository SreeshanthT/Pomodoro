import type { TaskGroup } from '@shared/types'

const TABS: { key: TaskGroup; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'upcoming', label: 'Upcoming' }
]

interface TaskGroupTabsProps {
  active: TaskGroup
  counts: Record<TaskGroup, number>
  onChange: (group: TaskGroup) => void
}

export function TaskGroupTabs({ active, counts, onChange }: TaskGroupTabsProps) {
  return (
    <div className="task-group-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`task-group-tab${active === tab.key ? ' active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
          {counts[tab.key] > 0 && <span className="task-group-count">{counts[tab.key]}</span>}
        </button>
      ))}
    </div>
  )
}
