import { formatHMS } from '../../utils/time'
import styles from './CircularTimer.module.css'

const RING_RADIUS = 88
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export default function CircularTimer({
  remainingSeconds = 0,
  plannedSeconds = 0,
  isPaused = false,
  idle = false,
  overtime = false,
  centerText,
  centerSubText
}) {
  const fraction = overtime ? 1 : idle || plannedSeconds <= 0 ? 0 : remainingSeconds / plannedSeconds
  const ringFraction = Math.min(1, Math.max(0, fraction))
  const ringOffset = RING_CIRCUMFERENCE * (1 - ringFraction)

  const label = centerText ?? formatHMS(remainingSeconds)
  const subLabel = centerSubText ?? (isPaused ? '일시정지' : '남음')

  return (
    <div className={styles.ring}>
      <svg viewBox="0 0 200 200" className={styles.ringSvg}>
        <circle cx="100" cy="100" r={RING_RADIUS} className={styles.ringTrack} strokeWidth="12" fill="none" />
        <circle
          cx="100"
          cy="100"
          r={RING_RADIUS}
          className={styles.ringProgress}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={ringOffset}
        />
      </svg>
      <div className={styles.ringLabel}>
        <span className={styles.timer}>{label}</span>
        <span className={styles.ringSub}>{subLabel}</span>
      </div>
    </div>
  )
}
