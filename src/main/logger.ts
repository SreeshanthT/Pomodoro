import log from 'electron-log/main'

/** Sets up file + console logging and installs global handlers for uncaught exceptions and
 *  unhandled rejections in the main process. Without this, every error path in the app either
 *  goes to console.error (invisible once the app isn't launched from a terminal) or is silently
 *  swallowed, leaving field failures undiagnosable. */
export function initLogger(): void {
  log.initialize()
  log.errorHandler.startCatching()
}

export { log }
