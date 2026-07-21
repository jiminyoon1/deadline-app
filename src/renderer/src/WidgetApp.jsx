import { useEffect, useRef } from 'react'
import { useSession } from './hooks/useSession'
import TimerWidget from './components/timer/TimerWidget'
import RestWidget from './components/timer/RestWidget'
import NextTaskWait from './components/timer/NextTaskWait'
import DaySummary from './components/timer/DaySummary'
import { playAlarmBeep } from './utils/sound'
import styles from './WidgetApp.module.css'

export default function WidgetApp() {
  const session = useSession()

  // 알람 콜백은 한 번만 등록되므로, 최신 설정은 ref로 참조한다.
  const soundEnabledRef = useRef(true)
  useEffect(() => {
    soundEnabledRef.current = session?.settings?.alarmSoundEnabled !== false
  }, [session?.settings?.alarmSoundEnabled])

  useEffect(() => {
    return window.api.session.onAlarm(() => {
      if (soundEnabledRef.current) playAlarmBeep()
    })
  }, [])

  if (!session) return null

  const { timer } = session
  const activeTask = session.tasks.find((t) => t.id === timer.activeTaskId)

  if (timer.status === 'dayFinished') {
    return (
      <div className={styles.shell}>
        <div className={styles.card}>
          <DaySummary session={session} />
        </div>
      </div>
    )
  }

  if (timer.status === 'resting') {
    return (
      <div className={styles.shell}>
        <RestWidget session={session} />
      </div>
    )
  }

  if (timer.status === 'awaitingNext') {
    return (
      <div className={styles.shell}>
        <NextTaskWait session={session} />
      </div>
    )
  }

  if (['running', 'paused'].includes(timer.status) && activeTask) {
    return (
      <div className={styles.shell}>
        <TimerWidget session={session} task={activeTask} />
      </div>
    )
  }

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.idle}>
          <p>메인 창에서 태스크를 시작해주세요</p>
          <button
            type="button"
            className={styles.idleButton}
            onClick={() => window.api.mainWindow.show()}
          >
            메인 창 열기
          </button>
        </div>
      </div>
    </div>
  )
}
