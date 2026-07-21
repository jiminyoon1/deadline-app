---
name: front-design-tokens
description: Deadline Flow 렌더러의 디자인 토큰과 인터랙션 상태 규칙. 색·radius·그림자·모션 값을 쓰거나 hover/선택/완료/pressed 같은 상태 스타일을 만들 때 사용한다. hex 색 직접 사용을 금지하고 tokens.css 참조를 강제한다. "색", "컬러", "hex", "hover", "선택 상태", "완료 표시", "토큰", "그림자", "애니메이션" 같은 작업이 나오면 이 스킬을 적용한다.
---

# front-design-tokens (디자인 토큰 / 인터랙션 상태 규칙)

단일 소스: `src/renderer/src/assets/tokens.css`. 메인 창과 위젯이 모두 `main.css → base.css → tokens.css` 경로로 공유한다.

## 절대 규칙

- **CSS/JSX에 hex 색을 직접 쓰지 않는다.** 반드시 `var(--color-*)` 토큰을 참조한다. SVG의 `fill`/`stroke`도 마찬가지 (`fill="var(--color-primary)"`). 유일한 예외: 유색 배경 위의 흰색 획(체크 표시 등)은 `#ffffff` 허용.
- 새 색이 필요하면 먼저 기존 토큰으로 대체 가능한지 확인하고, 정말 필요할 때만 tokens.css에 **시맨틱 이름**으로 추가한다 (예: `--color-done`). 회색 단계를 늘리지 않는다 — 텍스트 회색은 `text / text-sub / text-faint` 3단계로 고정.
- radius·그림자·transition도 토큰(`--radius-*`, `--shadow-*`, `--transition-fast`)을 쓴다.

## 토큰 의미 (요약 — 값은 tokens.css가 정본)

| 토큰 | 용도 |
|---|---|
| `--color-primary` | 유일한 포인트 컬러. 타이머, 활성/선택 상태, 활성 탭 밑줄. 다른 강조색 도입 금지 |
| `--color-primary-tint` / `-tint-strong` | 선택 행 배경 / 그 hover |
| `--color-done` | 완료 체크·완료 점 전용 진회색 |
| `--color-success` | 긍정 피드백 (휴식 화면). 완료 표시에는 쓰지 않는다 |
| `--color-bg` / `-bg-soft` / `-bg-app` | 카드 표면 / hover·서브 영역 / 창 배경 |
| `--color-border` / `--color-divider` | 테두리 / 리스트 구분선·링 트랙 |
| `--shadow-card` / `--shadow-float` / `--shadow-popover` | 메인 카드 / 플로팅 위젯 / 드롭다운 메뉴 |

## 인터랙션 상태 규칙 (HIG 피드백 원칙)

모든 인터랙티브 요소는 다음 상태를 갖춘다:

- **hover**: 클릭 가능한 행/버튼은 `background: var(--color-bg-soft)` 또는 색 변화. `transition: ... var(--transition-fast)` 필수 (뚝 끊기는 상태 변화 금지).
- **선택(selected)**: 텍스트 색만 바꾸지 말고 행/영역 전체에 `--color-primary-tint` 배경.
- **pressed**: 버튼류에 `:active { transform: scale(0.96~0.97) }` (작은 아이콘 버튼은 0.88).
- **focus**: 전역 `:focus-visible` 링이 base.css에 있다 — 개별 컴포넌트에서 `outline: none`으로 끄지 않는다.
- **완료(done)**: 취소선(`text-decoration-color: var(--color-text-faint)`) + 텍스트/시간 `opacity: 0.62` + `--color-done` 체크. 완료 행이 미완료 행보다 시각적으로 무거우면 안 된다.
- **보조 액션 숨김**: 드래그 핸들·더보기처럼 부차적인 컨트롤은 기본 `opacity: 0`, 행 `:hover`/`:focus-within`에서 노출 (`.ghost` 패턴, TaskList.module.css 참고).
- **애니메이션**: 완료 체크 팝 같은 스프링은 `cubic-bezier(0.34, 1.56, 0.64, 1)` 0.3s 내외. **`prefers-reduced-motion: reduce` 대응 필수** (애니메이션·transition 해제).
- 처음부터 완료 상태로 마운트된 요소는 애니메이션을 재생하지 않는다 (TaskRow의 `wasDoneOnMount` 패턴).

## 참고 구현

- 행 상태 분기: `components/home/TaskRow.jsx` (rowClickable / rowSelected / rowDone 클래스 분기)
- 상태 스타일 문법: `components/home/TaskList.module.css` (composes로 base `.row` 확장)
