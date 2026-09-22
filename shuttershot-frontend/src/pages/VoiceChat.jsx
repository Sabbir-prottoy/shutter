import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ChatMarkdown from '../components/ChatMarkdown'
import AiSparkIcon from '../components/AiSparkIcon'
import { useAuth } from '../context/AuthContext'
import { getSpeechSynthesisApi } from '../utils/speechSupport'
import {
  deleteAiChatConversation,
  getAiChatConversations,
  getAiChatMessages,
  sendAiChatMessage,
  transcribeAudio,
} from '../services/api'

// Speaking replies aloud is optional and browser-dependent; transcription is
// not, because that runs server-side through Whisper.
const canSpeak = Boolean(getSpeechSynthesisApi())

// idle → recording → transcribing → thinking → idle
const STATUS_LABELS = {
  idle: 'Tap the microphone and start talking',
  recording: 'Listening… tap again when you finish',
  transcribing: 'Making out what you said…',
  thinking: 'Thinking about your answer…',
}

function MicIcon({ className = 'h-10 w-10' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path strokeLinecap="round" d="M5 11a7 7 0 0 0 14 0M12 18.5V22M8.5 22h7" />
    </svg>
  )
}

function StopIcon({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <rect x="7" y="7" width="10" height="10" rx="2" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />
    </svg>
  )
}

export default function VoiceChat() {
  const { isAuthenticated } = useAuth()

  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [speakReplies, setSpeakReplies] = useState(canSpeak)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const bottomRef = useRef(null)
  const busy = status !== 'idle'

  useEffect(() => {
    if (!isAuthenticated) {
      setConversations([])
      return
    }
    getAiChatConversations('voice')
      .then(setConversations)
      .catch(() => setConversations([]))
  }, [isAuthenticated])

  useEffect(() => {
    if (messages.length === 0) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, status])

  // Stop any narration if the page is left mid-sentence, otherwise the voice
  // keeps talking over whatever the person navigates to next.
  useEffect(() => () => canSpeak && window.speechSynthesis.cancel(), [])

  const speak = useCallback((text) => {
    if (!canSpeak) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.02
    window.speechSynthesis.speak(utterance)
  }, [])

  async function ask(question) {
    setStatus('thinking')
    const priorTurns = messages
    setMessages([...priorTurns, { role: 'user', content: question }])

    try {
      const result = await sendAiChatMessage({
        message: question,
        conversationId: activeId,
        history: isAuthenticated ? undefined : priorTurns,
        mode: 'voice',
      })

      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }])
      if (speakReplies) speak(result.reply)

      if (result.conversationId) {
        const isNew = result.conversationId !== activeId
        setActiveId(result.conversationId)
        setConversations((prev) => {
          const rest = prev.filter((c) => c.id !== result.conversationId)
          const entry = isNew
            ? { id: result.conversationId, title: result.title, updatedAt: new Date().toISOString() }
            : prev.find((c) => c.id === result.conversationId)
          return entry ? [entry, ...rest] : prev
        })
      }
    } catch (err) {
      setMessages(priorTurns)
      setError(err?.response?.data?.message || "We couldn't get an answer. Please try again.")
    } finally {
      setStatus('idle')
    }
  }

  async function startRecording() {
    setError(null)
    if (canSpeak) window.speechSynthesis.cancel()

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('We need permission to use your microphone. Allow it in your browser and try again.')
      return
    }

    chunksRef.current = []
    const recorder = new MediaRecorder(stream)
    recorderRef.current = recorder

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }

    recorder.onstop = async () => {
      // Release the mic so the browser's recording indicator switches off.
      stream.getTracks().forEach((track) => track.stop())

      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
      if (blob.size === 0) {
        setStatus('idle')
        setError("That recording came through empty. Please try again.")
        return
      }

      setStatus('transcribing')
      try {
        const { text } = await transcribeAudio(blob)
        if (!text || !text.trim()) {
          setStatus('idle')
          setError("We couldn't make out any words there. Try again, a little closer to the mic.")
          return
        }
        await ask(text.trim())
      } catch (err) {
        setStatus('idle')
        setError(err?.response?.data?.message || "We couldn't transcribe that. Please try again.")
      }
    }

    recorder.start()
    setStatus('recording')
  }

  function stopRecording() {
    recorderRef.current?.state === 'recording' && recorderRef.current.stop()
  }

  function handleMicClick() {
    if (status === 'recording') {
      stopRecording()
    } else if (!busy) {
      startRecording()
    }
  }

  async function openConversation(id) {
    setActiveId(id)
    setError(null)
    setSidebarOpen(false)
    if (canSpeak) window.speechSynthesis.cancel()
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
    setError(null)
    setSidebarOpen(false)
    if (canSpeak) window.speechSynthesis.cancel()
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

  const sidebar = (
    <div className="flex h-full flex-col">
      <button
        type="button"
        onClick={startNewChat}
        className="rounded-card bg-accent-gradient px-4 py-2.5 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
      >
        New conversation
      </button>

      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-ink-muted">History</p>

      {!isAuthenticated ? (
        <p className="mt-3 text-sm text-ink-muted">
          <Link to="/login" className="text-accent underline underline-offset-2">
            Log in
          </Link>{' '}
          to save what you talk about. You can still speak freely — it just won't be kept.
        </p>
      ) : conversations.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">Nothing spoken yet.</p>
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
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-bold text-ink">Speak with AI</p>
              <p className="truncate text-xs text-ink-muted">
                Ask out loud about photographers, packages and dates
              </p>
            </div>
            {canSpeak && (
              <button
                type="button"
                onClick={() => {
                  if (speakReplies) window.speechSynthesis.cancel()
                  setSpeakReplies((value) => !value)
                }}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  speakReplies
                    ? 'border-accent text-accent'
                    : 'border-border text-ink-muted hover:text-accent'
                }`}
              >
                {speakReplies ? 'Voice on' : 'Voice off'}
              </button>
            )}
          </div>

          <div className="min-h-[45vh] flex-1 space-y-5 px-4 py-5 sm:px-6">
            {messages.length === 0 && status === 'idle' && (
              <div className="mx-auto max-w-lg py-10 text-center">
                <AiSparkIcon className="mx-auto h-10 w-10" />
                <h1 className="mt-4 font-display text-2xl font-bold text-ink">
                  Just ask out loud
                </h1>
                <p className="mt-2 text-sm text-ink-muted">
                  Tap the microphone below and speak — try “which photographers cover weddings in
                  Dhaka?” I'll answer, and read it back to you.
                </p>
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

            <div ref={bottomRef} />
          </div>

          {error && <p className="px-4 pb-2 text-sm text-booked sm:px-6">{error}</p>}

          <div className="flex flex-col items-center border-t border-border px-4 pb-10 pt-6 sm:px-6">
            <button
              type="button"
              onClick={handleMicClick}
              disabled={busy && status !== 'recording'}
              aria-label={status === 'recording' ? 'Stop recording' : 'Start recording'}
              className={`relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-hover transition-transform duration-200 hover:scale-105 disabled:opacity-60 ${
                status === 'recording' ? 'bg-booked' : 'bg-accent-gradient'
              }`}
            >
              {/* A pulsing ring while live, so it's obvious the mic is open. */}
              {status === 'recording' && (
                <span className="absolute inset-0 animate-ping rounded-full bg-booked opacity-40" />
              )}
              <span className="relative">
                {status === 'recording' ? <StopIcon /> : <MicIcon />}
              </span>
            </button>

            <p className="mt-4 text-center text-sm text-ink-muted">{STATUS_LABELS[status]}</p>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}
