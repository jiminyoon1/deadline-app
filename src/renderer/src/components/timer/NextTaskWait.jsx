import { useEffect, useRef, useState } from 'react'
import { useWindowDrag } from './TimerWidget'
import WidgetTaskList from './WidgetTaskList'
import { formatHoursMinutes } from '../../utils/time'
import pillStyles from './TimerWidget.module.css'
import styles from './NextTaskWait.module.css'

// 다음 태스크 대기 — 진행 중/휴식 위젯과 같은 알약 UI를 쓴다.
// 왼쪽의 큰 ▶가 유일한 주요 행동(시작), 목록·숨김은 진행 중 알약과 같은 자리의 아이콘이다.

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path d="M5 3v10l8.5-5z" fill="currentColor" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path
        d="M3 4.5h10M3 8h10M3 11.5h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10">
      <path
        d="M2.5 2.5l7 7m0-7l-7 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

// 직전 태스크 다음 순서의 미완료 태스크 (sessionStore._nextPendingTask와 같은 규칙)
function nextPendingTask(session) {
  const { tasks, timer } = session
  const prevIndex = tasks.findIndex((t) => t.id === timer.activeTaskId)
  for (let i = 1; i <= tasks.length; i++) {
    const candidate = tasks[(prevIndex + i) % tasks.length]
    if (candidate && !candidate.completed) return candidate
  }
  return null
}

export default function NextTaskWait({ session }) {
  const [listOpen, setListOpen] = useState(false)
  const listOpenRef = useRef(listOpen)
  const next = nextPendingTask(session)
  // 대기 화면엔 미니 모드가 없어서, 여기 텍스트 영역은 그냥 메인 창을 연다.
  const handleBodyMouseDown = useWindowDrag(() => window.api.mainWindow.show())

  // 목록을 펼치면 위젯 창도 함께 커진다
  useEffect(() => {
    listOpenRef.current = listOpen
    window.api.widget.setMode(listOpen ? 'list' : 'expanded')
  }, [listOpen])

  // 다른 곳을 클릭해 포커스를 잃으면 목록은 자동으로 접힌다 (진행 중 위젯과 동일)
  useEffect(() => {
    const handleBlur = () => {
      if (listOpenRef.current) setListOpen(false)
    }
    window.addEventListener('blur', handleBlur)
    return () => window.removeEventListener('blur', handleBlur)
  }, [])

  if (!next) return null

  return (
    <div className={pillStyles.stack}>
      <div className={pillStyles.pill}>
        <button
          type="button"
          className={styles.startCircle}
          title="다음 할 일 시작"
          onClick={() => window.api.session.startNextTask()}
        >
          <PlayIcon />
        </button>

        <div
          className={pillStyles.pillBody}
          role="button"
          title="메인 창 열기 (드래그로 이동)"
          onMouseDown={handleBodyMouseDown}
        >
          <div className={pillStyles.textColumn}>
            <p className={pillStyles.taskName}>{next.name}</p>
            <p className={pillStyles.subText}>
              다음 할 일 · {formatHoursMinutes(next.plannedMinutes)} 예정
            </p>
          </div>
        </div>

        <button
          type="button"
          className={listOpen ? pillStyles.iconButtonActive : pillStyles.iconButton}
          title={listOpen ? '목록 접기' : '다른 할 일 선택'}
          onClick={() => setListOpen((open) => !open)}
        >
          <ListIcon />
        </button>

        <button
          type="button"
          className={pillStyles.iconButton}
          title="위젯 숨기기 (결정은 나중에 해도 돼요)"
          onClick={() => window.api.widget.hide()}
        >
          <CloseIcon />
        </button>
      </div>

      {listOpen && (
        <WidgetTaskList
          session={session}
          footer={
            <button
              type="button"
              className={styles.finishDay}
              onClick={() => window.api.session.finishDay()}
            >
              오늘은 여기까지 — 하루 마무리
            </button>
          }
        />
      )}
    </div>
  )
}
