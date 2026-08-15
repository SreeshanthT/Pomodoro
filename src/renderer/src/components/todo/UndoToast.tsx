interface UndoToastProps {
  message: string
  onUndo: () => void
}

export function UndoToast({ message, onUndo }: UndoToastProps) {
  return (
    <div className="undo-toast">
      <span>{message}</span>
      <button onClick={onUndo}>Undo</button>
    </div>
  )
}
