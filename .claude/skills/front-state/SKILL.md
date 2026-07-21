---
name: front-state
description: Deadline Flow 렌더러에서 컴포넌트 상태나 화면 간 공유 상태를 다룰 때 사용. React 기본(useState/useContext)만 쓰는 규칙과, 세션 상태의 source of truth가 메인 프로세스에 있다는 제약을 정의한다. "상태 관리", "전역 상태", "useState", "useContext", "Context", "탭 전환" 같은 작업이 나오면 이 스킬을 적용한다.
---

# front-state (상태 관리 규칙)

**React 기본(`useState`/`useContext`)만 사용한다. zustand, redux 등 외부 상태 라이브러리는 사용자 확인 없이 도입 금지.**

## 이 프로젝트에 "전역 상태 스토어"가 없는 이유

세션(태스크·타이머·설정)의 source of truth는 렌더러가 아니라 **메인 프로세스의 `sessionStore`**다. 렌더러는 `useSession()` 훅으로 그 상태를 구독만 한다 (`front-ipc-client` Skill 참고). 그래서 렌더러 쪽에 별도 zustand/redux 스토어를 만들 필요가 거의 없다 — 새로 만들기 전에 정말 메인 프로세스 상태로 처리할 수 없는지 먼저 확인한다.

## 창(진입점)을 넘어서는 상태 공유는 IPC로만

메인 창과 위젯은 별도 렌더러 프로세스이므로 **React state/Context가 창을 넘어 공유되지 않는다.** 두 창이 같은 값을 봐야 하면 반드시 메인 프로세스(`sessionStore`) → `session:changed` 브로드캐스트 경로를 거친다. Context로 우회하려 하지 않는다.

## 로컬 state vs Context

- 한 화면/컴포넌트 트리 안에서만 쓰이는 값(탭 선택, 입력 폼, 토글 등)은 `useState`로 충분하다.
- 여러 depth 아래 컴포넌트까지 prop drilling 없이 공유해야 하는 값만 `useContext`로 올린다. 지금은 트리가 얕아 대부분 props로 충분하다 — Context가 실제로 필요한 사례가 생기면 그때 도입한다.
- 세션 상태(`session` 객체)는 Context로 감싸지 않는다. 각 루트(`App`/`WidgetApp`)에서 `useSession()`을 직접 호출해 필요한 하위 컴포넌트에 props로 내려준다.
