import { useRef } from 'react'
import { formatDurationKo, formatHoursMinutes } from '../../utils/time'
import TaskRowMenu from './TaskRowMenu'
import styles from './TaskList.module.css'

function DragHandleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="7" cy="5" r="1.3" fill="currentColor" />
      <circle cx="13" cy="5" r="1.3" fill="currentColor" />
      <circle cx="7" cy="10" r="1.3" fill="currentColor" />
      <circle cx="13" cy="10" r="1.3" fill="currentColor" />
      <circle cx="7" cy="15" r="1.3" fill="currentColor" />
      <circle cx="13" cy="15" r="1.3" fill="currentColor" />
    </svg>
  )
}

function StatusIcon({ status, started }) {
  if (status === 'done') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="var(--color-done)" />
        <path
          d="M6.3 10.2l2.4 2.4 4.9-5"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (status === 'running' || status === 'paused') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="var(--color-primary)" />
      </svg>
    )
  }
  // 하다 만 할 일(진행량 있음): 반만 채운 원 — 손댄 적 있다는 표시
  if (started) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9.25" stroke="var(--color-primary)" strokeWidth="1.5" />
        <path d="M10 1.5a8.5 8.5 0 0 1 0 17z" fill="var(--color-primary)" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9.25" stroke="var(--color-border)" strokeWidth="1.5" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="4.5" r="1.4" fill="currentColor" />
      <circle cx="10" cy="10" r="1.4" fill="currentColor" />
      <circle cx="10" cy="15.5" r="1.4" fill="currentColor" />
    </svg>
  )
}

function RestartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M7 5l8 5-8 5V5z" fill="currentColor" />
    </svg>
  )
}

export default function TaskRow({
  task,
  index,
  isPreviewed,
  onToggleCompleted,
  onStart,
  menuOpen,
  onOpenMenu,
  onCloseMenu,
  onEdit,
  onRestart,
  onDefer,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop
}) {
  const status = task.status
  const isActive = status === 'running' || status === 'paused'
  const isDone = status === 'done'

  // 처음부터 완료로 그려진 행은 팝 애니메이션 없이, 이 세션에서 방금 완료된 행만 팝
  const wasDoneOnMount = useRef(isDone)
  const popCheck = isDone && !wasDoneOnMount.current

  let timeLabel
  if (isActive) {
    // 계획을 다 쓰고 플로우로 이어가는 중이면 남은 시간(0) 대신 초과분을 보여준다
    const over = (task.elapsedSeconds || 0) - task.plannedSeconds
    timeLabel =
      task.remainingSeconds === 0 && over > 0
        ? `+${formatDurationKo(over)} 집중 중`
        : formatDurationKo(task.remainingSeconds)
  } else if (isDone) {
    // 계획 대비 실제 집중 시간. 계획을 넘겼으면(플로우/연장) 초과분을 함께 보여준다.
    const focused = task.actualMinutes || 0
    const over = focused - task.plannedMinutes
    timeLabel = `${task.plannedMinutes}분 계획 · ${focused}분 집중${over > 0 ? ` (+${over}분)` : ''}`
  } else {
    // 하다가 만 할 일은 얼마나 했는지 함께 보여준다
    const doneMinutes = Math.round((task.elapsedSeconds || 0) / 60)
    timeLabel =
      doneMinutes > 0
        ? `${doneMinutes}분 함 · ${formatDurationKo(task.remainingSeconds)} 남음`
        : formatHoursMinutes(task.plannedMinutes)
  }

  const nameClass = isActive
    ? styles.rowNameActive
    : isPreviewed
      ? styles.rowNameSelected
      : isDone
        ? styles.rowNameDone
        : styles.rowName

  const rowClass = isPreviewed
    ? styles.rowSelected
    : isDone
      ? styles.rowDone
      : status === 'pending'
        ? styles.rowClickable
        : styles.row

  // 행 클릭 = 즉시 시작. 프리뷰 단계 없이 바로 타이머가 돈다 ("묻지 않는 흐름"과 일관).
  // 잘못 눌러도 이전 태스크를 다시 클릭하면 되돌아가고, 경과 시간은 각자 보존된다.
  function handleRowClick() {
    if (status === 'pending') onStart(task.id)
  }

  return (
    <li
      className={rowClass}
      onDragOver={
        isDone
          ? undefined
          : (e) => {
              e.preventDefault()
              onDragOver(index)
            }
      }
      onDrop={isDone ? undefined : () => onDrop(index)}
      onClick={handleRowClick}
      title={status === 'pending' ? '클릭해서 바로 시작' : undefined}
    >
      {isDone ? (
        <span className={styles.dragHandle} aria-hidden="true" />
      ) : (
        <span
          className={`${styles.dragHandle} ${styles.ghost}`}
          draggable
          onDragStart={() => onDragStart(index)}
          onClick={(e) => e.stopPropagation()}
        >
          <DragHandleIcon />
        </span>
      )}
      <span
        className={popCheck ? `${styles.statusIcon} ${styles.checkAnim}` : styles.statusIcon}
        onClick={(e) => {
          e.stopPropagation()
          onToggleCompleted(task.id)
        }}
      >
        <StatusIcon status={status} started={(task.elapsedSeconds || 0) > 0} />
      </span>
      <span className={nameClass}>{task.name}</span>
      <span className={styles.rowTime}>{timeLabel}</span>
      {isDone && (
        <button
          type="button"
          className={`${styles.deferButton} ${styles.ghost}`}
          aria-label="다시 시작"
          title="완료 해제하고 이어서 시작 (기록된 시간은 유지돼요)"
          onClick={(e) => {
            e.stopPropagation()
            onRestart()
          }}
        >
          <RestartIcon />
        </button>
      )}
      <button
        type="button"
        className={`${styles.moreButton} ${styles.ghost}`}
        aria-label="더 보기"
        onClick={(e) => {
          e.stopPropagation()
          menuOpen ? onCloseMenu() : onOpenMenu()
        }}
      >
        <MoreIcon />
      </button>
      {menuOpen && (
        <TaskRowMenu onEdit={onEdit} onDefer={onDefer} onDelete={onDelete} onClose={onCloseMenu} />
      )}
    </li>
  )
}
