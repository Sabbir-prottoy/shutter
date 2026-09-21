import { useState } from 'react'

function randomTarget() {
  return Math.floor(Math.random() * 100) + 1
}

export default function NumberGuessing() {
  const [target, setTarget] = useState(randomTarget)
  const [guess, setGuess] = useState('')
  const [history, setHistory] = useState([])
  const [won, setWon] = useState(false)

  function submitGuess(event) {
    event.preventDefault()
    const value = Number(guess)
    if (!value || value < 1 || value > 100 || won) return

    if (value === target) {
      setHistory((h) => [...h, { value, hint: 'correct' }])
      setWon(true)
    } else {
      setHistory((h) => [...h, { value, hint: value < target ? 'higher' : 'lower' }])
    }
    setGuess('')
  }

  function reset() {
    setTarget(randomTarget())
    setHistory([])
    setWon(false)
    setGuess('')
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-ink-muted">
        {won ? `You got it in ${history.length} guesses!` : "I'm thinking of a number between 1 and 100."}
      </p>

      {!won && (
        <form onSubmit={submitGuess} className="flex gap-2">
          <input
            type="number"
            min="1"
            max="100"
            value={guess}
            onChange={(event) => setGuess(event.target.value)}
            className="w-28 rounded-card border border-border bg-surface px-3 py-2 text-center text-ink focus:border-accent"
            placeholder="1-100"
          />
          <button
            type="submit"
            className="rounded-card bg-accent-gradient px-4 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
          >
            Guess
          </button>
        </form>
      )}

      {history.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-2 text-sm">
          {history.map((entry, index) => (
            <li
              key={index}
              className={`rounded-full px-3 py-1 ${
                entry.hint === 'correct'
                  ? 'bg-free/20 text-free'
                  : 'bg-surface-raised text-ink-muted'
              }`}
            >
              {entry.value} {entry.hint === 'higher' ? '↑' : entry.hint === 'lower' ? '↓' : '✓'}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={reset}
        className="rounded-card bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
      >
        New number
      </button>
    </div>
  )
}
