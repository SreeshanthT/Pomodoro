import { contextBridge, ipcRenderer } from 'electron'
import type { TimerState } from '@shared/types'

// Exposed to the focus and mini windows only. They're a standalone timer view and a compact
// frameless widget respectively - neither has any business reaching task/project/settings/backup
// data or other destructive IPC channels, even though they share the same renderer bundle as the
// main window. Keep this in sync with what useTimerState/MiniApp/FocusApp actually call.
const api = {
  windows: {
    openFocus: (): Promise<void> => ipcRenderer.invoke('windows:openFocus'),
    openMini: (): Promise<void> => ipcRenderer.invoke('windows:openMini')
  },
  timer: {
    getState: (): Promise<TimerState> => ipcRenderer.invoke('timer:getState'),
    start: (taskId: string | null): Promise<void> => ipcRenderer.invoke('timer:start', taskId),
    pause: (): Promise<void> => ipcRenderer.invoke('timer:pause'),
    resume: (): Promise<void> => ipcRenderer.invoke('timer:resume'),
    onTick: (callback: (state: TimerState) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, state: TimerState): void => callback(state)
      ipcRenderer.on('timer:tick', listener)
      return () => ipcRenderer.removeListener('timer:tick', listener)
    }
  }
}

export type RestrictedApi = typeof api

contextBridge.exposeInMainWorld('api', api)
