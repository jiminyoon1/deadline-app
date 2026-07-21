import { useEffect, useRef, useState } from 'react'
import { ProgressRing, useWindowDrag } from './TimerWidget'
import { formatClock, formatDurationKo } from '../../utils/time'
import styles from './TimerWidget.module.css'

// 휴식 중 위젯 — 진행 중 위젯과 같은 미니 버블/알약 UI를 쓰고 색만 초록이다.
// 일시정지·목록 대신 "건너뛰기" 하나만 제공한다 (휴식은 세부 조작이 필요 없다).

function SkipIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path d="M3.5 3l6 5-6 5V3z" fill="currentColor" />
      <rect x="11" y="3" width="2" height="10" rx="1" fill="currentColor" />
    </svg>
  )
}

export default function RestWidget({ session }) {
  const { timer } = session
  const [mode, setModeState] = useState('pill') // 'mini' | 'pill'
  const modeRef = useRef(mode)

  const setMode = (next) => {
    modeRef.current = next
    setModeState(next)
    window.api.widget.setMode(next === 'pill' ? 'expanded' : 'mini')
  }

  // 진행 중에 목록(list)을 펼쳐둔 채 휴식으로 넘어와도 창 크기가 알약에 맞도록 초기화
  useEffect(() => {
    window.api.widget.setMode('expanded')
  }, [])

  const ratio =
    timer.restTotalSeconds > 0 ? 1 - timer.restRemainingSeconds / timer.restTotalSeconds : 0

  const handleMiniMouseDown = useWindowDrag(() => setMode('pill'))
  const handleBodyMouseDown = useWindowDrag(() => setMode('mini'))

  if (mode === 'mini') {
    return (
      <div className={styles.miniWrap}>
        <button
          type="button"
          className={styles.miniBubble}
          onMouseDown={handleMiniMouseDown}
          title="확장 (드래그로 이동)"
        >
          <ProgressRing
            ratio={ratio}
            size={56}
            radius={24.5}
            className={styles.miniRing}
            progressClassName={styles.ringProgressRest}
          />
          <span className={styles.miniTime}>{formatClock(timer.restRemainingSeconds)}</span>
        </button>
        <button
          type="button"
          className={styles.miniClose}
          title="위젯 숨기기 (휴식은 계속돼요)"
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

  return (
    <div className={styles.pill}>
      <div
        className={styles.pillBody}
        role="button"
        title="작게 보기 (드래그로 이동)"
        onMouseDown={handleBodyMouseDown}
      >
        <ProgressRing
          ratio={ratio}
          size={40}
          radius={15.5}
          className={styles.ring}
          progressClassName={styles.ringProgressRest}
        />
        <div className={styles.textColumn}>
          <p className={styles.taskName}>휴식 중</p>
          <p className={styles.subTextRest}>{formatDurationKo(timer.restRemainingSeconds)} 남음</p>
        </div>
      </div>

      <button
        type="button"
        className={styles.iconButton}
        title="휴식 건너뛰기"
        onClick={() => window.api.session.skipRest()}
      >
        <SkipIcon />
      </button>
    </div>
  )
}
