import { useEffect, useState } from 'react'
import { getPhotographerAvailability } from '../services/api'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Deliberately not date.toISOString() — that converts to UTC first, which can
// shift a local calendar date to the day before/after depending on timezone.
function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export default function AvailabilityCalendar({
  photographerId,
  selectedDate,
  onSelectDate,
  interactiveStatuses = ['FREE'],
  refreshKey,
}) {
  const [viewedMonth, setViewedMonth] = useState(() => startOfMonth(new Date()))
  const [statusByDate, setStatusByDate] = useState({})
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    getPhotographerAvailability(photographerId, {
      from: toISODate(startOfMonth(viewedMonth)),
      to: toISODate(endOfMonth(viewedMonth)),
    })
      .then((data) => {
        if (cancelled) return
        const map = {}
        data.forEach((entry) => {
          map[entry.date] = entry.status
        })
        setStatusByDate(map)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [photographerId, viewedMonth, refreshKey])

  const monthStart = startOfMonth(viewedMonth)
  const monthEnd = endOfMonth(viewedMonth)
  const today = toISODate(new Date())

  const cells = Array(monthStart.getDay()).fill(null)
  for (let day = 1; day <= monthEnd.getDate(); day++) {
    cells.push(new Date(viewedMonth.getFullYear(), viewedMonth.getMonth(), day))
  }

  const monthLabel = viewedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="rounded-card bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          aria-label="Previous month"
          className="rounded-card px-3 py-1.5 text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
        >
          &larr;
        </button>
        <h3 className="font-sans text-lg font-semibold text-ink">{monthLabel}</h3>
        <button
          type="button"
          onClick={() => setViewedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          aria-label="Next month"
          className="rounded-card px-3 py-1.5 text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
        >
          &rarr;
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-ink-muted">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, index) => {
          if (!date) return <div key={`blank-${index}`} />

          const iso = toISODate(date)
          const isPast = iso < today
          const explicitStatus = statusByDate[iso]
          const currentStatus = explicitStatus || 'FREE'
          const isFree = currentStatus === 'FREE'
          const isSelectable = Boolean(onSelectDate) && !isPast && interactiveStatuses.includes(currentStatus)
          const isSelected = selectedDate === iso

          const baseClass =
            'flex aspect-square items-center justify-center rounded-[4px] text-sm transition-shadow duration-200'
          const stateClass = isPast
            ? 'text-ink-muted/40'
            : isFree
              ? 'bg-free/20 text-ink hover:shadow-[0_0_0_3px_rgba(193,90,58,0.15)]'
              : 'bg-booked/25 text-ink hover:shadow-[0_0_0_3px_rgba(193,90,58,0.15)]'
          const selectedClass = isSelected ? 'ring-2 ring-accent' : ''

          if (isSelectable) {
            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelectDate(iso, currentStatus)}
                className={`${baseClass} ${stateClass} ${selectedClass} cursor-pointer`}
              >
                {date.getDate()}
              </button>
            )
          }

          return (
            <div key={iso} className={`${baseClass} ${stateClass} ${selectedClass}`}>
              {date.getDate()}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[4px] bg-free/40" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[4px] bg-booked/40" /> Unavailable
        </span>
      </div>

      {status === 'error' && (
        <p className="mt-3 text-sm text-ink-muted">
          We couldn't load availability right now. Please check your connection and try again.
        </p>
      )}
    </div>
  )
}
