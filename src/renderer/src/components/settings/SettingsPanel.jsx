import styles from './SettingsPanel.module.css'

const REST_PRESETS = [
  { minutes: 0, label: '없음' },
  { minutes: 5, label: '5분' },
  { minutes: 10, label: '10분' },
  { minutes: 15, label: '15분' }
]

// On/Off 텍스트 대신 스위치 — 상태는 색과 위치로 말한다
function Switch({ checked, onChange }) {
  return (
    <label className={styles.switch}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={styles.switchTrack} aria-hidden="true" />
    </label>
  )
}

function SettingRow({ title, desc, control }) {
  return (
    <div className={styles.row}>
      <div className={styles.rowText}>
        <p className={styles.rowTitle}>{title}</p>
        <p className={styles.rowDesc}>{desc}</p>
      </div>
      {control}
    </div>
  )
}

export default function SettingsPanel({ settings, onUpdate }) {
  if (!settings) return null

  const restMinutes = Number(settings.restBetweenTasksMinutes) || 0

  return (
    <div className={styles.container}>
      <section className={styles.group}>
        <h3 className={styles.groupTitle}>타이머</h3>

        <SettingRow
          title="할 일 사이 휴식"
          desc="할 일을 끝내면 묻지 않고 이 시간만큼 자동으로 쉬어요. 휴식 화면에서 언제든 건너뛸 수 있어요."
          control={
            <div className={styles.optionGroup}>
              {REST_PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  type="button"
                  className={restMinutes === preset.minutes ? styles.optionActive : styles.option}
                  onClick={() => onUpdate({ restBetweenTasksMinutes: preset.minutes })}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          }
        />

        <SettingRow
          title="플로우모도로"
          desc="설정 시간이 끝나도 세션이 자동으로 이어지고, 종료 시 경과 시간의 1/5을 보상 휴식으로 제안해요."
          control={
            <Switch
              checked={settings.flowmodoroEnabled}
              onChange={(v) => onUpdate({ flowmodoroEnabled: v })}
            />
          }
        />

        <SettingRow
          title="알람 소리"
          desc="타이머가 끝날 때 소리로 알려줘요. 꺼도 위젯은 나타나요."
          control={
            <Switch
              checked={settings.alarmSoundEnabled !== false}
              onChange={(v) => onUpdate({ alarmSoundEnabled: v })}
            />
          }
        />
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupTitle}>할 일</h3>

        <SettingRow
          title="미완료 할 일 자동 이월"
          desc="날짜가 바뀔 때 끝내지 못한 할 일을 다음날 목록에 자동으로 올려요. 어제까지 한 시간은 어제 기록에 그대로 남아요."
          control={
            <Switch
              checked={Boolean(settings.autoCarryOverEnabled)}
              onChange={(v) => onUpdate({ autoCarryOverEnabled: v })}
            />
          }
        />
      </section>
    </div>
  )
}
