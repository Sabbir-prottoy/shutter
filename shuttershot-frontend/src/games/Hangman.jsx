import { useState } from 'react'

const WORDS = ['CAMERA', 'PORTRAIT', 'WEDDING', 'LENS', 'SHUTTER', 'ALBUM', 'STUDIO', 'APERTURE', 'FLASH', 'GALLERY']
const MAX_MISSES = 6
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

export default function Hangman() {
  const [word, setWord] = useState(randomWord)
  const [guessed, setGuessed] = useState([])

  const misses = guessed.filter((letter) => !word.includes(letter)).length
  const lost = misses >= MAX_MISSES
  const won = word.split('').every((letter) => guessed.includes(letter))

  function guess(letter) {
    if (guessed.includes(letter) || lost || won) return
    setGuessed((g) => [...g, letter])
  }

  function reset() {
    setWord(randomWord())
    setGuessed([])
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-ink-muted">
        {won ? 'You saved the day!' : lost ? `Out of guesses — the word was ${word}.` : `Misses: ${misses} / ${MAX_MISSES}`}
      </p>

      <div className="flex gap-2 font-display text-3xl font-bold tracking-widest text-ink">
        {word.split('').map((letter, index) => (
          <span key={index} className="w-6 border-b-2 border-border text-center">
            {guessed.includes(letter) || lost ? letter : ''}
          </span>
        ))}
      </div>

      <div className="grid max-w-xs grid-cols-7 gap-1.5">
        {ALPHABET.map((letter) => {
          const used = guessed.includes(letter)
          const correct = used && word.includes(letter)
          return (
            <button
              key={letter}
              type="button"
              onClick={() => guess(letter)}
              disabled={used || lost || won}
              className={`h-8 w-8 rounded text-xs font-medium transition-colors disabled:cursor-default ${
                used
                  ? correct
                    ? 'bg-free/30 text-free'
                    : 'bg-booked/20 text-booked'
                  : 'bg-surface-raised text-ink hover:bg-surface'
              }`}
            >
              {letter}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={reset}
        className="rounded-card bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
      >
        New word
      </button>
    </div>
  )
}
