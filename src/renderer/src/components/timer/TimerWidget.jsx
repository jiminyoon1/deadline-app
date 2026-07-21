import { useEffect, useRef, useState } from 'react'
import WidgetTaskList from './WidgetTaskList'
import { formatClock, formatDurationKo } from '../../utils/time'
import { hasSeenHint, markHintSeen } from '../../utils/onboardingHints'
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

// 미니 버블의 작은 X와 같은 글리프 — 알약형 화면들에도 동일하게 쓴다.
export function CloseIcon() {
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

      {/* 미니 버블과 같은 방식: 모서리에 hover할 때만 나타난다. 알약 배경 전체가
          -webkit-app-region:drag라서, 버튼만 no-drag로 두면 접근하는 동안 마우스 이동이
          드래그 영역에 가로채여 hover가 끊긴다. 이 구역 자체를 no-drag로 넉넉히 잡아서
          접근 경로가 드래그 픽셀을 지나지 않게 한다. */}
      <div className={styles.pillCloseZone}>
        <button
          type="button"
          className={styles.pillClose}
          title="위젯 숨기기 (타이머는 계속돼요)"
          onClick={() => window.api.widget.hide()}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}

function InfoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="6.5" r="1" fill="currentColor" />
      <path d="M10 9.5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// 알약 아래 말풍선 — 위젯을 처음 띄운 순간에만 한 번 뜬다.
function WidgetHideHint({ onClose }) {
  return (
    <div className={styles.hintBubble}>
      <InfoIcon />
      <p className={styles.hintText}>
        필요 없을 땐 알약을 눌러 작게 만들고, X로 숨길 수 있어요. 숨겨도 타이머는 계속 흘러요.
      </p>
      <button type="button" className={styles.hintClose} aria-label="안내 닫기" onClick={onClose}>
        <CloseIcon />
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

  // 위젯을 처음 띄운 순간에만 알약 아래 말풍선을 보여준다.
  // "이미 봤는가"는 마운트 시 1회만 확정(useState 지연 초기화)하고 이후 절대 안 바꾼다 —
  // effect 안에서 ref를 직접 고쳐버리면 StrictMode의 이중 실행(개발 모드에서 effect를
  // 일부러 두 번 연달아 돌려 정리 누락을 잡아냄) 때 두 번째 실행이 "이미 봤다"로 잘못
  // 읽어 방금 띄운 걸 바로 꺼버린다. 렌더 값에서 파생시키면 이 문제가 아예 생기지 않는다.
  const [hintEligible] = useState(() => !hasSeenHint('widgetHide'))
  const [hintDismissed, setHintDismissed] = useState(false)
  const showHideHint = mode === 'pill' && hintEligible && !hintDismissed

  // 말풍선이 뜨는 동안은 창을 키워야 해서(widget:setHintVisible) 상태를 메인 프로세스에
  // 동기화한다. 이 effect는 showHideHint 값을 그대로 반영만 할 뿐 자기 자신이 참조하는
  // 값을 바꾸지 않으므로 StrictMode 이중 실행에도 항상 같은 결과를 낸다.
  useEffect(() => {
    window.api.widget.setHintVisible(showHideHint)
    if (showHideHint) markHintSeen('widgetHide')
  }, [showHideHint])

  useEffect(() => {
    return () => window.api.widget.setHintVisible(false)
  }, [])

  function dismissHint() {
    setHintDismissed(true)
  }

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
      {showHideHint && <WidgetHideHint onClose={dismissHint} />}
    </div>
  )
}
