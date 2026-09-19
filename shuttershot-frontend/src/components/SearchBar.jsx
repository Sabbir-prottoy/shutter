import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BANGLADESH_DISTRICTS } from '../constants'

const CATEGORIES = ['wedding', 'portrait', 'event', 'landscape']

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
      className={`flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card sm:flex-row sm:flex-wrap sm:items-center ${className}`}
    >
      <input
        type="text"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Search by name, email, or phone"
        aria-label="Search by name, email, or phone"
        className="flex-1 rounded-card border border-border bg-transparent px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent sm:min-w-[12rem]"
      />

      <select
        value={district}
        onChange={(event) => setDistrict(event.target.value)}
        aria-label="District"
        className="rounded-card border border-border bg-transparent px-4 py-3 text-ink focus:border-accent sm:w-48"
      >
        <option value="">Any district</option>
        {BANGLADESH_DISTRICTS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        aria-label="Category"
        className="rounded-card border border-border bg-transparent px-4 py-3 text-ink focus:border-accent sm:w-44"
      >
        <option value="">Any category</option>
        {CATEGORIES.map((option) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover"
      >
        Search
      </button>
    </form>
  )
}
