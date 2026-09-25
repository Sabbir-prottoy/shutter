import { useEffect, useState } from 'react'
import { getAdminReviews, removeReview } from '../../services/api'

export default function ReviewModeration() {
  const [reviews, setReviews] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    getAdminReviews()
      .then((data) => {
        setReviews(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  async function handleRemove(id) {
    if (!window.confirm('Take this review off the photographer\'s public profile?')) {
      return
    }

    setError(null)
    setProcessingId(id)
    try {
      await removeReview(id)
      setReviews((prev) => prev.filter((review) => review.id !== id))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't remove that review. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Review moderation</h1>
        <p className="mt-1 text-ink-muted">
          Reviews go live as soon as clients submit them. Photographers can reply but cannot remove
          them, so this is where an abusive or fake review is taken down.
        </p>
      </div>

      {error && <p className="text-sm text-booked">{error}</p>}

      {status === 'loading' && <p className="text-ink-muted">Loading reviews…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load reviews right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && reviews.length === 0 && (
        <p className="text-ink-muted">No published reviews yet.</p>
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

              {review.photographerReply && (
                <p className="mt-3 text-sm text-ink-muted">
                  <span className="font-medium text-ink">Photographer replied:</span>{' '}
                  {review.photographerReply}
                </p>
              )}

              <p className="mt-3 text-xs text-ink-muted">
                Photographer #{review.photographerId} &middot;{' '}
                {new Date(review.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>

              <div className="mt-4 text-sm">
                <button
                  type="button"
                  disabled={processingId === review.id}
                  onClick={() => handleRemove(review.id)}
                  className="text-ink-muted underline transition-colors hover:text-booked disabled:opacity-60"
                >
                  Remove review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
