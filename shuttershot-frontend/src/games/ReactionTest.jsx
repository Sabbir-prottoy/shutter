import { useEffect, useRef, useState } from 'react'

export default function ReactionTest() {
  const [phase, setPhase] = useState('idle') // idle | waiting | ready | tooSoon | result
  const [lastTime, setLastTime] = useState(null)
  const [best, setBest] = useState(null)
  const startRef = useRef(0)
  const timeoutRef = useRef(null)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  function start() {
    setPhase('waiting')
    const delay = 1000 + Math.random() * 2500
    timeoutRef.current = setTimeout(() => {
      startRef.current = performance.now()
      setPhase('ready')
    }, delay)
  }

  function handleClick() {
    if (phase === 'idle' || phase === 'result' || phase === 'tooSoon') {
      start()
      return
    }
    if (phase === 'waiting') {
      clearTimeout(timeoutRef.current)
      setPhase('tooSoon')
      return
    }
    if (phase === 'ready') {
      const elapsed = Math.round(performance.now() - startRef.current)
      setLastTime(elapsed)
      setBest((b) => (b === null ? elapsed : Math.min(b, elapsed)))
      setPhase('result')
    }
  }

  const bgClass = {
    idle: 'bg-accent-gradient',
    waiting: 'bg-booked',
    ready: 'bg-free',
    tooSoon: 'bg-booked',
    result: 'bg-accent-gradient',
  }[phase]

  const message = {
    idle: 'Click to start',
    waiting: 'Wait for green…',
    ready: 'Click now!',
    tooSoon: 'Too soon — click to retry',
    result: `${lastTime} ms — click to try again`,
  }[phase]

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-ink-muted">{best !== null ? `Best: ${best} ms` : 'Test your reflexes.'}</p>

      <button
        type="button"
        onClick={handleClick}
        className={`flex h-48 w-full max-w-sm items-center justify-center rounded-card text-lg font-medium text-white shadow-card transition-colors ${bgClass}`}
      >
        {message}
      </button>
    </div>
  )
}
