import { useEffect, useRef, useState } from 'react'

const GRID = 18
const CELL = 18
const TICK_MS = 130

function randomCell(snake) {
  let cell
  do {
    cell = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }
  } while (snake.some((s) => s.x === cell.x && s.y === cell.y))
  return cell
}

export default function SnakeGame() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [running, setRunning] = useState(false)

  function start() {
    const snake = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }]
    stateRef.current = { snake, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, food: randomCell(snake) }
    setScore(0)
    setGameOver(false)
    setRunning(true)
  }

  useEffect(() => {
    function handleKey(event) {
      const s = stateRef.current
      if (!s) return
      const map = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      }
      const next = map[event.key]
      if (!next) return
      event.preventDefault()
      if (next.x === -s.dir.x && next.y === -s.dir.y) return
      s.nextDir = next
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    if (!running) return undefined
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const interval = setInterval(() => {
      const s = stateRef.current
      s.dir = s.nextDir
      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y }

      const hitsWall = head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID
      const hitsSelf = s.snake.some((seg) => seg.x === head.x && seg.y === head.y)
      if (hitsWall || hitsSelf) {
        setRunning(false)
        setGameOver(true)
        return
      }

      s.snake = [head, ...s.snake]
      if (head.x === s.food.x && head.y === s.food.y) {
        setScore((n) => n + 1)
        s.food = randomCell(s.snake)
      } else {
        s.snake.pop()
      }

      ctx.fillStyle = '#fcfaf7'
      ctx.fillRect(0, 0, GRID * CELL, GRID * CELL)
      ctx.fillStyle = '#c15a3a'
      s.snake.forEach((seg) => ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2))
      ctx.fillStyle = '#e8b34f'
      ctx.fillRect(s.food.x * CELL + 2, s.food.y * CELL + 2, CELL - 4, CELL - 4)
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [running])

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-ink-muted">
        {gameOver ? `Game over — score ${score}` : running ? `Score: ${score}` : 'Use the arrow keys to steer.'}
      </p>
      <canvas
        ref={canvasRef}
        width={GRID * CELL}
        height={GRID * CELL}
        className="rounded-card border border-border"
      />
      <button
        type="button"
        onClick={start}
        className="rounded-card bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
      >
        {gameOver || !running ? 'Start' : 'Restart'}
      </button>
    </div>
  )
}
