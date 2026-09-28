import { useEffect, useState } from 'react'
import { cancelAccountDeletionRequest, getMyDeletionRequest, requestAccountDeletion } from '../services/api'

// Shared by AccountSettings (customer) and DeleteAccountRequest (photographer
// dashboard) — the backend endpoint is role-agnostic, so this one component
// covers both "Request to delete account" surfaces.
export default function DeleteAccountSection() {
  const [request, setRequest] = useState(null)
  const [status, setStatus] = useState('loading')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getMyDeletionRequest()
      .then((data) => {
        setRequest(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    if (
      !window.confirm(
        "Request to delete your account? An admin will review this. If approved, your account and everything tied to it is permanently deleted and can't be recovered.",
      )
    ) {
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const created = await requestAccountDeletion(reason.trim() || undefined)
      setRequest(created)
      setReason('')
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't submit your request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel() {
    if (!window.confirm('Cancel your account deletion request?')) return

    setError(null)
    setSubmitting(true)
    try {
      await cancelAccountDeletionRequest()
      setRequest(null)
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't cancel your request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // A convenience section, not core account info — if it fails to load,
  // fail quietly rather than blocking the rest of the settings page.
  if (status === 'loading' || status === 'error') return null

  return (
    <div className="rounded-card border border-booked/30 bg-surface p-6 shadow-card">
      <h2 className="font-display text-lg font-bold text-ink">Danger zone</h2>

      {request?.status === 'PENDING' && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-ink-muted">
            Your request to delete your account is{' '}
            <span className="font-medium text-booked">pending admin review</span>. You'll keep full
            access until an admin approves it.
          </p>
          <button
            type="button"
            disabled={submitting}
            onClick={handleCancel}
            className="text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
          >
            Cancel request
          </button>
        </div>
      )}

      {request?.status === 'REJECTED' && (
        <div className="mt-3 space-y-4">
          <p className="text-sm text-ink-muted">
            Your previous request to delete your account was declined
            {request.adminNote ? `: "${request.adminNote}"` : '.'}
          </p>
          <DeletionRequestForm reason={reason} setReason={setReason} submitting={submitting} onSubmit={handleSubmit} />
        </div>
      )}

      {!request && (
        <div className="mt-3 space-y-4">
          <p className="text-sm text-ink-muted">
            Permanently delete your account. This removes your profile and everything tied to it and
            can't be undone. An admin reviews every request before it takes effect.
          </p>
          <DeletionRequestForm reason={reason} setReason={setReason} submitting={submitting} onSubmit={handleSubmit} />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-booked">{error}</p>}
    </div>
  )
}

function DeletionRequestForm({ reason, setReason, submitting, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label htmlFor="delete-reason" className="text-sm font-medium text-ink">
          Reason (optional)
        </label>
        <textarea
          id="delete-reason"
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Let us know why you're leaving (optional)"
          className="mt-1 w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-card border border-booked px-6 py-2.5 text-sm font-medium text-booked transition-colors hover:bg-booked/10 disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Request to delete account'}
      </button>
    </form>
  )
}
