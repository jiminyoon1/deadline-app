import { useEffect, useRef } from 'react'
import styles from './TaskRowMenu.module.css'

export default function TaskRowMenu({ onEdit, onDefer, onDelete, onClose }) {
  const rootRef = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) onClose()
    }
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div ref={rootRef} className={styles.menu} onClick={(e) => e.stopPropagation()}>
      <button type="button" className={styles.item} onClick={onEdit}>
        수정하기
      </button>
      <button type="button" className={styles.item} onClick={onDefer}>
        다음날로 미루기
      </button>
      <button type="button" className={`${styles.item} ${styles.danger}`} onClick={onDelete}>
        삭제하기
      </button>
    </div>
  )
}
