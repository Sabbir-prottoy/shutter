import { useEffect, useRef, useState } from 'react'

const WIDTH = 320
const HEIGHT = 400
const GRAVITY = 0.4
const FLAP = -6.5
const PIPE_GAP = 120
const PIPE_WIDTH = 44
const PIPE_SPEED = 2.2

export default function FlappyBird() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const frameRef = useRef(null)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [phase, setPhase] = useState('idle') // idle | playing | over

  function reset() {
    stateRef.current = {
      birdY: HEIGHT / 2,
      velocity: 0,
      pipes: [{ x: WIDTH, gapY: 120 }],
      score: 0,
    }
    setScore(0)
    setPhase('playing')
  }

  function flap() {
    if (phase === 'idle' || phase === 'over') {
      reset()
      return
    }
    if (stateRef.current) stateRef.current.velocity = FLAP
  }

  useEffect(() => {
    if (phase !== 'playing') return undefined
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    function tick() {
      const s = stateRef.current
      s.velocity += GRAVITY
      s.birdY += s.velocity

      s.pipes.forEach((pipe) => { pipe.x -= PIPE_SPEED })
      if (s.pipes[s.pipes.length - 1].x < WIDTH - 170) {
        s.pipes.push({ x: WIDTH, gapY: 60 + Math.random() * (HEIGHT - 180) })
      }
      if (s.pipes[0].x < -PIPE_WIDTH) {
        s.pipes.shift()
        s.score += 1
        setScore(s.score)
      }

      const birdX = 60
      const hitGround = s.birdY > HEIGHT - 12 || s.birdY < 0
      const hitPipe = s.pipes.some(
        (pipe) =>
          birdX + 10 > pipe.x &&
          birdX - 10 < pipe.x + PIPE_WIDTH &&
          (s.birdY - 10 < pipe.gapY - PIPE_GAP / 2 || s.birdY + 10 > pipe.gapY + PIPE_GAP / 2),
      )

      if (hitGround || hitPipe) {
        setBest((b) => Math.max(b, s.score))
        setPhase('over')
        return
      }

      ctx.fillStyle = '#dceaf5'
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
      ctx.fillStyle = '#8db5a0'
      s.pipes.forEach((pipe) => {
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY - PIPE_GAP / 2)
        ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP / 2, PIPE_WIDTH, HEIGHT - (pipe.gapY + PIPE_GAP / 2))
      })
      ctx.fillStyle = '#e8b34f'
      ctx.beginPath()
      ctx.arc(birdX, s.birdY, 10, 0, Math.PI * 2)
      ctx.fill()

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [phase])

  useEffect(() => {
    function handleKey(event) {
      if (event.code === 'Space') {
        event.preventDefault()
        flap()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-ink-muted">
        {phase === 'idle' ? 'Click or press space to flap.' : `Score: ${score}${best ? ` · Best: ${best}` : ''}`}
      </p>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onClick={flap}
        className="cursor-pointer rounded-card border border-border"
      />
      {phase === 'over' && <p className="text-sm text-booked">Crashed! Click the game to try again.</p>}
    </div>
  )
}
