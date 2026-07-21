import { app, Tray, Menu, nativeImage } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import trayIconPath from '../../resources/trayTemplate.png?asset'
import { createMainWindow, getMainWindow, showMainWindow } from './windows/mainWindow'
import { createWidgetWindow, showWidgetWindow, resizeWidgetForStatus } from './windows/widgetWindow'
import { registerIpcHandlers } from './ipc'
import { sessionStore } from './store/sessionStore'

let tray = null

function createTray() {
  // macOS에서는 템플릿 이미지로 등록해 라이트/다크 메뉴바 색상에 자동 대응한다.
  let trayIcon
  if (process.platform === 'darwin') {
    trayIcon = nativeImage.createFromPath(trayIconPath)
    trayIcon.setTemplateImage(true)
  } else {
    trayIcon = nativeImage.createFromPath(icon).resize({ width: 16, height: 16 })
  }
  tray = new Tray(trayIcon)
  tray.setToolTip('Deadline Flow')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '메인 창 열기', click: () => showMainWindow() },
      { label: '위젯 열기', click: () => showWidgetWindow() },
      { type: 'separator' },
      { label: '종료', role: 'quit' }
    ])
  )
  tray.on('click', () => showWidgetWindow())
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.deadlineflow.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()

  createMainWindow()
  const widgetWindow = createWidgetWindow()
  createTray()

  // 앱 종료 중에는 창이 파괴되기 직전 렌더러 프레임이 먼저 해제되는 순간이 있어
  // isDestroyed()만으로는 send가 실패할 수 있다. 프레임까지 확인하고 예외는 무시한다.
  // 메인 창은 닫으면 파괴됐다가 재생성될 수 있으므로 보낼 때마다 현재 인스턴스를 얻는다.
  const safeSend = (win, channel, ...args) => {
    if (!win || win.isDestroyed() || win.webContents.isDestroyed()) return
    try {
      win.webContents.send(channel, ...args)
    } catch {
      // 종료 레이스로 프레임이 이미 해제된 경우 — 무시해도 안전하다.
    }
  }

  sessionStore.on('change', (state) => {
    safeSend(getMainWindow(), 'session:changed', state)
    safeSend(widgetWindow, 'session:changed', state)
    resizeWidgetForStatus(state.timer.status, state.tasks?.length ?? 0)
  })
  sessionStore.on('widgetReappear', () => {
    showWidgetWindow()
  })
  sessionStore.on('alarm', () => {
    safeSend(widgetWindow, 'session:alarm')
    safeSend(getMainWindow(), 'session:alarm')
    // 숨겨진 상태라도 알람 시점에는 위젯을 다시 띄워 다음 행동을 물어본다.
    showWidgetWindow()
  })
  sessionStore.start()

  // 위젯 창이 항상 살아 있어 getAllWindows()가 0이 되지 않으므로,
  // 독 아이콘 클릭 시에는 메인 창을 기준으로 재생성/표시한다.
  app.on('activate', function () {
    showMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  sessionStore.stop()
})
