import { useState } from 'react'

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function winnerOf(cells) {
  for (const [a, b, c] of LINES) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) return cells[a]
  }
  return null
}

export default function TicTacToe() {
  const [cells, setCells] = useState(Array(9).fill(null))
  const [xTurn, setXTurn] = useState(true)

  const winner = winnerOf(cells)
  const isDraw = !winner && cells.every(Boolean)

  function play(index) {
    if (cells[index] || winner) return
    const next = [...cells]
    next[index] = xTurn ? 'X' : 'O'
    setCells(next)
    setXTurn(!xTurn)
  }

  function reset() {
    setCells(Array(9).fill(null))
    setXTurn(true)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-ink-muted">
        {winner ? `${winner} wins!` : isDraw ? "It's a draw." : `${xTurn ? 'X' : 'O'}'s turn — two players, same screen.`}
      </p>

      <div className="grid grid-cols-3 gap-2">
        {cells.map((cell, index) => (
          <button
            key={index}
            type="button"
            onClick={() => play(index)}
            className="flex h-20 w-20 items-center justify-center rounded-card border border-border bg-surface-raised font-display text-3xl font-bold text-ink transition-colors hover:bg-surface disabled:cursor-default"
          >
            {cell}
          </button>
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
