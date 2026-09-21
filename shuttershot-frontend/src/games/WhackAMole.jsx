import { useEffect, useRef, useState } from 'react'

const HOLES = 9
const GAME_SECONDS = 20

export default function WhackAMole() {
  const [activeHole, setActiveHole] = useState(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS)
  const [running, setRunning] = useState(false)
  const moleTimeout = useRef(null)

  function start() {
    setScore(0)
    setTimeLeft(GAME_SECONDS)
    setRunning(true)
  }

  useEffect(() => {
    if (!running) return undefined
    const popInterval = setInterval(() => {
      setActiveHole(Math.floor(Math.random() * HOLES))
      clearTimeout(moleTimeout.current)
      moleTimeout.current = setTimeout(() => setActiveHole(null), 650)
    }, 800)

    const countdown = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(popInterval)
          clearInterval(countdown)
          setRunning(false)
          setActiveHole(null)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => {
      clearInterval(popInterval)
      clearInterval(countdown)
      clearTimeout(moleTimeout.current)
    }
  }, [running])

  function whack(index) {
    if (!running || index !== activeHole) return
    setScore((s) => s + 1)
    setActiveHole(null)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-ink-muted">
        {running ? `Score: ${score} · Time left: ${timeLeft}s` : score > 0 || timeLeft === 0 ? `Final score: ${score}` : 'Whack the mole as it pops up!'}
      </p>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: HOLES }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => whack(index)}
            className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-surface-raised text-3xl transition-transform"
          >
            {activeHole === index ? '🐹' : ''}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={start}
        disabled={running}
        className="rounded-card bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
      >
        {running ? 'Playing…' : 'Start'}
      </button>
    </div>
  )
}
