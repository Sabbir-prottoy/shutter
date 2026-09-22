import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ChatMarkdown from '../components/ChatMarkdown'
import AiSparkIcon from '../components/AiSparkIcon'
import { useAuth } from '../context/AuthContext'
import {
  deleteAiChatConversation,
  getAiChatConversations,
  getAiChatMessages,
  sendAiChatMessage,
} from '../services/api'

const SUGGESTIONS = [
  'Which photographers cover weddings in Dhaka?',
  'What does a portrait session usually cost here?',
  'How does booking and the deposit work?',
  'Find me someone free next weekend',
]

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />
    </svg>
  )
}

export default function AiChat() {
  const { isAuthenticated } = useAuth()

  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const bottomRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setConversations([])
      return
    }
    getAiChatConversations('text')
      .then(setConversations)
      .catch(() => setConversations([]))
  }, [isAuthenticated])

  // The page itself scrolls now, so bring the newest turn into view rather
  // than scrolling a container that no longer has its own scrollbar.
  useEffect(() => {
    if (messages.length === 0) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, sending])

  async function openConversation(id) {
    setActiveId(id)
    setError(null)
    setSidebarOpen(false)
    try {
      const stored = await getAiChatMessages(id)
      setMessages(stored.map((m) => ({ role: m.role, content: m.content })))
    } catch {
      setError("We couldn't open that conversation.")
    }
  }

  function startNewChat() {
    setActiveId(null)
    setMessages([])
    setDraft('')
    setError(null)
    setSidebarOpen(false)
  }

  async function handleDelete(id, event) {
    event.stopPropagation()
    if (!window.confirm('Delete this conversation?')) return

    try {
      await deleteAiChatConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeId === id) startNewChat()
    } catch {
      setError("We couldn't delete that conversation.")
    }
  }

  async function submit(text) {
    const question = text.trim()
    if (!question || sending) return

    setDraft('')
    setError(null)
    setSending(true)

    // Show the question straight away rather than after the round trip.
    const priorTurns = messages
    setMessages([...priorTurns, { role: 'user', content: question }])

    try {
      const result = await sendAiChatMessage({
        message: question,
        conversationId: activeId,
        // Guests have nothing stored server-side, so their thread travels with
        // the request; signed-in callers have theirs loaded from the database.
        history: isAuthenticated ? undefined : priorTurns,
        mode: 'text',
      })

      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }])

      if (result.conversationId) {
        const isNew = result.conversationId !== activeId
        setActiveId(result.conversationId)
        if (isNew) {
          setConversations((prev) => [
            { id: result.conversationId, title: result.title, updatedAt: new Date().toISOString() },
            ...prev.filter((c) => c.id !== result.conversationId),
          ])
        } else {
          // Bump the thread to the top, matching the server's ordering.
          setConversations((prev) => {
            const match = prev.find((c) => c.id === result.conversationId)
            return match ? [match, ...prev.filter((c) => c.id !== result.conversationId)] : prev
          })
        }
      }
    } catch (err) {
      setMessages(priorTurns)
      setDraft(question)
      setError(err?.response?.data?.message || "We couldn't send that message. Please try again.")
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit(draft)
    }
  }

  // In each history row, delete sits beside the open button rather than inside
  // it: a button within a button is invalid HTML and browsers disagree on which
  // one owns the click.
  const sidebar = (
    <div className="flex h-full flex-col">
      <button
        type="button"
        onClick={startNewChat}
        className="rounded-card bg-accent-gradient px-4 py-2.5 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
      >
        New chat
      </button>

      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-ink-muted">History</p>

      {!isAuthenticated ? (
        <p className="mt-3 text-sm text-ink-muted">
          <Link to="/login" className="text-accent underline underline-offset-2">
            Log in
          </Link>{' '}
          to save your chats. You can still ask anything — it just won't be kept once you leave.
        </p>
      ) : conversations.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">No conversations yet.</p>
      ) : (
        <ul className="mt-3 flex-1 space-y-1 overflow-y-auto pr-1">
          {conversations.map((conversation) => (
            <li
              key={conversation.id}
              className={`group flex items-center gap-1 rounded-card pr-1 transition-colors ${
                activeId === conversation.id
                  ? 'bg-surface-raised text-ink'
                  : 'text-ink-muted hover:bg-surface-raised hover:text-ink'
              }`}
            >
              <button
                type="button"
                onClick={() => openConversation(conversation.id)}
                className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm"
              >
                {conversation.title}
              </button>
              <button
                type="button"
                aria-label={`Delete "${conversation.title}"`}
                onClick={(event) => handleDelete(conversation.id, event)}
                className="shrink-0 rounded p-1.5 opacity-0 transition-opacity hover:text-booked focus-visible:opacity-100 group-hover:opacity-100"
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-canvas">
      <Navbar />

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6 sm:px-6">
        {/* Sticky so the thread list stays reachable as the page scrolls. */}
        <aside className="sticky top-24 hidden h-[calc(100vh-9rem)] w-64 shrink-0 overflow-y-auto rounded-card border border-border bg-surface/60 p-4 backdrop-blur lg:block">
          {sidebar}
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-scrim/40" onClick={() => setSidebarOpen(false)} />
            <div className="relative h-full w-72 max-w-[80vw] border-r border-border bg-surface p-4 shadow-hover">
              {sidebar}
            </div>
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col rounded-card border border-border bg-surface/70 backdrop-blur">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-card px-2 py-1 text-sm text-ink-muted transition-colors hover:text-accent lg:hidden"
            >
              History
            </button>
            <AiSparkIcon className="h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold text-ink">ShutterShot AI</p>
              <p className="truncate text-xs text-ink-muted">
                Ask about photographers, packages, prices and availability
              </p>
            </div>
          </div>

          {/* Grows with the thread and lets the whole page scroll, rather than
              trapping the conversation in its own scrollbar. */}
          <div className="min-h-[55vh] flex-1 space-y-5 px-4 py-5 sm:px-6">
            {messages.length === 0 && !sending && (
              <div className="mx-auto max-w-lg py-10 text-center">
                <AiSparkIcon className="mx-auto h-10 w-10" />
                <h1 className="mt-4 font-display text-2xl font-bold text-ink">
                  How can I help with your shoot?
                </h1>
                <p className="mt-2 text-sm text-ink-muted">
                  I know every photographer on ShutterShot — their styles, packages, prices and
                  which dates they still have open.
                </p>
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => submit(suggestion)}
                      className="rounded-card border border-border px-3 py-2.5 text-left text-sm text-ink-muted transition-colors hover:border-accent hover:text-accent"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) =>
              message.role === 'user' ? (
                <div key={index} className="flex justify-end">
                  <div className="max-w-[80%] rounded-card bg-accent-gradient px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-card">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div key={index} className="flex gap-3">
                  <AiSparkIcon className="mt-1 h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1 text-ink">
                    <ChatMarkdown content={message.content} />
                  </div>
                </div>
              ),
            )}

            {sending && (
              <div className="flex gap-3">
                <AiSparkIcon className="mt-1 h-5 w-5 shrink-0" />
                <div className="flex items-center gap-1 py-1">
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

            <div ref={bottomRef} />
          </div>

          {error && <p className="px-4 pb-2 text-sm text-booked sm:px-6">{error}</p>}

          <div className="border-t border-border px-4 pb-10 pt-5 sm:px-6">
            <div className="mx-auto flex w-full max-w-xl items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-5 pr-1.5 focus-within:border-accent">
              <textarea
                rows={1}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about photographers, packages or dates…"
                aria-label="Message"
                className="max-h-28 w-full flex-1 resize-none bg-transparent py-1.5 text-[15px] text-ink placeholder:text-ink-muted focus:outline-none"
              />
              <button
                type="button"
                onClick={() => submit(draft)}
                disabled={!draft.trim() || sending}
                className="shrink-0 rounded-full bg-ink px-5 py-2 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Send
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-ink-muted">
              Enter to send.
            </p>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}
