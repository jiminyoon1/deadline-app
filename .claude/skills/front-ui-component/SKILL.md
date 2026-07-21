---
name: front-ui-component
description: Deadline Flow 렌더러에서 새 컴포넌트나 화면을 만들거나 스타일을 작성/수정할 때 사용. CSS Modules 전용 스타일 규칙과 컴포넌트 폴더 구조, 메인창/위젯 두 진입점 구조를 정의한다. "컴포넌트 만들기", "화면 추가", "스타일", "CSS", "레이아웃", "메인창", "위젯 UI" 같은 작업이 나오면 이 스킬을 적용한다.
---

# front-ui-component (컴포넌트 / 스타일 규칙)

React + JSX. **TypeScript 금지**(`.ts`/`.tsx` 파일 생성 금지). 스타일은 **CSS Modules만** 사용 — 인라인 스타일, Tailwind, styled-components 모두 금지.

## 진입점 구조 (고정 — 2개)

| 진입점 | 루트 컴포넌트 | HTML / entry | 포함 화면 |
|---|---|---|---|
| 메인 창 | `App.jsx` | `index.html` → `main.jsx` | 홈, 기록·통계, 설정 (탭 전환은 로컬 state, 라우터 없음) |
| 플로팅 위젯 | `WidgetApp.jsx` | `widget.html` → `widget.jsx` | 몰입 타이머, 종료(알람) 팝업, 휴식 화면, 하루 마무리 요약 |

- 두 진입점은 **완전히 별도의 렌더러 프로세스**다. 컴포넌트/state를 서로 import해서 공유하지 않는다.
- 화면 전환은 라우터가 아니라 `session.timer.status` 값(`idle/running/alarm/restSetup/resting/restFinished/dayFinished`)에 따른 조건 분기다 (`WidgetApp.jsx` 참고). 새 위젯 화면을 추가할 때도 이 분기 방식을 따른다.

## 컴포넌트 폴더 구조 (고정)

```
src/renderer/src/components/<도메인>/<Name>.jsx
src/renderer/src/components/<도메인>/<Name>.module.css
```
도메인 폴더는 화면 단위로 나뉜다: `home/`, `timer/`, `rest/`, `settings/`, `stats/`, `layout/`, `common/`. 새 화면은 기존 도메인에 맞춰 넣거나, 새 도메인이면 새 폴더를 만든다.

## 스타일 규칙

1. 인라인 스타일(`style={{}}`) 금지 — 값이 동적으로 계산되는 경우(예: 그래프 막대 높이)만 예외로 허용.
2. 모든 정적 스타일은 `*.module.css`로 분리하고 `import styles from './X.module.css'`로 가져온다.
3. Tailwind, styled-components 등 다른 스타일링 방식 도입 금지.
4. 트랜지션은 과하지 않게(0.15~0.2s 수준), 그림자·그라데이션 남발 금지.

## 작업 방식

- 화면/컴포넌트를 새로 만들기 전에 같은 도메인 폴더의 기존 컴포넌트 네이밍·구조를 먼저 확인하고 따른다.
- **색상·그림자·모션 등 시각 값은 `front-design-tokens` Skill을 따른다.** 단일 소스는 `src/renderer/src/assets/tokens.css`이고, hex 직접 사용은 금지다.
