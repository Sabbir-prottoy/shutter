import { useEffect, useState } from 'react'
import { getMyReviews, replyToReview } from '../services/api'

function Stars({ rating }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} className="text-accent">
      {'★'.repeat(rating)}
      <span className="text-border">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function FeedbackCard({ review, onReplied }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(review.photographerReply || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!draft.trim()) {
      setError('Please write a reply first.')
      return
    }

    setError(null)
    setSaving(true)
    try {
      onReplied(await replyToReview(review.id, draft))
      setEditing(false)
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't post that reply. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-card bg-surface p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="font-sans text-lg font-semibold text-ink">{review.clientName}</p>
        <Stars rating={review.rating} />
      </div>

      {review.comment && <p className="mt-3 text-ink-muted">{review.comment}</p>}
      <p className="mt-3 text-xs text-ink-muted">{formatDate(review.createdAt)}</p>

      {review.photographerReply && !editing && (
        <div className="mt-4 rounded-card border-l-4 border-accent bg-surface-raised px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Your reply</p>
          <p className="mt-1 whitespace-pre-line text-sm text-ink">{review.photographerReply}</p>
          <button
            type="button"
            onClick={() => {
              setDraft(review.photographerReply)
              setEditing(true)
            }}
            className="mt-2 text-sm text-ink-muted underline transition-colors hover:text-accent"
          >
            Edit reply
          </button>
        </div>
      )}

      {!review.photographerReply && !editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-4 text-sm text-accent underline transition-opacity hover:opacity-80"
        >
          Reply
        </button>
      )}

      {editing && (
        <form onSubmit={handleSubmit} className="mt-4">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Write a public reply to this rating"
            className="w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
          />
          {error && <p className="mt-1 text-xs text-booked">{error}</p>}
          <div className="mt-2 flex items-center gap-4 text-sm">
            <button
              type="submit"
              disabled={saving}
              className="rounded-card bg-accent-gradient px-4 py-1.5 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
            >
              {saving ? 'Posting…' : review.photographerReply ? 'Save reply' : 'Post reply'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setEditing(false)
                setError(null)
              }}
              className="text-ink-muted underline transition-colors hover:text-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function FeedbackManager() {
  const [reviews, setReviews] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    getMyReviews()
      .then((data) => {
        setReviews(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  function replaceReview(updated) {
    setReviews((prev) => prev.map((review) => (review.id === updated.id ? updated : review)))
  }

  const awaitingReply = reviews.filter((review) => !review.photographerReply).length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">Feedback</h1>
        {status === 'ready' && awaitingReply > 0 && (
          <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-sm font-medium text-accent">
            {awaitingReply} without a reply
          </span>
        )}
      </div>
      <p className="-mt-4 text-ink-muted">
        Ratings from clients appear on your public profile as soon as they're submitted, and count
        toward your average right away. You can reply to any rating; replies show publicly beneath
        it.
      </p>

      {status === 'loading' && <p className="text-ink-muted">Loading feedback…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load your feedback right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && reviews.length === 0 && (
        <p className="text-ink-muted">No ratings yet. They'll show up here once clients leave them.</p>
      )}

      {status === 'ready' && reviews.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {reviews.map((review) => (
            <FeedbackCard key={review.id} review={review} onReplied={replaceReview} />
          ))}
        </div>
      )}
    </div>
  )
}
