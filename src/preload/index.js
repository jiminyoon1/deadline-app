import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  session: {
    get: () => ipcRenderer.invoke('session:get'),
    addTask: (payload) => ipcRenderer.invoke('session:addTask', payload),
    reorderTasks: (orderedIds) => ipcRenderer.invoke('session:reorderTasks', orderedIds),
    toggleTaskCompleted: (id) => ipcRenderer.invoke('session:toggleTaskCompleted', id),
    updateTask: (id, payload) => ipcRenderer.invoke('session:updateTask', { id, ...payload }),
    restartTask: (id) => ipcRenderer.invoke('session:restartTask', id),
    pauseTask: () => ipcRenderer.invoke('session:pauseTask'),
    resumeTask: () => ipcRenderer.invoke('session:resumeTask'),
    deferTask: (taskId) => ipcRenderer.invoke('session:deferTask', taskId),
    deleteTask: (taskId) => ipcRenderer.invoke('session:deleteTask', taskId),
    startTask: (id) => ipcRenderer.invoke('session:startTask', id),
    completeTask: () => ipcRenderer.invoke('session:completeTask'),
    skipRest: () => ipcRenderer.invoke('session:skipRest'),
    startNextTask: () => ipcRenderer.invoke('session:startNextTask'),
    finishDay: () => ipcRenderer.invoke('session:finishDay'),
    backToHome: () => ipcRenderer.invoke('session:backToHome'),
    cancelSession: () => ipcRenderer.invoke('session:cancelSession'),
    onChanged: (callback) => {
      const listener = (_e, state) => callback(state)
      ipcRenderer.on('session:changed', listener)
      return () => ipcRenderer.removeListener('session:changed', listener)
    },
    onAlarm: (callback) => {
      const listener = () => callback()
      ipcRenderer.on('session:alarm', listener)
      return () => ipcRenderer.removeListener('session:alarm', listener)
    }
  },
  settings: {
    update: (partial) => ipcRenderer.invoke('settings:update', partial)
  },
  mainWindow: {
    show: () => ipcRenderer.invoke('mainWindow:show')
  },
  records: {
    getByDate: (date) => ipcRenderer.invoke('records:getByDate', date),
    listDates: () => ipcRenderer.invoke('records:listDates'),
    readAll: () => ipcRenderer.invoke('records:readAll')
  },
  widget: {
    show: () => ipcRenderer.invoke('widget:show'),
    hide: () => ipcRenderer.invoke('widget:hide'),
    setMode: (mode) => ipcRenderer.invoke('widget:setMode', mode),
    setHintVisible: (visible) => ipcRenderer.invoke('widget:setHintVisible', visible),
    getPosition: () => ipcRenderer.invoke('widget:getPosition'),
    moveTo: (x, y) => ipcRenderer.invoke('widget:moveTo', { x, y })
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
