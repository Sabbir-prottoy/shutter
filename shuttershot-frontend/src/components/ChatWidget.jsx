import { useEffect, useRef, useState } from 'react'
import { askChatbot } from '../services/api'

const GREETING = "Hi! I'm the ShutterShot Assistant. Ask me about photographers, packages, pricing, or date availability."

// How many prior turns to resend as context each time — enough for a
// coherent back-and-forth without the request growing unbounded.
const MAX_HISTORY_TURNS = 12

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ role: 'model', text: GREETING }])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, open])

  async function handleSend(event) {
    event.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    const history = messages.slice(-MAX_HISTORY_TURNS)
    const nextMessages = [...messages, { role: 'user', text }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)

    try {
      const result = await askChatbot(text, history)
      setMessages((prev) => [...prev, { role: 'model', text: result.reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: "Sorry, I couldn't reach the assistant just now. Please try again." },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-hover">
          <div className="flex items-center justify-between bg-accent-gradient px-4 py-3">
            <p className="font-display text-sm font-bold text-white">ShutterShot Assistant</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-white/90 transition-opacity hover:opacity-75"
            >
              ✕
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <p
                  className={`max-w-[85%] rounded-card px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-accent-gradient text-white'
                      : 'bg-surface-raised text-ink'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-card bg-surface-raised px-3 py-2.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-ink-muted animate-dot-bounce"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-3">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about a photographer, package, or date…"
              className="min-w-0 flex-1 rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="shrink-0 rounded-card bg-accent-gradient px-4 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat assistant' : 'Open chat assistant'}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-gradient text-white shadow-hover transition-transform duration-200 hover:scale-105 active:animate-nav-bounce"
      >
        {open ? (
          <span className="text-xl">✕</span>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
            />
          </svg>
        )}
      </button>
    </div>
  )
}
