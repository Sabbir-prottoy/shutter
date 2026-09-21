import { useState } from 'react'

const ICONS = ['🌸', '🌵', '🍀', '🍁', '🍄', '🍌', '🍇', '🍊']

function shuffledDeck() {
  const deck = [...ICONS, ...ICONS].map((icon, index) => ({ id: index, icon }))
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export default function MemoryMatch() {
  const [deck, setDeck] = useState(shuffledDeck)
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [moves, setMoves] = useState(0)
  const [busy, setBusy] = useState(false)

  const won = matched.length === deck.length

  function flip(index) {
    if (busy || flipped.includes(index) || matched.includes(index)) return

    const next = [...flipped, index]
    setFlipped(next)

    if (next.length === 2) {
      setMoves((m) => m + 1)
      setBusy(true)
      const [a, b] = next
      if (deck[a].icon === deck[b].icon) {
        setTimeout(() => {
          setMatched((prev) => [...prev, a, b])
          setFlipped([])
          setBusy(false)
        }, 400)
      } else {
        setTimeout(() => {
          setFlipped([])
          setBusy(false)
        }, 700)
      }
    }
  }

  function reset() {
    setDeck(shuffledDeck())
    setFlipped([])
    setMatched([])
    setMoves(0)
    setBusy(false)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-ink-muted">{won ? `Solved in ${moves} moves!` : `Moves: ${moves}`}</p>

      <div className="grid grid-cols-4 gap-2">
        {deck.map((card, index) => {
          const shown = flipped.includes(index) || matched.includes(index)
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => flip(index)}
              className={`flex h-14 w-14 items-center justify-center rounded-card border border-border text-2xl transition-colors sm:h-16 sm:w-16 ${
                shown ? 'bg-surface' : 'bg-accent-gradient'
              }`}
            >
              {shown ? card.icon : ''}
            </button>
          )
        })}
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
