import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PillSelect from '../components/PillSelect'
import ProductArt from '../components/ProductArt'
import { useCart } from '../context/CartContext'
import { BANGLADESH_DISTRICTS } from '../constants'
import { getProductsByIds, placeOrder } from '../services/api'
import { estimateDeliveryFee, formatBdt } from '../utils/shop'

const DISTRICT_OPTIONS = [
  { value: '', label: 'Select your district' },
  ...BANGLADESH_DISTRICTS.map((name) => ({ value: name, label: name })),
]

const inputClass =
  'w-full rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent'
const textareaClass =
  'w-full rounded-card border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent'

function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-accent"> *</span>}
        {hint && <span className="ml-1 text-xs font-normal text-ink-muted">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

const LAST_ORDER_KEY = 'shuttershot_last_order'

const PAYMENT_NOTICES = {
  failed: 'Your online payment did not go through, so nothing was charged and no order was placed. You can try again or choose cash on delivery.',
  cancelled: 'You cancelled the online payment, so nothing was charged and no order was placed. Your cart is still here.',
}

function PaymentOption({ selected, disabled, onSelect, title, children, badge }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-card border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        selected ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? 'border-accent' : 'border-border'
        }`}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink">{title}</span>
          {badge}
        </span>
        <span className="mt-0.5 block text-xs text-ink-muted">{children}</span>
      </span>
    </button>
  )
}

function Row({ label, value, strong }) {
  return (
    <div className={`flex items-center justify-between ${strong ? 'text-base font-bold text-ink' : 'text-sm text-ink-muted'}`}>
      <span>{label}</span>
      <span className={strong ? 'font-display text-lg' : 'text-ink'}>{value}</span>
    </div>
  )
}

export default function Checkout() {
  const { items, clear, rules } = useCart()
  const [products, setProducts] = useState({})
  const [status, setStatus] = useState('loading')
  const [form, setForm] = useState({ name: '', phone: '', email: '', district: '', address: '', note: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [placed, setPlaced] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY')
  const [notice, setNotice] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const handledReturn = useRef(false)

  const idsKey = items
    .map((item) => item.productId)
    .sort((a, b) => a - b)
    .join(',')

  useEffect(() => {
    if (placed) return undefined
    if (!idsKey) {
      setStatus('ready')
      return undefined
    }
    let cancelled = false
    setStatus('loading')
    getProductsByIds(idsKey.split(',').map(Number))
      .then((list) => {
        if (cancelled) return
        setProducts(Object.fromEntries(list.map((product) => [product.id, product])))
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [idsKey, placed])

  // Coming back with the browser's Back button from the payment page restores this page
  // as it was, with the button still busy.
  useEffect(() => {
    const onShow = (event) => {
      if (event.persisted) setSubmitting(false)
    }
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [])

  // SSLCommerz sends the browser back here with ?payment=success|failed|cancelled.
  useEffect(() => {
    const result = searchParams.get('payment')
    if (!result || handledReturn.current) return
    handledReturn.current = true
    const orderNumber = searchParams.get('order')

    if (result === 'success') {
      let stored = null
      try {
        stored = JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) || 'null')
        sessionStorage.removeItem(LAST_ORDER_KEY)
      } catch {
        stored = null
      }
      const known = stored && stored.orderNumber === orderNumber ? stored : null
      setPlaced({ ...(known || { orderNumber, items: [] }), paymentMethod: 'SSLCOMMERZ', paidOnline: true })
      clear()
      window.scrollTo({ top: 0 })
    } else if (PAYMENT_NOTICES[result]) {
      setNotice(PAYMENT_NOTICES[result])
    }
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams, clear])

  function update(field) {
    return (event) => {
      setError(null)
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  if (placed) {
    return (
      <div className="flex min-h-screen flex-col bg-canvas">
        <Navbar />
        <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
          <div className="rounded-card border border-border bg-surface p-8 shadow-card">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-free/25 text-free">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-5 font-display text-3xl font-bold text-ink">
              {placed.paidOnline ? 'Payment received, your order is placed' : 'Thank you, your order is placed'}
            </h1>
            <p className="mt-2 text-ink-muted">
              Order number{' '}
              <span className="rounded-full bg-accent/15 px-3 py-0.5 font-medium text-accent">{placed.orderNumber}</span>
            </p>
            {placed.paidOnline ? (
              <p className="mt-3 text-sm text-ink-muted">
                {placed.total != null && (
                  <>
                    You paid <span className="font-medium text-ink">{formatBdt(placed.total)}</span> online.{' '}
                  </>
                )}
                {placed.phone
                  ? `We will call ${placed.phone} to confirm your order`
                  : 'We will contact you shortly to confirm your order'}
                {placed.email ? `, and send updates to ${placed.email}` : ''}.
                {placed.items.some((item) => item.digital) &&
                  ' Software and subscriptions are sent to your email after confirmation.'}
              </p>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">
                We will call {placed.phone} to confirm your order
                {placed.email ? `, and send updates to ${placed.email}` : ''}. You pay{' '}
                <span className="font-medium text-ink">{formatBdt(placed.total)}</span> in cash when it is delivered.
                {placed.items.some((item) => item.digital) &&
                  ' Software and subscriptions are sent to your email after confirmation.'}
              </p>
            )}

            {placed.items.length > 0 && (
              <ul className="mt-6 divide-y divide-border border-y border-border">
              {placed.items.map((item) => (
                <li key={item.productId} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="text-ink">
                    {item.productName} <span className="text-ink-muted">× {item.quantity}</span>
                  </span>
                  <span className="text-ink">{formatBdt(item.lineTotal)}</span>
                </li>
              ))}
              </ul>
            )}

            {placed.total != null && (
              <div className="mt-4 space-y-1">
                <Row label="Subtotal" value={formatBdt(placed.subtotal)} />
                <Row label="Delivery" value={placed.deliveryFee === 0 ? 'Free' : formatBdt(placed.deliveryFee)} />
                <Row label={placed.paidOnline ? 'Total paid' : 'Total to pay'} value={formatBdt(placed.total)} strong />
              </div>
            )}

            {placed.address && (
              <p className="mt-5 text-sm text-ink-muted">
                <span className="font-medium text-ink">Delivering to: </span>
                {placed.customerName}, {placed.address}, {placed.district}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/marketplace"
                className="rounded-full bg-accent-gradient px-6 py-2.5 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
              >
                Continue shopping
              </Link>
              <Link
                to="/"
                className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Back to home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const lines = items.map((item) => ({ ...item, product: products[item.productId] }))
  const available = lines.filter((line) => line.product)
  const unavailable = status === 'ready' ? lines.filter((line) => !line.product || !line.product.inStock) : []
  const subtotal = available.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  const anyPhysical = available.some((line) => !line.product.digital)
  const anyDigital = available.some((line) => line.product.digital)
  const fee = estimateDeliveryFee(rules, { anyPhysical, district: form.district, subtotal })
  const total = subtotal + fee
  const districtPending = anyPhysical && !form.district
  const onlineAvailable = Boolean(rules?.onlinePayment)
  const payOnline = paymentMethod === 'SSLCOMMERZ' && onlineAvailable

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!form.name.trim()) return setError('Please enter your name.')
    if (!form.phone.trim()) return setError('Please enter your mobile number.')
    if (anyDigital && !form.email.trim()) {
      return setError('Please enter your email - software and subscriptions are delivered by email.')
    }
    if (anyPhysical && !form.district) return setError('Please choose your district.')
    if (anyPhysical && !form.address.trim()) return setError('Please enter your delivery address.')

    setSubmitting(true)
    try {
      const order = await placeOrder({
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        district: anyPhysical ? form.district : null,
        address: anyPhysical ? form.address.trim() : null,
        note: form.note.trim() || null,
        paymentMethod: payOnline ? 'SSLCOMMERZ' : 'CASH_ON_DELIVERY',
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      })
      if (order.gatewayUrl) {
        // Online payment: keep the cart until the payment succeeds, then leave for SSLCommerz.
        try {
          sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order))
        } catch {
          // Private mode: the confirmation page falls back to a shorter summary.
        }
        window.location.href = order.gatewayUrl
        return
      }
      setPlaced(order)
      clear()
      window.scrollTo({ top: 0 })
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't place your order. Please try again.")
    }
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:px-12">
        <Link to="/marketplace" className="text-sm text-ink-muted underline transition-colors hover:text-accent">
          ← Back to the marketplace
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">Checkout</h1>

        {notice && (
          <div role="alert" className="mt-5 rounded-card border border-booked/40 bg-booked/10 px-4 py-3 text-sm text-ink">
            {notice}
          </div>
        )}

        {status === 'loading' && <p className="mt-8 text-ink-muted">Loading your cart…</p>}

        {status === 'error' && (
          <p className="mt-8 text-ink-muted">
            We couldn't load your cart right now. Please check your connection and try again.
          </p>
        )}

        {status === 'ready' && items.length === 0 && (
          <div className="mt-8 rounded-card border border-border bg-surface p-8 text-center shadow-card">
            <p className="font-display text-lg font-bold text-ink">Your cart is empty</p>
            <p className="mt-1 text-sm text-ink-muted">Add some gear first, then come back to check out.</p>
            <Link
              to="/marketplace"
              className="mt-5 inline-block rounded-full bg-accent-gradient px-6 py-2.5 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
            >
              Browse the marketplace
            </Link>
          </div>
        )}

        {status === 'ready' && items.length > 0 && (
          <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="space-y-6">
              <section className="rounded-card border border-border bg-surface p-6 shadow-card">
                <h2 className="font-display text-lg font-bold text-ink">Your details</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Full name" required>
                    <input type="text" value={form.name} onChange={update('name')} maxLength={100} autoComplete="name" className={inputClass} />
                  </Field>
                  <Field label="Mobile number" required>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      maxLength={20}
                      autoComplete="tel"
                      placeholder="01XXXXXXXXX"
                      className={inputClass}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field
                      label="Email"
                      required={anyDigital}
                      hint={anyDigital ? '(your software is delivered here)' : '(optional, for order updates)'}
                    >
                      <input type="email" value={form.email} onChange={update('email')} maxLength={120} autoComplete="email" className={inputClass} />
                    </Field>
                  </div>
                </div>
              </section>

              {anyPhysical && (
                <section className="rounded-card border border-border bg-surface p-6 shadow-card">
                  <h2 className="font-display text-lg font-bold text-ink">Delivery address</h2>
                  <div className="mt-4 space-y-4">
                    <Field label="District" required>
                      <div className="rounded-full border border-border bg-surface">
                        <PillSelect
                          value={form.district}
                          onChange={(value) => {
                            setError(null)
                            setForm((prev) => ({ ...prev, district: value }))
                          }}
                          options={DISTRICT_OPTIONS}
                          ariaLabel="District"
                          icon={
                            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
                              <circle cx="12" cy="10" r="2.5" />
                            </svg>
                          }
                        />
                      </div>
                    </Field>
                    <Field label="Full address" required hint="(house, road, area)">
                      <textarea value={form.address} onChange={update('address')} maxLength={300} rows={3} autoComplete="street-address" className={textareaClass} />
                    </Field>
                  </div>
                </section>
              )}

              <section className="rounded-card border border-border bg-surface p-6 shadow-card">
                <h2 className="font-display text-lg font-bold text-ink">Order note</h2>
                <p className="mt-1 text-xs text-ink-muted">
                  Optional. Tell us your camera model or lens mount, or anything the courier should know.
                </p>
                <textarea value={form.note} onChange={update('note')} maxLength={300} rows={3} className={`mt-3 ${textareaClass}`} />
              </section>

              <section className="rounded-card border border-border bg-surface p-6 shadow-card">
                <h2 className="font-display text-lg font-bold text-ink">Payment</h2>
                <div role="radiogroup" aria-label="Payment method" className="mt-4 space-y-3">
                  <PaymentOption
                    selected={!payOnline}
                    onSelect={() => setPaymentMethod('CASH_ON_DELIVERY')}
                    title="Cash on delivery"
                  >
                    Pay the courier in cash when your order arrives. Software and subscriptions are
                    activated by email once your order is confirmed.
                  </PaymentOption>
                  <PaymentOption
                    selected={payOnline}
                    disabled={!onlineAvailable}
                    onSelect={() => setPaymentMethod('SSLCOMMERZ')}
                    title="Pay online with SSLCommerz"
                    badge={
                      <span className="rounded-full bg-free/25 px-2 py-0.5 text-[11px] font-medium text-free">
                        Secure
                      </span>
                    }
                  >
                    {onlineAvailable
                      ? 'Pay now by card, mobile banking (bKash, Nagad, Rocket) or net banking. You will be taken to the SSLCommerz payment page.'
                      : 'Online payment is not available right now. Please use cash on delivery.'}
                  </PaymentOption>
                </div>
              </section>
            </div>

            <aside className="h-fit rounded-card border border-border bg-surface p-6 shadow-card lg:sticky lg:top-28">
              <h2 className="font-display text-lg font-bold text-ink">Order summary</h2>

              <ul className="mt-4 space-y-3">
                {lines.map((line) =>
                  line.product ? (
                    <li key={line.productId} className="flex gap-3">
                      <ProductArt product={line.product} className="h-14 w-14 shrink-0 rounded-card border border-border" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm text-ink">{line.product.name}</p>
                        <p className="text-xs text-ink-muted">
                          {formatBdt(line.product.price)} × {line.quantity}
                        </p>
                        {(!line.product.inStock || line.quantity > line.product.stock) && (
                          <p className="text-xs font-medium text-booked">
                            {line.product.inStock ? `Only ${line.product.stock} left` : 'Out of stock'}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-ink">{formatBdt(line.product.price * line.quantity)}</span>
                    </li>
                  ) : (
                    <li key={line.productId} className="text-sm text-booked">An item in your cart is no longer available.</li>
                  ),
                )}
              </ul>

              <div className="mt-5 space-y-2 border-t border-border pt-4">
                <Row label="Subtotal" value={formatBdt(subtotal)} />
                <Row
                  label="Delivery"
                  value={!anyPhysical ? 'None' : districtPending ? 'Choose district' : fee === 0 ? 'Free' : formatBdt(fee)}
                />
                <Row label="Total" value={formatBdt(total)} strong />
              </div>

              {rules && anyPhysical && subtotal < rules.freeDeliveryFrom && (
                <p className="mt-2 text-xs text-ink-muted">
                  Add {formatBdt(rules.freeDeliveryFrom - subtotal)} more for free delivery.
                </p>
              )}

              {error && <p className="mt-4 text-sm text-booked">{error}</p>}
              {unavailable.length > 0 && (
                <p className="mt-4 text-sm text-booked">
                  Some items are unavailable. Remove them from your cart to place this order.
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || unavailable.length > 0}
                className="mt-5 w-full rounded-full bg-accent-gradient px-6 py-3 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
              >
                {submitting
                  ? payOnline
                    ? 'Taking you to payment…'
                    : 'Placing order…'
                  : payOnline
                    ? `Pay ${formatBdt(total)} online`
                    : `Place order · ${formatBdt(total)}`}
              </button>
              <p className="mt-3 text-center text-xs text-ink-muted">
                {payOnline ? 'Secure payment by SSLCommerz' : 'Pay in cash on delivery'}
              </p>
            </aside>
          </form>
        )}
      </main>

      <Footer />
    </div>
  )
}
