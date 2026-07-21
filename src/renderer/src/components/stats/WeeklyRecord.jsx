import { useMemo } from 'react'
import { formatHoursMinutes } from '../../utils/time'
import styles from './WeeklyRecord.module.css'

// 기록 탭의 첫 화면 — 이번 주 7일 그리드.
// 요일 카드가 곧 날짜 내비게이션이다: 클릭하면 아래 DayDetail이 그 날로 바뀐다.

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

function dateString(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// offsetWeeks=0이면 오늘이 속한 주(월요일 시작)의 7개 날짜
export function weekDates(offsetWeeks = 0) {
  const now = new Date()
  const mondayDelta = (now.getDay() + 6) % 7
  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - mondayDelta + offsetWeeks * 7
  )
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    return dateString(d)
  })
}

function shortLabel(date) {
  const [, m, d] = date.split('-')
  return `${Number(m)}/${Number(d)}`
}

function rangeLabel(dates) {
  const [, m1, d1] = dates[0].split('-')
  const [, m2, d2] = dates[6].split('-')
  return `${Number(m1)}월 ${Number(d1)}일 - ${Number(m2)}월 ${Number(d2)}일`
}

// 완료된 태스크 기준 추정 오차 목록: (실제-계획)/계획
export function estimationErrors(tasks) {
  return tasks
    .filter((t) => t.completed && t.plannedMinutes > 0 && (t.actualMinutes || 0) > 0)
    .map((t) => (t.actualMinutes - t.plannedMinutes) / t.plannedMinutes)
}

export default function WeeklyRecord({
  records,
  weekOffset,
  onWeekChange,
  selectedDate,
  onSelectDate
}) {
  const today = dateString(new Date())
  const dates = useMemo(() => weekDates(weekOffset), [weekOffset])
  const byDate = useMemo(() => new Map(records.map((r) => [r.date, r])), [records])
  const weekRecords = dates.map((d) => byDate.get(d)).filter(Boolean)

  const totalMinutes = weekRecords.reduce((s, r) => s + (r.totalFocusMinutes || 0), 0)
  const allTasks = weekRecords.flatMap((r) => r.tasks)
  const doneCount = allTasks.filter((t) => t.completed).length
  const completionRate = allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : null

  const errors = estimationErrors(allTasks)
  const avgError =
    errors.length > 0 ? Math.round((errors.reduce((s, e) => s + e, 0) / errors.length) * 100) : null

  let errorSentence = null
  if (avgError !== null && errors.length >= 3) {
    if (Math.abs(avgError) < 5) {
      errorSentence = '계획과 실제가 거의 일치해요. 지금 감각을 유지하세요.'
    } else if (avgError > 0) {
      errorSentence = `보통 계획보다 ${avgError}% 더 걸려요 — 60분짜리 일은 ${Math.round(
        60 * (1 + avgError / 100)
      )}분으로 잡아보세요.`
    } else {
      errorSentence = `보통 계획보다 ${Math.abs(avgError)}% 빨리 끝내요 — 계획을 조금 타이트하게 잡아도 좋아요.`
    }
  }

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{weekOffset === 0 ? '이번 주' : rangeLabel(dates)}</h3>
            <div className={styles.weekNav}>
              <button
                type="button"
                className={styles.navButton}
                aria-label="지난 주"
                onClick={() => onWeekChange(weekOffset - 1)}
              >
                ‹
              </button>
              <button
                type="button"
                className={styles.navButton}
                aria-label="다음 주"
                disabled={weekOffset >= 0}
                onClick={() => onWeekChange(weekOffset + 1)}
              >
                ›
              </button>
            </div>
          </div>
          {weekOffset === 0 && <p className={styles.range}>{rangeLabel(dates)}</p>}
        </div>
        <div className={styles.totalCol}>
          <p className={styles.totalLabel}>주간 총 집중</p>
          <p className={styles.totalValue}>{formatHoursMinutes(totalMinutes)}</p>
        </div>
      </header>

      <div className={styles.grid}>
        {dates.map((date, i) => {
          const record = byDate.get(date)
          const isToday = date === today
          const isSelected = date === selectedDate
          const isFuture = date > today
          return (
            <button
              key={date}
              type="button"
              disabled={!record}
              className={isSelected ? styles.dayActive : styles.day}
              onClick={() => record && onSelectDate(date)}
            >
              <span className={isToday ? styles.dayLabelToday : styles.dayLabel}>
                {DAY_LABELS[i]}
              </span>
              <span className={styles.dayDate}>
                {shortLabel(date)}
                {isToday ? ' · 오늘' : ''}
              </span>
              <span className={isToday ? styles.dayTotalToday : styles.dayTotal}>
                {record ? formatHoursMinutes(record.totalFocusMinutes || 0) : isFuture ? '' : '—'}
              </span>
              <span className={styles.chips}>
                {(record?.tasks || []).slice(0, 4).map((t) =>
                  t.completed ? (
                    <span key={t.id} className={styles.chipDone}>
                      {t.name}
                    </span>
                  ) : (
                    <span key={t.id} className={styles.chipPlain}>
                      {t.name}
                    </span>
                  )
                )}
                {record && record.tasks.length > 4 && (
                  <span className={styles.chipMore}>+{record.tasks.length - 4}</span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <footer className={styles.footer}>
        <span className={styles.stat}>
          완료율{' '}
          <b className={styles.statValueSuccess}>
            {completionRate === null ? '—' : `${completionRate}%`}
          </b>
        </span>
        <span className={styles.statDivider} />
        <span className={styles.stat}>
          추정 오차{' '}
          <b>{avgError === null ? '—' : `${avgError > 0 ? '+' : ''}${avgError}%`}</b>
        </span>
        {errorSentence && <span className={styles.sentence}>{errorSentence}</span>}
      </footer>
    </section>
  )
}
