import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { readJsonSafe } from './safeJson'

const DEFAULT_SETTINGS = {
  flowmodoroEnabled: false,
  restBetweenTasksMinutes: 5,
  alarmSoundEnabled: true,
  autoCarryOverEnabled: false
}

function settingsFilePath() {
  return join(app.getPath('userData'), 'settings.json')
}

export function readSettings() {
  return { ...DEFAULT_SETTINGS, ...readJsonSafe(settingsFilePath(), {}) }
}

export function writeSettings(settings) {
  fs.writeFileSync(settingsFilePath(), JSON.stringify(settings, null, 2), 'utf-8')
}
