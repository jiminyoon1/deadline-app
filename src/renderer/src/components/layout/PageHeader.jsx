import styles from './PageHeader.module.css'

// 서브페이지(기록·설정) 상단 헤더 — 탭이 아니라 "홈이 기지, 여긴 잠깐 들르는 방" 모델.
// 버튼 생김새는 홈 좌하단 내비 버튼과 동일한 언어를 쓴다 (들어간 문과 같은 문으로 나온다).

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <path
        d="M12.5 4.5L7 10l5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function PageHeader({ title, onBack }) {
  return (
    <div className={styles.header}>
      <button type="button" className={styles.navButton} onClick={onBack}>
        <BackIcon />홈
      </button>
      <h2 className={styles.title}>{title}</h2>
    </div>
  )
}
