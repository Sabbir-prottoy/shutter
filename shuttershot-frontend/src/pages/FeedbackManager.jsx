import { useEffect, useState } from 'react'
import { approveMyReview, getMyPendingReviews, rejectMyReview } from '../services/api'

function Stars({ rating }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} className="text-accent">
      {'★'.repeat(rating)}
      <span className="text-border">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

export default function FeedbackManager() {
  const [reviews, setReviews] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    loadReviews()
  }, [])

  function loadReviews() {
    setStatus('loading')
    getMyPendingReviews()
      .then((data) => {
        setReviews(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  async function handleDecision(id, action) {
    setError(null)
    setProcessingId(id)
    try {
      if (action === 'approve') {
        await approveMyReview(id)
      } else {
        await rejectMyReview(id)
      }
      setReviews((prev) => prev.filter((review) => review.id !== id))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't process that feedback. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">Feedback</h1>
        {status === 'ready' && (
          <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-sm font-medium text-accent">
            {reviews.length} pending
          </span>
        )}
      </div>
      <p className="-mt-4 text-ink-muted">
        Clients can rate a session once it's marked completed. Every rating lands here first — it
        only appears on your public profile, and only counts toward your average, once you
        approve it.
      </p>

      {error && <p className="text-sm text-booked">{error}</p>}

      {status === 'loading' && <p className="text-ink-muted">Loading pending feedback…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load your pending feedback right now. Please check your connection and try
          again.
        </p>
      )}

      {status === 'ready' && reviews.length === 0 && (
        <p className="text-ink-muted">Nothing waiting for review right now.</p>
      )}

      {status === 'ready' && reviews.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-card bg-surface p-6 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <p className="font-sans text-lg font-semibold text-ink">{review.clientName}</p>
                <Stars rating={review.rating} />
              </div>

              {review.comment && <p className="mt-3 text-ink-muted">{review.comment}</p>}

              <p className="mt-3 text-xs text-ink-muted">
                {new Date(review.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>

              <div className="mt-4 flex gap-4 text-sm">
                <button
                  type="button"
                  disabled={processingId === review.id}
                  onClick={() => handleDecision(review.id, 'approve')}
                  className="text-accent underline transition-opacity hover:opacity-80 disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={processingId === review.id}
                  onClick={() => handleDecision(review.id, 'reject')}
                  className="text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
