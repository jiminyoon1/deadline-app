# 홈 화면 리디자인 스펙 (Home Redesign Spec)

> 참고 디자인: `docs/resources/task-timer-widget.png`
> 프론트엔드(렌더러)와 백엔드(메인 프로세스)를 함께 재구현하기 위한 명세.


---

## 1. 전체 레이아웃

홈 화면은 좌/우 2단 레이아웃의 카드형 UI다. (흰색 카드, 둥근 모서리, 연한 그림자, 배경은 밝은 회색)

```
┌────────────────────┬──────────────────────────────────────┐
│  [좌측 패널]        │  [우측 패널]                          │
│  현재 진행 태스크명  │  날짜        ·        오늘 총 집중시간 │
│  원형 타이머        │  "오늘 할 일" 타이틀                  │
│  (남은 시간 표시)   │  할 일 추가 입력줄 (이름 + 분 + [+])   │
│  ⏸ ⏹ ➕ 버튼 3개   │  태스크 리스트 (드래그 정렬 가능)      │
│  ⚙설정  📊통계     │                                      │
└────────────────────┴──────────────────────────────────────┘
```

- 좌우 패널 사이에 세로 구분선(1px, 연한 회색).
- 포인트 컬러: `tokens.css`의 `--color-primary` (hex 직접 사용 금지 — `front-design-tokens` Skill 참조).

---

## 2. 좌측 패널 — 타이머

### 2.1 표시 요소 (위에서 아래로)
1. **현재 진행 중인 태스크 이름** — 예: "데드라인 앱 제작하기". 진행 중 태스크가 없으면 안내 문구(예: "태스크를 시작하세요").
2. **원형 프로그레스 링 타이머**
   - 링은 남은 시간 비율만큼 포인트 컬러로 채워지고, 소진된 부분은 연한 회색.
   - 중앙에 남은 시간 `HH:MM:SS` 큰 숫자 + 아래에 "남음" 라벨.
   - 카운트다운 방식: `남은 시간 = 태스크 계획 시간(planned) − 누적 진행 시간(elapsed)`. 0이 되면 알람(기존 `session:alarm` 흐름 유지).
3. **컨트롤 버튼 3개 (가로 정렬, 원형 아웃라인 버튼)**
   - ⏸ **일시정지/재개** — 타이머 정지·재개 토글. 정지 중엔 ▶ 아이콘.
   - ⏹ **끝내기** — 현재 태스크 집중 종료 (기존 `session:endFocus`).
   - ➕ **시간 추가** — 진행 중 태스크에 시간 추가 (기본 +10분, 기존 `session:addFocusTime` 재사용).
4. **하단 버튼 2개 (가로 정렬, 알약형 아웃라인 버튼)**
   - ⚙ **설정** — 설정 페이지로 전환.
   - 📊 **통계** — 통계 페이지로 전환.

### 2.2 상태별 동작
- 진행 중 태스크 없음: 링은 회색, 시간 `00:00:00`, ⏸/⏹/➕ 비활성화.
- 일시정지 상태: 링 유지, 시간 정지, 태스크명 옆 또는 링에 일시정지 표시(선택).

---

## 3. 우측 패널 — 오늘 할 일

### 3.1 헤더
- 좌측: **오늘 날짜** — `M월 D일` 형식 (예: "7월 12일").
- 우측: **오늘 총 집중 시간** — 포인트 컬러 텍스트, `오늘 N시간 M분 집중` 형식. 오늘 완료·진행된 모든 집중 시간의 합계 (당일 records + 현재 세션 진행분).
- 그 아래 큰 타이틀: **"오늘 할 일"**.

### 3.2 할 일 추가 입력줄
구성: `[할 일 이름 입력칸(넓음)] [분 입력칸(좁음, "30 분" 형태)] [+ 버튼]`

동작 명세:
- 이름 입력칸 placeholder: "새로운 할 일 추가".
- **키보드 오른쪽 방향키(→)** 를 이름 입력칸에서 누르면(커서가 텍스트 끝에 있을 때) 분 입력칸으로 포커스 이동. 마우스 클릭으로도 이동 가능.
- 분 입력칸: 숫자만 입력, 단위 "분" 표시. 기본값 없음(placeholder "30 분").
- **+ 버튼 활성화 조건**: 이름과 분이 모두 입력된 경우에만 활성화되고 포인트 컬러(빨강)로 변함. 그 외에는 회색 비활성.
- 추가 방법: + 버튼 클릭 또는 분 입력칸에서 Enter. 추가되면 리스트 맨 아래에 붙고 입력칸 초기화, 포커스는 이름 입력칸으로 복귀.

