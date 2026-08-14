import { useEffect, useMemo } from 'react'
import { useTimerStore } from '../../state/timerStore'
import { useSettingsStore } from '../../state/settingsStore'
import { useTaskStore } from '../../state/taskStore'
import { useSessionStore } from '../../state/sessionStore'
import { useTimerSounds } from '../../hooks/useTimerSounds'
import { DIAL_BACKGROUND_URLS } from '../../assets/backgrounds'
import { groupTasks, isToday } from '../../utils/dateGroups'
import { TimerRing } from './TimerRing'
import { TimerDial } from './TimerDial'
import { TimerFlipClock } from './TimerFlipClock'
import { TimerControls } from './TimerControls'
import { SessionDots } from './SessionDots'
import { TaskSearchBar } from './TaskSearchBar'
import { QuickActionsRow } from './QuickActionsRow'
import { TimerSidebar } from './TimerSidebar'
import { IconButton } from '../shared/IconButton'
import { CollapseIcon } from '../shared/icons'
import './timer.css'

const PHASE_LABEL: Record<string, string> = {
  work: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break'
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface TimerScreenProps {
  focusMode: boolean
  onToggleFocusMode: () => void
}

export function TimerScreen({ focusMode, onToggleFocusMode }: TimerScreenProps) {
  const state = useTimerStore((s) => s.state)
  const selectedTaskId = useTimerStore((s) => s.selectedTaskId)
  const subscribe = useTimerStore((s) => s.subscribe)
  const selectTask = useTimerStore((s) => s.selectTask)
  const start = useTimerStore((s) => s.start)
  const pause = useTimerStore((s) => s.pause)
  const resume = useTimerStore((s) => s.resume)
  const skip = useTimerStore((s) => s.skip)
  const reset = useTimerStore((s) => s.reset)

  const settings = useSettingsStore((s) => s.settings)
  const loadSettings = useSettingsStore((s) => s.load)
  const settingsLoaded = useSettingsStore((s) => s.loaded)
  const saveSettings = useSettingsStore((s) => s.save)

  const tasks = useTaskStore((s) => s.tasks)
  const loadTasks = useTaskStore((s) => s.load)
  const tasksLoaded = useTaskStore((s) => s.loaded)
  const toggleComplete = useTaskStore((s) => s.toggleComplete)

  const sessions = useSessionStore((s) => s.sessions)
  const loadSessions = useSessionStore((s) => s.load)
  const sessionsLoaded = useSessionStore((s) => s.loaded)

  useEffect(() => {
    subscribe()
  }, [subscribe])

  useEffect(() => {
    if (!settingsLoaded) loadSettings()
    if (!tasksLoaded) loadTasks()
    if (!sessionsLoaded) loadSessions()
  }, [settingsLoaded, loadSettings, tasksLoaded, loadTasks, sessionsLoaded, loadSessions])

  useEffect(() => {
    if (!focusMode) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggleFocusMode()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [focusMode, onToggleFocusMode])

  useTimerSounds()

  const todaySessions = useMemo(() => sessions.filter((s) => isToday(s.startedAt)), [sessions])
  const todayFocusSeconds = useMemo(
    () => todaySessions.reduce((sum, s) => sum + s.durationSeconds, 0),
    [todaySessions]
  )
  const todayTasks = useMemo(() => groupTasks(tasks.filter((t) => !t.completed)).today, [tasks])

  const colorVar =
    state.phase === 'work' ? 'var(--work)' : state.phase === 'shortBreak' ? 'var(--short-break)' : 'var(--long-break)'
  const softVar =
    state.phase === 'work'
      ? 'var(--work-soft)'
      : state.phase === 'shortBreak'
        ? 'var(--short-break-soft)'
        : 'var(--long-break-soft)'

  const progress = state.durationSeconds > 0 ? 1 - state.remainingSeconds / state.durationSeconds : 0
  const linkedTask = tasks.find((t) => t.id === state.linkedTaskId)
  const timeLabel = formatTime(state.remainingSeconds)
  const isDial = settings.timerStyle === 'dial'

  const screenClass = [
    'screen',
    'screen-wide',
    'timer-screen',
    isDial && 'timer-screen-dial',
    focusMode && 'timer-screen-focus'
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={screenClass} style={{ ['--phase-color' as string]: colorVar }}>
      {isDial && (
        <>
          <div
            className="timer-dial-bg"
            style={{ backgroundImage: `url(${DIAL_BACKGROUND_URLS[settings.dialBackground]})` }}
          />
          <div className="timer-dial-vignette" />
        </>
      )}

      {focusMode && (
        <IconButton label="Exit focus mode" className="timer-focus-close" onClick={onToggleFocusMode}>
          <CollapseIcon />
        </IconButton>
      )}

      <div className="timer-layout">
        <div className="timer-main">
          {!focusMode && (
            <TaskSearchBar
              tasks={tasks}
              selectedTaskId={state.status === 'idle' ? selectedTaskId : state.linkedTaskId}
              disabled={state.status !== 'idle'}
              onSelect={selectTask}
            />
          )}

          <h1 className="screen-title">{PHASE_LABEL[state.phase]}</h1>

          {settings.timerStyle === 'ring' && (
            <TimerRing
              progress={progress}
              color={colorVar}
              softColor={softVar}
              label={timeLabel}
              sublabel={linkedTask ? linkedTask.title : PHASE_LABEL[state.phase]}
            />
          )}
          {settings.timerStyle === 'dial' && <TimerDial progress={progress} color={colorVar} label={timeLabel} />}
          {settings.timerStyle === 'flip' && <TimerFlipClock remainingSeconds={state.remainingSeconds} />}

          <SessionDots
            sessionsCompleted={state.sessionsCompleted}
            sessionsBeforeLongBreak={settings.sessionsBeforeLongBreak}
            color={colorVar}
          />

          <TimerControls
            status={state.status}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onSkip={skip}
            onReset={reset}
          />

          {!focusMode && (
            <QuickActionsRow
              onFullscreen={onToggleFocusMode}
              timerStyle={settings.timerStyle}
              onCycleStyle={(next) => saveSettings({ ...settings, timerStyle: next })}
              whiteNoiseOn={settings.ambientSound === 'white-noise'}
              onToggleWhiteNoise={() =>
                saveSettings({ ...settings, ambientSound: settings.ambientSound === 'white-noise' ? 'none' : 'white-noise' })
              }
            />
          )}
        </div>

        {!focusMode && (
          <TimerSidebar
            todayFocusSeconds={todayFocusSeconds}
            todaySessions={todaySessions}
            todayTasks={todayTasks}
            onToggleTask={toggleComplete}
          />
        )}
      </div>
    </div>
  )
}
