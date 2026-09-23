import { useState } from 'react'
import { submitReview } from '../services/api'

/**
 * Star-rating submission form for a completed booking. Shared by every place
 * a customer can leave feedback (the booking confirmation page and their
 * account's booking list), so the widget and its validation only exist once.
 */
export default function RatingForm({ bookingId, photographerName, onSubmitted }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    if (rating < 1) {
      setError('Please choose a star rating.')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      await submitReview({ bookingId, rating, comment })
      onSubmitted()
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't submit that rating. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-sm font-medium text-ink">
        Rate your session{photographerName ? ` with ${photographerName}` : ''}
      </p>
      <p className="mt-0.5 text-xs text-ink-muted">
        Sent to {photographerName || 'the photographer'} for approval — it only appears on their
        profile once they approve it.
      </p>

      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} star${value === 1 ? '' : 's'}`}
            onClick={() => setRating(value)}
            className={`text-2xl leading-none transition-colors ${
              value <= rating ? 'text-accent' : 'text-border hover:text-accent/60'
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Tell others about your experience (optional)"
        rows={2}
        className="mt-2 w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
      />

      {error && <p className="mt-1 text-xs text-booked">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-card bg-accent-gradient px-4 py-1.5 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit rating'}
      </button>
    </form>
  )
}
