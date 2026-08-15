import { useRef, useState } from 'react'
import { PlusIcon } from '../shared/icons'

interface TaskQuickAddProps {
  groupLabel: string
  onAdd: (title: string) => Promise<void>
}

export function TaskQuickAdd({ groupLabel, onAdd }: TaskQuickAddProps) {
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    try {
      await onAdd(trimmed)
      setTitle('')
    } catch (err) {
      console.error('Failed to add task', err)
    } finally {
      inputRef.current?.focus()
    }
  }

  return (
    <form className="task-quick-add" onSubmit={handleSubmit}>
      <PlusIcon className="task-quick-add-icon" />
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={`Add a task to "${groupLabel}"...`}
      />
    </form>
  )
}
