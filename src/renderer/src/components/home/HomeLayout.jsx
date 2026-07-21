import styles from './HomeLayout.module.css'

export default function HomeLayout({ left, right }) {
  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.left}>{left}</div>
        <div className={styles.right}>{right}</div>
      </div>
    </div>
  )
}
