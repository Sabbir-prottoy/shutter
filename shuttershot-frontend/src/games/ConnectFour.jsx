import { useState } from 'react'

const ROWS = 6
const COLS = 7

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null))
}

function checkWinner(board) {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]]
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const player = board[y][x]
      if (!player) continue
      for (const [dy, dx] of dirs) {
        let count = 1
        for (let step = 1; step < 4; step++) {
          const ny = y + dy * step
          const nx = x + dx * step
          if (ny < 0 || ny >= ROWS || nx < 0 || nx >= COLS || board[ny][nx] !== player) break
          count++
        }
        if (count === 4) return player
      }
    }
  }
  return null
}

export default function ConnectFour() {
  const [board, setBoard] = useState(emptyBoard)
  const [redTurn, setRedTurn] = useState(true)

  const winner = checkWinner(board)
  const full = board.every((row) => row.every(Boolean))

  function drop(col) {
    if (winner) return
    const next = board.map((row) => [...row])
    for (let y = ROWS - 1; y >= 0; y--) {
      if (!next[y][col]) {
        next[y][col] = redTurn ? 'red' : 'yellow'
        setBoard(next)
        setRedTurn(!redTurn)
        return
      }
    }
  }

  function reset() {
    setBoard(emptyBoard())
    setRedTurn(true)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-ink-muted">
        {winner ? `${winner === 'red' ? 'Red' : 'Yellow'} wins!` : full ? "It's a draw." : `${redTurn ? 'Red' : 'Yellow'}'s turn`}
      </p>

      <div className="flex flex-col gap-1 rounded-card bg-[#6d8fd6]/20 p-2">
        {board.map((row, y) => (
          <div key={y} className="flex gap-1">
            {row.map((cell, x) => (
              <button
                key={x}
                type="button"
                onClick={() => drop(x)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface sm:h-10 sm:w-10"
              >
                {cell && (
                  <span
                    className="h-7 w-7 rounded-full sm:h-8 sm:w-8"
                    style={{ backgroundColor: cell === 'red' ? '#c15a3a' : '#e8b34f' }}
                  />
                )}
              </button>
            ))}
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
