---
name: backend-ipc-conventions
description: Deadline Flow Electron 앱의 IPC 채널 설계 규약. 렌더러 ↔ 메인 프로세스 통신 채널을 새로 만들거나 수정할 때 사용한다. 채널 네이밍, ipcMain.handle/ipcRenderer.invoke 사용, preload 노출 규칙을 강제한다. "IPC", "채널", "preload", "window.api", "invoke"를 언급하면 항상 참조한다.
---

# backend-ipc-conventions (IPC 채널 설계 규약)

렌더러와 메인 프로세스는 오직 **preload + contextBridge**로 노출한 `window.api`를 통해서만 통신한다 (`nodeIntegration: false`, `contextIsolation` 유지). 실제 채널 목록은 `references/ipc-channels.md` 참고.

## 채널 네이밍

- `도메인:camelCase동작` 형식. 예: `session:addTask`, `settings:update`, `records:getByDate`, `widget:show`.
- 도메인은 `preload/index.js`의 `api` 객체 최상위 키와 1:1로 대응한다(`session`, `settings`, `records`, `widget`). 새 도메인을 추가하면 `api` 객체에도 같은 이름의 그룹을 추가한다.
- 채널 하나에 여러 역할을 겹치지 않는다. 새 동작이 필요하면 새 채널을 추가한다.

## 요청/응답 vs 단방향 이벤트

- **요청/응답(렌더러 → 메인)**: `ipcMain.handle(channel, handler)` + `ipcRenderer.invoke(channel, payload)`. `send`/`on` 대신 항상 `invoke` 우선.
- **단방향 푸시(메인 → 렌더러)**: 세션 변경, 알람처럼 메인에서 능동적으로 알려야 하는 경우만 `webContents.send(channel, payload)` 사용. 대상 채널: `session:changed`, `session:alarm` (`src/main/index.js`에서 `sessionStore`의 `change`/`alarm` 이벤트를 두 창에 브로드캐스트).
- 새 채널 등록은 `src/main/ipc.js`의 `registerIpcHandlers()` 안에 추가한다. 채널 등록 위치를 분산시키지 않는다.

## preload 노출 규칙

- `ipcRenderer` 전체를 노출하지 않는다. 반드시 함수 단위로 감싸서 `contextBridge.exposeInMainWorld('api', {...})`.
- 단방향 이벤트는 `on<Event>(callback)` 형태로 감싸고, **항상 구독 해제 함수를 반환**한다:
  ```js
  onChanged: (callback) => {
    const listener = (_e, state) => callback(state)
    ipcRenderer.on('session:changed', listener)
    return () => ipcRenderer.removeListener('session:changed', listener)
  }
  ```
- `remote` 모듈 사용 금지 (deprecated).

## 응답 형식 (현재 상태 — 유의)

- 현재 핸들러는 공통 성공/실패 envelope 없이 **데이터를 그대로 반환**한다 (`ipcMain.handle`의 리턴값이 `invoke()`의 resolve 값). 새 채널도 이 방식을 따른다 — 임의로 `{ ok, data }` 같은 포맷을 새로 도입하지 않는다.
- 에러 처리 공통 규약은 없다(핸들러가 throw하면 `invoke()`가 reject). 공통 에러 처리 도입이 필요하다고 판단되면 먼저 사용자에게 제안한다 — 기존 코드를 임의로 리팩터링하지 않는다.

## 하지 말 것

- 채널을 새로 만들기 전에 `references/ipc-channels.md`와 `src/main/ipc.js`의 기존 채널을 먼저 확인한다. 이 문서와 실제 코드가 다르면 **코드가 우선**이며, 이 경우 `ipc-channels.md`를 코드에 맞게 갱신한다.
