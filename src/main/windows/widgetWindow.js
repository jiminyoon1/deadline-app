import { app, BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

const SCREEN_MARGIN = 16

let widgetWindow = null

// 진행 중(running/paused)에는 사용자가 선택한 보기 모드(미니/확장)를 따르고,
// 그 외(휴식/다음 태스크 대기/요약)는 패널 형태를 쓴다.
// 콘텐츠 주변 12px 여백은 투명 영역으로 그림자가 그려지는 공간이다.
const SIZES = {
  mini: { width: 88, height: 88 },
  pill: { width: 324, height: 84 },
  panel: { width: 324, height: 256 },
  list: { width: 324, height: 400 } // 알약 + 오늘 할 일 드롭다운 패널
}

// 하루 요약: 태스크 전체가 스크롤 없이 보이도록 개수에 맞춰 높이를 계산한다.
// base는 제목·합계·버튼·여백 몫, row는 태스크 한 줄 높이. 화면(workArea)을 넘으면 그때만 스크롤.
const SUMMARY_BASE_HEIGHT = 180
const SUMMARY_ROW_HEIGHT = 36

// 첫 등장 말풍선 힌트(알약 아래 말풍선 카드)가 뜨는 동안만 창을 이만큼 더 키운다.
const HINT_EXTRA_HEIGHT = 92

let widgetMode = 'expanded' // 'mini' | 'expanded' | 'list'
let lastStatus = 'idle'
let lastTaskCount = 0
let hintVisible = false

function summarySize() {
  const workArea = screen.getPrimaryDisplay().workArea
  const maxHeight = workArea.height - SCREEN_MARGIN * 2
  const rows = Math.max(lastTaskCount, 1)
  return {
    width: 324,
    height: Math.min(SUMMARY_BASE_HEIGHT + rows * SUMMARY_ROW_HEIGHT, maxHeight)
  }
}

function sizeForStatus(status) {
  // 휴식도 진행 중과 같은 위젯(미니/알약) UI를 쓴다 — 색만 초록으로 다르다
  if (status === 'running' || status === 'paused' || status === 'resting') {
    if (widgetMode === 'list') return SIZES.list
    if (widgetMode !== 'expanded') return SIZES.mini
    return hintVisible
      ? { width: SIZES.pill.width, height: SIZES.pill.height + HINT_EXTRA_HEIGHT }
      : SIZES.pill
  }
  if (status === 'dayFinished') return summarySize()
  // 다음 태스크 대기도 알약 UI — 목록을 펼치면 더 큰 패널을 쓴다.
  if (status === 'awaitingNext') {
    return widgetMode === 'list' ? SIZES.list : SIZES.pill
  }
  return SIZES.panel
}

// 위젯은 보통 화면 오른쪽 구석에 두므로, 크기가 바뀔 때 오른쪽 위 모서리를 고정한다.
function applySize(status) {
  if (!widgetWindow || widgetWindow.isDestroyed()) return
  const { width, height } = sizeForStatus(status)
  const bounds = widgetWindow.getBounds()
  if (bounds.width === width && bounds.height === height) return
  // 커진 창이 화면 아래로 삐져나가면 위로 밀어 넣는다
  const workArea = screen.getDisplayMatching(bounds).workArea
  const y = Math.max(
    workArea.y + SCREEN_MARGIN,
    Math.min(bounds.y, workArea.y + workArea.height - height - SCREEN_MARGIN)
  )
  widgetWindow.setBounds({
    x: bounds.x + (bounds.width - width),
    y,
    width,
    height
  })
}

export function createWidgetWindow() {
  widgetWindow = new BrowserWindow({
    width: SIZES.mini.width,
    height: SIZES.mini.height,
    show: false,
    resizable: false,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  widgetWindow.setAlwaysOnTop(true, 'floating')

  // 처음 위치: 주 화면 오른쪽 상단 끝
  const workArea = screen.getPrimaryDisplay().workArea
  widgetWindow.setPosition(
    workArea.x + workArea.width - SIZES.mini.width - SCREEN_MARGIN,
    workArea.y + SCREEN_MARGIN
  )

  // 위젯을 화면에서 치우는 것은 세션에 아무 영향을 주지 않는다. 파괴적 동작은 UI의 멈춤(■)뿐이다.
  // 단, 앱 종료 중에는 close를 막으면 종료 자체가 취소되므로 그대로 통과시킨다.
  let isQuitting = false
  app.on('before-quit', () => {
    isQuitting = true
  })
  widgetWindow.on('close', (event) => {
    if (isQuitting || widgetWindow.isDestroyed()) return
    event.preventDefault()
    widgetWindow.hide()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    widgetWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/widget.html`)
  } else {
    widgetWindow.loadFile(join(__dirname, '../renderer/widget.html'))
  }

  return widgetWindow
}

export function getWidgetWindow() {
  return widgetWindow
}

export function showWidgetWindow() {
  if (!widgetWindow || widgetWindow.isDestroyed()) return
  widgetWindow.show()
}

export function hideWidgetWindow() {
  if (!widgetWindow || widgetWindow.isDestroyed()) return
  widgetWindow.hide()
}

export function resizeWidgetForStatus(status, taskCount = lastTaskCount) {
  lastStatus = status
  lastTaskCount = taskCount
  applySize(status)
}

export function setWidgetMode(mode) {
  widgetMode = ['expanded', 'list'].includes(mode) ? mode : 'mini'
  applySize(lastStatus)
}

// 알약 아래 말풍선 힌트를 보이는 동안만 창을 키운다. 목록을 펼치는 등 다른 모드로
// 바뀌면 렌더러 쪽에서 false로 되돌려 원래 크기로 복귀시킨다.
export function setWidgetHintVisible(visible) {
  hintVisible = Boolean(visible)
  applySize(lastStatus)
}

// 미니 버블의 JS 드래그용: 드래그 시작 시 창 위치를 알려주고, 이동 중 절대 좌표로 옮긴다.
export function getWidgetPosition() {
  if (!widgetWindow || widgetWindow.isDestroyed()) return { x: 0, y: 0 }
  const [x, y] = widgetWindow.getPosition()
  return { x, y }
}

export function moveWidgetTo(x, y) {
  if (!widgetWindow || widgetWindow.isDestroyed()) return
  widgetWindow.setPosition(Math.round(x), Math.round(y))
}
