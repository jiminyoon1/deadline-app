import { useRef, useState } from 'react'
import { formatDurationKo } from '../../utils/time'
import styles from './WidgetTaskList.module.css'

// 위젯의 "오늘 할 일" 드롭다운 패널.
// 즉석 처리(확인·바로 시작·인라인 수정·추가)만 담당하고, 본격 정리는 메인 창의 몫이다.

function rowTime(task) {
  if (task.status === 'done') return `${task.actualMinutes || 0}분 집중`
  if (task.status === 'running' || task.status === 'paused') {
    const over = (task.elapsedSeconds || 0) - task.plannedSeconds
    if (task.remainingSeconds === 0 && over > 0) return `+${formatDurationKo(over)}`
    return `${formatDurationKo(task.remainingSeconds)} 남음`
  }
  // 하다가 만 할 일은 진행량을 함께 보여준다
  const doneMinutes = Math.round((task.elapsedSeconds || 0) / 60)
  if (doneMinutes > 0) return `${doneMinutes}/${task.plannedMinutes}분`
  return `${task.plannedMinutes}분`
}

function StatusDot({ status, started }) {
  if (status === 'done') return <span className={styles.dotDone}>✓</span>
  if (status === 'running' || status === 'paused') return <span className={styles.dotActive} />
  // 하다 만 할 일: 반만 채운 점으로 손댄 적 있음을 표시
  if (started) return <span className={styles.dotHalf} />
  return <span className={styles.dotPending} />
}

function EditRow({ task, onDone }) {
  const [name, setName] = useState(task.name)
  const [minutes, setMinutes] = useState(String(task.plannedMinutes))
  const nameRef = useRef(null)
  const minutesRef = useRef(null)

  function save() {
    const parsed = Number(minutes)
    if (name.trim() && parsed > 0) {
      window.api.session.updateTask(task.id, { name: name.trim(), plannedMinutes: parsed })
    }
    onDone()
  }

  // AddRow와 같은 키 동작: Enter 저장, Esc 취소, 칸 경계에서 방향키로 이동
  function handleNameKey(e) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') onDone()
    if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length) {
      e.preventDefault()
      minutesRef.current?.focus()
    }
  }

  function handleMinutesKey(e) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') onDone()
    if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
      e.preventDefault()
      nameRef.current?.focus()
    }
  }

  return (
    <li className={styles.editRow}>
      <input
        autoFocus
        ref={nameRef}
        className={styles.editName}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleNameKey}
      />
      <input
        ref={minutesRef}
        className={styles.editMinutes}
        inputMode="numeric"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value.replace(/[^0-9]/g, ''))}
        onKeyDown={handleMinutesKey}
      />
      <button type="button" className={styles.editSave} onClick={save}>
        저장
      </button>
    </li>
  )
}

function AddRow() {
  const [name, setName] = useState('')
  const [minutes, setMinutes] = useState('')
  const nameRef = useRef(null)
  const minutesRef = useRef(null)

  function add() {
    const parsed = Number(minutes)
    if (!name.trim() || !(parsed > 0)) return
    window.api.session.addTask({ name: name.trim(), plannedMinutes: parsed })
    setName('')
    setMinutes('')
    // 연달아 입력할 수 있게 이름칸으로 포커스를 되돌린다
    nameRef.current?.focus()
  }

  // 방향키로 이름 ↔ 분 칸을 오간다. 커서가 칸 끝/처음에 있을 때만 넘어가서
  // 칸 안에서의 커서 이동은 그대로 동작한다.
  function handleNameKey(e) {
    if (e.key === 'Enter') add()
    if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length) {
      e.preventDefault()
      minutesRef.current?.focus()
    }
  }

  function handleMinutesKey(e) {
    if (e.key === 'Enter') add()
    if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
      e.preventDefault()
      nameRef.current?.focus()
    }
  }

  return (
    <div className={styles.addRow}>
      <input
        ref={nameRef}
        className={styles.addName}
        placeholder="새로운 할 일"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleNameKey}
      />
      <input
        ref={minutesRef}
        className={styles.addMinutes}
        inputMode="numeric"
        placeholder="분"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value.replace(/[^0-9]/g, ''))}
        onKeyDown={handleMinutesKey}
      />
      <button type="button" className={styles.addButton} onClick={add} aria-label="추가">
        +
      </button>
    </div>
  )
}

// footer: 패널 맨 아래에 붙는 부가 행(예: 대기 화면의 "하루 마무리"). 없으면 생략.
export default function WidgetTaskList({ session, footer }) {
  const [editingId, setEditingId] = useState(null)
  // 완료된 할 일은 위젯에서 보여주지 않는다 — 헤더의 진행률(n/m)이 대신한다. 정리는 메인 창에서.
  const visibleTasks = session.tasks.filter((t) => !t.completed)
  const doneCount = session.tasks.length - visibleTasks.length

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span>오늘 할 일</span>
        <span className={styles.progress} title="완료한 할 일 / 전체">
          {doneCount}/{session.tasks.length}
        </span>
      </div>
      <ul className={styles.list}>
        {visibleTasks.length === 0 && <li className={styles.empty}>남은 할 일이 없어요</li>}
        {visibleTasks.map((task) =>
          editingId === task.id ? (
            <EditRow key={task.id} task={task} onDone={() => setEditingId(null)} />
          ) : (
            <li
              key={task.id}
              className={styles.row}
              title="클릭해서 수정"
              onClick={() => setEditingId(task.id)}
            >
              <StatusDot status={task.status} started={(task.elapsedSeconds || 0) > 0} />
              <span className={task.status === 'done' ? styles.nameDone : styles.name}>
                {task.name}
              </span>
              <span className={styles.time}>{rowTime(task)}</span>
              {task.status === 'pending' && (
                <button
                  type="button"
                  className={styles.startButton}
                  title="바로 시작"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.api.session.startTask(task.id)
                  }}
                >
                  ▶
                </button>
              )}
            </li>
          )
        )}
      </ul>
      <AddRow />
      {footer}
    </div>
  )
}
