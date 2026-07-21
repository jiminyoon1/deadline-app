import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { readJsonSafe } from './safeJson'

function recordsDir() {
  const dir = join(app.getPath('userData'), 'records')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

function filePathForDate(date) {
  return join(recordsDir(), `${date}.json`)
}

export function readRecord(date) {
  return readJsonSafe(filePathForDate(date), null)
}

export function writeRecord(date, record) {
  const filePath = filePathForDate(date)
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8')
}

export function listRecordDates() {
  const dir = recordsDir()
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.replace(/\.json$/, ''))
    .sort()
}

export function readAllRecords() {
  return listRecordDates()
    .map((date) => readRecord(date))
    .filter(Boolean)
}
