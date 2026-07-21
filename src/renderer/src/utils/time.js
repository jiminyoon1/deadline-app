export function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export function formatHMS(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export function formatHoursMinutes(totalMinutes) {
  const minutes = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (hours === 0) return `${remainder}분`
  if (remainder === 0) return `${hours}시간`
  return `${hours}시간 ${remainder}분`
}

export function formatDurationKo(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  if (hours > 0) return `${hours}시간 ${minutes}분`
  return `${minutes}분 ${remainder}초`
}

export function formatFocusDuration(totalSeconds) {
  const minutes = Math.max(0, Math.floor(totalSeconds / 60))
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (hours === 0) return `${remainder}분`
  return `${hours}시간 ${remainder}분`
}

export function formatMonthDay(date = new Date()) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}
