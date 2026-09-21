import { useEffect, useRef, useState } from 'react'
import { askChatbot } from '../services/api'
import { getSpeechSupport } from '../utils/speechSupport'
import { triggerClickBurst } from './ClickBurstLayer'

const GREETING = "Hi, I'm the ShutterShot voice assistant. Tap the microphone and ask me anything."
const MAX_HISTORY_TURNS = 12

export default function VoiceAgent() {
  const { RecognitionCtor, synth, canListen, canSpeak } = getSpeechSupport()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ role: 'model', text: GREETING }])
  const [status, setStatus] = useState('idle') // idle | listening | thinking | speaking | error
  const [autoSpeak, setAutoSpeak] = useState(canSpeak)
  const [typedInput, setTypedInput] = useState('')
  const [error, setError] = useState(null)

  const recognitionRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, open])

  // Lets the navbar's "Speak with AI" link open this widget from anywhere on
  // the site — see ChatWidget's identical listener for why this has to be an
  // event rather than a passed-down handler.
  useEffect(() => {
    function handleOpenRequest() {
      setOpen(true)
    }
    window.addEventListener('open-voice-agent', handleOpenRequest)
    return () => window.removeEventListener('open-voice-agent', handleOpenRequest)
  }, [])

  // Stop any speech synthesis and any in-progress listening the moment the
  // panel closes or the component unmounts — nothing should keep talking or
  // listening in the background once the widget is out of sight.
  useEffect(() => {
    if (!open) {
      recognitionRef.current?.stop()
      if (canSpeak) synth.cancel()
    }
    return () => {
      recognitionRef.current?.stop()
      if (canSpeak) synth.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function send(transcript) {
    const text = transcript.trim()
    if (!text) return

    const history = messages.slice(-MAX_HISTORY_TURNS)
    setMessages((prev) => [...prev, { role: 'user', text }])
    setStatus('thinking')
    setError(null)

    try {
      const result = await askChatbot(text, history)
      setMessages((prev) => [...prev, { role: 'model', text: result.reply }])
      if (autoSpeak && canSpeak) {
        speak(result.reply)
      } else {
        setStatus('idle')
      }
    } catch {
      const fallback = "Sorry, I couldn't reach the assistant just now. Please try again."
      setMessages((prev) => [...prev, { role: 'model', text: fallback }])
      setStatus('idle')
    }
  }

  function speak(text) {
    if (!canSpeak) return
    synth.cancel()
    const utterance = new window.SpeechSynthesisUtterance(text)
    utterance.onstart = () => setStatus('speaking')
    utterance.onend = () => setStatus('idle')
    utterance.onerror = () => setStatus('idle')
    synth.speak(utterance)
  }

  function stopSpeaking() {
    if (canSpeak) synth.cancel()
    setStatus('idle')
  }

  function startListening() {
    if (!canListen || status === 'listening') return
    setError(null)

    if (!recognitionRef.current) {
      const recognition = new RecognitionCtor()
      recognition.lang = 'en-US'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript
        if (transcript) send(transcript)
      }
      recognition.onerror = (event) => {
        setStatus('idle')
        setError(
          event.error === 'not-allowed' || event.error === 'permission-denied'
            ? 'Microphone access was blocked — allow it in your browser to use voice input.'
            : "Didn't catch that — try again.",
        )
      }
      recognition.onend = () => {
        setStatus((current) => (current === 'listening' ? 'idle' : current))
      }
      recognitionRef.current = recognition
    }

    if (canSpeak) synth.cancel()
    setStatus('listening')
    try {
      recognitionRef.current.start()
    } catch {
      // Already running — a rapid double-click can fire this before the
      // "listening" state above has re-rendered. The in-progress session
      // just continues; nothing to recover from.
    }
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setStatus('idle')
  }

  function handleTypedSubmit(event) {
    event.preventDefault()
    if (!typedInput.trim() || status === 'thinking') return
    send(typedInput)
    setTypedInput('')
  }

  const statusLabel = {
    idle: canListen ? 'Tap to speak' : 'Type your question below',
    listening: 'Listening…',
    thinking: 'Thinking…',
    speaking: 'Speaking…',
  }[status]

  return (
    <div className="fixed bottom-24 right-6 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-hover">
          <div className="flex items-center justify-between bg-accent-gradient px-4 py-3">
            <p className="font-display text-sm font-bold text-white">Voice Assistant</p>
            <button
              type="button"
              onClick={(event) => {
                triggerClickBurst(event.currentTarget)
                setOpen(false)
              }}
              aria-label="Close voice assistant"
              className="text-white/90 transition-opacity hover:opacity-75"
            >
              ✕
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p
                  className={`max-w-[85%] rounded-card px-3 py-2 text-sm ${
                    message.role === 'user' ? 'bg-accent-gradient text-white' : 'bg-surface-raised text-ink'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            ))}

            {status === 'thinking' && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-card bg-surface-raised px-3 py-2.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-dot-bounce rounded-full bg-ink-muted"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-3">
            {error && <p className="mb-2 text-xs text-booked">{error}</p>}

            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-ink-muted">{statusLabel}</p>
              {canSpeak && (
                <label className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(event) => setAutoSpeak(event.target.checked)}
                    className="accent-accent"
                  />
                  Speak replies
                </label>
              )}
            </div>

            {canListen ? (
              <div className="mt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    triggerClickBurst(event.currentTarget)
                    status === 'listening' ? stopListening() : startListening()
                  }}
                  disabled={status === 'thinking'}
                  className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-card transition-transform hover:scale-105 disabled:opacity-60 ${
                    status === 'listening' ? 'bg-booked animate-nav-glow' : 'bg-accent-gradient'
                  }`}
                  aria-label={status === 'listening' ? 'Stop listening' : 'Start listening'}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                  </svg>
                </button>
                {status === 'speaking' && (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="text-xs text-ink-muted underline transition-colors hover:text-accent"
                  >
                    Stop speaking
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleTypedSubmit} className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={typedInput}
                  onChange={(event) => setTypedInput(event.target.value)}
                  placeholder="Voice input isn't supported here — type instead"
                  className="min-w-0 flex-1 rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={status === 'thinking' || !typedInput.trim()}
                  className="shrink-0 rounded-card bg-accent-gradient px-4 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
                >
                  Send
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={(event) => {
          triggerClickBurst(event.currentTarget)
          setOpen((v) => !v)
        }}
        aria-label={open ? 'Close voice assistant' : 'Open voice assistant'}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-gradient text-white shadow-hover transition-transform duration-200 hover:scale-105 active:animate-nav-bounce"
      >
        {open ? (
          <span className="text-xl">✕</span>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
          </svg>
        )}
      </button>
    </div>
  )
}
