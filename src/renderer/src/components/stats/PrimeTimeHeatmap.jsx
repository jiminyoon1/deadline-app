import { useMemo } from 'react'
import styles from './StatsView.module.css'

export default function PrimeTimeHeatmap({ records }) {
  const hourlyMinutes = useMemo(() => {
    const buckets = new Array(24).fill(0)
    records.forEach((record) => {
      record.tasks.forEach((task) => {
        if (!task.startedAt) return
        const hour = new Date(task.startedAt).getHours()
        buckets[hour] += task.actualMinutes || 0
      })
    })
    return buckets
  }, [records])

  const max = Math.max(1, ...hourlyMinutes)

  return (
    <div className={styles.heatmap}>
      {hourlyMinutes.map((minutes, hour) => (
        <div key={hour} className={styles.heatmapCellWrap} title={`${hour}시 · ${minutes}분`}>
          <div
            className={styles.heatmapCell}
            style={{ opacity: minutes === 0 ? 0.08 : 0.15 + (minutes / max) * 0.85 }}
          />
          {hour % 3 === 0 && <span className={styles.heatmapLabel}>{hour}</span>}
        </div>
      ))}
    </div>
  )
}
