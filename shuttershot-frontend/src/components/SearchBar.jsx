import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BANGLADESH_DISTRICTS } from '../constants'
import { triggerClickBurst } from './ClickBurstLayer'
import PillSelect from './PillSelect'

const CATEGORIES = ['wedding', 'portrait', 'event', 'landscape']

const DISTRICT_OPTIONS = [
  { value: '', label: 'Any district' },
  ...BANGLADESH_DISTRICTS.map((name) => ({ value: name, label: name })),
]

const CATEGORY_OPTIONS = [
  { value: '', label: 'Any category' },
  ...CATEGORIES.map((name) => ({ value: name, label: name.charAt(0).toUpperCase() + name.slice(1) })),
]

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.6 13.4 13 21a2 2 0 0 1-2.8 0L3 13.8V4h9.8l7.8 7.8a2 2 0 0 1 0 2.6z" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function SearchBar({
  initialQuery = '',
  initialDistrict = '',
  initialCategory = '',
  onSearch,
  className = '',
}) {
  const [q, setQ] = useState(initialQuery)
  const [district, setDistrict] = useState(initialDistrict)
  const [category, setCategory] = useState(initialCategory)
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()
    if (onSearch) {
      onSearch({ q, district, category })
      return
    }
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (district) params.set('district', district)
    if (category) params.set('category', category)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative z-30 flex flex-col gap-1 rounded-card bg-surface p-1.5 shadow-card sm:flex-row sm:items-center sm:gap-1 sm:rounded-full ${className}`}
    >
      <div className="flex flex-1 items-center gap-2 rounded-full px-4 py-2.5 transition-colors hover:bg-surface-raised focus-within:bg-surface-raised focus-within:ring-2 focus-within:ring-accent/40">
        <SearchIcon />
        <input
          type="text"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search by name, email, or phone"
          aria-label="Search by name, email, or phone"
          className="bare-input w-full min-w-0 bg-transparent text-sm text-ink placeholder:text-ink-muted"
        />
      </div>

      <PillSelect
        value={district}
        onChange={setDistrict}
        options={DISTRICT_OPTIONS}
        icon={<PinIcon />}
        ariaLabel="District"
      />

      <PillSelect
        value={category}
        onChange={setCategory}
        options={CATEGORY_OPTIONS}
        icon={<TagIcon />}
        ariaLabel="Category"
      />

      <div className="p-1.5">
        <button
          type="submit"
          onClick={(event) => triggerClickBurst(event.currentTarget)}
          className="w-full shrink-0 rounded-full bg-ink px-6 py-2.5 font-medium text-surface shadow-card transition-shadow hover:shadow-hover sm:w-auto"
        >
          Search
        </button>
      </div>
    </form>
  )
}
