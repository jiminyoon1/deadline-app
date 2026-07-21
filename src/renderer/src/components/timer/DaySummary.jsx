import { formatHoursMinutes } from '../../utils/time'
import styles from './DaySummary.module.css'

export default function DaySummary({ session }) {
  return (
    <div className={styles.screen}>
      <p className={styles.title}>오늘 하루 요약</p>
      <p className={styles.total}>
        총 몰입 {formatHoursMinutes(session.totalFocusMinutes)} · 총 휴식{' '}
        {formatHoursMinutes(session.totalBreakMinutes)}
      </p>
      <ul className={styles.taskList}>
        {session.tasks.map((task) => (
          <li key={task.id} className={styles.taskRow}>
            <span>{task.name}</span>
            <span>
              {task.completed
                ? `예정 ${formatHoursMinutes(task.plannedMinutes)} · 실제 ${formatHoursMinutes(task.actualMinutes)}`
                : (task.elapsedSeconds || 0) > 0
                  ? `${formatHoursMinutes(task.actualMinutes)} 함 · 미완`
                  : '시작 안 함'}
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className={styles.confirmButton} onClick={() => window.api.session.backToHome()}>
        확인
      </button>
    </div>
  )
}
