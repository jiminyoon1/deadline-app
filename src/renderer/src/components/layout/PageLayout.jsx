import PageHeader from './PageHeader'
import styles from './PageLayout.module.css'

// 서브페이지(기록·설정)의 프레임 — 홈과 동일한 "회색 배경 + 흰 카드" 언어를 쓴다.
// 카드 크기·여백이 홈과 같아야 페이지 전환 시 프레임이 고정된 것처럼 느껴진다.
export default function PageLayout({ title, onBack, children }) {
  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <PageHeader title={title} onBack={onBack} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
