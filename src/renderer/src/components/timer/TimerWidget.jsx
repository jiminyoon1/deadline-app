import { useEffect, useRef, useState } from 'react'
import WidgetTaskList from './WidgetTaskList'
import { formatClock, formatDurationKo } from '../../utils/time'
import styles from './TimerWidget.module.css'

export function ProgressRing({ ratio, size, radius, className, progressClassName }) {
  const clamped = Math.min(1, Math.max(0, ratio))
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  return (
    <svg className={className} viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <circle className={styles.ringTrack} cx={center} cy={center} r={radius} />
      <circle
        className={progressClassName || styles.ringProgress}
        cx={center}
        cy={center}
        r={radius}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped)}
      />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <rect x="3.5" y="2.5" width="3" height="11" rx="1" fill="currentColor" />
      <rect x="9.5" y="2.5" width="3" height="11" rx="1" fill="currentColor" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path d="M4.5 2.5v11l9-5.5z" fill="currentColor" />
    </svg>
  )
}

// CSS 드래그 영역(-webkit-app-region)은 클릭 이벤트를 삼키므로,
// 미니 버블은 JS로 창을 직접 옮기고 이동량이 작으면 클릭(확장)으로 판정한다.
export function useWindowDrag(onClick) {
  return (e) => {
    if (e.button !== 0) return
    const startX = e.screenX
    const startY = e.screenY
    let moved = false
    let winPos = null
    window.api.widget.getPosition().then((pos) => {
      winPos = pos
    })

    const handleMove = (ev) => {
      const dx = ev.screenX - startX
      const dy = ev.screenY - startY
      if (!moved && Math.hypot(dx, dy) < 4) return
      moved = true
      if (winPos) window.api.widget.moveTo(winPos.x + dx, winPos.y + dy)
    }
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      if (!moved) onClick()
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }
}

function MiniBubble({ timer, ratio, overtimeSeconds, onExpand }) {
  const handleMouseDown = useWindowDrag(onExpand)
  return (
    <div className={styles.miniWrap}>
      <button
        type="button"
        className={styles.miniBubble}
        onMouseDown={handleMouseDown}
        title="확장 (드래그로 이동)"
      >
        <ProgressRing ratio={ratio} size={56} radius={24.5} className={styles.miniRing} />
        <span className={timer.isOvertime ? styles.miniTimeOvertime : styles.miniTime}>
          {timer.isOvertime ? `+${formatClock(overtimeSeconds)}` : formatClock(timer.remainingSeconds)}
        </span>
      </button>
      <button
        type="button"
        className={styles.miniClose}
        title="위젯 숨기기 (타이머는 계속돼요)"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          window.api.widget.hide()
        }}
      >
        <svg viewBox="0 0 12 12" width="9" height="9">
          <path
            d="M2.5 2.5l7 7m0-7l-7 7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
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

function ExpandedPill({ timer, task, ratio, subText, listOpen, onToggleList, onCollapse }) {
  const isPaused = timer.status === 'paused'
  // 본문(링·텍스트)은 드래그하면 위젯 이동, 살짝 누르면 미니로 접힌다.
  const handleBodyMouseDown = useWindowDrag(onCollapse)
  return (
    <div className={styles.pill}>
      <div
        className={styles.pillBody}
        role="button"
        title="작게 보기 (드래그로 이동)"
        onMouseDown={handleBodyMouseDown}
      >
        <ProgressRing ratio={ratio} size={40} radius={15.5} className={styles.ring} />
        <div className={styles.textColumn}>
          <p className={styles.taskName}>{task.name}</p>
          <p className={timer.isOvertime ? styles.subTextOvertime : styles.subText}>{subText}</p>
        </div>
      </div>

      <button
        type="button"
        className={styles.iconButton}
        title={isPaused ? '재개' : '일시정지'}
        onClick={() =>
          isPaused ? window.api.session.resumeTask() : window.api.session.pauseTask()
        }
      >
        {isPaused ? <PlayIcon /> : <PauseIcon />}
      </button>

      <button
        type="button"
        className={styles.iconButton}
        title="이 활동 끝내기"
        onClick={() => window.api.session.completeTask()}
      >
        <StopIcon />
      </button>

      <button
        type="button"
        className={listOpen ? styles.iconButtonActive : styles.iconButton}
        title={listOpen ? '목록 접기' : '오늘 할 일 보기'}
        onClick={onToggleList}
      >
        <ListIcon />
      </button>
    </div>
  )
}

export default function TimerWidget({ session, task }) {
  const { timer } = session
  // 기본은 알약(확장) — 뭘 하고 있는지 항상 보이는 쪽이 편하다
  const [mode, setModeState] = useState('pill') // 'mini' | 'pill' | 'list'
  const modeRef = useRef(mode)
  const prevTaskRef = useRef(timer.activeTaskId)

  const setMode = (next) => {
    modeRef.current = next
    setModeState(next)
    window.api.widget.setMode(next === 'pill' ? 'expanded' : next)
  }

  // 태스크가 바뀌면(대기 화면에서 다음 태스크 시작 등) 기본 보기인 알약으로 돌아간다.
  useEffect(() => {
    if (prevTaskRef.current !== timer.activeTaskId && timer.activeTaskId) {
      setMode('pill')
    }
    prevTaskRef.current = timer.activeTaskId
  }, [timer.activeTaskId])

  // 다른 곳을 클릭해 위젯이 포커스를 잃으면 목록은 자동으로 접힌다.
  useEffect(() => {
    const handleBlur = () => {
      if (modeRef.current === 'list') setMode('pill')
    }
    window.addEventListener('blur', handleBlur)
    return () => window.removeEventListener('blur', handleBlur)
  }, [])

  const plannedSeconds = task.plannedSeconds ?? (task.plannedMinutes || 0) * 60
  const ratio = timer.isOvertime
    ? 1
    : plannedSeconds > 0
      ? 1 - timer.remainingSeconds / plannedSeconds
      : 0

  // 초과분만 +로 표시한다 (계획을 넘겨서 더 하고 있는 시간)
  const overtimeSeconds = Math.max(0, (task.elapsedSeconds || 0) - plannedSeconds)

  const subText = timer.isOvertime
    ? `+${formatClock(overtimeSeconds)} 플로우 집중 중`
    : timer.status === 'paused'
      ? '일시정지됨'
      : `${formatDurationKo(timer.remainingSeconds)} 남음`

  if (mode === 'mini') {
    return (
      <MiniBubble
        timer={timer}
        ratio={ratio}
        overtimeSeconds={overtimeSeconds}
        onExpand={() => setMode('pill')}
      />
    )
  }

  return (
    <div className={styles.stack}>
      <ExpandedPill
        timer={timer}
        task={task}
        ratio={ratio}
        subText={subText}
        listOpen={mode === 'list'}
        onToggleList={() => setMode(mode === 'list' ? 'pill' : 'list')}
        onCollapse={() => setMode('mini')}
      />
      {mode === 'list' && <WidgetTaskList session={session} />}
    </div>
  )
}
