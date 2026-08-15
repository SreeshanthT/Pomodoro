interface TaskBulkToolbarProps {
  count: number
  onComplete: () => void
  onDelete: () => void
  onCancel: () => void
}

export function TaskBulkToolbar({ count, onComplete, onDelete, onCancel }: TaskBulkToolbarProps) {
  if (count === 0) return null

  return (
    <div className="task-bulk-toolbar">
      <span>{count} selected</span>
      <div className="task-bulk-actions">
        <button onClick={onComplete}>Complete</button>
        <button onClick={onDelete}>Delete</button>
        <button className="task-bulk-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
