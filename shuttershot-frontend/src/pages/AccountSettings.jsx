import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProfilePhotoUploader from '../components/ProfilePhotoUploader'
import { useAuth } from '../context/AuthContext'
import { getMyAccount, getMyBookingsAsCustomer, updateMyAccount, uploadAccountPhoto } from '../services/api'

const STATUS_STYLES = {
  PENDING: 'bg-border text-ink-muted',
  CONFIRMED: 'bg-free/20 text-free',
  COMPLETED: 'bg-accent/15 text-accent',
  CANCELLED: 'bg-booked/20 text-booked',
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export default function AccountSettings() {
  const { logout } = useAuth()
  const [account, setAccount] = useState(null)
  const [status, setStatus] = useState('loading')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  const [bookings, setBookings] = useState([])
  const [bookingsStatus, setBookingsStatus] = useState('loading')

  useEffect(() => {
    getMyAccount()
      .then((data) => {
        setAccount(data)
        setName(data.name || '')
        setPhone(data.phone || '')
        setLocation(data.location || '')
        setEmail(data.email || '')
        setStatus('ready')
      })
      .catch(() => setStatus('error'))

    getMyBookingsAsCustomer()
      .then((data) => {
        setBookings(data)
        setBookingsStatus('ready')
      })
      .catch(() => setBookingsStatus('error'))
  }, [])

  async function handlePhotoUpload(file) {
    const updated = await uploadAccountPhoto(file)
    setAccount(updated)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      const updated = await updateMyAccount({ name, phone, location, email })
      setAccount(updated)
      setName(updated.name || '')
      setPhone(updated.phone || '')
      setLocation(updated.location || '')
      setEmail(updated.email || '')
      setSaved(true)
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't save your changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">My account</h1>
            <p className="mt-1 text-ink-muted">Manage your profile photo and contact details.</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="shrink-0 text-sm text-ink-muted underline transition-colors hover:text-accent"
          >
            Log out
          </button>
        </div>

        {status === 'loading' && <p className="mt-8 text-ink-muted">Loading your account…</p>}

        {status === 'error' && (
          <p className="mt-8 text-ink-muted">
            We couldn't load your account right now. Please check your connection and try again.
          </p>
        )}

        {status === 'ready' && (
          <div className="mt-8 max-w-xl space-y-8">
            <ProfilePhotoUploader
              photoUrl={account.profilePhotoUrl}
              onUpload={handlePhotoUpload}
              size="h-28 w-28"
            />

            <form onSubmit={handleSubmit} className="space-y-4 rounded-card bg-surface p-6 shadow-card">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-ink">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Full name"
                  className="mt-1 w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
                />
              </div>

              <div>
                <label htmlFor="phone" className="text-sm font-medium text-ink">
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Phone number"
                  className="mt-1 w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
                />
              </div>

              <div>
                <label htmlFor="location" className="text-sm font-medium text-ink">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="City, area"
                  className="mt-1 w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
                />
              </div>

              <div>
                <label htmlFor="email" className="text-sm font-medium text-ink">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  className="mt-1 w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
                />
                <p className="mt-1 text-xs text-ink-muted">
                  If you change this, use the new address next time you log in.
                </p>
              </div>

              {error && <p className="text-sm text-booked">{error}</p>}
              {saved && <p className="text-sm text-free">Saved.</p>}

              <button
                type="submit"
                disabled={saving}
                className="rounded-card bg-accent-gradient px-6 py-2.5 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>
        )}

        <div className="mt-12">
          <h2 className="font-display text-xl font-bold text-ink">My bookings</h2>
          <p className="mt-1 text-ink-muted">Requests you've made while logged in, and their current status.</p>

          {bookingsStatus === 'loading' && <p className="mt-4 text-ink-muted">Loading your bookings…</p>}

          {bookingsStatus === 'error' && (
            <p className="mt-4 text-ink-muted">
              We couldn't load your bookings right now. Please check your connection and try again.
            </p>
          )}

          {bookingsStatus === 'ready' && bookings.length === 0 && (
            <p className="mt-4 text-ink-muted">
              No bookings yet — once you book a photographer while logged in, it'll show up here.
            </p>
          )}

          {bookingsStatus === 'ready' && bookings.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {bookings.map((booking) => (
                <BookingDetailCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

function BookingDetailCard({ booking }) {
  const {
    photographerName,
    packageTitle,
    packagePrice,
    bookingDate,
    timeSlot,
    status: bookingStatus,
    otpVerified,
  } = booking

  return (
    <div className="rounded-card bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-sans text-lg font-semibold text-ink">{photographerName}</p>
          {packageTitle && (
            <p className="text-sm text-ink-muted">
              {packageTitle}
              {packagePrice != null && ` — ${currencyFormatter.format(packagePrice)}`}
            </p>
          )}
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
      </dl>

      {bookingStatus === 'PENDING' && !otpVerified && (
        <p className="mt-3 text-sm text-ink-muted">Waiting for phone verification to complete.</p>
      )}
    </div>
  )
}
