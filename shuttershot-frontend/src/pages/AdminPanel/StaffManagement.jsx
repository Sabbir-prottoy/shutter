import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createStaffAccount, getAdminStaff } from '../../services/api'

export default function StaffManagement({ role, title, roleLabel }) {
  const { user } = useAuth()
  const [staff, setStaff] = useState([])
  const [status, setStatus] = useState('loading')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)

  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    if (isAdmin) loadStaff()
  }, [role, isAdmin])

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
      const result = await createStaffAccount({ name, email, role })
      setStaff((prev) => [result, ...prev])
      setCreated(result)
      setName('')
      setEmail('')
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't create that account. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        <p className="text-ink-muted">Only admins can manage staff accounts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-1 text-ink-muted">
          Add a new {roleLabel} account. A password is generated automatically and emailed to
          them, so they can log in with their email and that password.
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
        <div className="max-w-md rounded-card border border-accent/30 bg-accent/10 px-4 py-3">
          <p className="text-sm text-ink-muted">
            Account created for <span className="text-ink">{created.email}</span>. We tried to
            email them the password below — if mail isn't set up in this environment, share it
            with them directly:
          </p>
          <p className="mt-1 font-display text-xl font-bold tracking-wide text-accent">
            {created.generatedPassword}
          </p>
        </div>
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
            {staff.map((account) => (
              <div key={account.id} className="rounded-card bg-surface p-5 shadow-card">
                <p className="font-sans text-base font-semibold text-ink">{account.name}</p>
                <p className="text-sm text-ink-muted">{account.email}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