### 3.3 태스크 리스트
각 행 구성 (왼쪽 → 오른쪽):
1. **드래그 핸들** (⠿ 점 6개 아이콘) — 드래그로 순서 변경 (기존 `session:reorderTasks`).
2. **상태 원형 아이콘**
   - 완료: 회색 채움 원 + 흰 체크.
   - 진행 중: 포인트 컬러 채움 원.
   - 대기: 빈 아웃라인 원. (클릭 시 완료 토글 — 기존 `session:toggleTaskCompleted`.)
3. **태스크 이름**
   - 진행 중 태스크: 포인트 컬러 텍스트.
   - 완료 태스크: 회색 텍스트 (취소선 선택).
4. **시간 표시** (우측 정렬)
   - 진행 중: 남은 시간 실시간 표시, `38분 20초` 형식 (좌측 타이머와 동기화).
   - 대기: 계획 시간 `40분` / `1시간 20분` 형식.
   - 완료: 계획(또는 실제 소요) 시간.
5. **→ 화살표 버튼** = **다음날로 미루기**
   - 클릭 시 해당 태스크를 오늘 목록에서 제거하고 내일 목록으로 이관.
- 행 사이 얇은 구분선. 행 클릭(이름 영역)으로 태스크 시작은 기존 UX 유지 여부를 구현 시 결정 (기존 `session:startTask`).

---

## 4. 백엔드 (메인 프로세스) 변경 사항

기존 규약 준수: sessionStore 단일 소스 + `session:changed` 브로드캐스트, IPC는 `ipcMain.handle`/`invoke`, 저장은 날짜별 JSON 파일 (물리 DB 금지). 관련 스킬: `backend-session-state`, `backend-ipc-conventions`, `backend-data-storage`.

### 4.1 sessionStore 상태 확장
| 필드 | 설명 |
|---|---|
| `tasks[].plannedSeconds` | 계획 시간(초). 추가 입력줄의 "분" × 60 |
| `tasks[].elapsedSeconds` | 누적 진행 시간(초). tick마다 증가 |
| `tasks[].status` | `pending` \| `running` \| `paused` \| `done` \| `deferred` |
| `todayFocusSeconds` | 오늘 총 집중 시간(초). 헤더 표시용 파생값 포함해 브로드캐스트 |

- 남은 시간(`remainingSeconds`)은 파생값: `plannedSeconds − elapsedSeconds` (음수 방지). 메인에서 계산해 상태에 포함하거나 렌더러에서 계산 — 단일 소스 원칙상 메인 계산 권장.
- 타이머 tick은 메인 프로세스에서만 돌리고 1초마다 브로드캐스트(기존 패턴 유지).

### 4.2 IPC 채널 (기존 + 신규)
**기존 재사용:**
`session:get`, `session:addTask`, `session:reorderTasks`, `session:toggleTaskCompleted`, `session:updateTask`, `session:addFocusTime`, `session:startTask`, `session:endFocus`, `session:changed`, `session:alarm`, `records:*`, `settings:update`

**신규:**
| 채널 | 방향 | 페이로드 | 설명 |
|---|---|---|---|
| `session:pauseTask` | invoke | — | 진행 중 타이머 일시정지 |
| `session:resumeTask` | invoke | — | 일시정지 해제 |
| `session:deferTask` | invoke | `taskId` | 태스크를 다음날로 미루기 |

- `session:addTask` 페이로드에 `plannedMinutes`(또는 `plannedSeconds`)가 없으면 추가. preload `window.api.session`에 신규 3개 메서드 노출.

### 4.3 데이터 저장
- **미루기(defer)**: 해당 태스크를 오늘 세션에서 제거하고, 다음날 날짜 키의 이월 목록에 저장. 다음날 세션 초기화 시 이월 태스크를 자동으로 목록에 포함.
  - 저장 위치: 날짜별 JSON 규약에 맞춰 `deferred-tasks` 형태로 다음날 파일(또는 별도 이월 파일)에 기록 — `backend-data-storage` 스킬 규약 따름.
