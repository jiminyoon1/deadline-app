---
name: front-ipc-client
description: Deadline Flow 렌더러(React)에서 메인 프로세스와 통신(IPC)하는 코드를 작성/수정할 때 사용. window.api 호출 규칙과 세션 상태 구독 패턴을 정의한다. "IPC", "window.api", "메인 프로세스 호출", "세션 상태", "데이터 불러오기", "onChanged", "구독" 같은 작업이 나오면 이 스킬을 적용한다.
---

# front-ipc-client (렌더러 IPC 연동 규칙)

렌더러는 Node.js API에 직접 접근할 수 없다. 모든 메인 프로세스 기능은 preload가 노출한 `window.api`를 통해서만 호출한다 (`src/preload/index.js`). 채널 목록·네이밍은 `backend-ipc-conventions` Skill을 따른다.

## 두 가지 통신 패턴 (혼동 금지)

1. **살아있는 세션 상태 (구독형)** — `session` 도메인 전용.
   - `useSession()` 훅(`src/renderer/src/hooks/useSession.js`) 하나로 최초 상태 조회 + 실시간 갱신을 모두 처리한다.
   - 최초 로드: `window.api.session.get()` → 이후 `window.api.session.onChanged(setState)` 구독.
   - `onChanged`/`onAlarm` 같은 `on*` 계열은 항상 **구독 해제 함수를 반환**한다 (`useEffect` cleanup에서 그대로 호출).
   - 새 화면에서 세션 상태가 필요하면 새 훅을 만들지 말고 **기존 `useSession()`을 그대로 재사용**한다.

2. **1회성 조회** — `records` 등 세션 상태가 아닌 데이터.
   - 컴포넌트 안에서 `useState` + `useEffect` + async 함수로 직접 호출한다 (`StatsView.jsx`의 `reload()` 패턴 참고).
   - 별도의 커스텀 훅/API 래퍼 레이어를 새로 만들지 않는다 — 이 프로젝트는 아직 그 정도 규모가 아니다.

## 상태 변경(mutation) 호출 규칙

- 세션을 바꾸는 액션(`addTask`, `toggleTaskCompleted`, `startTask` 등)은 **컴포넌트에서 직접 `window.api.session.xxx()` 호출**로 끝낸다 (`App.jsx` 참고).
- 응답값을 기다리거나 로컬 state에 반영하지 않는다. 상태 변화는 메인 프로세스의 `session:changed` 브로드캐스트 → `useSession()`이 자동으로 반영한다 (fire-and-forget).
- 현재 IPC 응답에는 공통 성공/실패 포맷(`{ ok, data }` 같은 envelope)이 없다. 핸들러가 던진 에러는 `invoke()`가 그대로 reject하는 형태로 넘어온다. 에러 UI가 필요하면 호출부에서 직접 `try/catch` (아직 프로젝트 전역 에러 UI 규약은 없음 — 새로 도입하려면 먼저 사용자 확인).

## 하지 말 것

- 컴포넌트에서 `window.electron`(raw ipcRenderer)이나 Node API에 접근하지 않는다. 오직 `window.api`.
- `session` 상태를 렌더러 쪽에 별도로 복제해서 들고 있지 않는다 (source of truth는 메인 프로세스의 `sessionStore` — `backend-session-state` Skill 참고).
- react-query, swr 등 데이터 페칭 라이브러리 임의 도입 금지 (사용자 확인 없이).
