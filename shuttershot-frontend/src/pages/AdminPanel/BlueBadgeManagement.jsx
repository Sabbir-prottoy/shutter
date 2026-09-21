import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { MAIN_ADMIN_EMAIL } from '../../constants'
import BlueCheckIcon from '../../components/BlueCheckIcon'
import {
  getBlueBadgeHolders,
  getBlueBadgeSettings,
  revokeBlueBadge,
  updateBlueBadgeSettings,
} from '../../services/api'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'BDT',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

export default function BlueBadgeManagement() {
  const { user } = useAuth()
  const isMainAdminUser = user?.email?.toLowerCase() === MAIN_ADMIN_EMAIL

  const [price, setPrice] = useState('')
  const [priceStatus, setPriceStatus] = useState('loading')
  const [savingPrice, setSavingPrice] = useState(false)
  const [priceSaved, setPriceSaved] = useState(false)
  const [priceError, setPriceError] = useState(null)

  const [holders, setHolders] = useState([])
  const [holdersStatus, setHoldersStatus] = useState('loading')
  const [query, setQuery] = useState('')
  const [error, setError] = useState(null)
  const [revokingId, setRevokingId] = useState(null)

  useEffect(() => {
    if (!isMainAdminUser) return
    getBlueBadgeSettings()
      .then((data) => {
        setPrice(String(data.price))
        setPriceStatus('ready')
      })
      .catch(() => setPriceStatus('error'))
    loadHolders()
  }, [isMainAdminUser])

  function loadHolders() {
    setHoldersStatus('loading')
    getBlueBadgeHolders()
      .then((data) => {
        setHolders(data)
        setHoldersStatus('ready')
      })
      .catch(() => setHoldersStatus('error'))
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return holders
    return holders.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.email.toLowerCase().includes(q) ||
        (h.phone || '').toLowerCase().includes(q),
    )
  }, [holders, query])

  async function handleSavePrice(event) {
    event.preventDefault()
    setPriceError(null)
    setPriceSaved(false)
    setSavingPrice(true)
    try {
      const result = await updateBlueBadgeSettings(Number(price))
      setPrice(String(result.price))
      setPriceSaved(true)
    } catch (err) {
      setPriceError(err?.response?.data?.message || "We couldn't save that price. Please try again.")
    } finally {
      setSavingPrice(false)
    }
  }

  async function handleRevoke(holder) {
    if (
      !window.confirm(
        `Revoke ${holder.name}'s blue badge? Their profile will lose top placement and the badge icon. This does not refund the payment.`,
      )
    ) {
      return
    }

    setError(null)
    setRevokingId(holder.userId)
    try {
      await revokeBlueBadge(holder.userId)
      setHolders((prev) => prev.filter((h) => h.userId !== holder.userId))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't revoke that badge. Please try again.")
    } finally {
      setRevokingId(null)
    }
  }

  if (!isMainAdminUser) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-ink">Blue Badge Management</h1>
        <p className="text-ink-muted">Only the main admin can manage the blue badge.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
          <BlueCheckIcon className="h-6 w-6" />
          Blue Badge Management
        </h1>
        <p className="mt-1 text-ink-muted">
          Set the price photographers pay for the verified badge, and manage who currently has it.
        </p>
      </div>

      <div>
        <h2 className="font-sans text-lg font-semibold text-ink">Price</h2>
        {priceStatus === 'loading' && <p className="mt-2 text-ink-muted">Loading…</p>}
        {priceStatus === 'error' && (
          <p className="mt-2 text-ink-muted">We couldn't load the current price. Please try again.</p>
        )}
        {priceStatus === 'ready' && (
          <form onSubmit={handleSavePrice} className="mt-3 flex max-w-sm items-end gap-3">
            <div className="flex-1">
              <label htmlFor="price" className="text-sm font-medium text-ink">
                Amount (BDT)
              </label>
              <input
                id="price"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={price}
                onChange={(event) => {
                  setPrice(event.target.value)
                  setPriceSaved(false)
                }}
                className="mt-1 w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent"
              />
            </div>
            <button
              type="submit"
              disabled={savingPrice}
              className="rounded-card bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
            >
              {savingPrice ? 'Saving…' : 'Save'}
            </button>
          </form>
        )}
        {priceError && <p className="mt-2 text-sm text-booked">{priceError}</p>}
        {priceSaved && <p className="mt-2 text-sm text-free">Price updated.</p>}
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-sans text-lg font-semibold text-ink">Current badge holders</h2>
        </div>

        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email, or phone…"
          className="mt-3 w-full max-w-md rounded-card border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
        />

        {error && <p className="mt-3 text-sm text-booked">{error}</p>}

        {holdersStatus === 'loading' && <p className="mt-4 text-ink-muted">Loading…</p>}

        {holdersStatus === 'error' && (
          <p className="mt-4 text-ink-muted">
            We couldn't load badge holders right now. Please check your connection and try again.
          </p>
        )}

        {holdersStatus === 'ready' && holders.length === 0 && (
          <p className="mt-4 text-ink-muted">No one has purchased the blue badge yet.</p>
        )}

        {holdersStatus === 'ready' && holders.length > 0 && filtered.length === 0 && (
          <p className="mt-4 text-ink-muted">No badge holders match "{query}".</p>
        )}

        {holdersStatus === 'ready' && filtered.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filtered.map((holder) => (
              <div key={holder.userId} className="rounded-card bg-surface p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <p className="flex items-center gap-1.5 font-sans text-base font-semibold text-ink">
                    <BlueCheckIcon className="h-4 w-4" />
                    {holder.name}
                  </p>
                  <button
                    type="button"
                    disabled={revokingId === holder.userId}
                    onClick={() => handleRevoke(holder)}
                    className="shrink-0 text-sm text-booked underline transition-opacity hover:opacity-80 disabled:opacity-60"
                  >
                    {revokingId === holder.userId ? 'Revoking…' : 'Revoke'}
                  </button>
                </div>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 text-ink-muted">Email:</dt>
                    <dd className="truncate text-ink">{holder.email}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 text-ink-muted">Phone:</dt>
                    <dd className="text-ink">{holder.phone || '—'}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 text-ink-muted">Location:</dt>
                    <dd className="text-ink">{holder.location || '—'}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 text-ink-muted">Paid:</dt>
                    <dd className="text-ink">{currencyFormatter.format(holder.amountPaid)}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 text-ink-muted">Purchased:</dt>
                    <dd className="text-ink">{dateFormatter.format(new Date(holder.purchasedAt))}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
