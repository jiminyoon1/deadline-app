import { useEffect, useState } from 'react'
import { useSession } from './hooks/useSession'
import PageLayout from './components/layout/PageLayout'
import HomeLayout from './components/home/HomeLayout'
import TimerPanel from './components/home/TimerPanel'
import TodayPanel from './components/home/TodayPanel'
import TaskList from './components/home/TaskList'
import StatsView from './components/stats/StatsView'
import SettingsPanel from './components/settings/SettingsPanel'

function App() {
  const session = useSession()
  const [tab, setTab] = useState('home')
  const [previewTaskId, setPreviewTaskId] = useState(null)

  const previewTask =
    (previewTaskId && session?.tasks.find((t) => t.id === previewTaskId && t.status === 'pending')) || null

  // 타이머가 비거나 흐름이 넘어가는 중(휴식·다음 태스크 대기)이면
  // 다음 순서의 할 일을 "시작하기" 대기 화면에 올려 홈에서도 흐름이 보이게 한다.
  useEffect(() => {
    if (!session || previewTask) return
    if (!['idle', 'resting', 'awaitingNext'].includes(session.timer.status)) return
    const next = session.tasks.find((t) => t.status === 'pending')
    if (next) setPreviewTaskId(next.id)
  }, [session, previewTask])

  return (
    <>
      {tab === 'home' && session && (
        <HomeLayout
          left={
            <TimerPanel
              session={session}
              previewTask={previewTask}
              onPause={() => window.api.session.pauseTask()}
              onResume={() => window.api.session.resumeTask()}
              onComplete={() => window.api.session.completeTask()}
              onStart={(id) => {
                setPreviewTaskId(null)
                window.api.session.startTask(id)
              }}
              onNavigate={setTab}
            />
          }
          right={
            <TodayPanel
              session={session}
              onAddTask={(payload) => window.api.session.addTask(payload)}
            >
              <TaskList
                tasks={session.tasks}
                previewTaskId={previewTask?.id ?? null}
                onReorder={(ids) => window.api.session.reorderTasks(ids)}
                onToggleCompleted={(id) => window.api.session.toggleTaskCompleted(id)}
                onStart={(id) => {
                  setPreviewTaskId(null)
                  window.api.session.startTask(id)
                }}
                onRestart={(id) => window.api.session.restartTask(id)}
                onDefer={(id) => window.api.session.deferTask(id)}
                onDelete={(id) => window.api.session.deleteTask(id)}
                onUpdateTask={(id, payload) => window.api.session.updateTask(id, payload)}
              />
            </TodayPanel>
          }
        />
      )}
      {tab === 'stats' && (
        <PageLayout title="기록·통계" onBack={() => setTab('home')}>
          <StatsView session={session} />
        </PageLayout>
      )}
      {tab === 'settings' && (
        <PageLayout title="설정" onBack={() => setTab('home')}>
          <SettingsPanel
            settings={session?.settings}
            onUpdate={(partial) => window.api.settings.update(partial)}
          />
        </PageLayout>
      )}
    </>
  )
}

export default App
