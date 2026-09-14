import { useEffect, useState } from 'react'
import { banUser, getAdminUsers, unbanUser, verifyUser } from '../../services/api'

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

  async function handleToggleBan(user) {
    const action = user.enabled ? 'ban' : 'unban'
    if (user.enabled && !window.confirm(`Ban ${user.name}? They won't be able to log in until unbanned.`)) {
      return
    }

    setError(null)
    setProcessingId(user.id)
    try {
      const updated = user.enabled ? await banUser(user.id) : await unbanUser(user.id)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)))
    } catch (err) {
      setError(err?.response?.data?.message || `We couldn't ${action} that account. Please try again.`)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">User management</h1>
        <p className="mt-1 text-ink-muted">Verify photographers or suspend accounts that break the rules.</p>
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
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.verified ? 'bg-free/20 text-free' : 'bg-border text-ink-muted'
                    }`}
                  >
                    {user.verified ? 'Verified' : 'Unverified'}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.enabled ? 'bg-free/20 text-free' : 'bg-booked/20 text-booked'
                    }`}
                  >
                    {user.enabled ? 'Active' : 'Banned'}
                  </span>
                </div>
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
                  onClick={() => handleToggleBan(user)}
                  className="text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
                >
                  {user.enabled ? 'Ban' : 'Unban'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
