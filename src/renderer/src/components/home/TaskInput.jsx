import { useRef, useState } from 'react'
import styles from './TaskInput.module.css'

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <line x1="10" y1="4" x2="10" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="4" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function TaskInput({ onAddTask }) {
  const [name, setName] = useState('')
  const [minutes, setMinutes] = useState('')
  const nameRef = useRef(null)
  const minutesRef = useRef(null)

  const parsedMinutes = Number(minutes)
  const canAdd = name.trim().length > 0 && parsedMinutes > 0

  function submit() {
    if (!canAdd) return
    onAddTask({ name: name.trim(), plannedMinutes: parsedMinutes })
    setName('')
    setMinutes('')
    nameRef.current?.focus()
  }

  function handleNameKeyDown(e) {
    if (
      e.key === 'ArrowRight' &&
      e.target.selectionStart === e.target.value.length &&
      e.target.selectionStart === e.target.selectionEnd
    ) {
      e.preventDefault()
      minutesRef.current?.focus()
    }
  }

  return (
    <div className={styles.root}>
      <input
        ref={nameRef}
        className={styles.nameInput}
        type="text"
        placeholder="새로운 할 일 추가"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleNameKeyDown}
      />
      <input
        ref={minutesRef}
        className={styles.minutesInput}
        type="text"
        inputMode="numeric"
        placeholder="30 분"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value.replace(/[^0-9]/g, ''))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          // 커서가 맨 앞일 때 ←로 이름 입력칸으로 되돌아간다 (→로 넘어온 것과 대칭)
          if (
            e.key === 'ArrowLeft' &&
            e.target.selectionStart === 0 &&
            e.target.selectionStart === e.target.selectionEnd
          ) {
            e.preventDefault()
            nameRef.current?.focus()
          }
        }}
      />
      <button
        type="button"
        className={styles.addButton}
        aria-label="할 일 추가"
        disabled={!canAdd}
        onClick={submit}
      >
        <PlusIcon />
      </button>
    </div>
  )
}
