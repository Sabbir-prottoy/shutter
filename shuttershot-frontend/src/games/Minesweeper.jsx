import { useState } from 'react'

const SIZE = 8
const MINES = 10

function buildBoard() {
  const cells = Array.from({ length: SIZE }, (_, y) =>
    Array.from({ length: SIZE }, (_, x) => ({ x, y, mine: false, revealed: false, flagged: false, adjacent: 0 })),
  )

  let placed = 0
  while (placed < MINES) {
    const x = Math.floor(Math.random() * SIZE)
    const y = Math.floor(Math.random() * SIZE)
    if (!cells[y][x].mine) {
      cells[y][x].mine = true
      placed++
    }
  }

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (cells[y][x].mine) continue
      let count = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy
          const nx = x + dx
          if (ny >= 0 && ny < SIZE && nx >= 0 && nx < SIZE && cells[ny][nx].mine) count++
        }
      }
      cells[y][x].adjacent = count
    }
  }

  return cells
}

export default function Minesweeper() {
  const [board, setBoard] = useState(buildBoard)
  const [status, setStatus] = useState('playing') // playing | won | lost

  function revealFlood(cells, x, y) {
    const cell = cells[y][x]
    if (cell.revealed || cell.flagged) return
    cell.revealed = true
    if (cell.adjacent === 0 && !cell.mine) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy
          const nx = x + dx
          if (ny >= 0 && ny < SIZE && nx >= 0 && nx < SIZE) revealFlood(cells, nx, ny)
        }
      }
    }
  }

  function reveal(x, y) {
    if (status !== 'playing' || board[y][x].flagged || board[y][x].revealed) return
    const next = board.map((row) => row.map((cell) => ({ ...cell })))

    if (next[y][x].mine) {
      next.forEach((row) => row.forEach((cell) => { if (cell.mine) cell.revealed = true }))
      setBoard(next)
      setStatus('lost')
      return
    }

    revealFlood(next, x, y)
    setBoard(next)

    const cleared = next.every((row) => row.every((cell) => cell.mine || cell.revealed))
    if (cleared) setStatus('won')
  }

  function toggleFlag(event, x, y) {
    event.preventDefault()
    if (status !== 'playing' || board[y][x].revealed) return
    const next = board.map((row) => row.map((cell) => ({ ...cell })))
    next[y][x].flagged = !next[y][x].flagged
    setBoard(next)
  }

  function reset() {
    setBoard(buildBoard())
    setStatus('playing')
  }

  const NUMBER_COLORS = ['', '#6d8fd6', '#8db5a0', '#c15a3a', '#e0729a', '#a8492e', '#e8b34f', '#1e1b16', '#7a7267']

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-ink-muted">
        {status === 'won' ? 'You cleared the field!' : status === 'lost' ? 'Boom — try again.' : 'Left click to reveal, right click to flag.'}
      </p>

      <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `repeat(${SIZE}, 1.75rem)` }}>
        {board.flatMap((row) =>
          row.map((cell) => (
            <button
              key={`${cell.x}-${cell.y}`}
              type="button"
              onClick={() => reveal(cell.x, cell.y)}
              onContextMenu={(event) => toggleFlag(event, cell.x, cell.y)}
              className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold ${
                cell.revealed ? (cell.mine ? 'bg-booked/30' : 'bg-surface') : 'bg-surface-raised hover:bg-border'
              }`}
              style={{ color: cell.revealed && !cell.mine ? NUMBER_COLORS[cell.adjacent] : undefined }}
            >
              {cell.revealed ? (cell.mine ? '💣' : cell.adjacent || '') : cell.flagged ? '🚩' : ''}
            </button>
          )),
        )}
      </div>

      <button
        type="button"
        onClick={reset}
        className="rounded-card bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
      >
        New board
      </button>
    </div>
  )
}
