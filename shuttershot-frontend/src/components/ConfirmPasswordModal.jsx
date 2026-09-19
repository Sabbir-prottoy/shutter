import { useState } from 'react'

// A confirmation dialog that requires re-entering the main admin's own
// password before proceeding — used for destructive actions that need more
// friction than a plain yes/no confirm().
export default function ConfirmPasswordModal({ title, description, confirmLabel, danger, onConfirm, onCancel }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onConfirm(password)
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-sm rounded-card bg-surface p-6 shadow-hover">
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-ink-muted">{description}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your admin password"
            className="w-full rounded-card border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
          />

          {error && <p className="text-sm text-booked">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="text-sm text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`rounded-card px-4 py-2 text-sm font-medium text-white shadow-card transition-opacity hover:opacity-90 disabled:opacity-60 ${
                danger ? 'bg-booked' : 'bg-accent-gradient'
              }`}
            >
              {submitting ? 'Please wait…' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
