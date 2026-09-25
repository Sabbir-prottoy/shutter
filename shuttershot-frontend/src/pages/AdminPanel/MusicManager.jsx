import { useEffect, useState } from 'react'
import { addMusic, deleteMusic, getAdminMusic } from '../../services/api'

// Kept in sync with the backend's MusicCategory enum and the public
// Suggestions page's sections - `slug` is what both sides key by.
const CATEGORIES = [
  { slug: 'bangla', value: 'BANGLA', label: 'Wedding - Bangla', itemLabel: 'song' },
  { slug: 'english', value: 'ENGLISH', label: 'Wedding - English', itemLabel: 'song' },
  { slug: 'hindi', value: 'HINDI', label: 'Wedding - Hindi', itemLabel: 'song' },
  { slug: 'event', value: 'EVENT', label: 'Event music', itemLabel: 'music' },
]

const fieldClass =
  'w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent'

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  )
}

export default function MusicManager() {
  const [musicBySlug, setMusicBySlug] = useState({})
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [activeSlug, setActiveSlug] = useState(CATEGORIES[0].slug)
  const [title, setTitle] = useState('')
  const [credit, setCredit] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    getAdminMusic()
      .then((data) => {
        setMusicBySlug(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  const active = CATEGORIES.find((category) => category.slug === activeSlug)
  const items = musicBySlug[activeSlug] || []

  function switchTab(slug) {
    setActiveSlug(slug)
    setError(null)
  }

  async function handleAdd(event) {
    event.preventDefault()
    if (!title.trim()) {
      setError(`Please enter the ${active.itemLabel} name.`)
      return
    }
    if (!youtubeUrl.trim()) {
      setError('Please paste the YouTube link.')
      return
    }

    setError(null)
    setAdding(true)
    try {
      const created = await addMusic({
        category: active.value,
        title: title.trim(),
        credit: credit.trim(),
        youtubeUrl: youtubeUrl.trim(),
      })
      setMusicBySlug((prev) => ({ ...prev, [activeSlug]: [...(prev[activeSlug] || []), created] }))
      setTitle('')
      setCredit('')
      setYoutubeUrl('')
    } catch (err) {
      setError(err?.response?.data?.message || `We couldn't add that ${active.itemLabel}. Please try again.`)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Remove "${item.title}" from the list?`)) {
      return
    }

    setError(null)
    setDeletingId(item.id)
    try {
      await deleteMusic(item.id)
      setMusicBySlug((prev) => ({
        ...prev,
        [activeSlug]: (prev[activeSlug] || []).filter((entry) => entry.id !== item.id),
      }))
    } catch (err) {
      setError(err?.response?.data?.message || `We couldn't remove that ${active.itemLabel}. Please try again.`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">Manage Music</h1>
      <p className="-mt-4 text-ink-muted">
        Add or remove the songs and background music listed under "Music suggestions" on the
        public Suggestions page. Each entry links to its YouTube video, and changes take effect
        immediately.
      </p>

      {status === 'loading' && <p className="text-ink-muted">Loading music…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load the music list right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && (
        <>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => switchTab(category.slug)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeSlug === category.slug
                    ? 'border-transparent bg-accent-gradient text-white shadow-card'
                    : 'border-border bg-surface text-ink-muted hover:border-accent hover:text-accent'
                }`}
              >
                {category.label} ({(musicBySlug[category.slug] || []).length})
              </button>
            ))}
          </div>

          <form onSubmit={handleAdd} className="rounded-card border border-border bg-surface p-5 shadow-card">
            <h2 className="font-display text-lg font-bold text-ink">Add to {active.label}</h2>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-muted">
                  {active.itemLabel === 'song' ? 'Song name' : 'Music name'}
                </span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={150}
                  placeholder={active.itemLabel === 'song' ? 'e.g. Perfect' : 'e.g. Sunny'}
                  className={fieldClass}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-muted">
                  {active.itemLabel === 'song' ? 'Artist (optional)' : 'Artist or library (optional)'}
                </span>
                <input
                  type="text"
                  value={credit}
                  onChange={(event) => setCredit(event.target.value)}
                  maxLength={150}
                  placeholder={active.itemLabel === 'song' ? 'e.g. Ed Sheeran' : 'e.g. Bensound'}
                  className={fieldClass}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-muted">YouTube link</span>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(event) => setYoutubeUrl(event.target.value)}
                  maxLength={300}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={fieldClass}
                />
              </label>
            </div>

            {error && <p className="mt-3 text-sm text-booked">{error}</p>}

            <button
              type="submit"
              disabled={adding}
              className="mt-4 rounded-full bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
            >
              {adding ? 'Adding…' : `Add ${active.itemLabel}`}
            </button>
          </form>

          {items.length === 0 && (
            <p className="text-ink-muted">Nothing in this list yet. Add the first one above.</p>
          )}

          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface px-4 py-3 shadow-card"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{item.title}</p>
                  {item.credit && <p className="truncate text-xs text-ink-muted">{item.credit}</p>}
                </div>

                <div className="flex shrink-0 items-center gap-4 text-sm">
                  <a
                    href={item.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-ink-muted underline transition-colors hover:text-accent"
                  >
                    YouTube <ExternalIcon />
                  </a>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item)}
                    className="text-ink-muted underline transition-colors hover:text-booked disabled:opacity-60"
                  >
                    {deletingId === item.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
