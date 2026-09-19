import { useRef, useState } from 'react'

export default function OtpInput({ length = 6, onChange }) {
  const [digits, setDigits] = useState(() => Array(length).fill(''))
  const inputsRef = useRef([])

  function updateDigits(next) {
    setDigits(next)
    onChange?.(next.join(''))
  }

  function handleChange(index, rawValue) {
    const value = rawValue.replace(/\D/g, '')
    const next = [...digits]

    if (!value) {
      next[index] = ''
      updateDigits(next)
      return
    }

    next[index] = value[value.length - 1]
    updateDigits(next)
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  function handlePaste(event) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    event.preventDefault()

    const next = Array(length).fill('')
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i]
    }
    updateDigits(next)
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <div className="flex gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          aria-label={`Digit ${index + 1} of ${length}`}
          className="h-12 w-10 rounded-card border border-border bg-surface text-center text-lg font-semibold text-ink focus:border-accent sm:h-14 sm:w-12"
        />
      ))}
    </div>
  )
}
