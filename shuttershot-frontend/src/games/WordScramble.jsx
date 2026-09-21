import { useState } from 'react'

const WORDS = ['CAMERA', 'PORTRAIT', 'WEDDING', 'ALBUM', 'STUDIO', 'APERTURE', 'GALLERY', 'FOCUS', 'LIGHTING', 'FRAME']

function scramble(word) {
  const letters = word.split('')
  do {
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[letters[i], letters[j]] = [letters[j], letters[i]]
    }
  } while (letters.join('') === word)
  return letters.join('')
}

function nextPuzzle() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)]
  return { word, scrambled: scramble(word) }
}

export default function WordScramble() {
  const [puzzle, setPuzzle] = useState(nextPuzzle)
  const [guess, setGuess] = useState('')
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState(null)

  function submit(event) {
    event.preventDefault()
    if (!guess) return

    if (guess.trim().toUpperCase() === puzzle.word) {
      setScore((s) => s + 1)
      setFeedback('correct')
      setTimeout(() => {
        setPuzzle(nextPuzzle())
        setFeedback(null)
        setGuess('')
      }, 700)
    } else {
      setFeedback('wrong')
    }
  }

  function skip() {
    setPuzzle(nextPuzzle())
    setGuess('')
    setFeedback(null)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-ink-muted">Score: {score}</p>

      <p className="font-display text-3xl font-bold tracking-[0.3em] text-ink">{puzzle.scrambled}</p>

      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={guess}
          onChange={(event) => setGuess(event.target.value)}
          placeholder="Your guess"
          className="w-44 rounded-card border border-border bg-surface px-3 py-2 text-center uppercase text-ink focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-card bg-accent-gradient px-4 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
        >
          Check
        </button>
      </form>

      {feedback === 'correct' && <p className="text-sm text-free">Correct!</p>}
      {feedback === 'wrong' && <p className="text-sm text-booked">Not quite — try again.</p>}

      <button
        type="button"
        onClick={skip}
        className="text-sm text-ink-muted underline transition-colors hover:text-accent"
      >
        Skip word
      </button>
    </div>
  )
}
