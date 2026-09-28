import { useEffect, useState } from 'react'
import { approveDeletionRequest, getAdminDeletionRequests, rejectDeletionRequest } from '../../services/api'

export default function DeletionRequests() {
  const [requests, setRequests] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    loadRequests()
  }, [])

  function loadRequests() {
    setStatus('loading')
    getAdminDeletionRequests()
      .then((data) => {
        setRequests(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  async function handleApprove(request) {
    if (
      !window.confirm(
        `Approve ${request.userName}'s request? This permanently deletes their account, profile, and everything tied to it (portfolio, packages, bookings, reviews). This cannot be undone.`,
      )
    ) {
      return
    }

    setError(null)
    setProcessingId(request.id)
    try {
      await approveDeletionRequest(request.id)
      setRequests((prev) => prev.filter((r) => r.id !== request.id))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't approve that request. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(request) {
    const reason = window.prompt(`Reason for declining ${request.userName}'s request (optional):`)
    if (reason === null) return // they cancelled the prompt

    setError(null)
    setProcessingId(request.id)
    try {
      await rejectDeletionRequest(request.id, reason || undefined)
      setRequests((prev) => prev.filter((r) => r.id !== request.id))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't decline that request. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Account deletion requests</h1>
        <p className="mt-1 text-ink-muted">
          Review requests from customers and photographers to delete their own accounts. Approving
          permanently deletes the account and everything tied to it.
        </p>
      </div>

      {error && <p className="text-sm text-booked">{error}</p>}

      {status === 'loading' && <p className="text-ink-muted">Loading requests…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load deletion requests right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && requests.length === 0 && (
        <p className="text-ink-muted">No pending account deletion requests.</p>
      )}

      {status === 'ready' && requests.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {requests.map((request) => (
            <div key={request.id} className="rounded-card bg-surface p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-lg font-semibold text-ink">{request.userName}</p>
                  <p className="text-sm text-ink-muted">{request.userEmail}</p>
                </div>
                <span className="shrink-0 rounded-full bg-border px-2.5 py-0.5 text-xs font-medium text-ink-muted">
                  {request.role === 'PHOTOGRAPHER' ? 'Photographer' : 'Customer'}
                </span>
              </div>

              {request.reason && (
                <p className="mt-3 text-sm text-ink-muted">
                  <span className="font-medium text-ink">Reason: </span>
                  {request.reason}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <button
                  type="button"
                  disabled={processingId === request.id}
                  onClick={() => handleApprove(request)}
                  className="text-booked underline transition-opacity hover:opacity-80 disabled:opacity-60"
                >
                  Approve &amp; delete
                </button>
                <button
                  type="button"
                  disabled={processingId === request.id}
                  onClick={() => handleReject(request)}
                  className="text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
