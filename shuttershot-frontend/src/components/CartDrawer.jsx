import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { getProductsByIds } from '../services/api'
import { formatBdt, MAX_PER_ITEM } from '../utils/shop'
import ProductArt from './ProductArt'
import QuantityStepper from './QuantityStepper'

// A slide-over cart that can be opened from anywhere in the shop. It stores only
// ids and quantities; everything else it shows is fetched fresh.
export default function CartDrawer() {
  const { items, open, closeCart, setQuantity, remove, rules } = useCart()
  const [products, setProducts] = useState({})
  const [status, setStatus] = useState('idle')
  const closeRef = useRef(null)

  const idsKey = items
    .map((item) => item.productId)
    .sort((a, b) => a - b)
    .join(',')

  useEffect(() => {
    if (!open || !idsKey) return undefined
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
  }, [open, idsKey])

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') closeCart()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, closeCart])

  if (!open) return null

  const lines = items.map((item) => ({ ...item, product: products[item.productId] }))
  const available = lines.filter((line) => line.product)
  const subtotal = available.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  const anyPhysical = available.some((line) => !line.product.digital)
  const missing = status === 'ready' ? lines.filter((line) => !line.product) : []
  const remainingForFree = rules ? rules.freeDeliveryFrom - subtotal : 0

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="absolute inset-0 bg-scrim/40" onClick={closeCart} />

      <aside className="animate-drawer-in relative flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-hover">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-xl font-bold text-ink">
            Your cart{items.length > 0 && <span className="ml-2 text-sm font-normal text-ink-muted">({items.length})</span>}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="pill-focus flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink-muted transition-colors hover:border-accent hover:text-accent"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="font-display text-lg font-bold text-ink">Your cart is empty</p>
            <p className="mt-1 text-sm text-ink-muted">Add gear from the marketplace and it will show up here.</p>
            <button
              type="button"
              onClick={closeCart}
              className="mt-5 rounded-full bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {lines.map((line) =>
                line.product ? (
                  <li key={line.productId} className="flex gap-3">
                    <ProductArt product={line.product} className="h-20 w-20 shrink-0 rounded-card border border-border" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-ink">{line.product.name}</p>
                      <p className="mt-0.5 text-sm text-ink-muted">{formatBdt(line.product.price)}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        {line.product.inStock ? (
                          <QuantityStepper
                            size="sm"
                            value={line.quantity}
                            max={Math.min(line.product.stock, MAX_PER_ITEM)}
                            onChange={(value) => setQuantity(line.productId, value)}
                            label={`Quantity of ${line.product.name}`}
                          />
                        ) : (
                          <span className="text-xs font-medium text-booked">Out of stock</span>
                        )}
                        <button
                          type="button"
                          onClick={() => remove(line.productId)}
                          className="text-xs text-ink-muted underline transition-colors hover:text-booked"
                        >
                          Remove
                        </button>
                      </div>
                      {line.product.inStock && line.quantity > line.product.stock && (
                        <p className="mt-1 text-xs text-booked">Only {line.product.stock} left in stock.</p>
                      )}
                    </div>
                  </li>
                ) : status === 'ready' ? (
                  <li key={line.productId} className="flex items-center justify-between gap-3 text-sm text-ink-muted">
                    <span>This item is no longer available.</span>
                    <button
                      type="button"
                      onClick={() => remove(line.productId)}
                      className="text-xs underline transition-colors hover:text-booked"
                    >
                      Remove
                    </button>
                  </li>
                ) : (
                  <li key={line.productId} className="text-sm text-ink-muted">
                    {status === 'error' ? "We couldn't load this item." : 'Loading…'}
                  </li>
                ),
              )}
            </ul>

            <div className="border-t border-border px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">Subtotal</span>
                <span className="font-display text-lg font-bold text-ink">{formatBdt(subtotal)}</span>
              </div>

              {rules && anyPhysical && (
                <p className="mt-1 text-xs text-ink-muted">
                  {remainingForFree > 0
                    ? `Add ${formatBdt(remainingForFree)} more for free delivery.`
                    : 'You have free delivery on this order.'}
                </p>
              )}
              {missing.length > 0 && (
                <p className="mt-1 text-xs text-booked">Remove unavailable items to continue.</p>
              )}

              <Link
                to="/marketplace/checkout"
                onClick={closeCart}
                aria-disabled={missing.length > 0 || available.length === 0}
                className={`mt-4 block rounded-full bg-accent-gradient px-5 py-2.5 text-center text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover ${
                  missing.length > 0 || available.length === 0 ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                Checkout
              </Link>
              <button
                type="button"
                onClick={closeCart}
                className="mt-2 w-full text-center text-sm text-ink-muted underline transition-colors hover:text-accent"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
