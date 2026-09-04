import { useEffect, useState } from 'react'
import AvailabilityCalendar from '../components/AvailabilityCalendar'
import { getMyProfile, setAvailability } from '../services/api'

const INTERACTIVE_STATUSES = ['FREE', 'BLOCKED']

export default function CalendarManager() {
  const [photographerId, setPhotographerId] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    getMyProfile()
      .then((profile) => {
        setPhotographerId(profile.id)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  async function handleToggleDate(dateIso, currentStatus) {
    setError(null)
    const nextStatus = currentStatus === 'BLOCKED' ? 'FREE' : 'BLOCKED'

    try {
      await setAvailability(dateIso, nextStatus)
      setRefreshKey((key) => key + 1)
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't update that date. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Calendar manager</h1>
        <p className="mt-1 text-ink-muted">
          Click any available date to block it, or a blocked date to make it available again.
          Booked dates are managed from Bookings.
        </p>
      </div>

      {status === 'loading' && <p className="text-ink-muted">Loading your calendar…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load your calendar right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && (
        <>
          {error && <p className="text-sm text-booked">{error}</p>}

          <div className="max-w-md">
            <AvailabilityCalendar
              photographerId={photographerId}
              onSelectDate={handleToggleDate}
              interactiveStatuses={INTERACTIVE_STATUSES}
              refreshKey={refreshKey}
            />
          </div>
        </>
      )}
    </div>
  )
}
