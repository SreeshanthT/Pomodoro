import { useEffect, useMemo } from 'react'
import { useTimerStore } from '../../state/timerStore'
import { useSettingsStore } from '../../state/settingsStore'
import { useTaskStore } from '../../state/taskStore'
import { useSessionStore } from '../../state/sessionStore'
import { useTimerSounds } from '../../hooks/useTimerSounds'
import { platform } from '../../adapters/electronAdapter'
import { DIAL_BACKGROUND_URLS } from '../../assets/backgrounds'
import { groupTasks, isToday } from '../../utils/dateGroups'
import { TimerDial } from './TimerDial'
import { TimerControls } from './TimerControls'
import { SessionDots } from './SessionDots'
import { TaskSearchBar } from './TaskSearchBar'
import { QuickActionsRow } from './QuickActionsRow'
import { TimerSidebar } from './TimerSidebar'
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

export function TimerScreen() {
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

  useTimerSounds()

  const todaySessions = useMemo(() => sessions.filter((s) => isToday(s.startedAt)), [sessions])
  const todayFocusSeconds = useMemo(
    () => todaySessions.reduce((sum, s) => sum + s.durationSeconds, 0),
    [todaySessions]
  )
  const todayTasks = useMemo(() => groupTasks(tasks.filter((t) => !t.completed)).today, [tasks])

  const colorVar =
    state.phase === 'work' ? 'var(--work)' : state.phase === 'shortBreak' ? 'var(--short-break)' : 'var(--long-break)'

  const progress = state.durationSeconds > 0 ? 1 - state.remainingSeconds / state.durationSeconds : 0
  const timeLabel = formatTime(state.remainingSeconds)

  return (
    <div className="screen screen-wide timer-screen timer-screen-dial" style={{ ['--phase-color' as string]: colorVar }}>
      <div
        className="timer-dial-bg"
        style={{ backgroundImage: `url(${DIAL_BACKGROUND_URLS[settings.dialBackground]})` }}
      />
      <div className="timer-dial-vignette" />

      <div className="timer-layout">
        <div className="timer-main">
          <TaskSearchBar
            tasks={tasks}
            selectedTaskId={state.status === 'idle' ? selectedTaskId : state.linkedTaskId}
            disabled={state.status !== 'idle'}
            onSelect={selectTask}
          />

          <h1 className="screen-title">{PHASE_LABEL[state.phase]}</h1>

          <TimerDial progress={progress} color={colorVar} label={timeLabel} />

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

          <QuickActionsRow
            onFullscreen={() => platform.windows.openFocus()}
            whiteNoiseOn={settings.ambientSound === 'white-noise'}
            onToggleWhiteNoise={() =>
              saveSettings({ ...settings, ambientSound: settings.ambientSound === 'white-noise' ? 'none' : 'white-noise' })
            }
          />
        </div>

        <TimerSidebar
          todayFocusSeconds={todayFocusSeconds}
          todaySessions={todaySessions}
          todayTasks={todayTasks}
          onToggleTask={toggleComplete}
        />
      </div>
    </div>
  )
}
