import { useEffect, useState } from 'react'
import { getMyBookings, getMyPackages, getMyProfile, updateBookingStatus } from '../services/api'

const STATUS_STYLES = {
  PENDING: 'bg-border text-ink-muted',
  CONFIRMED: 'bg-free/20 text-free',
  COMPLETED: 'bg-accent/15 text-accent',
  CANCELLED: 'bg-booked/20 text-booked',
}

const SECTIONS = [
  { status: 'PENDING', title: 'Pending requests' },
  { status: 'CONFIRMED', title: 'Confirmed' },
  { status: 'COMPLETED', title: 'Completed' },
  { status: 'CANCELLED', title: 'Cancelled' },
]

export default function BookingRequests() {
  const [bookings, setBookings] = useState([])
  const [packagesById, setPackagesById] = useState({})
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    setStatus('loading')
    getMyProfile()
      .then((profile) => Promise.all([getMyBookings(profile.id), getMyPackages()]))
      .then(([bookingsData, packagesData]) => {
        setBookings(bookingsData)
        setPackagesById(Object.fromEntries(packagesData.map((pkg) => [pkg.id, pkg])))
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  async function handleStatusChange(booking, nextStatus) {
    setError(null)
    setUpdatingId(booking.id)
    try {
      const updated = await updateBookingStatus(booking.id, nextStatus)
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? updated : b)))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't update that booking. Please try again.")
    } finally {
      setUpdatingId(null)
    }
  }

  if (status === 'loading') {
    return <p className="text-ink-muted">Loading your bookings…</p>
  }

  if (status === 'error') {
    return (
      <p className="text-ink-muted">
        We couldn't load your bookings right now. Please check your connection and try again.
      </p>
    )
  }

  const sorted = [...bookings].sort((a, b) => a.bookingDate.localeCompare(b.bookingDate))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Booking requests</h1>
        <p className="mt-1 text-ink-muted">Accept, reject, and complete your booking requests.</p>
      </div>

      {error && <p className="text-sm text-booked">{error}</p>}

      {bookings.length === 0 && <p className="text-ink-muted">No bookings yet.</p>}

      {SECTIONS.map(({ status: sectionStatus, title }) => {
        const items = sorted.filter((booking) => booking.status === sectionStatus)
        if (items.length === 0) return null

        return (
          <div key={sectionStatus}>
            <h2 className="font-sans text-lg font-semibold text-ink">{title}</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {items.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  pkg={packagesById[booking.packageId]}
                  updating={updatingId === booking.id}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BookingCard({ booking, pkg, updating, onStatusChange }) {
  const { clientName, clientPhone, clientEmail, bookingDate, timeSlot, status: bookingStatus, otpVerified } = booking

  return (
    <div className="rounded-card bg-surface p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-sans text-lg font-semibold text-ink">{clientName}</p>
          {pkg && <p className="text-sm text-ink-muted">{pkg.title}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[bookingStatus]}`}>
          {bookingStatus}
        </span>
      </div>

      <dl className="mt-4 space-y-1 text-sm text-ink-muted">
        <div className="flex gap-1.5">
          <dt>Date:</dt>
          <dd className="text-ink">
            {bookingDate} &middot; {timeSlot}
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Phone:</dt>
          <dd>{clientPhone}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Email:</dt>
          <dd>{clientEmail}</dd>
        </div>
      </dl>

      {bookingStatus === 'PENDING' && !otpVerified && (
        <p className="mt-3 text-sm text-ink-muted">Waiting for the client to verify their phone number.</p>
      )}

      <div className="mt-4 flex gap-4 text-sm">
        {bookingStatus === 'PENDING' && (
          <>
            <button
              type="button"
              disabled={!otpVerified || updating}
              onClick={() => onStatusChange(booking, 'CONFIRMED')}
              className="text-accent underline transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:text-ink-muted disabled:opacity-60"
            >
              Accept
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => onStatusChange(booking, 'CANCELLED')}
              className="text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
            >
              Reject
            </button>
          </>
        )}

        {bookingStatus === 'CONFIRMED' && (
          <>
            <button
              type="button"
              disabled={updating}
              onClick={() => onStatusChange(booking, 'COMPLETED')}
              className="text-accent underline transition-opacity hover:opacity-80 disabled:opacity-60"
            >
              Mark completed
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => onStatusChange(booking, 'CANCELLED')}
              className="text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}
