# IPC 채널 목록

실제 코드(`src/main/ipc.js`, `src/preload/index.js`) 기준. 채널을 추가/변경하면 이 표도 함께 갱신한다.

## session — 세션(태스크·타이머) 상태

| 채널 | 방향 | 요청 | 설명 |
|---|---|---|---|
| `session:get` | invoke | 없음 | 현재 세션 상태 전체 조회 |
| `session:addTask` | invoke | `{ name, plannedMinutes }` | 태스크 추가 (백엔드가 `plannedSeconds = plannedMinutes*60` 변환 저장) |
| `session:reorderTasks` | invoke | `orderedIds: string[]` | 태스크 순서 변경 |
| `session:toggleTaskCompleted` | invoke | `id` | 완료 토글 (`completed` ↔ `status==='done'` 동기화) |
| `session:updateTask` | invoke | `{ id, name?, plannedMinutes? }` | 태스크 수정 |
| `session:addFocusTime` | invoke | `seconds` | 몰입 시간 추가 (연장, `running`/`paused`에서 동작. 활성 태스크 `plannedSeconds`도 증가) |
| `session:pauseTask` | invoke | 없음 | 진행 중(`running`) 타이머 일시정지. 그 외 상태에선 no-op |
| `session:resumeTask` | invoke | 없음 | 일시정지(`paused`) 해제 → `running`. 그 외 상태에선 no-op |
| `session:deferTask` | invoke | `taskId: string` | 태스크를 오늘 목록에서 제거하고 다음날로 이월 |
| `session:deleteTask` | invoke | `taskId: string` | 태스크를 완전히 삭제(이월 없음). 삭제 대상이 진행 중이던 태스크면 타이머 초기화 |
| `session:startTask` | invoke | `id` | 태스크 시작 (+ 위젯 표시). `resting` 중이면 쉰 시간을 기록하고 휴식 종료 후 시작 |
| `session:completeTask` | invoke | 없음 | 끝내기(■). 활성 태스크 완료 확정 → 자동 진행(휴식 or `awaitingNext` or `dayFinished`) |
| `session:skipRest` | invoke | 없음 | 휴식 건너뛰기 (`resting` → 쉰 시간 기록 → `awaitingNext`) |
| `session:startNextTask` | invoke | 없음 | 대기(`awaitingNext`)에서 다음 순서 미완료 태스크 시작 |
| `session:finishDay` | invoke | 없음 | 하루 마무리 (+ 위젯 표시 — 요약은 위젯에 뜬다) |
| `session:backToHome` | invoke | 없음 | 홈으로 복귀 |
| `session:cancelSession` | invoke | 없음 | 세션 취소 (+ 위젯 숨김) |
| `session:changed` | send (메인→렌더러) | `state` | 세션 상태 변경 시 브로드캐스트 |
| `session:alarm` | send (메인→렌더러) | 없음 | 타이머 알람 발생 |

### 세션 상태(state) 형태 — `session:get` / `session:changed`

최상위: `{ date, tasks, totalFocusMinutes, totalBreakMinutes, todayFocusSeconds, settings, timer }`

- `todayFocusSeconds` (number, 초): 오늘 총 집중 시간(파생, 메인 계산 = 당일 tasks의 `elapsedSeconds` 합). 헤더 표시용.
- `timer.status`: `idle | running | paused | resting | awaitingNext | dayFinished`. 태스크 종료(■/만료) 시 묻지 않고 설정된 휴식(`resting`, `settings.restBetweenTasksMinutes`분) → 다음 태스크 대기(`awaitingNext`)로 자동 진행한다 (task-flow-v2-spec.md). 일시정지 중 `timer.remainingSeconds`는 감소하지 않고 멈춘 값을 유지하며 `timer.activeTaskId`도 유지된다. 일시정지 상태는 영속화되어 앱 재시작 시 복원된다(재시작 시 진행 중이던 태스크는 `paused`로 복원).

각 `tasks[]` 항목:

| 필드 | 타입 | 설명 |
|---|---|---|
| `id`, `name` | string | 기존 |
| `plannedMinutes` | number | 원래 계획(분). addTask/updateTask 페이로드 및 "계획 시간" 표시의 정본 |
| `plannedSeconds` | number | 유효 계획(초). 초기값 `plannedMinutes*60`, `addFocusTime`으로 연장 시 증가. **원형 타이머 링의 분모는 이 값 사용** |
| `elapsedSeconds` | number | 누적 진행(초). `running` tick마다 증가, `paused`에서 멈춤 |
| `remainingSeconds` | number | 파생(메인 계산) = `max(0, plannedSeconds - elapsedSeconds)`. 리스트 진행중 행/좌측 타이머 표시용 |
| `status` | string | `pending \| running \| paused \| done \| deferred` |
| `completed` | boolean | `status==='done'`과 항상 동기화(하위 호환) |
| `actualMinutes`, `flowmodoroUsed`, `startedAt`, `breaks` | — | 기존 |

## settings — 설정

| 채널 | 방향 | 요청 | 설명 |
|---|---|---|---|
| `settings:update` | invoke | 변경할 설정 부분 객체 (`xButtonMode`, `flowmodoroEnabled`, `restBetweenTasksMinutes`) | 설정 갱신 |

## records — 기록 조회 (읽기 전용, 저장은 세션 액션이 트리거)

| 채널 | 방향 | 요청 | 설명 |
|---|---|---|---|
| `records:getByDate` | invoke | `date: 'YYYY-MM-DD'` | 특정 날짜 기록 조회 |
| `records:listDates` | invoke | 없음 | 기록 있는 날짜 목록 |
| `records:readAll` | invoke | 없음 | 전체 기록 조회 |

## widget — 위젯 창 제어

| 채널 | 방향 | 요청 | 설명 |
|---|---|---|---|
| `widget:show` | invoke | 없음 | 위젯 표시 |
| `widget:hide` | invoke | 없음 | 위젯 숨김 |

## mainWindow — 메인 창 제어

| 채널 | 방향 | 요청 | 설명 |
|---|---|---|---|
| `mainWindow:show` | invoke | 없음 | 메인 창 표시 (닫혀서 파괴됐으면 재생성). 위젯에서 메인 창으로 돌아갈 방법이 트레이 아이콘뿐이면 안 되므로 위젯 UI에서도 호출한다 |

## 채널 추가 절차

1. `src/main/ipc.js`의 `registerIpcHandlers()`에 `ipcMain.handle('도메인:동작', ...)` 추가.
2. `src/preload/index.js`의 `api` 객체 해당 도메인 그룹에 대응 함수 추가.
3. 이 표에 행 추가.
