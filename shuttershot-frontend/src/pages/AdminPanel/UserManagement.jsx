import { useEffect, useState } from 'react'
import { banUser, getAdminUsers, verifyUser } from '../../services/api'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  function loadUsers() {
    setStatus('loading')
    getAdminUsers('PHOTOGRAPHER')
      .then((data) => {
        setUsers(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  async function handleVerify(id) {
    setError(null)
    setProcessingId(id)
    try {
      const updated = await verifyUser(id)
      setUsers((prev) => prev.map((user) => (user.id === id ? updated : user)))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't verify that account. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  async function handleBan(user) {
    if (
      !window.confirm(
        `Ban ${user.name}? This permanently deletes their profile, portfolio, packages, and booking history from ShutterShot — this cannot be undone.`,
      )
    ) {
      return
    }

    setError(null)
    setProcessingId(user.id)
    try {
      await banUser(user.id)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't remove that account. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">User management</h1>
        <p className="mt-1 text-ink-muted">
          Verify photographers, or permanently remove accounts that break the rules.
        </p>
      </div>

      {error && <p className="text-sm text-booked">{error}</p>}

      {status === 'loading' && <p className="text-ink-muted">Loading photographers…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load photographers right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && users.length === 0 && <p className="text-ink-muted">No photographers yet.</p>}

      {status === 'ready' && users.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {users.map((user) => (
            <div key={user.id} className="rounded-card bg-surface p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-lg font-semibold text-ink">{user.name}</p>
                  <p className="text-sm text-ink-muted">{user.email}</p>
                  {user.phone && <p className="text-sm text-ink-muted">{user.phone}</p>}
                  {user.location && <p className="text-sm text-ink-muted">{user.location}</p>}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.verified ? 'bg-free/20 text-free' : 'bg-border text-ink-muted'
                  }`}
                >
                  {user.verified ? 'Verified' : 'Unverified'}
                </span>
              </div>

              <div className="mt-4 flex gap-4 text-sm">
                {!user.verified && (
                  <button
                    type="button"
                    disabled={processingId === user.id}
                    onClick={() => handleVerify(user.id)}
                    className="text-accent underline transition-opacity hover:opacity-80 disabled:opacity-60"
                  >
                    Verify
                  </button>
                )}
                <button
                  type="button"
                  disabled={processingId === user.id}
                  onClick={() => handleBan(user)}
                  className="text-booked underline transition-opacity hover:opacity-80 disabled:opacity-60"
                >
                  Ban
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
