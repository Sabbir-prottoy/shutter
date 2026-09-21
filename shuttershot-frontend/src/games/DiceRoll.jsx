import { useState } from 'react'

const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

export default function DiceRoll() {
  const [dice, setDice] = useState([1, 1])
  const [guess, setGuess] = useState(null)
  const [rolling, setRolling] = useState(false)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [message, setMessage] = useState('Guess odd or even, then roll.')

  function roll() {
    if (!guess || rolling) return
    setRolling(true)
    let ticks = 0
    const interval = setInterval(() => {
      setDice([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)])
      ticks++
      if (ticks >= 8) {
        clearInterval(interval)
        const final = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]
        setDice(final)
        const total = final[0] + final[1]
        const isEven = total % 2 === 0
        const correct = (guess === 'even' && isEven) || (guess === 'odd' && !isEven)
        if (correct) {
          setStreak((s) => {
            const next = s + 1
            setBest((b) => Math.max(b, next))
            return next
          })
          setMessage(`Rolled ${total} — correct! Streak: ${streak + 1}`)
        } else {
          setStreak(0)
          setMessage(`Rolled ${total} — wrong, streak reset.`)
        }
        setRolling(false)
      }
    }, 80)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-ink-muted">{message}</p>
      <p className="text-xs text-ink-muted">Best streak: {best}</p>

      <div className="flex gap-4 text-6xl">
        <span>{FACES[dice[0] - 1]}</span>
        <span>{FACES[dice[1] - 1]}</span>
      </div>

      <div className="flex gap-3">
        {['odd', 'even'].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setGuess(option)}
            className={`rounded-card border px-4 py-2 text-sm font-medium capitalize transition-colors ${
              guess === option ? 'border-accent bg-surface-raised text-ink' : 'border-border bg-surface text-ink-muted'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={roll}
        disabled={!guess || rolling}
        className="rounded-card bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
      >
        {rolling ? 'Rolling…' : 'Roll the dice'}
      </button>
    </div>
  )
}
