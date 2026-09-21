import { useState } from 'react'

const CHOICES = [
  { key: 'rock', label: 'Rock', emoji: '✊' },
  { key: 'paper', label: 'Paper', emoji: '✋' },
  { key: 'scissors', label: 'Scissors', emoji: '✌️' },
]

function beats(a, b) {
  return (a === 'rock' && b === 'scissors') || (a === 'paper' && b === 'rock') || (a === 'scissors' && b === 'paper')
}

export default function RockPaperScissors() {
  const [you, setYou] = useState(null)
  const [cpu, setCpu] = useState(null)
  const [result, setResult] = useState(null)
  const [score, setScore] = useState({ you: 0, cpu: 0 })

  function play(choice) {
    const cpuChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)].key
    setYou(choice)
    setCpu(cpuChoice)

    if (choice === cpuChoice) {
      setResult('draw')
    } else if (beats(choice, cpuChoice)) {
      setResult('you')
      setScore((s) => ({ ...s, you: s.you + 1 }))
    } else {
      setResult('cpu')
      setScore((s) => ({ ...s, cpu: s.cpu + 1 }))
    }
  }

  function emojiFor(key) {
    return CHOICES.find((c) => c.key === key)?.emoji
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-ink-muted">You {score.you} — {score.cpu} CPU</p>

      <div className="flex items-center gap-8 text-5xl">
        <span>{you ? emojiFor(you) : '❓'}</span>
        <span className="text-ink-muted text-lg">vs</span>
        <span>{cpu ? emojiFor(cpu) : '❓'}</span>
      </div>

      {result && (
        <p className="font-display text-lg font-bold text-ink">
          {result === 'draw' ? "It's a draw!" : result === 'you' ? 'You win!' : 'CPU wins!'}
        </p>
      )}

      <div className="flex gap-3">
        {CHOICES.map((choice) => (
          <button
            key={choice.key}
            type="button"
            onClick={() => play(choice.key)}
            className="rounded-card border border-border bg-surface-raised px-4 py-3 text-2xl transition-colors hover:bg-surface"
            aria-label={choice.label}
          >
            {choice.emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
