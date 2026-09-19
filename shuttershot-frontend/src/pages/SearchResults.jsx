import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SearchBar from '../components/SearchBar'
import PhotographerCard from '../components/PhotographerCard'
import { searchPhotographers } from '../services/api'

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const district = searchParams.get('district') || ''
  const category = searchParams.get('category') || ''

  const [photographers, setPhotographers] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    searchPhotographers({ q, district, category })
      .then((data) => {
        if (!cancelled) {
          setPhotographers(data)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [q, district, category])

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
              ? `${photographers.length} photographer${photographers.length === 1 ? '' : 's'} matching your search`
              : `${photographers.length} photographer${photographers.length === 1 ? '' : 's'} available`)}
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
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {photographers.map((photographer) => (
              <PhotographerCard key={photographer.id} photographer={photographer} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
