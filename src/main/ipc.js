import { ipcMain } from 'electron'
import { sessionStore } from './store/sessionStore'
import { readRecord, readAllRecords, listRecordDates } from './data/records'
import {
  showWidgetWindow,
  hideWidgetWindow,
  setWidgetMode,
  setWidgetHintVisible,
  getWidgetPosition,
  moveWidgetTo
} from './windows/widgetWindow'

export function registerIpcHandlers() {
  ipcMain.handle('session:get', () => sessionStore.getState())

  ipcMain.handle('session:addTask', (_e, payload) => {
    sessionStore.addTask(payload)
  })

  ipcMain.handle('session:reorderTasks', (_e, orderedIds) => {
    sessionStore.reorderTasks(orderedIds)
  })

  ipcMain.handle('session:toggleTaskCompleted', (_e, id) => {
    sessionStore.toggleTaskCompleted(id)
  })

  ipcMain.handle('session:updateTask', (_e, payload) => {
    sessionStore.updateTask(payload.id, payload)
  })

  ipcMain.handle('session:restartTask', (_e, id) => {
    sessionStore.restartTask(id)
    showWidgetWindow()
  })

  ipcMain.handle('session:pauseTask', () => {
    sessionStore.pauseTask()
  })

  ipcMain.handle('session:resumeTask', () => {
    sessionStore.resumeTask()
  })

  ipcMain.handle('session:deferTask', (_e, taskId) => {
    sessionStore.deferTask(taskId)
  })

  ipcMain.handle('session:deleteTask', (_e, taskId) => {
    sessionStore.deleteTask(taskId)
  })

  ipcMain.handle('session:startTask', (_e, id) => {
    sessionStore.startTask(id)
    setWidgetMode('expanded')
    showWidgetWindow()
  })

  ipcMain.handle('session:completeTask', () => {
    sessionStore.completeTask()
  })

  ipcMain.handle('session:skipRest', () => {
    sessionStore.skipRest()
  })

  ipcMain.handle('session:startNextTask', () => {
    sessionStore.startNextTask()
    setWidgetMode('expanded')
  })

  // 하루 요약(DaySummary)은 위젯 창에 뜨므로 여기서 위젯을 숨기지 않는다.
  ipcMain.handle('session:finishDay', () => {
    sessionStore.finishDay()
    showWidgetWindow()
  })

  ipcMain.handle('session:backToHome', () => {
    sessionStore.backToHome()
    hideWidgetWindow()
  })

  ipcMain.handle('session:cancelSession', () => {
    sessionStore.cancelSession()
    hideWidgetWindow()
  })

  ipcMain.handle('settings:update', (_e, partial) => {
    sessionStore.updateSettings(partial)
  })

  ipcMain.handle('records:getByDate', (_e, date) => readRecord(date))
  ipcMain.handle('records:listDates', () => listRecordDates())
  ipcMain.handle('records:readAll', () => readAllRecords())

  ipcMain.handle('widget:show', () => showWidgetWindow())
  ipcMain.handle('widget:hide', () => hideWidgetWindow())
  ipcMain.handle('widget:setMode', (_e, mode) => setWidgetMode(mode))
  ipcMain.handle('widget:setHintVisible', (_e, visible) => setWidgetHintVisible(visible))
  ipcMain.handle('widget:getPosition', () => getWidgetPosition())
  ipcMain.handle('widget:moveTo', (_e, { x, y }) => moveWidgetTo(x, y))
}
