import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { MAIN_ADMIN_EMAIL } from '../../constants'
import PasswordField from '../../components/PasswordField'
import ConfirmPasswordModal from '../../components/ConfirmPasswordModal'

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

// Shared by "Photographers Profile History" and "Users Profile History" —
// same list/search/remove/remove-all behavior, just pointed at different
// API functions and wording for which role it's showing.
export default function AccountHistory({ title, entityLabel, pluralLabel, getHistory, removeEntry, removeAll }) {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [status, setStatus] = useState('loading')
  const [query, setQuery] = useState('')
  const [error, setError] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null) // { type: 'single', account } | { type: 'all' }

  const isMainAdminUser = user?.email?.toLowerCase() === MAIN_ADMIN_EMAIL

  useEffect(() => {
    if (isMainAdminUser) loadHistory()
  }, [isMainAdminUser])

  function loadHistory() {
    setStatus('loading')
    getHistory()
      .then((data) => {
        setAccounts(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return accounts
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.phone || '').toLowerCase().includes(q),
    )
  }, [accounts, query])

  async function handleConfirmSingle(password) {
    const account = confirmTarget.account
    await removeEntry(account.id, password)
    setAccounts((prev) => prev.filter((a) => a.id !== account.id))
    setConfirmTarget(null)
  }

  async function handleConfirmAll(password) {
    await removeAll(password)
    setAccounts([])
    setConfirmTarget(null)
  }

  if (!isMainAdminUser) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        <p className="text-ink-muted">Only the main admin can view this.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-ink-muted">Every {entityLabel} on the platform, A to Z.</p>
        </div>
        {status === 'ready' && accounts.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmTarget({ type: 'all' })}
            className="shrink-0 rounded-card border border-booked px-4 py-2 text-sm font-medium text-booked transition-colors hover:bg-booked/10"
          >
            Remove all history
          </button>
        )}
      </div>

      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name, email, or phone…"
        className="w-full max-w-md rounded-card border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
      />

      {error && <p className="text-sm text-booked">{error}</p>}

      {status === 'loading' && <p className="text-ink-muted">Loading…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load {entityLabel} history right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && accounts.length === 0 && (
        <p className="text-ink-muted">No {pluralLabel} yet.</p>
      )}

      {status === 'ready' && accounts.length > 0 && filtered.length === 0 && (
        <p className="text-ink-muted">No {pluralLabel} match "{query}".</p>
      )}

      {status === 'ready' && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((account) => (
            <div key={account.id} className="rounded-card bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <p className="font-sans text-base font-semibold text-ink">{account.name}</p>
                <button
                  type="button"
                  onClick={() => setConfirmTarget({ type: 'single', account })}
                  className="shrink-0 text-sm text-booked underline transition-opacity hover:opacity-80"
                >
                  Remove
                </button>
              </div>
              <dl className="mt-2 space-y-1 text-sm">
                <div className="flex gap-1.5">
                  <dt className="shrink-0 text-ink-muted">Email:</dt>
                  <dd className="truncate text-ink">{account.email}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="shrink-0 text-ink-muted">Phone:</dt>
                  <dd className="text-ink">{account.phone || '—'}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="shrink-0 text-ink-muted">Location:</dt>
                  <dd className="text-ink">{account.location || '—'}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="shrink-0 text-ink-muted">Joined:</dt>
                  <dd className="text-ink">{dateFormatter.format(new Date(account.joinedAt))}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <dt className="shrink-0 text-ink-muted">Password:</dt>
                  <dd className="min-w-0 text-ink">
                    <PasswordField password={account.password} />
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}

      {confirmTarget?.type === 'single' && (
        <ConfirmPasswordModal
          title={`Remove this ${entityLabel}?`}
          description={`This permanently deletes ${confirmTarget.account.name}'s account and all of their data on ShutterShot. This cannot be undone. Enter your admin password to confirm.`}
          confirmLabel="Remove permanently"
          danger
          onConfirm={handleConfirmSingle}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {confirmTarget?.type === 'all' && (
        <ConfirmPasswordModal
          title={`Remove all ${entityLabel} history?`}
          description={`Every ${entityLabel}'s account and all of their data will be permanently deleted. This cannot be undone and cannot be recovered. Enter your admin password to confirm.`}
          confirmLabel="Delete everything"
          danger
          onConfirm={handleConfirmAll}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  )
}
