import CircularTimer from './CircularTimer'
import { formatClock, formatHoursMinutes } from '../../utils/time'
import styles from './TimerPanel.module.css'

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="5.5" y="4" width="3" height="12" rx="1" fill="currentColor" />
      <rect x="11.5" y="4" width="3" height="12" rx="1" fill="currentColor" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M6 4.5l9 5.5-9 5.5V4.5z" fill="currentColor" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <rect x="5.5" y="5.5" width="9" height="9" rx="1.5" fill="currentColor" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="5" r="2" fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="10" r="2" fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="15" r="2" fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function StatsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <line x1="2" y1="17" x2="18" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="4" y="11" width="3" height="6" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="7" width="3" height="10" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="3" width="3" height="14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export default function TimerPanel({
  session,
  previewTask,
  onPause,
  onResume,
  onComplete,
  onStart,
  onNavigate
}) {
  const { timer } = session
  const activeTask = session.tasks.find((t) => t.id === timer.activeTaskId)
  const isRunning = timer.status === 'running'
  const isPaused = timer.status === 'paused'
  const hasFocus = Boolean(activeTask) && ['running', 'paused'].includes(timer.status)
  const isPreview = !hasFocus && Boolean(previewTask)

  const remainingSeconds = activeTask ? activeTask.remainingSeconds : 0
  const plannedSeconds = activeTask ? activeTask.plannedSeconds : 0
  const isOvertime = hasFocus && timer.isOvertime

  const displayName = hasFocus ? activeTask.name : isPreview ? previewTask.name : '태스크를 시작하세요'

  return (
    <div className={styles.root}>
      <p className={styles.taskName}>{displayName}</p>

      <CircularTimer
        remainingSeconds={remainingSeconds}
        plannedSeconds={plannedSeconds}
        isPaused={isPaused}
        idle={isPreview}
        overtime={isOvertime}
        centerText={
          isOvertime
            ? `+${formatClock(Math.max(0, (activeTask.elapsedSeconds || 0) - plannedSeconds))}`
            : isPreview
              ? formatHoursMinutes(previewTask.plannedMinutes)
              : undefined
        }
        centerSubText={isOvertime ? '플로우 집중 중' : isPreview ? '예상 시간' : undefined}
      />

      {isPreview ? (
        <button
          type="button"
          className={styles.startButton}
          onClick={() => onStart(previewTask.id)}
        >
          <PlayIcon />
          시작하기
        </button>
      ) : (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.controlButton}
            aria-label={isPaused ? '재개' : '일시정지'}
            disabled={!(isRunning || isPaused)}
            onClick={isPaused ? onResume : onPause}
          >
            {isPaused ? <PlayIcon /> : <PauseIcon />}
          </button>
          <button
            type="button"
            className={styles.controlButton}
            aria-label="끝내기"
            disabled={!hasFocus}
            onClick={onComplete}
          >
            <StopIcon />
          </button>
        </div>
      )}

      <div className={styles.navRow}>
        <button type="button" className={styles.navButton} onClick={() => onNavigate('settings')}>
          <SettingsIcon />
          설정
        </button>
        <button type="button" className={styles.navButton} onClick={() => onNavigate('stats')}>
          <StatsIcon />
          기록
        </button>
      </div>
    </div>
  )
}
