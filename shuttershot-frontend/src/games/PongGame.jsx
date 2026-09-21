import { useEffect, useRef, useState } from 'react'

const WIDTH = 360
const HEIGHT = 240
const PADDLE_H = 50
const PADDLE_W = 8
const WIN_SCORE = 5

export default function PongGame() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const frameRef = useRef(null)
  const [score, setScore] = useState({ you: 0, cpu: 0 })
  const [phase, setPhase] = useState('idle') // idle | playing | over

  function reset() {
    stateRef.current = {
      ball: { x: WIDTH / 2, y: HEIGHT / 2, vx: 3, vy: 2 },
      playerY: HEIGHT / 2 - PADDLE_H / 2,
      cpuY: HEIGHT / 2 - PADDLE_H / 2,
      score: { you: 0, cpu: 0 },
    }
    setScore({ you: 0, cpu: 0 })
    setPhase('playing')
  }

  useEffect(() => {
    const canvas = canvasRef.current
    function handleMove(event) {
      if (!stateRef.current) return
      const rect = canvas.getBoundingClientRect()
      const y = event.clientY - rect.top
      stateRef.current.playerY = Math.min(HEIGHT - PADDLE_H, Math.max(0, y - PADDLE_H / 2))
    }
    canvas.addEventListener('mousemove', handleMove)
    return () => canvas.removeEventListener('mousemove', handleMove)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return undefined
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    function tick() {
      const s = stateRef.current
      const b = s.ball

      b.x += b.vx
      b.y += b.vy
      if (b.y < 4 || b.y > HEIGHT - 4) b.vy *= -1

      const cpuCenter = s.cpuY + PADDLE_H / 2
      s.cpuY += Math.sign(b.y - cpuCenter) * 2.4
      s.cpuY = Math.min(HEIGHT - PADDLE_H, Math.max(0, s.cpuY))

      if (b.x < PADDLE_W + 4 && b.y > s.playerY && b.y < s.playerY + PADDLE_H) {
        b.vx = Math.abs(b.vx) * 1.03
        b.vy += (b.y - (s.playerY + PADDLE_H / 2)) * 0.06
      }
      if (b.x > WIDTH - PADDLE_W - 4 && b.y > s.cpuY && b.y < s.cpuY + PADDLE_H) {
        b.vx = -Math.abs(b.vx) * 1.03
      }

      if (b.x < 0) {
        s.score.cpu += 1
        setScore({ ...s.score })
        Object.assign(b, { x: WIDTH / 2, y: HEIGHT / 2, vx: 3, vy: 2 })
      } else if (b.x > WIDTH) {
        s.score.you += 1
        setScore({ ...s.score })
        Object.assign(b, { x: WIDTH / 2, y: HEIGHT / 2, vx: -3, vy: 2 })
      }

      if (s.score.you >= WIN_SCORE || s.score.cpu >= WIN_SCORE) {
        setPhase('over')
        return
      }

      ctx.fillStyle = '#1e1b16'
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
      ctx.fillStyle = '#e8e2d9'
      ctx.fillRect(6, s.playerY, PADDLE_W, PADDLE_H)
      ctx.fillRect(WIDTH - PADDLE_W - 6, s.cpuY, PADDLE_W, PADDLE_H)
      ctx.beginPath()
      ctx.arc(b.x, b.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#e8b34f'
      ctx.fill()

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [phase])

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-ink-muted">
        {phase === 'idle' ? 'Move your mouse over the board to control the left paddle.' : `You ${score.you} — ${score.cpu} CPU`}
      </p>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="rounded-card border border-border" />
      {phase === 'over' && (
        <p className="text-sm text-ink">{score.you > score.cpu ? 'You win!' : 'CPU wins!'}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="rounded-card bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
      >
        {phase === 'idle' ? 'Start' : 'Restart'}
      </button>
    </div>
  )
}
