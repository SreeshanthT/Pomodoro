import { useState } from 'react'
import type { Project, TaskGroup } from '@shared/types'
import { CalendarIcon, CheckCircleIcon, InboxIcon, PlusIcon, SearchIcon, SunIcon, TrashIcon } from '../shared/icons'

const VIEWS: { key: TaskGroup; label: string; Icon: typeof SunIcon }[] = [
  { key: 'today', label: 'Today', Icon: SunIcon },
  { key: 'tomorrow', label: 'Tomorrow', Icon: CalendarIcon },
  { key: 'thisWeek', label: 'This Week', Icon: CalendarIcon },
  { key: 'planned', label: 'Planned', Icon: CalendarIcon },
  { key: 'completed', label: 'Completed', Icon: CheckCircleIcon },
  { key: 'all', label: 'Tasks', Icon: InboxIcon }
]

const PROJECT_COLORS = ['#3555db', '#2fbf8f', '#f98c5e', '#e64848', '#799ae3', '#5b73d7']

interface TaskSidebarProps {
  active: TaskGroup
  counts: Record<TaskGroup, number>
  onChangeView: (group: TaskGroup) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  projects: Project[]
  activeProjectId: string | null
  onSelectProject: (id: string | null) => void
  onAddProject: (name: string, color: string) => void
  onDeleteProject: (id: string) => void
}

export function TaskSidebar({
  active,
  counts,
  onChangeView,
  searchQuery,
  onSearchChange,
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onDeleteProject
}: TaskSidebarProps) {
  const [addingProject, setAddingProject] = useState(false)
  const [projectName, setProjectName] = useState('')

  const submitProject = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = projectName.trim()
    if (!trimmed) {
      setAddingProject(false)
      return
    }
    const color = PROJECT_COLORS[projects.length % PROJECT_COLORS.length]
    onAddProject(trimmed, color)
    setProjectName('')
    setAddingProject(false)
  }

  return (
    <aside className="task-sidebar">
      <div className="task-sidebar-search">
        <SearchIcon />
        <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
      </div>

      <nav className="task-sidebar-nav">
        {VIEWS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`task-sidebar-item${active === key && !activeProjectId ? ' active' : ''}`}
            onClick={() => {
              onSelectProject(null)
              onChangeView(key)
            }}
          >
            <Icon />
            <span>{label}</span>
            {counts[key] > 0 && <span className="task-sidebar-count">{counts[key]}</span>}
          </button>
        ))}
      </nav>

      <div className="task-sidebar-projects">
        <span className="task-sidebar-heading">Projects</span>
        {projects.map((project) => (
          <div
            key={project.id}
            className={`task-sidebar-item task-sidebar-project${activeProjectId === project.id ? ' active' : ''}`}
          >
            <button className="task-sidebar-project-btn" onClick={() => onSelectProject(project.id)}>
              <span className="task-sidebar-dot" style={{ background: project.color }} />
              <span>{project.name}</span>
            </button>
            <button
              className="task-sidebar-project-delete"
              onClick={() => onDeleteProject(project.id)}
              aria-label={`Delete ${project.name}`}
            >
              <TrashIcon />
            </button>
          </div>
        ))}

        {addingProject ? (
          <form className="task-sidebar-add-project-form" onSubmit={submitProject}>
            <input
              autoFocus
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={submitProject}
              placeholder="Project name"
            />
          </form>
        ) : (
          <button className="task-sidebar-add-project" onClick={() => setAddingProject(true)}>
            <PlusIcon />
            <span>Add Project</span>
          </button>
        )}
      </div>
    </aside>
  )
}
