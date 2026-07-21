import { useEffect, useState } from 'react'
import WeeklyRecord from './WeeklyRecord'
import DayDetail from './DayDetail'
import PrimeTimeHeatmap from './PrimeTimeHeatmap'
import styles from './StatsView.module.css'

// 기록 탭: 주간 그리드(내비게이션 겸용) → 선택한 날 상세 → 프라임타임 순.
// 히트맵은 데이터가 쌓여야 의미가 생기므로 맨 아래에 둔다.

export default function StatsView({ session }) {
  const [records, setRecords] = useState([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(null)

  async function reload() {
    const all = await window.api.records.readAll()
    all.sort((a, b) => (a.date < b.date ? 1 : -1))
    setRecords(all)
    if (!selectedDate && all.length > 0) setSelectedDate(all[0].date)
  }

  useEffect(() => {
    reload()
  }, [session?.date, session?.totalFocusMinutes, session?.totalBreakMinutes])

  const selectedRecord = records.find((r) => r.date === selectedDate) || null

  if (records.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>아직 저장된 기록이 없어요. 하루를 마무리하면 기록이 쌓여요.</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.stack}>
        <WeeklyRecord
          records={records}
          weekOffset={weekOffset}
          onWeekChange={setWeekOffset}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        <DayDetail record={selectedRecord} />

        <section className={styles.heatmapCard}>
          <h3 className={styles.sectionTitle}>프라임타임 분석</h3>
          <PrimeTimeHeatmap records={records} />
        </section>
      </div>
    </div>
  )
}
