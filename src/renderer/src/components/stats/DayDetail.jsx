import { formatHoursMinutes } from '../../utils/time'
import styles from './DayDetail.module.css'

// 하루 상세 — 태스크별 계획 대비 실제 막대.
// 막대 전체 폭 = max(계획, 실제). 계획 위치에 기준선을 긋고, 넘친 만큼이 한눈에 보이게 한다.

function formatDay(date) {
  const [y, m, d] = date.split('-').map(Number)
  const label = ['일', '월', '화', '수', '목', '금', '토'][new Date(y, m - 1, d).getDay()]
  return `${m}월 ${d}일 (${label})`
}

function TaskBar({ task }) {
  const planned = task.plannedMinutes || 0
  const actual = task.actualMinutes || 0
  const scale = Math.max(planned, actual, 1)
  const actualPct = (actual / scale) * 100
  const plannedPct = (planned / scale) * 100
  const error = planned > 0 && actual > 0 ? Math.round(((actual - planned) / planned) * 100) : null
  const over = error !== null && error > 0

  return (
    <li className={styles.row}>
      <span className={task.completed ? styles.name : styles.nameUndone}>{task.name}</span>
      <div className={styles.barArea}>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${actualPct}%` }} />
          {/* 계획 기준선 — 실제가 이 선을 넘으면 초과 */}
          <div className={styles.plannedMark} style={{ left: `${plannedPct}%` }} />
        </div>
      </div>
      <span className={styles.minutes}>
        {actual > 0 ? `${actual}/${planned}분` : `${planned}분 계획`}
      </span>
      <span className={over ? styles.errorOver : styles.errorUnder}>
        {error === null ? '' : `${error > 0 ? '+' : ''}${error}%`}
      </span>
    </li>
  )
}

export default function DayDetail({ record }) {
  if (!record) return null

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h3 className={styles.title}>{formatDay(record.date)}</h3>
        <p className={styles.totals}>
          몰입 {formatHoursMinutes(record.totalFocusMinutes || 0)} · 휴식{' '}
          {formatHoursMinutes(record.totalBreakMinutes || 0)}
        </p>
      </header>

      {record.tasks.length === 0 ? (
        <p className={styles.empty}>이 날은 기록된 할 일이 없어요.</p>
      ) : (
        <ul className={styles.list}>
          {record.tasks.map((t) => (
            <TaskBar key={t.id} task={t} />
          ))}
        </ul>
      )}
    </section>
  )
}