- **오늘 집중 시간**: 기존 records에서 당일 합산 + 진행 중 세션의 elapsed를 더해 계산.
- 일시정지 상태도 영속화하여 앱 재시작 시 복원.

---

## 5. 프론트엔드 (렌더러) 구현 사항

규약: React 기본 훅만 사용(useState/useContext), CSS Modules 전용, 세션 상태는 `window.api.session` 구독(`onChanged`). 관련 스킬: `front-state`, `front-ipc-client`, `front-ui-component`.

### 5.1 컴포넌트 구조 (제안)
```
components/home/
  HomeLayout.jsx / .module.css      # 좌우 2단 레이아웃 카드
  TimerPanel.jsx / .module.css      # 좌측: 태스크명 + 원형 타이머 + 버튼들
  CircularTimer.jsx / .module.css   # SVG 원형 프로그레스 링
  TodayPanel.jsx / .module.css      # 우측: 헤더 + 추가 입력줄 + 리스트
  TaskInput.jsx / .module.css       # 이름/분 입력 + [+] 버튼 (방향키 포커스 이동)
  TaskList.jsx / .module.css        # 리스트 + 드래그 정렬
  TaskRow.jsx / .module.css         # 행: 핸들·상태원·이름·시간·미루기 버튼
```
- 기존 `CafeHome.jsx`/`TaskRow.jsx`는 새 구조로 대체. `TimerWidget`, `DaySummary` 등 재사용 가능한 부분은 구현 시 판단.
- 설정/통계 버튼은 기존 `SettingsPanel`, `StatsView` 화면으로 전환 (기존 탭/화면 전환 방식 유지).

### 5.2 원형 타이머 구현
- SVG `<circle>` 2개: 배경 링(연회색) + 진행 링(포인트 컬러, `stroke-dasharray`/`stroke-dashoffset`).
- 진행률 = `remainingSeconds / plannedSeconds`. 12시 방향 시작, 시계 방향 소진.
- 중앙 텍스트: `HH:MM:SS` (모노스페이스 느낌의 큰 굵은 숫자) + "남음".

### 5.3 TaskInput 포커스/활성화 로직
- 이름 input에서 `onKeyDown`: `ArrowRight`이고 `selectionStart === value.length`일 때 분 input으로 `focus()`.
- 분 input: `inputMode="numeric"`, 숫자 외 입력 차단.
- `+` 버튼: `disabled = !(name.trim() && minutes > 0)`. 활성 시 포인트 컬러 배경.
- 추가 성공 시 두 input 초기화 + 이름 input 포커스.

### 5.4 드래그 정렬
- 외부 라이브러리 없이 HTML5 DnD(`draggable`, `onDragStart/Over/Drop`)로 구현, 드롭 시 `session:reorderTasks` 호출.

### 5.5 시간 포맷 유틸 (`utils/time.js` 확장)
| 용도 | 형식 | 예 |
|---|---|---|
| 타이머 중앙 | `HH:MM:SS` | `00:38:20` |
| 진행 중 행 | `N분 M초` / `N시간 M분` | `38분 20초` |
| 계획 시간 | `N분` / `N시간 M분` | `40분`, `1시간 30분` |
| 헤더 집중 시간 | `N시간 M분` | `1시간 58분` |
| 날짜 | `M월 D일` | `7월 12일` |

---

## 6. 구현 순서 (권장)

1. **백엔드**: sessionStore 필드 확장(planned/elapsed/status, pause/resume) → 신규 IPC 3개 + preload 노출 → defer 저장 로직 → tick/브로드캐스트 검증.
2. **프론트**: HomeLayout 뼈대 → TimerPanel(원형 타이머 + 버튼) → TodayPanel(헤더 + TaskInput) → TaskList(드래그 + 미루기) → 상태 연동/포맷 마무리.
3. **통합 검증**: 추가→시작→일시정지→시간추가→끝내기→미루기→앱 재시작 복원 시나리오.

## 7. 범위 외 (이번 작업에서 안 함)
- 플로팅 위젯(WidgetApp) UI 변경 — 단, 세션 상태 필드 변경으로 인한 호환성은 유지할 것.
- 설정/통계 페이지 자체의 리디자인.
- 알람 팝업/사운드 로직 변경.
