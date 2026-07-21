---
name: backend-window-management
description: Deadline Flow Electron 앱의 창(메인 창/플로팅 위젯) 관리 규약. BrowserWindow 생성·always-on-top·X 버튼 동작·트레이 아이콘을 다루거나 수정할 때 사용한다. "창", "위젯", "alwaysOnTop", "X 버튼", "트레이", "포커스"를 언급하면 항상 참조한다.
---

# backend-window-management (창 관리 규약)

`src/main/windows/mainWindow.js`, `src/main/windows/widgetWindow.js`, `src/main/index.js`(트레이) 기준.

## 창 종류

| 창 | 속성 | 생성 파일 | 규칙 |
|---|---|---|---|
| 메인 창 | 일반 창, `show: false`로 생성 후 `ready-to-show`에서 표시 | `mainWindow.js` | 닫아도 앱은 유지 (트레이로 상주) |
| 플로팅 위젯 | `alwaysOnTop: true` (+ `setAlwaysOnTop(true, 'floating')`), 리사이즈 불가 | `widgetWindow.js` | X 버튼은 `close` 이벤트를 `preventDefault`로 가로챈다 |

## 위젯 X 버튼 동작

`widgetWindow.js`의 `close` 이벤트 핸들러가 실제 종료를 막고:
- `settings.xButtonMode === 'close'`면 `sessionStore.cancelSession()` 호출 후 `widgetWindow.hide()`.
- 그 외(`'hide'`, 기본값)는 그냥 `hide()`만.
- 위젯은 절대 `destroy`되지 않는다 — 항상 `show()`/`hide()`로만 제어한다 (트레이 클릭이나 `session:startTask` 시 `showWidgetWindow()`로 재사용).

## 트레이

- `main/index.js`의 `createTray()`가 트레이 아이콘 + 컨텍스트 메뉴("위젯 열기"/"종료")를 만든다. 트레이 클릭도 `showWidgetWindow()` 호출.
- 트레이는 앱당 1개만 생성한다(재생성 금지).

## 외부 링크

- 메인 창의 `setWindowOpenHandler`는 새 창을 열지 않고 `shell.openExternal`로 기본 브라우저에서 열도록 되어 있다(`mainWindow.js`). 새로 외부 링크를 여는 UI를 추가할 때도 이 방식을 따른다.

## 하지 말 것

- 창 생성/표시 로직을 렌더러나 IPC 핸들러(`ipc.js`)에 직접 넣지 않는다 — `windows/` 아래 함수(`showWidgetWindow`, `hideWidgetWindow` 등)를 통해서만 제어한다.
- 위젯을 여러 개 생성하지 않는다(`widgetWindow` 싱글턴 변수 유지).
