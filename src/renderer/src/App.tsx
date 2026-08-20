import { useState } from 'react'
import { TimerScreen } from './components/timer/TimerScreen'
import { TodoScreen } from './components/todo/TodoScreen'
import { SettingsScreen } from './components/settings/SettingsScreen'
import { MiniTimerBar } from './components/timer/MiniTimerBar'
import { ToastContainer } from './components/shared/ToastContainer'
import { ChecklistIcon, SettingsIcon } from './components/shared/icons'
import { useTimerSounds } from './hooks/useTimerSounds'

type Screen = 'timer' | 'todo' | 'settings'

const RAIL_ITEMS: { key: Screen; label: string; Icon: typeof ChecklistIcon }[] = [
  { key: 'todo', label: 'Tasks', Icon: ChecklistIcon },
  { key: 'settings', label: 'Settings', Icon: SettingsIcon }
]

export function App() {
  const [screen, setScreen] = useState<Screen>('timer')
  const [timerMinimized, setTimerMinimized] = useState(false)
  const [previousScreen, setPreviousScreen] = useState<Screen>('todo')

  useTimerSounds()

  const showingFullTimer = screen === 'timer' && !timerMinimized
  const showRail = !showingFullTimer

  const minimizeTimer = () => {
    setTimerMinimized(true)
    if (screen === 'timer') setScreen(previousScreen)
  }

  const restoreTimer = () => {
    setPreviousScreen(screen)
    setTimerMinimized(false)
    setScreen('timer')
  }

  return (
    <div className="app-shell">
      {showRail && (
        <nav className="app-rail">
          {RAIL_ITEMS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`app-rail-item${screen === key ? ' active' : ''}`}
              onClick={() => setScreen(key)}
              title={label}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}

      <div className="app-content">
        {screen === 'timer' && <TimerScreen onMinimize={minimizeTimer} />}
        {screen === 'todo' && <TodoScreen />}
        {screen === 'settings' && <SettingsScreen />}
      </div>

      {timerMinimized && <MiniTimerBar onExpand={restoreTimer} />}

      <ToastContainer />
    </div>
  )
}
