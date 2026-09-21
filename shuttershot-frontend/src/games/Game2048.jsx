import { useEffect, useState } from 'react'

const SIZE = 4

const TILE_COLORS = {
  2: '#f3ece1', 4: '#e8e0cf', 8: '#e8b34f', 16: '#e0a23c',
  32: '#c15a3a', 64: '#a8492e', 128: '#8db5a0', 256: '#6d8fd6',
  512: '#e0729a', 1024: '#b85f83', 2048: '#1e1b16',
}

function emptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
}

function addRandomTile(board) {
  const empties = []
  board.forEach((row, y) => row.forEach((cell, x) => { if (!cell) empties.push({ x, y }) }))
  if (empties.length === 0) return board
  const { x, y } = empties[Math.floor(Math.random() * empties.length)]
  const next = board.map((row) => [...row])
  next[y][x] = Math.random() < 0.9 ? 2 : 4
  return next
}

function slideRow(row) {
  const values = row.filter(Boolean)
  const merged = []
  let gained = 0
  for (let i = 0; i < values.length; i++) {
    if (values[i] === values[i + 1]) {
      merged.push(values[i] * 2)
      gained += values[i] * 2
      i++
    } else {
      merged.push(values[i])
    }
  }
  while (merged.length < SIZE) merged.push(0)
  return { row: merged, gained }
}

function move(board, direction) {
  let rotated = board.map((row) => [...row])
  const rotate = (b) => b[0].map((_, x) => b.map((row) => row[x]))

  if (direction === 'up') rotated = rotate(rotated)
  if (direction === 'down') rotated = rotate(rotated).map((row) => [...row].reverse())
  if (direction === 'right') rotated = rotated.map((row) => [...row].reverse())

  let gained = 0
  let moved = false
  const result = rotated.map((row) => {
    const { row: slid, gained: g } = slideRow(row)
    gained += g
    if (slid.some((v, i) => v !== row[i])) moved = true
    return slid
  })

  let finalBoard = result
  if (direction === 'right') finalBoard = finalBoard.map((row) => [...row].reverse())
  if (direction === 'up') finalBoard = rotate(finalBoard)
  if (direction === 'down') finalBoard = rotate(finalBoard.map((row) => [...row].reverse()))

  return { board: finalBoard, gained, moved }
}

function canMove(board) {
  for (const dir of ['up', 'down', 'left', 'right']) {
    if (move(board, dir).moved) return true
  }
  return false
}

export default function Game2048() {
  const [board, setBoard] = useState(() => addRandomTile(addRandomTile(emptyBoard())))
  const [score, setScore] = useState(0)
  const [over, setOver] = useState(false)

  useEffect(() => {
    function handleKey(event) {
      const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }
      const direction = map[event.key]
      if (!direction || over) return
      event.preventDefault()

      setBoard((prev) => {
        const { board: next, gained, moved } = move(prev, direction)
        if (!moved) return prev
        setScore((s) => s + gained)
        const withTile = addRandomTile(next)
        if (!canMove(withTile)) setOver(true)
        return withTile
      })
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [over])

  function reset() {
    setBoard(addRandomTile(addRandomTile(emptyBoard())))
    setScore(0)
    setOver(false)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-ink-muted">{over ? `No more moves — score ${score}` : `Score: ${score}`}</p>
      <p className="text-xs text-ink-muted">Use the arrow keys to merge tiles.</p>

      <div className="grid grid-cols-4 gap-2 rounded-card bg-surface-raised p-2">
        {board.flat().map((value, index) => (
          <div
            key={index}
            className="flex h-14 w-14 items-center justify-center rounded-card text-sm font-bold sm:h-16 sm:w-16 sm:text-lg"
            style={{
              backgroundColor: value ? TILE_COLORS[value] || '#1e1b16' : '#e8e2d9',
              color: value >= 8 ? '#ffffff' : '#1e1b16',
            }}
          >
            {value || ''}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={reset}
        className="rounded-card bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
      >
        New game
      </button>
    </div>
  )
}
