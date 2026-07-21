export function playAlarmBeep() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return
  const ctx = new AudioCtx()
  const now = ctx.currentTime

  ;[0, 0.22, 0.44].forEach((offset) => {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0, now + offset)
    gain.gain.linearRampToValueAtTime(0.3, now + offset + 0.02)
    gain.gain.linearRampToValueAtTime(0, now + offset + 0.18)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(now + offset)
    oscillator.stop(now + offset + 0.2)
  })

  setTimeout(() => ctx.close(), 900)
}
