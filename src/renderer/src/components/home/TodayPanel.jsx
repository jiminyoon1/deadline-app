import TaskInput from './TaskInput'
import { formatMonthDay, formatFocusDuration } from '../../utils/time'
import styles from './TodayPanel.module.css'

export default function TodayPanel({ session, onAddTask, children }) {
  const todayFocusSeconds = session?.todayFocusSeconds ?? 0

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.date}>{formatMonthDay()}</span>
        <span className={styles.focus}>오늘 {formatFocusDuration(todayFocusSeconds)} 집중</span>
      </div>
      <h2 className={styles.heading}>오늘 할 일</h2>
      <TaskInput onAddTask={onAddTask} />
      <div className={styles.listArea}>{children}</div>
    </div>
  )
}
