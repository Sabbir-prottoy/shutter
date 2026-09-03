import { useEffect, useState } from 'react'
import { approveReview, getPendingReviews, rejectReview } from '../../services/api'

export default function ReviewModeration() {
  const [reviews, setReviews] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    loadReviews()
  }, [])

  function loadReviews() {
    setStatus('loading')
    getPendingReviews()
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
        await approveReview(id)
      } else {
        await rejectReview(id)
      }
      setReviews((prev) => prev.filter((review) => review.id !== id))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't process that review. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Review moderation</h1>
        <p className="mt-1 text-ink-muted">Approve or reject reviews before they go public.</p>
      </div>

      {error && <p className="text-sm text-booked">{error}</p>}

      {status === 'loading' && <p className="text-ink-muted">Loading pending reviews…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load pending reviews right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && reviews.length === 0 && (
        <p className="text-ink-muted">No reviews waiting for moderation.</p>
      )}

      {status === 'ready' && reviews.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-card bg-surface p-6 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <p className="font-sans text-lg font-semibold text-ink">{review.clientName}</p>
                <span className="shrink-0 text-sm font-medium text-accent">{review.rating} / 5</span>
              </div>

              {review.comment && <p className="mt-3 text-ink-muted">{review.comment}</p>}

              <p className="mt-3 text-xs text-ink-muted">
                Photographer #{review.photographerId} &middot;{' '}
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
