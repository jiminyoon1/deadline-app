import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../../resources/icon.png?asset'

let mainWindow = null

export function createMainWindow() {
  mainWindow = new BrowserWindow({
    // 16:10 — 좌(타이머)·우(리스트) 2단 카드 레이아웃에 맞는 가로형 비율
    width: 1024,
    height: 640,
    minWidth: 760,
    minHeight: 520,
    center: true,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

export function getMainWindow() {
  return mainWindow
}

// 독 아이콘 클릭 등으로 메인 창을 다시 열 때 사용한다.
// 메인 창은 닫으면 파괴되므로(위젯과 달리 hide가 아님) 필요하면 재생성한다.
export function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow()
    return
  }
  mainWindow.show()
  mainWindow.focus()
}
