import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BlueCheckIcon from '../components/BlueCheckIcon'
import { getBlueBadgeStatus, purchaseBlueBadge } from '../services/api'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'BDT',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

const BENEFITS = [
  'A blue verified badge next to your name, like the checkmark on a verified Facebook or Instagram profile.',
  'Your profile is shown at the top of search results and the homepage listing, ahead of accounts without the badge.',
  'Priority/premium support from the ShutterShot team.',
]

const PAYMENT_BANNERS = {
  success: { tone: 'success', text: 'Payment received — your Verified Badge is now active.' },
  failed: { tone: 'error', text: "Payment couldn't be verified, so the badge wasn't activated. You haven't been charged by us — please try again." },
  cancelled: { tone: 'error', text: 'Checkout was cancelled, so no payment was made.' },
}

export default function VerifiedBadge() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState(null)
  const [pageStatus, setPageStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [redirecting, setRedirecting] = useState(false)
  const paymentResult = searchParams.get('payment')

  useEffect(() => {
    loadBadgeStatus()
  }, [])

  useEffect(() => {
    if (!paymentResult) return
    // Clear the query param once read so a page refresh doesn't re-show the banner.
    const next = new URLSearchParams(searchParams)
    next.delete('payment')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function loadBadgeStatus() {
    setPageStatus('loading')
    getBlueBadgeStatus()
      .then((data) => {
        setStatus(data)
        setPageStatus('ready')
      })
      .catch(() => setPageStatus('error'))
  }

  async function handlePurchase() {
    setError(null)
    setRedirecting(true)
    try {
      const { gatewayUrl } = await purchaseBlueBadge()
      window.location.href = gatewayUrl
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't start checkout. Please try again.")
      setRedirecting(false)
    }
  }

  const banner = paymentResult ? PAYMENT_BANNERS[paymentResult] : null

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Verified Badge</h1>
        <p className="mt-1 text-ink-muted">
          Stand out with a blue verified badge, top placement in search, and premium support.
        </p>
      </div>

      {banner && (
        <div
          className={`rounded-card border p-4 text-sm ${
            banner.tone === 'success'
              ? 'border-free/30 bg-free/10 text-free'
              : 'border-booked/30 bg-booked/10 text-booked'
          }`}
        >
          {banner.text}
        </div>
      )}

      {pageStatus === 'loading' && <p className="text-ink-muted">Loading…</p>}

      {pageStatus === 'error' && (
        <p className="text-ink-muted">
          We couldn't load your badge status right now. Please check your connection and try again.
        </p>
      )}

      {pageStatus === 'ready' && status?.hasBadge && (
        <div className="rounded-card border border-accent/30 bg-accent/10 p-6">
          <div className="flex items-center gap-2">
            <BlueCheckIcon className="h-6 w-6" />
            <p className="font-display text-lg font-bold text-ink">You have the Verified Badge</p>
          </div>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex gap-1.5">
              <dt className="text-ink-muted">Purchased:</dt>
              <dd className="text-ink">{dateFormatter.format(new Date(status.purchasedAt))}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-ink-muted">Amount paid:</dt>
              <dd className="text-ink">{currencyFormatter.format(status.amountPaid)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-ink-muted">
            Your profile is now shown at the top of search results, and you have access to premium
            support.
          </p>
        </div>
      )}

      {pageStatus === 'ready' && !status?.hasBadge && (
        <div className="rounded-card bg-surface p-6 shadow-card">
          <div className="flex items-center gap-2">
            <BlueCheckIcon className="h-6 w-6" />
            <p className="font-display text-lg font-bold text-ink">Get the Verified Badge</p>
          </div>

          <ul className="mt-4 space-y-2 text-sm text-ink-muted">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between rounded-card border border-border bg-surface-raised px-4 py-3">
            <span className="text-sm text-ink-muted">Current price</span>
            <span className="font-display text-xl font-bold text-ink">
              {currencyFormatter.format(status.currentPrice)}
            </span>
          </div>

          {error && <p className="mt-3 text-sm text-booked">{error}</p>}

          <button
            type="button"
            onClick={handlePurchase}
            disabled={redirecting}
            className="mt-6 w-full rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60 sm:w-auto"
          >
            {redirecting ? 'Redirecting to payment…' : 'Get Verified Badge'}
          </button>
          <p className="mt-2 text-xs text-ink-muted">
            You'll be taken to SSLCommerz's secure checkout to complete payment in BDT.
          </p>
        </div>
      )}
    </div>
  )
}
