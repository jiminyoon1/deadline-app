---
name: backend-build
description: Deadline Flow의 electron-builder 빌드/배포 작업 가이드. 빌드 설정, 크로스 플랫폼 패키징, 배포 관련 작업을 할 때 사용한다. "빌드", "배포", "electron-builder", "dmg", "exe", "패키징"을 언급하면 항상 참조한다.
---

# backend-build (빌드/배포 가이드)

빌드/배포 작업 시 반드시 `references/build.md`를 읽고 그 방침을 따른다.

## 핵심 방침 요약

- macOS + Windows 크로스 빌드 (electron-builder). 코드 서명·공증은 1차 버전에서 생략.
- 네이티브 모듈(N-API 바이너리) 도입 금지 — Mac에서 Windows 크로스 빌드가 깨진다.
- 자동 업데이트, CI/CD 세팅은 요구사항에 없음 — 사용자가 명시적으로 요청할 때만.

상세 스크립트 컨벤션, electron-builder 설정, README 필수 항목은 `references/build.md` 참고.
