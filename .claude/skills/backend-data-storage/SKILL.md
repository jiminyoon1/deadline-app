---
name: backend-data-storage
description: Deadline Flow 메인 프로세스의 로컬 JSON 파일 저장 규약. 기록(records)·설정(settings) 파일 스키마를 다루거나 저장/조회 로직을 작성할 때 사용한다. 물리 DB(SQLite 등) 도입을 금지하고 날짜별 JSON 파일 구조를 강제한다. "저장", "파일", "기록", "records", "settings.json"을 언급하면 항상 참조한다.
---

# backend-data-storage (로컬 JSON 저장 규약)

**물리적인 DB 절대 금지.** SQLite, PostgreSQL, Supabase 등 어떤 DB도 설치·연결하지 않는다. 클라우드 동기화는 백로그(Phase 2) — 지금 구현 대상 아님. 저장은 전부 `app.getPath('userData')` 하위 로컬 JSON 파일만 사용한다. 파일 읽기/쓰기는 메인 프로세스에서만 처리한다.

## 파일 구조 (실제 — `src/main/data/`)

| 파일 | 위치 | 내용 |
|---|---|---|
| `records.js` | `userData/records/YYYY-MM-DD.json` (날짜별 1파일) | 하루 기록 |
| `settingsStore.js` | `userData/settings.json` (파일 1개) | 앱 설정 |

## 기록(record) 스키마

`sessionStore.getState()`가 반환하고 `writeRecord`가 저장하는 형태 (`records.js` 기준):

```json
{
  "date": "2026-07-12",
  "tasks": [
    {
      "id": "uuid",
      "name": "PRD 초안 작성",
      "plannedMinutes": 50,
      "actualMinutes": 62,
      "completed": true,
      "flowmodoroUsed": false,
      "startedAt": "2026-07-12T09:30:00.000Z",
      "breaks": [
        { "minutes": 10, "note": "", "isRewardRest": false }
      ]
    }
  ],
  "totalFocusMinutes": 182,
  "totalBreakMinutes": 25
}
```

필드를 추가/변경하려면 `sessionStore.js`의 `emptyRecord`/태스크 형태와 `records.js` 저장 로직을 함께 맞춘다 (`backend-session-state` Skill 참고).

## 설정(settings) 스키마

```json
{ "xButtonMode": "hide", "flowmodoroEnabled": false }
```
- `xButtonMode`: `'hide' | 'close'`. 위젯 X 버튼 동작 (`backend-window-management` Skill 참고).
- `readSettings()`는 파일이 없으면 `DEFAULT_SETTINGS`를 반환한다 — 기본값은 `settingsStore.js`의 `DEFAULT_SETTINGS`에서만 바꾼다.

## 저장 동작 규칙

- 쓰기 전 디렉토리 존재 확인 후 없으면 생성(`fs.mkdirSync(..., { recursive: true })`) — `records.js`의 `recordsDir()` 패턴을 그대로 따른다.
- 같은 날짜 파일은 덮어쓰기(하루 기록은 항상 최신 상태 1개 파일).
- `JSON.stringify(data, null, 2)`로 사람이 읽을 수 있게 저장.
- 읽기 시 파일이 없으면 에러가 아니라 `null`(record) 또는 기본값(settings) 반환.

## 하지 말 것

- 전체 기록을 하나의 거대 파일로 합치지 않는다 (날짜별 분리 유지).
- 스키마 필드를 임의로 추가/변경하지 않는다. PRD에 없는 필드가 필요하면 먼저 사용자 확인.
