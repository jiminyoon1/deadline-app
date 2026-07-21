# 빌드 / 배포 가이드

## 방침

- 개발 환경: macOS
- 빌드 타겟: electron-builder로 **macOS(.dmg) + Windows(.exe)** 동시 크로스 빌드
- 배포 범위: 본인 + 지인 소수 테스트 → **코드 서명·공증은 1차 버전에서 생략** (백로그)
- 네이티브 모듈(N-API 바이너리)을 쓰지 않아야 Mac에서 Windows 크로스 빌드가 문제없다.
  네이티브 모듈이 필요한 패키지는 도입 전 사용자 확인.

## electron-builder 설정 요점

```json
{
  "build": {
    "appId": "com.example.deadlineflow",
    "mac": { "target": "dmg" },
    "win": { "target": "nsis" },
    "files": ["out/**/*"],
    "directories": { "output": "release" }
  }
}
```

- `appId`는 실제 프로젝트 값 확인 후 사용.
- 서명 생략이므로 mac `identity: null` 설정으로 서명 시도 자체를 끈다.
- 첫 실행 시 경고가 뜨는 것은 정상 동작:
  - macOS: "확인되지 않은 개발자" → 우클릭 → 열기로 우회
  - Windows: SmartScreen 경고 → "추가 정보" → 실행
  이 우회 방법을 README에 안내 문구로 포함할 것.

## 스크립트 컨벤션 (초안 — 실제 package.json 확인 우선)

| 스크립트 | 용도 |
|---|---|
| `npm run dev` | electron-vite 개발 모드 실행 |
| `npm run build` | 렌더러 + 메인 번들 빌드 |
| `npm run dist` | electron-builder로 mac + win 패키징 |

## README 필수 항목 (완료 조건)

README.md에 아래 두 가지가 반드시 정리되어 있어야 한다:

1. 개발 모드 실행법 (`npm install` → `npm run dev`)
2. 통합 빌드 실행법 (mac/win 산출물 생성 방법 + 미서명 앱 실행 우회 안내)

## 하지 말 것

- 코드 서명 인증서, Apple Developer 계정, 공증(notarization) 설정 추가 금지 (백로그).
- 자동 업데이트(electron-updater) 구현 금지 — 요구사항에 없음.
- CI/CD(GitHub Actions 등) 세팅은 사용자가 명시적으로 요청할 때만.
