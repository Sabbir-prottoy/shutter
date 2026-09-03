import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = ['wedding', 'portrait', 'event', 'landscape']

export default function SearchBar({ initialLocation = '', initialCategory = '', onSearch, className = '' }) {
  const [location, setLocation] = useState(initialLocation)
  const [category, setCategory] = useState(initialCategory)
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()
    if (onSearch) {
      onSearch({ location, category })
      return
    }
    const params = new URLSearchParams()
    if (location) params.set('location', location)
    if (category) params.set('category', category)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card sm:flex-row sm:items-center ${className}`}
    >
      <input
        type="text"
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        placeholder="Where's your shoot?"
        aria-label="Location"
        className="flex-1 rounded-card border border-border bg-transparent px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
      />

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
