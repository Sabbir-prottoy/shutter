import { useState } from 'react'

const COLORS = [
  { key: 'red', active: '#e07a5f', idle: '#c15a3a' },
  { key: 'yellow', active: '#f4cf74', idle: '#e8b34f' },
  { key: 'green', active: '#a9cbb8', idle: '#8db5a0' },
  { key: 'blue', active: '#8fa9e0', idle: '#6d8fd6' },
]

export default function SimonSays() {
  const [sequence, setSequence] = useState([])
  const [playerIndex, setPlayerIndex] = useState(0)
  const [flash, setFlash] = useState(null)
  const [status, setStatus] = useState('idle') // idle | showing | playing | over
  const [best, setBest] = useState(0)

  function playSequence(seq) {
    setStatus('showing')
    seq.forEach((colorKey, i) => {
      setTimeout(() => {
        setFlash(colorKey)
        setTimeout(() => setFlash(null), 320)
      }, i * 600)
    })
    setTimeout(() => {
      setStatus('playing')
      setPlayerIndex(0)
    }, seq.length * 600)
  }

  function start() {
    const first = [COLORS[Math.floor(Math.random() * 4)].key]
    setSequence(first)
    playSequence(first)
  }

  function press(colorKey) {
    if (status !== 'playing') return
    setFlash(colorKey)
    setTimeout(() => setFlash(null), 200)

    if (colorKey !== sequence[playerIndex]) {
      setStatus('over')
      setBest((b) => Math.max(b, sequence.length - 1))
      return
    }

    if (playerIndex + 1 === sequence.length) {
      const next = [...sequence, COLORS[Math.floor(Math.random() * 4)].key]
      setSequence(next)
      setTimeout(() => playSequence(next), 500)
    } else {
      setPlayerIndex((i) => i + 1)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-ink-muted">
        {status === 'idle' && 'Watch the sequence, then repeat it.'}
        {status === 'showing' && 'Watch…'}
        {status === 'playing' && `Your turn — round ${sequence.length}`}
        {status === 'over' && `Game over — you reached round ${sequence.length} (best: ${best})`}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {COLORS.map((color) => (
          <button
            key={color.key}
            type="button"
            onClick={() => press(color.key)}
            disabled={status !== 'playing'}
            className="h-20 w-20 rounded-card border border-border shadow-card transition-opacity disabled:cursor-default"
            style={{ backgroundColor: flash === color.key ? color.active : color.idle, opacity: flash === color.key ? 1 : 0.85 }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={start}
        disabled={status === 'showing' || status === 'playing'}
        className="rounded-card bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
      >
        {status === 'idle' ? 'Start' : 'Restart'}
      </button>
    </div>
  )
}
