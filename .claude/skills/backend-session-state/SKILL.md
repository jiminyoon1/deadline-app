---
name: backend-session-state
description: Deadline Flow 메인 프로세스의 세션(태스크·타이머) 상태 관리 규약. sessionStore에 새 필드나 액션을 추가/수정할 때 사용한다. 단일 소스(source of truth) 브로드캐스트 패턴, 영속화·타이머 tick 규칙을 강제한다. "세션", "타이머", "sessionStore", "태스크 상태", "브로드캐스트"를 언급하면 항상 참조한다.
---

# backend-session-state (세션 상태 관리 규약)

`src/main/store/sessionStore.js`의 `SessionStore`가 태스크·타이머·설정의 **유일한 source of truth**다. 렌더러는 상태를 들고 있지 않고 매번 이 스토어를 구독한다.

## 기본 패턴

- `SessionStore`는 `EventEmitter`를 상속한다. 상태를 바꾸는 메서드는 끝에서 항상:
  1. 기록에 영향을 준 변경이면 `this._persist()` 호출 (`records.js`에 저장)
  2. `this._broadcast()` 호출 → `change` 이벤트 emit → `src/main/index.js`가 두 창(`mainWindow`, `widgetWindow`) 모두에 `session:changed`로 전송.
- 새 세션 액션을 추가할 때 이 순서(영속화 → 브로드캐스트)를 빠뜨리지 않는다. 브로드캐스트를 빠뜨리면 다른 창이 갱신되지 않는다.
- 타이머(`status`)는 상태 머신이다: `idle → running → (alarm | restSetup) → resting → restFinished → running(다음 태스크) ... → dayFinished`. 새 상태를 추가하려면 `_tick()`의 분기와 `WidgetApp.jsx`의 화면 분기를 함께 고려해야 한다 (`front-ui-component` Skill 참고) — 임의로 상태값을 늘리지 말고 먼저 사용자 확인.
- 매 초 `_tick()`이 `running`/`resting` 상태를 갱신한다 (`sessionStore.start()`가 `main/index.js`에서 앱 시작 시 호출). 자정이 지나면 `_checkMidnightRollover()`가 그날 기록을 저장하고 새 레코드로 초기화한다.

## 가드 조건

- 대부분의 메서드는 맨 앞에서 `this.timer.status`를 확인하고 맞지 않으면 조용히 return한다(예: `startRest`는 `restSetup` 상태가 아니면 무시). 새 액션도 이 가드 스타일을 따른다 — 상태가 안 맞을 때 에러를 던지지 않고 no-op으로 처리하는 것이 기존 컨벤션이다.

## 하지 말 것

- 렌더러에서 세션 상태를 계산/캐시해서 sessionStore와 별도로 들고 있지 않는다.
- `getState()`가 반환하는 필드 형태를 임의로 바꾸지 않는다 — 바꾸면 저장 스키마(`backend-data-storage` Skill)와도 어긋난다.
- 오픈 이슈(하루 초기화 시점, 휴식 후 자동 진행, 플로우모도로 보상 상한 등)는 임의로 결정하지 말고 사용자 확인.
