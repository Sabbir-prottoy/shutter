import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PillSelect from '../components/PillSelect'
import ProductArt from '../components/ProductArt'
import QuantityStepper from '../components/QuantityStepper'
import { useCart } from '../context/CartContext'
import { getProductCategoryCounts, getProducts } from '../services/api'
import { CATEGORY_BY_KEY, formatBdt, MAX_PER_ITEM, SHOP_CATEGORIES, SORT_OPTIONS } from '../utils/shop'

// Products load a portion at a time, like the photographer search.
const PAGE_SIZE = 12

function CartIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2.2l2.2 11h9.4l2-8H6.3" />
      <circle cx="9.5" cy="19.5" r="1.4" />
      <circle cx="16.5" cy="19.5" r="1.4" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
    </svg>
  )
}

const PERKS = [
  { title: 'Pay online or cash on delivery', body: 'Card, mobile banking or cash.' },
  { title: 'Delivery across Bangladesh', body: '৳80 inside Dhaka, ৳150 elsewhere.' },
  { title: 'Free delivery over ৳10,000', body: 'On every order that reaches it.' },
]

function ProductCard({ product }) {
  const { quantityOf, add, setQuantity } = useCart()
  const inCart = quantityOf(product.id)
  const category = CATEGORY_BY_KEY[product.category]
  const max = Math.min(product.stock, MAX_PER_ITEM)

  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-hover">
      <div className="relative">
        <ProductArt product={product} className="aspect-square w-full" />
        {product.discountPercent > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-accent-gradient px-2.5 py-1 text-xs font-semibold text-white shadow-card">
            -{product.discountPercent}%
          </span>
        )}
        {product.digital && (
          <span className="absolute right-3 top-3 rounded-full border border-border bg-surface/90 px-2.5 py-1 text-xs font-medium text-ink-muted backdrop-blur">
            Digital
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">{category?.label}</p>
        <h3 className="mt-1 line-clamp-2 font-sans text-base font-semibold text-ink">{product.name}</h3>
        {product.description && <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{product.description}</p>}

        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-xl font-bold text-accent">{formatBdt(product.price)}</span>
            {product.oldPrice && (
              <span className="text-sm text-ink-muted line-through">{formatBdt(product.oldPrice)}</span>
            )}
          </div>

          <p className={`mt-1 text-xs ${product.stock <= 5 ? 'font-medium text-booked' : 'text-ink-muted'}`}>
            {!product.inStock
              ? 'Out of stock'
              : product.digital
                ? 'Delivered by email'
                : product.stock <= 5
                  ? `Only ${product.stock} left`
                  : 'In stock'}
          </p>

          <div className="mt-3">
            {!product.inStock ? (
              <button
                type="button"
                disabled
                className="w-full rounded-full border border-border px-4 py-2 text-sm font-medium text-ink-muted opacity-60"
              >
                Out of stock
              </button>
            ) : inCart > 0 ? (
              <div className="flex items-center justify-between gap-2">
                <QuantityStepper
                  value={inCart}
                  max={max}
                  onChange={(value) => setQuantity(product.id, value)}
                  label={`Quantity of ${product.name}`}
                />
                <span className="text-xs font-medium text-free">In your cart</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => add(product.id, 1, max)}
                className="pill-focus flex w-full items-center justify-center gap-2 rounded-full bg-accent-gradient px-4 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
              >
                <CartIcon className="h-4 w-4" />
                Add to cart
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

const chipClass = (active) =>
  `pill-focus rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
    active
      ? 'border-transparent bg-accent-gradient text-white shadow-card'
      : 'border-border bg-surface text-ink-muted hover:border-accent hover:text-accent'
  }`

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || ''
  const urlQuery = searchParams.get('q') || ''

  const { count, openCart } = useCart()
  const [queryInput, setQueryInput] = useState(urlQuery)
  const [counts, setCounts] = useState({})
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [nextPage, setNextPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [status, setStatus] = useState('loading')
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreFailed, setLoadMoreFailed] = useState(false)
  const requestKey = useRef(0)
  const sentinelRef = useRef(null)

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    setSearchParams(next, { replace: true })
  }

  // Waits for a pause in typing before searching, so each keystroke isn't a request.
  useEffect(() => {
    if (queryInput === urlQuery) return undefined
    const timer = setTimeout(() => updateParams({ q: queryInput.trim() }), 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput])

  useEffect(() => {
    getProductCategoryCounts()
      .then((rows) => setCounts(Object.fromEntries(rows.map((row) => [row.category, row.count]))))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const key = ++requestKey.current
    setStatus('loading')
    setLoadMoreFailed(false)

    getProducts({ category, q: urlQuery, sort, page: 0, size: PAGE_SIZE })
      .then((data) => {
        if (key !== requestKey.current) return
        setProducts(data.items)
        setTotal(data.total)
        setHasMore(data.hasMore)
        setNextPage(1)
        setStatus('ready')
      })
      .catch(() => {
        if (key === requestKey.current) setStatus('error')
      })
  }, [category, urlQuery, sort])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    const key = requestKey.current
    setLoadingMore(true)
    setLoadMoreFailed(false)

    getProducts({ category, q: urlQuery, sort, page: nextPage, size: PAGE_SIZE })
      .then((data) => {
        if (key !== requestKey.current) return
        setProducts((prev) => {
          const seen = new Set(prev.map((product) => product.id))
          return [...prev, ...data.items.filter((product) => !seen.has(product.id))]
        })
        setTotal(data.total)
        setHasMore(data.hasMore)
        setNextPage(nextPage + 1)
      })
      .catch(() => {
        if (key === requestKey.current) setLoadMoreFailed(true)
      })
      .finally(() => {
        if (key === requestKey.current) setLoadingMore(false)
      })
  }, [loadingMore, hasMore, category, urlQuery, sort, nextPage])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore || loadMoreFailed || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore()
      },
      { rootMargin: '500px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loadMore, loadMoreFailed, products.length])

  const totalAll = Object.values(counts).reduce((sum, value) => sum + value, 0)
  const activeLabel = CATEGORY_BY_KEY[category]?.label
  const hasFilters = Boolean(category || urlQuery)

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <section className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-12">
        <h1 className="text-center font-display text-3xl font-bold text-ink sm:text-4xl">Accessories Marketplace</h1>
        <p className="mx-auto mt-3 max-w-3xl text-balance text-center text-ink-muted">
          Everything a working photographer reaches for, in one place: tripods and bags, lenses and
          lighting, storage, sound, editing software and the small things that save a shoot. Browse
          by shelf, add what you need to your cart, and pay online or in cash when it is delivered.
        </p>

        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PERKS.map((perk) => (
            <li key={perk.title} className="rounded-card border border-border bg-surface px-4 py-3 shadow-card">
              <p className="text-sm font-semibold text-ink">{perk.title}</p>
              <p className="text-xs text-ink-muted">{perk.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-2 rounded-card bg-surface p-1.5 shadow-card sm:flex-row sm:items-center sm:gap-1 sm:rounded-full">
          <div className="flex flex-1 items-center gap-2 rounded-full px-4 py-2.5 transition-colors hover:bg-surface-raised focus-within:bg-surface-raised focus-within:ring-2 focus-within:ring-accent/40">
            <SearchIcon />
            <input
              type="search"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Search tripods, lenses, flashes…"
              aria-label="Search products"
              className="bare-input w-full min-w-0 bg-transparent text-sm text-ink placeholder:text-ink-muted"
            />
          </div>

          <PillSelect
            value={sort}
            onChange={(value) => updateParams({ sort: value })}
            options={SORT_OPTIONS}
            ariaLabel="Sort products"
          />

          <button
            type="button"
            onClick={openCart}
            className="pill-focus relative flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-surface shadow-card transition-shadow hover:shadow-hover"
          >
            <CartIcon className="h-4 w-4" />
            Cart
            {count > 0 && (
              <span className="rounded-full bg-accent-gradient px-2 py-0.5 text-xs font-semibold text-white" aria-label={`${count} items in cart`}>
                {count}
              </span>
            )}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2" role="toolbar" aria-label="Product shelves">
          <button type="button" onClick={() => updateParams({ category: '' })} className={chipClass(!category)}>
            All{totalAll > 0 ? ` (${totalAll})` : ''}
          </button>
          {SHOP_CATEGORIES.map((shelf) => (
            <button
              key={shelf.key}
              type="button"
              onClick={() => updateParams({ category: shelf.key })}
              className={chipClass(category === shelf.key)}
            >
              {shelf.label}
              {counts[shelf.key] != null ? ` (${counts[shelf.key]})` : ''}
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm text-ink-muted">
          {status === 'ready' &&
            `${total} product${total === 1 ? '' : 's'}${activeLabel ? ` in ${activeLabel}` : ''}${urlQuery ? ` matching "${urlQuery}"` : ''}`}
        </p>

        {status === 'loading' && <p className="mt-8 text-ink-muted">Loading products…</p>}

        {status === 'error' && (
          <p className="mt-8 text-ink-muted">
            We couldn't load the marketplace right now. Please check your connection and try again.
          </p>
        )}

        {status === 'ready' && products.length === 0 && (
          <div className="mt-8 rounded-card border border-border bg-surface p-8 text-center shadow-card">
            <p className="font-display text-lg font-bold text-ink">Nothing matches that search</p>
            <p className="mt-1 text-sm text-ink-muted">Try a different word, or browse another shelf.</p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQueryInput('')
                  setSearchParams({}, { replace: true })
                }}
                className="mt-4 rounded-full border border-border px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {status === 'ready' && products.length > 0 && (
          <>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div ref={sentinelRef} className="mt-8 flex flex-col items-center gap-2">
              {loadMoreFailed && (
                <p className="text-sm text-ink-muted">We couldn't load more products. Please try again.</p>
              )}
              {hasMore && (
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={loadMore}
                  className="rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-medium text-ink shadow-card transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
                >
                  {loadingMore
                    ? 'Loading…'
                    : loadMoreFailed
                      ? 'Try again'
                      : `Show more products (${Math.max(total - products.length, 0)} left)`}
                </button>
              )}
            </div>
          </>
        )}
      </section>

      <Footer />
    </div>
  )
}
