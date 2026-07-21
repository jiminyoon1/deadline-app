const STORAGE_PREFIX = 'df.hintSeen.'

// 메인 창·위젯 창이 같은 origin이라 localStorage를 공유한다 — 한쪽에서 본 힌트는 다른 쪽에서도 다시 안 뜬다.
export function hasSeenHint(key) {
  try {
    return localStorage.getItem(STORAGE_PREFIX + key) === '1'
  } catch {
    return true // 접근 불가하면 안 보여주는 쪽이 안전하다
  }
}

export function markHintSeen(key) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, '1')
  } catch {
    // 무시 — 다음에 한 번 더 보이는 정도는 치명적이지 않다
  }
}
