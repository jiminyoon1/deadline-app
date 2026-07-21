import { useRef, useState } from 'react'
import TaskRow from './TaskRow'
import EditTaskModal from './EditTaskModal'
import styles from './TaskList.module.css'

export default function TaskList({
  tasks,
  previewTaskId,
  onReorder,
  onToggleCompleted,
  onStart,
  onRestart,
  onDefer,
  onDelete,
  onUpdateTask
}) {
  const dragIndex = useRef(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [doneOpen, setDoneOpen] = useState(true)

  function handleDrop(dropIndex) {
    if (dragIndex.current === null || dragIndex.current === dropIndex) return
    const ids = tasks.map((t) => t.id)
    const [moved] = ids.splice(dragIndex.current, 1)
    ids.splice(dropIndex, 0, moved)
    dragIndex.current = null
    onReorder(ids)
  }

  const editingTask = tasks.find((t) => t.id === editingTaskId) || null

  // 미완료가 항상 위, 완료는 접을 수 있는 별도 섹션. index는 원본 배열 기준(드래그 reorder용)
  const activeTasks = []
  const doneTasks = []
  tasks.forEach((task, index) => {
    ;(task.status === 'done' ? doneTasks : activeTasks).push({ task, index })
  })

  function renderRow({ task, index }) {
    return (
      <TaskRow
        key={task.id}
        task={task}
        index={index}
        isPreviewed={task.id === previewTaskId}
        onToggleCompleted={onToggleCompleted}
        onStart={onStart}
        menuOpen={openMenuId === task.id}
        onOpenMenu={() => setOpenMenuId(task.id)}
        onCloseMenu={() => setOpenMenuId(null)}
        onEdit={() => {
          setOpenMenuId(null)
          setEditingTaskId(task.id)
        }}
        onRestart={() => onRestart(task.id)}
        onDefer={() => {
          setOpenMenuId(null)
          onDefer(task.id)
        }}
        onDelete={() => {
          setOpenMenuId(null)
          onDelete(task.id)
        }}
        onDragStart={(i) => (dragIndex.current = i)}
        onDragOver={() => {}}
        onDrop={handleDrop}
      />
    )
  }

  return (
    <>
      {tasks.length === 0 ? (
        <p className={styles.empty}>아직 등록된 할 일이 없어요.</p>
      ) : (
        <>
          {activeTasks.length === 0 ? (
            <p className={styles.empty}>남은 할 일이 없어요. 수고했어요!</p>
          ) : (
            <ul className={styles.list}>{activeTasks.map(renderRow)}</ul>
          )}

          {doneTasks.length > 0 && (
            <>
              <button
                type="button"
                className={styles.sectionHeader}
                onClick={() => setDoneOpen((v) => !v)}
                aria-expanded={doneOpen}
              >
                <span className={doneOpen ? styles.chevronOpen : styles.chevron}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M4 2.5L8 6l-4 3.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                완료
                <span className={styles.sectionCount}>{doneTasks.length}</span>
              </button>
              {doneOpen && <ul className={styles.list}>{doneTasks.map(renderRow)}</ul>}
            </>
          )}
        </>
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTaskId(null)}
          onSave={(payload) => {
            onUpdateTask(editingTask.id, payload)
            setEditingTaskId(null)
          }}
        />
      )}
    </>
  )
}
