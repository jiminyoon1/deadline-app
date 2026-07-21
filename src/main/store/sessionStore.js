import { EventEmitter } from 'events'
import { randomUUID } from 'crypto'
import { readRecord, writeRecord } from '../data/records'
import { readSettings, writeSettings } from '../data/settingsStore'
import { readDeferredTasks, appendDeferredTask, clearDeferredTasks } from '../data/deferredTasks'

function nextDateString(date) {
  const [y, m, d] = date.split('-').map(Number)
  const next = new Date(y, m - 1, d + 1)
  const year = next.getFullYear()
  const month = String(next.getMonth() + 1).padStart(2, '0')
  const day = String(next.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function newTask({ name, plannedMinutes }) {
  return {
    id: randomUUID(),
    name,
    plannedMinutes,
    plannedSeconds: plannedMinutes * 60,
    elapsedSeconds: 0,
    status: 'pending',
    actualMinutes: 0,
    completed: false,
    flowmodoroUsed: false,
    startedAt: null,
    breaks: []
  }
}

function todayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function emptyRecord(date) {
  return {
    date,
    tasks: [],
    totalFocusMinutes: 0,
    totalBreakMinutes: 0
  }
}

function emptyTimer() {
  return {
    status: 'idle', // idle | running | paused | resting | awaitingNext | dayFinished
    activeTaskId: null,
    remainingSeconds: 0,
    isOvertime: false,
    segmentSeconds: 0,
    restTotalSeconds: 0,
    restRemainingSeconds: 0
  }
}

class SessionStore extends EventEmitter {
  constructor() {
    super()
    const date = todayDateString()
    const stored = readRecord(date)
    this.record = stored || emptyRecord(date)
    this.settings = readSettings()
    this.timer = emptyTimer()
    this._interval = null
    this._normalizeTasks()
    this._applyDeferredTasks()
    this._restoreTimerFromTasks()
  }

  _normalizeTasks() {
    for (const t of this.record.tasks) {
      if (t.plannedSeconds == null) t.plannedSeconds = (t.plannedMinutes || 0) * 60
      // 예전 기록에는 elapsedSeconds가 없다 — 확정된 분에서 복원해 누적 기준을 지킨다.
      if (t.elapsedSeconds == null) t.elapsedSeconds = (t.actualMinutes || 0) * 60
      if (t.status == null) t.status = t.completed ? 'done' : 'pending'
    }
  }

  _applyDeferredTasks() {
    const carried = readDeferredTasks(this.record.date)
    if (!carried.length) return
    for (const entry of carried) {
      this.record.tasks.push(newTask({ name: entry.name, plannedMinutes: entry.plannedMinutes }))
    }
    clearDeferredTasks(this.record.date)
    this._persist()
  }

  // 앱 재시작 시 진행 중이던 태스크는 자동으로 계속 흐르지 않고 일시정지 상태로 복원한다.
  _restoreTimerFromTasks() {
    const active = this.record.tasks.find((t) => t.status === 'running' || t.status === 'paused')
    if (!active) return
    active.status = 'paused'
    const planned = active.plannedSeconds ?? active.plannedMinutes * 60
    this.timer = {
      ...emptyTimer(),
      status: 'paused',
      activeTaskId: active.id,
      remainingSeconds: Math.max(0, planned - (active.elapsedSeconds || 0))
    }
  }

  getState() {
    const tasks = this.record.tasks.map((t) => {
      const planned = t.plannedSeconds ?? t.plannedMinutes * 60
      return {
        ...t,
        remainingSeconds: Math.max(0, planned - (t.elapsedSeconds || 0))
      }
    })
    return {
      date: this.record.date,
      tasks,
      totalFocusMinutes: this.record.totalFocusMinutes,
      totalBreakMinutes: this.record.totalBreakMinutes,
      todayFocusSeconds: this.record.tasks.reduce((s, t) => s + (t.elapsedSeconds || 0), 0),
      settings: this.settings,
      timer: this.timer
    }
  }

  start() {
    if (this._interval) return
    this._interval = setInterval(() => this._tick(), 1000)
  }

  stop() {
    if (this._interval) {
      clearInterval(this._interval)
      this._interval = null
    }
  }

  _persist() {
    writeRecord(this.record.date, this.record)
  }

  _broadcast() {
    this.emit('change', this.getState())
  }

  _recalculateTotals() {
    this.record.totalFocusMinutes = this.record.tasks.reduce(
      (sum, t) => sum + (t.actualMinutes || 0),
      0
    )
    this.record.totalBreakMinutes = this.record.tasks.reduce(
      (sum, t) => sum + t.breaks.reduce((s, b) => s + (b.minutes || 0), 0),
      0
    )
  }

  _activeTask() {
    return this.record.tasks.find((t) => t.id === this.timer.activeTaskId) || null
  }

  updateSettings(partial) {
    this.settings = { ...this.settings, ...partial }
    writeSettings(this.settings)
    this._broadcast()
  }

  addTask({ name, plannedMinutes }) {
    this.record.tasks.push(newTask({ name, plannedMinutes }))
    this._persist()
    this._broadcast()
  }

  reorderTasks(orderedIds) {
    const byId = new Map(this.record.tasks.map((t) => [t.id, t]))
    const reordered = orderedIds.map((id) => byId.get(id)).filter(Boolean)
    if (reordered.length === this.record.tasks.length) {
      this.record.tasks = reordered
      this._persist()
      this._broadcast()
    }
  }

  deferTask(taskId) {
    const index = this.record.tasks.findIndex((t) => t.id === taskId)
    if (index === -1) return
    const [task] = this.record.tasks.splice(index, 1)
    if (this.timer.activeTaskId === taskId) {
      this.timer = emptyTimer()
    }
    appendDeferredTask(nextDateString(this.record.date), {
      name: task.name,
      plannedMinutes: task.plannedMinutes
    })
    this._recalculateTotals()
    this._persist()
    this._broadcast()
  }

  deleteTask(taskId) {
    const index = this.record.tasks.findIndex((t) => t.id === taskId)
    if (index === -1) return
    this.record.tasks.splice(index, 1)
    if (this.timer.activeTaskId === taskId) {
      this.timer = emptyTimer()
    }
    this._recalculateTotals()
    this._persist()
    this._broadcast()
  }

  toggleTaskCompleted(id) {
    const task = this.record.tasks.find((t) => t.id === id)
    if (!task) return
    // 진행 중인 태스크를 완료로 표시하는 것은 끝내기(■)와 같은 의도다.
    // 시간을 확정 기록하고 타이머도 함께 정리해 "완료됐는데 타이머가 도는" 상태를 막는다.
    const isActive =
      this.timer.activeTaskId === id && ['running', 'paused'].includes(this.timer.status)
    if (isActive && !task.completed) {
      this.completeTask()
      return
    }
    task.completed = !task.completed
    task.status = task.completed ? 'done' : 'pending'
    this._persist()
    this._broadcast()
  }

  updateTask(id, { name, plannedMinutes }) {
    const task = this.record.tasks.find((t) => t.id === id)
    if (!task) return
    if (typeof name === 'string' && name.trim()) task.name = name.trim()
    if (typeof plannedMinutes === 'number' && plannedMinutes > 0) {
      task.plannedMinutes = plannedMinutes
      task.plannedSeconds = plannedMinutes * 60
      // 진행 중인 태스크의 계획 시간을 바꾸면 돌고 있는 타이머에도 즉시 반영한다.
      if (
        this.timer.activeTaskId === id &&
        (this.timer.status === 'running' || this.timer.status === 'paused')
      ) {
        this.timer.remainingSeconds = Math.max(0, task.plannedSeconds - (task.elapsedSeconds || 0))
        if (this.timer.remainingSeconds > 0) this.timer.isOvertime = false
      }
    }
    this._persist()
    this._broadcast()
  }

  pauseTask() {
    if (this.timer.status !== 'running') return
    this.timer.status = 'paused'
    const task = this._activeTask()
    if (task) task.status = 'paused'
    this._persist()
    this._broadcast()
  }

  resumeTask() {
    if (this.timer.status !== 'paused') return
    this.timer.status = 'running'
    const task = this._activeTask()
    if (task) task.status = 'running'
    this._persist()
    this._broadcast()
  }

  // 시작하기 = 단일 실행. 다른 태스크의 타이머가 돌고 있으면 그 태스크를
  // 대기 상태로 되돌리고(경과시간 보존) 선택한 태스크만 시작한다.
  // 휴식 중에 시작하면 지금까지 쉰 시간을 기록하고 휴식을 끝낸 것으로 처리한다.
  startTask(id) {
    if (['running', 'paused'].includes(this.timer.status)) {
      const current = this._activeTask()
      if (current && current.id === id && this.timer.status === 'running') return
      if (current && current.id !== id) current.status = 'pending'
      this.timer = emptyTimer()
    }
    if (this.timer.status === 'resting') {
      this._recordPartialBreak()
      this.timer = emptyTimer()
    }
    if (this.timer.status === 'awaitingNext') {
      this.timer = emptyTimer()
    }
    if (this.timer.status !== 'idle') return
    const task = this.record.tasks.find((t) => t.id === id)
    if (!task) return
    task.startedAt = task.startedAt || new Date().toISOString()
    task.status = 'running'
    const planned = task.plannedSeconds ?? task.plannedMinutes * 60
    this.timer = {
      ...emptyTimer(),
      status: 'running',
      activeTaskId: id,
      remainingSeconds: Math.max(0, planned - (task.elapsedSeconds || 0))
    }
    this._persist()
    this._broadcast()
  }

  // 완료된 할 일 되살리기: 완료를 해제하고 그 태스크의 타이머를 이어서 시작한다.
  // 이미 집중한 시간(elapsedSeconds·actualMinutes)은 그대로 유지·누적된다.
  restartTask(id) {
    const task = this.record.tasks.find((t) => t.id === id)
    if (!task || !task.completed) return
    task.completed = false
    task.status = 'pending'
    this.startTask(id)
  }

  // 이번 집중 구간의 시간을 태스크에 확정 기록하고 완료 처리한다.
  _finishActiveTask() {
    const task = this._activeTask()
    if (!task) return null
    // 마지막 구간(segmentSeconds)이 아니라 누적 집중 시간 전체로 확정한다.
    // 전환·다시 시작·앱 재시작을 거쳐도 elapsedSeconds에는 모든 집중이 쌓여 있다.
    task.actualMinutes = Math.round((task.elapsedSeconds || 0) / 60)
    task.completed = true
    task.status = 'done'
    this._recalculateTotals()
    return task
  }

  // 직전 태스크(activeTaskId) 다음 순서의 미완료 태스크를 찾는다 (목록 끝이면 앞에서부터).
  _nextPendingTask() {
    const prevIndex = this.record.tasks.findIndex((t) => t.id === this.timer.activeTaskId)
    const ordered = this.record.tasks
    for (let i = 1; i <= ordered.length; i++) {
      const candidate = ordered[(prevIndex + i) % ordered.length]
      if (candidate && !candidate.completed) return candidate
    }
    return null
  }

  // 진행 중이던 휴식 시간을 태스크의 breaks에 확정 기록한다.
  _recordPartialBreak() {
    if (this.timer.status !== 'resting') return
    const restedSeconds = this.timer.restTotalSeconds - this.timer.restRemainingSeconds
    const task = this._activeTask()
    if (task && restedSeconds > 0) {
      task.breaks.push({ minutes: Math.round(restedSeconds / 60), note: '', isRewardRest: false })
    }
    this._recalculateTotals()
  }

  // 끝내기(■)·타이머 만료 공통 경로: 태스크를 완료 확정하고 묻지 않고 자동 진행한다.
  // 마지막 태스크면 하루 요약, 아니면 설정된 휴식(0이면 생략) 후 다음 태스크 대기로.
  completeTask() {
    if (!['running', 'paused'].includes(this.timer.status)) return
    const task = this._finishActiveTask()
    if (!task) return
    this._advanceAfterComplete(task)
  }

  _advanceAfterComplete(task) {
    const hasNext = this.record.tasks.some((t) => !t.completed)
    if (!hasNext) {
      this.timer = emptyTimer()
      this.timer.status = 'dayFinished'
    } else {
      const restMinutes = Number(this.settings.restBetweenTasksMinutes) || 0
      this.timer = emptyTimer()
      this.timer.activeTaskId = task.id
      if (restMinutes > 0) {
        this.timer.status = 'resting'
        this.timer.restTotalSeconds = restMinutes * 60
        this.timer.restRemainingSeconds = this.timer.restTotalSeconds
      } else {
        this.timer.status = 'awaitingNext'
      }
    }
    this._persist()
    this._broadcast()
    // 위젯이 숨겨져 있어도 흐름이 넘어가는 순간에는 다시 나타난다.
    this.emit('widgetReappear')
  }

  // 휴식 화면의 "건너뛰기": 지금까지 쉰 시간만 기록하고 다음 태스크 대기로.
  skipRest() {
    if (this.timer.status !== 'resting') return
    this._recordPartialBreak()
    this.timer.status = 'awaitingNext'
    this.timer.restTotalSeconds = 0
    this.timer.restRemainingSeconds = 0
    this._persist()
    this._broadcast()
  }

  // 다음 태스크 대기 화면의 "시작": 순서상 다음 미완료 태스크를 시작한다.
  startNextTask() {
    if (this.timer.status !== 'awaitingNext') return
    const next = this._nextPendingTask()
    if (!next) {
      this.timer = emptyTimer()
      this.timer.status = 'dayFinished'
      this._persist()
      this._broadcast()
      return
    }
    this.timer = emptyTimer()
    this.startTask(next.id)
  }

  finishDay() {
    // 하다 만 태스크도 지금까지의 시간을 확정 기록한다 (완료 처리는 하지 않음).
    // 확정하지 않으면 elapsedSeconds가 actualMinutes에 반영되지 않아 총 몰입에서 빠진다.
    for (const t of this.record.tasks) {
      if (!t.completed && (t.elapsedSeconds || 0) > 0) {
        t.actualMinutes = Math.round(t.elapsedSeconds / 60)
      }
    }
    this._recalculateTotals()
    this.timer = emptyTimer()
    this.timer.status = 'dayFinished'
    this._persist()
    this._broadcast()
  }

  backToHome() {
    this.timer = emptyTimer()
    this._broadcast()
  }

  cancelSession() {
    this.timer = emptyTimer()
    this._broadcast()
  }

  _tick() {
    let changed = false
    let alarmFired = false

    if (this.timer.status === 'running') {
      this.timer.segmentSeconds += 1
      const task = this._activeTask()
      if (task) task.elapsedSeconds = (task.elapsedSeconds || 0) + 1
      if (!this.timer.isOvertime) {
        this.timer.remainingSeconds = Math.max(0, this.timer.remainingSeconds - 1)
        // 사용자가 X로 숨긴 위젯도 종료 5분 전에는 다시 나타난다.
        if (this.timer.remainingSeconds === 300) {
          this.emit('widgetReappear')
        }
        if (this.timer.remainingSeconds === 0) {
          alarmFired = true
          if (this.settings.flowmodoroEnabled) {
            this.timer.isOvertime = true
            if (task) task.flowmodoroUsed = true
          } else {
            // 타이머 만료는 끝내기(■)와 같은 경로 — 묻지 않고 완료 확정 후 자동 진행.
            const finished = this._finishActiveTask()
            if (finished) this._advanceAfterComplete(finished)
          }
        }
      }
      changed = true
    } else if (this.timer.status === 'resting') {
      this.timer.restRemainingSeconds = Math.max(0, this.timer.restRemainingSeconds - 1)
      if (this.timer.restRemainingSeconds === 0) {
        const task = this._activeTask()
        if (task) {
          task.breaks.push({
            minutes: Math.round(this.timer.restTotalSeconds / 60),
            note: '',
            isRewardRest: false
          })
        }
        this._recalculateTotals()
        this.timer.status = 'awaitingNext'
        this._persist()
        // 위젯을 숨긴 채 쉬고 있어도 휴식이 끝나면 다시 나타나 다음 태스크 대기를 보여준다.
        this.emit('widgetReappear')
      }
      changed = true
    }

    this._checkMidnightRollover()

    if (alarmFired) {
      this.emit('alarm')
    }
    if (changed) {
      this._broadcast()
    }
  }

  _checkMidnightRollover() {
    const today = todayDateString()
    if (today !== this.record.date) {
      // 사용 중이면 세션을 날리지 않는다. 자정을 넘겨도 진행 중인 기록은 시작한 날짜에
      // 그대로 쌓이고, 날짜 전환은 세션이 idle로 돌아온 뒤에 수행한다.
      if (this.timer.status !== 'idle' && this.timer.status !== 'dayFinished') return
      // 자동 이월: 끝내지 못한 할 일을 새 날짜 목록에 올린다.
      // 어제 기록은 그대로 남고(부분 집중 시간 포함), 새 날에는 계획만 새로 시작한다.
      const carryOver = this.settings.autoCarryOverEnabled
        ? this.record.tasks.filter((t) => !t.completed)
        : []
      this._persist()
      this.record = emptyRecord(today)
      for (const t of carryOver) {
        this.record.tasks.push(newTask({ name: t.name, plannedMinutes: t.plannedMinutes }))
      }
      this.timer = emptyTimer()
      this._applyDeferredTasks()
      this._persist()
      this._broadcast()
    }
  }
}

export const sessionStore = new SessionStore()
