import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { MAIN_ADMIN_EMAIL } from '../../constants'
import PasswordField from '../../components/PasswordField'
import { createStaffAccount, getAdminStaff, removeStaffAccount } from '../../services/api'

export default function StaffManagement({ role, title, roleLabel }) {
  const { user } = useAuth()
  const [staff, setStaff] = useState([])
  const [status, setStatus] = useState('loading')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)
  const [removingId, setRemovingId] = useState(null)

  // Only the main admin can manage staff accounts at all — enforced for
  // real on the backend, mirrored here so the page doesn't even try.
  const isMainAdminUser = user?.email?.toLowerCase() === MAIN_ADMIN_EMAIL

  useEffect(() => {
    if (isMainAdminUser) loadStaff()
  }, [role, isMainAdminUser])

  function loadStaff() {
    setStatus('loading')
    getAdminStaff(role)
      .then((data) => {
        setStaff(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setCreated(null)
    setSubmitting(true)
    try {
      const result = await createStaffAccount({ name, email, password, role })
      setStaff((prev) => [result, ...prev])
      setCreated(result)
      setName('')
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't create that account. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(account) {
    if (
      !window.confirm(
        `Permanently remove ${account.name} (${account.email})? This deletes the account and cannot be undone.`,
      )
    ) {
      return
    }

    setError(null)
    setRemovingId(account.id)
    try {
      await removeStaffAccount(account.id)
      setStaff((prev) => prev.filter((a) => a.id !== account.id))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't remove that account. Please try again.")
    } finally {
      setRemovingId(null)
    }
  }

  if (!isMainAdminUser) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        <p className="text-ink-muted">Only the main admin can manage staff accounts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-1 text-ink-muted">
          Add a new {roleLabel} account with the full name, email, and password you set for them.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-card bg-surface p-6 shadow-card">
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Full name"
          className="w-full rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          className="w-full rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password (min. 8 characters)"
          className="w-full rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
        />
        {error && <p className="text-sm text-booked">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-card bg-accent-gradient px-6 py-2.5 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
        >
          {submitting ? 'Creating…' : `Add ${roleLabel}`}
        </button>
      </form>

      {created && (
        <p className="max-w-md rounded-card border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-ink-muted">
          <span className="text-ink">{created.name}</span> added as {roleLabel} — they can log in
          with <span className="text-ink">{created.email}</span> and the password you set. We also
          tried emailing them a copy.
        </p>
      )}

      <div>
        <h2 className="font-sans text-lg font-semibold text-ink">
          Existing {roleLabel} accounts
        </h2>

        {status === 'loading' && <p className="mt-3 text-ink-muted">Loading…</p>}

        {status === 'error' && (
          <p className="mt-3 text-ink-muted">
            We couldn't load these accounts right now. Please check your connection and try again.
          </p>
        )}

        {status === 'ready' && staff.length === 0 && (
          <p className="mt-3 text-ink-muted">No {roleLabel} accounts yet.</p>
        )}

        {status === 'ready' && staff.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {staff.map((account) => {
              const isMainAdmin = account.email.toLowerCase() === MAIN_ADMIN_EMAIL

              return (
                <div key={account.id} className="rounded-card bg-surface p-5 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-sans text-base font-semibold text-ink">{account.name}</p>
                    {isMainAdmin ? (
                      <span className="shrink-0 rounded-full bg-border px-2.5 py-0.5 text-xs font-medium text-ink-muted">
                        Main admin
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={removingId === account.id}
                        onClick={() => handleRemove(account)}
                        className="shrink-0 text-sm text-booked underline transition-opacity hover:opacity-80 disabled:opacity-60"
                      >
                        {removingId === account.id ? 'Removing…' : 'Remove'}
                      </button>
                    )}
                  </div>
                  <dl className="mt-2 space-y-1 text-sm">
                    <div className="flex gap-1.5">
                      <dt className="shrink-0 text-ink-muted">Email:</dt>
                      <dd className="truncate text-ink">{account.email}</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <dt className="shrink-0 text-ink-muted">Password:</dt>
                      <dd className="min-w-0 text-ink">
                        <PasswordField password={account.password} />
                      </dd>
                    </div>
                  </dl>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
