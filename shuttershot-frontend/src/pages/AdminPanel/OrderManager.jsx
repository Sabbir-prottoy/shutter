import { useCallback, useEffect, useState } from 'react'
import { getAdminOrders, updateOrderStatus } from '../../services/api'
import { formatBdt, ORDER_STATUS_STYLES, ORDER_STATUSES } from '../../utils/shop'

const PAGE_SIZE = 20

const STATUS_LABELS = {
  PLACED: 'New',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

// The one obvious next step for each open order; cancelling is always offered too.
const NEXT_STEP = {
  PLACED: { status: 'CONFIRMED', label: 'Confirm order' },
  CONFIRMED: { status: 'SHIPPED', label: 'Mark as shipped' },
  SHIPPED: { status: 'DELIVERED', label: 'Mark as delivered' },
}

// How the customer is paying, and whether the money is in.
function paymentBadge(order) {
  if (order.paymentMethod !== 'SSLCOMMERZ') {
    return { label: 'Cash on delivery', style: 'bg-canvas text-ink-muted border border-border' }
  }
  switch (order.paymentStatus) {
    case 'PAID':
      return { label: 'Paid online', style: 'bg-free/25 text-free' }
    case 'PENDING':
      return { label: 'Awaiting online payment', style: 'bg-accent/15 text-accent' }
    case 'FAILED':
      return { label: 'Online payment failed', style: 'bg-booked/15 text-booked' }
    default:
      return { label: 'Online payment cancelled', style: 'bg-booked/15 text-booked' }
  }
}

function formatDate(value) {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OrderManager() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [nextPage, setNextPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [tab, setTab] = useState('')
  const [status, setStatus] = useState('loading')
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    getAdminOrders({ status: tab, page: 0, size: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return
        setOrders(data.items)
        setTotal(data.total)
        setHasMore(data.hasMore)
        setNextPage(1)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [tab])

  const loadMore = useCallback(() => {
    setLoadingMore(true)
    getAdminOrders({ status: tab, page: nextPage, size: PAGE_SIZE })
      .then((data) => {
        setOrders((prev) => {
          const seen = new Set(prev.map((order) => order.id))
          return [...prev, ...data.items.filter((order) => !seen.has(order.id))]
        })
        setHasMore(data.hasMore)
        setNextPage((page) => page + 1)
      })
      .catch(() => setError("We couldn't load more orders. Please try again."))
      .finally(() => setLoadingMore(false))
  }, [tab, nextPage])

  async function changeStatus(order, next) {
    if (next === 'CANCELLED' && !window.confirm(`Cancel order ${order.orderNumber}? The items go back into stock.`)) {
      return
    }
    setError(null)
    setBusyId(order.id)
    try {
      const updated = await updateOrderStatus(order.id, next)
      setOrders((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't update that order. Please try again.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">Manage Orders</h1>
      <p className="-mt-4 text-ink-muted">
        Orders placed in the Accessories Marketplace, newest first. Customers pay either in cash on
        delivery or online with SSLCommerz. Confirm each order by phone, then move it along as it
        ships and arrives. Cancelling puts the items back in stock. Online orders can be confirmed
        once their payment shows as paid.
      </p>

      <div className="flex flex-wrap gap-2">
        {[{ key: '', label: 'All' }, ...ORDER_STATUSES.map((key) => ({ key, label: STATUS_LABELS[key] }))].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setTab(option.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === option.key
                ? 'border-transparent bg-accent-gradient text-white shadow-card'
                : 'border-border bg-surface text-ink-muted hover:border-accent hover:text-accent'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-booked">{error}</p>}
      {status === 'loading' && <p className="text-ink-muted">Loading orders…</p>}
      {status === 'error' && (
        <p className="text-ink-muted">We couldn't load the orders right now. Please check your connection and try again.</p>
      )}
      {status === 'ready' && orders.length === 0 && <p className="text-ink-muted">No orders here yet.</p>}

      {status === 'ready' && orders.length > 0 && (
        <>
          <p className="text-sm text-ink-muted">
            {total} order{total === 1 ? '' : 's'}
          </p>

          <ul className="space-y-4">
            {orders.map((order) => {
              const next = NEXT_STEP[order.status]
              const open = order.status !== 'DELIVERED' && order.status !== 'CANCELLED'
              const payment = paymentBadge(order)
              const online = order.paymentMethod === 'SSLCOMMERZ'
              const awaitingPayment = online && order.paymentStatus === 'PENDING'
              const refundNeeded = online && order.paymentStatus === 'PAID' && order.status === 'CANCELLED'
              return (
                <li key={order.id} className="rounded-card border border-border bg-surface p-5 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-display text-lg font-bold text-ink">{order.orderNumber}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_STYLES[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${payment.style}`}>
                        {payment.label}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted">{formatDate(order.createdAt)}</p>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="text-sm text-ink-muted">
                      <p className="font-medium text-ink">{order.customerName}</p>
                      <p>
                        <a href={`tel:${order.phone}`} className="underline transition-colors hover:text-accent">
                          {order.phone}
                        </a>
                        {order.email && <span> · {order.email}</span>}
                      </p>
                      {order.address ? (
                        <p className="mt-1">
                          {order.address}, {order.district}
                        </p>
                      ) : (
                        <p className="mt-1">Digital order - no delivery.</p>
                      )}
                      {order.note && (
                        <p className="mt-1">
                          <span className="font-medium text-ink">Note: </span>
                          {order.note}
                        </p>
                      )}
                    </div>

                    <div>
                      <ul className="divide-y divide-border text-sm">
                        {order.items.map((item) => (
                          <li key={item.productId} className="flex items-center justify-between gap-3 py-1.5">
                            <span className="text-ink">
                              {item.productName} <span className="text-ink-muted">× {item.quantity}</span>
                              {item.digital && <span className="ml-1 text-xs text-accent">(digital)</span>}
                            </span>
                            <span className="text-ink-muted">{formatBdt(item.lineTotal)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 space-y-0.5 text-sm">
                        <div className="flex justify-between text-ink-muted">
                          <span>Delivery</span>
                          <span>{order.deliveryFee === 0 ? 'Free' : formatBdt(order.deliveryFee)}</span>
                        </div>
                        <div className="flex justify-between font-medium text-ink">
                          <span>
                            {!online
                              ? 'Amount to collect'
                              : order.paymentStatus === 'PAID'
                                ? 'Paid online'
                                : 'Order total'}
                          </span>
                          <span>{formatBdt(order.total)}</span>
                        </div>
                      </div>
                      {refundNeeded && (
                        <p className="mt-2 text-xs text-booked">
                          This customer paid online after the order was released and the items ran out of stock.
                          Refund {formatBdt(order.total)} through your SSLCommerz merchant panel.
                        </p>
                      )}
                    </div>
                  </div>

                  {open && (
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      {next && !awaitingPayment && (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => changeStatus(order, next.status)}
                          className="rounded-full bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
                        >
                          {busyId === order.id ? 'Updating…' : next.label}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => changeStatus(order, 'CANCELLED')}
                        className="text-sm text-ink-muted underline transition-colors hover:text-booked disabled:opacity-60"
                      >
                        Cancel order
                      </button>
                      {awaitingPayment && (
                        <p className="text-xs text-ink-muted">
                          Waiting for the customer to pay online. Unpaid orders are released automatically after an hour.
                        </p>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          {hasMore && (
            <button
              type="button"
              disabled={loadingMore}
              onClick={loadMore}
              className="rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-medium text-ink shadow-card transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
            >
              {loadingMore ? 'Loading…' : `Show more orders (${Math.max(total - orders.length, 0)} left)`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
