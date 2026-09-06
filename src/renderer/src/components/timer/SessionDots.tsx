interface SessionDotsProps {
  sessionsCompleted: number
  sessionsBeforeLongBreak: number
  color: string
}

export function SessionDots({ sessionsCompleted, sessionsBeforeLongBreak, color }: SessionDotsProps) {
  const positionInCycle = sessionsCompleted % sessionsBeforeLongBreak
  return (
    <div
      className="session-dots"
      aria-label={`${positionInCycle} of ${sessionsBeforeLongBreak} sessions until long break`}
    >
      {Array.from({ length: sessionsBeforeLongBreak }).map((_, i) => (
        <span key={i} className="session-dot" style={{ background: i < positionInCycle ? color : undefined }} />
      ))}
    </div>
  )
}
