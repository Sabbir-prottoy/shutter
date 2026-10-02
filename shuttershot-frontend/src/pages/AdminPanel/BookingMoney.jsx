import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { MAIN_ADMIN_EMAIL } from '../../constants'
import { getBookingMoneySettings, updateBookingMoneySettings } from '../../services/api'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'BDT',
  maximumFractionDigits: 0,
})

const EXAMPLE_PACKAGE_PRICE = 10000

export default function BookingMoney() {
  const { user } = useAuth()
  const isMainAdminUser = user?.email?.toLowerCase() === MAIN_ADMIN_EMAIL

  const [percent, setPercent] = useState('')
  const [status, setStatus] = useState('loading')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isMainAdminUser) return
    getBookingMoneySettings()
      .then((data) => {
        setPercent(String(Number(data.percent)))
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [isMainAdminUser])

  async function handleSave(event) {
    event.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      const result = await updateBookingMoneySettings(Number(percent))
      setPercent(String(Number(result.percent)))
      setSaved(true)
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't save that percentage. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const parsedPercent = Number(percent)
  const showExample = percent !== '' && parsedPercent >= 1 && parsedPercent <= 100

  if (!isMainAdminUser) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-ink">Booking Money</h1>
        <p className="text-ink-muted">Only the main admin can change the booking money percentage.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Booking Money</h1>
        <p className="mt-1 text-ink-muted">
          Set the percentage of a package's price that a client pays as a deposit when booking a
          photographer. A change applies to new bookings only — a booking that's already been made
          keeps the deposit it was quoted.
        </p>
      </div>

      <div>
        <h2 className="font-sans text-lg font-semibold text-ink">Deposit percentage</h2>

        {status === 'loading' && <p className="mt-2 text-ink-muted">Loading…</p>}

        {status === 'error' && (
          <p className="mt-2 text-ink-muted">We couldn't load the current percentage. Please try again.</p>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSave} className="mt-3 flex max-w-sm items-end gap-3">
            <div className="flex-1">
              <label htmlFor="deposit-percent" className="text-sm font-medium text-ink">
                Percent of the package price (%)
              </label>
              <input
                id="deposit-percent"
                type="number"
                required
                min="1"
                max="100"
                step="0.01"
                value={percent}
                onChange={(event) => {
                  setPercent(event.target.value)
                  setSaved(false)
                }}
                className="mt-1 w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-card bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>
        )}

        {status === 'ready' && showExample && (
          <p className="mt-3 text-sm text-ink-muted">
            For example, on a {currencyFormatter.format(EXAMPLE_PACKAGE_PRICE)} package, the client pays{' '}
            <span className="font-medium text-ink">
              {currencyFormatter.format((EXAMPLE_PACKAGE_PRICE * parsedPercent) / 100)}
            </span>{' '}
            to book.
          </p>
        )}

        {error && <p className="mt-2 text-sm text-booked">{error}</p>}
        {saved && <p className="mt-2 text-sm text-free">Percentage updated.</p>}
      </div>
    </div>
  )
}
