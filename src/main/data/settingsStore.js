import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'

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
  const filePath = settingsFilePath()
  if (!fs.existsSync(filePath)) {
    return { ...DEFAULT_SETTINGS }
  }
  const raw = fs.readFileSync(filePath, 'utf-8')
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
}

export function writeSettings(settings) {
  fs.writeFileSync(settingsFilePath(), JSON.stringify(settings, null, 2), 'utf-8')
}
