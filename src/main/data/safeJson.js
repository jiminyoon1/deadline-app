import fs from 'fs'

// 저장 파일이 깨져 있으면(비정상 종료 중 쓰기 등) JSON.parse가 예외를 던져 앱이 시작부터
// 죽는다. 손상된 파일은 옆에 백업으로 남기고(복구·디버깅용) 호출자에게는 fallback을 준다.
export function readJsonSafe(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    try {
      fs.renameSync(filePath, `${filePath}.corrupted-${Date.now()}`)
    } catch {
      // 백업조차 실패해도 fallback 반환은 계속 진행한다.
    }
    return fallback
  }
}
