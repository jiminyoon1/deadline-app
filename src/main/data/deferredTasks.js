import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'

function deferredDir() {
  const dir = join(app.getPath('userData'), 'deferred')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

function filePathForDate(date) {
  return join(deferredDir(), `${date}.json`)
}

export function readDeferredTasks(date) {
  const filePath = filePathForDate(date)
  if (!fs.existsSync(filePath)) {
    return []
  }
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw)
}

export function appendDeferredTask(date, task) {
  const list = readDeferredTasks(date)
  list.push(task)
  fs.writeFileSync(filePathForDate(date), JSON.stringify(list, null, 2), 'utf-8')
}

export function clearDeferredTasks(date) {
  const filePath = filePathForDate(date)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}
