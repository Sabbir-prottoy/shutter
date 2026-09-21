import { useState } from 'react'

const SENTENCES = [
  'Every session tells a story worth capturing.',
  'A great photographer finds light where others see none.',
  'Book your photographer and let the moment unfold.',
  'Weddings, portraits, and events deserve a steady hand.',
  'Focus, frame, and let the shutter do the rest.',
]

function randomSentence() {
  return SENTENCES[Math.floor(Math.random() * SENTENCES.length)]
}

export default function TypingTest() {
  const [sentence, setSentence] = useState(randomSentence)
  const [input, setInput] = useState('')
  const [startedAt, setStartedAt] = useState(null)
  const [result, setResult] = useState(null)

  function handleChange(event) {
    const value = event.target.value
    if (result) return

    if (!startedAt) setStartedAt(Date.now())
    setInput(value)

    if (value === sentence) {
      const elapsedMinutes = (Date.now() - (startedAt || Date.now())) / 60000
      const words = sentence.split(' ').length
      const wpm = elapsedMinutes > 0 ? Math.round(words / elapsedMinutes) : words * 60
      setResult({ wpm, seconds: Math.max(1, Math.round((Date.now() - (startedAt || Date.now())) / 1000)) })
    }
  }

  function next() {
    setSentence(randomSentence())
    setInput('')
    setStartedAt(null)
    setResult(null)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-ink-muted">{result ? `${result.wpm} WPM in ${result.seconds}s` : 'Type the sentence below as fast as you can.'}</p>

      <p className="max-w-md rounded-card bg-surface-raised px-4 py-3 text-center font-display text-lg text-ink">
        {sentence.split('').map((char, index) => {
          const typedChar = input[index]
          const color = typedChar == null ? 'text-ink-muted' : typedChar === char ? 'text-free' : 'text-booked'
          return (
            <span key={index} className={color}>
              {char}
            </span>
          )
        })}
      </p>

      <textarea
        value={input}
        onChange={handleChange}
        disabled={Boolean(result)}
        rows={2}
        className="w-full max-w-md rounded-card border border-border bg-surface px-4 py-3 text-ink focus:border-accent disabled:opacity-60"
        placeholder="Start typing here…"
      />

      <button
        type="button"
        onClick={next}
        className="rounded-card bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
      >
        New sentence
      </button>
    </div>
  )
}
