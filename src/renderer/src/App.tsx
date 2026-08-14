import { useState } from 'react'
import { TimerScreen } from './components/timer/TimerScreen'
import { TodoScreen } from './components/todo/TodoScreen'
import { SettingsScreen } from './components/settings/SettingsScreen'
import { TimerIcon, ChecklistIcon, SettingsIcon } from './components/shared/icons'

type Screen = 'timer' | 'todo' | 'settings'

const SCREENS: { key: Screen; label: string; Icon: typeof TimerIcon }[] = [
  { key: 'timer', label: 'Timer', Icon: TimerIcon },
  { key: 'todo', label: 'Tasks', Icon: ChecklistIcon },
  { key: 'settings', label: 'Settings', Icon: SettingsIcon }
]

export function App() {
  const [screen, setScreen] = useState<Screen>('timer')

  return (
    <div className="app-shell">
      <nav className="app-rail">
        {SCREENS.map(({ key, label, Icon }) => (
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

      <div className="app-content">
        {screen === 'timer' && <TimerScreen />}
        {screen === 'todo' && <TodoScreen />}
        {screen === 'settings' && <SettingsScreen />}
      </div>
    </div>
  )
}
