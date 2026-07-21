import { useState } from 'react'
import styles from './EditTaskModal.module.css'

export default function EditTaskModal({ task, onSave, onClose }) {
  const [name, setName] = useState(task.name)
  const [minutes, setMinutes] = useState(String(task.plannedMinutes))

  const parsedMinutes = Number(minutes)
  const canSave = name.trim().length > 0 && parsedMinutes > 0

  function handleSave() {
    if (!canSave) return
    onSave({ name: name.trim(), plannedMinutes: parsedMinutes })
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>할 일 수정</h3>

        <label className={styles.field}>
          <span className={styles.label}>할 일 이름</span>
          <input
            className={styles.nameInput}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>예상 시간(분)</span>
          <input
            className={styles.minutesInput}
            type="text"
            inputMode="numeric"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </label>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            취소
          </button>
          <button type="button" className={styles.saveButton} disabled={!canSave} onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
