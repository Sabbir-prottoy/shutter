import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SearchBar from '../components/SearchBar'
import PhotographerCard from '../components/PhotographerCard'
import { searchPhotographersPage } from '../services/api'

// How many photographers load at a time. Small enough that the first screen
// appears quickly, large enough to fill the grid's rows evenly (1, 2 and 3
// columns all divide it).
const PAGE_SIZE = 12

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const district = searchParams.get('district') || ''
  const category = searchParams.get('category') || ''

  const [photographers, setPhotographers] = useState([])
  const [total, setTotal] = useState(0)
  const [nextPage, setNextPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [status, setStatus] = useState('loading')
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreFailed, setLoadMoreFailed] = useState(false)

  // Identifies the current search, so a slow response for an earlier search
  // (or an earlier page) can never overwrite the results now on screen.
  const searchKey = useRef(0)
  const sentinelRef = useRef(null)

  useEffect(() => {
    const key = ++searchKey.current
    setStatus('loading')
    setLoadMoreFailed(false)

    searchPhotographersPage({ q, district, category, page: 0, size: PAGE_SIZE })
      .then((data) => {
        if (key !== searchKey.current) return
        setPhotographers(data.items)
        setTotal(data.total)
        setHasMore(data.hasMore)
        setNextPage(1)
        setStatus('ready')
      })
      .catch(() => {
        if (key === searchKey.current) setStatus('error')
      })
  }, [q, district, category])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    const key = searchKey.current
    setLoadingMore(true)
    setLoadMoreFailed(false)

    searchPhotographersPage({ q, district, category, page: nextPage, size: PAGE_SIZE })
      .then((data) => {
        if (key !== searchKey.current) return
        setPhotographers((prev) => {
          const seen = new Set(prev.map((photographer) => photographer.id))
          return [...prev, ...data.items.filter((photographer) => !seen.has(photographer.id))]
        })
        setTotal(data.total)
        setHasMore(data.hasMore)
        setNextPage(nextPage + 1)
      })
      .catch(() => {
        if (key === searchKey.current) setLoadMoreFailed(true)
      })
      .finally(() => {
        if (key === searchKey.current) setLoadingMore(false)
      })
  }, [loadingMore, hasMore, q, district, category, nextPage])

  // Loads the next portion by itself as the visitor scrolls close to the end
  // of the list; the button below stays as the manual way to do the same.
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore || loadMoreFailed || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore()
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loadMore, loadMoreFailed, photographers.length])

  function handleSearch({ q: nextQ, district: nextDistrict, category: nextCategory }) {
    const params = new URLSearchParams()
    if (nextQ) params.set('q', nextQ)
    if (nextDistrict) params.set('district', nextDistrict)
    if (nextCategory) params.set('category', nextCategory)
    setSearchParams(params)
  }

  const hasFilters = Boolean(q || district || category)

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <section className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-12">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Find a photographer
        </h1>

        <SearchBar
          initialQuery={q}
          initialDistrict={district}
          initialCategory={category}
          onSearch={handleSearch}
          className="mt-6"
        />

        <p className="mt-6 text-sm text-ink-muted">
          {status === 'ready' &&
            (hasFilters
              ? `${total} photographer${total === 1 ? '' : 's'} matching your search`
              : `${total} photographer${total === 1 ? '' : 's'} available`)}
        </p>

        {status === 'loading' && <p className="mt-8 text-ink-muted">Searching…</p>}

        {status === 'error' && (
          <p className="mt-8 text-ink-muted">
            We couldn't load results right now. Please check your connection and try again.
          </p>
        )}

        {status === 'ready' && photographers.length === 0 && (
          <p className="mt-8 text-ink-muted">
            No photographers found — try a different search term, district, or category.
          </p>
        )}

        {status === 'ready' && photographers.length > 0 && (
          <>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {photographers.map((photographer) => (
                <PhotographerCard key={photographer.id} photographer={photographer} />
              ))}
            </div>

            <div ref={sentinelRef} className="mt-8 flex flex-col items-center gap-2">
              {loadMoreFailed && (
                <p className="text-sm text-ink-muted">
                  We couldn't load more photographers. Please check your connection and try again.
                </p>
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
                      : `Show more photographers (${Math.max(total - photographers.length, 0)} left)`}
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
