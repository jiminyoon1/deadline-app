import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'

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
  const filePath = filePathForDate(date)
  if (!fs.existsSync(filePath)) {
    return null
  }
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw)
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
