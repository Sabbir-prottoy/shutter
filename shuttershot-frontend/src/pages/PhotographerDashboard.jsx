import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import BarChart from '../components/BarChart'
import { getMyBookings, getMyPackages, getMyProfile } from '../services/api'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Bookings that made it past OTP verification and weren't cancelled — the
// ones that represent real, committed work rather than a request that's
// still pending or fell through.
const EARNED_STATUSES = new Set(['CONFIRMED', 'COMPLETED'])

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'BDT',
  maximumFractionDigits: 0,
})

export default function PhotographerDashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [packagesById, setPackagesById] = useState({})
  const [status, setStatus] = useState('loading')
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    let cancelled = false

    getMyProfile()
      .then((profile) => Promise.all([getMyBookings(profile.id), getMyPackages()]))
      .then(([bookingsData, packagesData]) => {
        if (cancelled) return
        setBookings(bookingsData)
        setPackagesById(Object.fromEntries(packagesData.map((pkg) => [pkg.id, pkg])))
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const earnedBookings = useMemo(
    () => bookings.filter((booking) => EARNED_STATUSES.has(booking.status)),
    [bookings],
  )

  const availableYears = useMemo(() => {
    const years = new Set([new Date().getFullYear()])
    earnedBookings.forEach((booking) => years.add(new Date(booking.bookingDate).getFullYear()))
    return Array.from(years).sort((a, b) => b - a)
  }, [earnedBookings])

  const { confirmedByMonth, earningsByMonth } = useMemo(() => {
    const confirmed = new Array(12).fill(0)
    const earnings = new Array(12).fill(0)

    earnedBookings
      .filter((booking) => new Date(booking.bookingDate).getFullYear() === year)
      .forEach((booking) => {
        const monthIndex = new Date(booking.bookingDate).getMonth()
        confirmed[monthIndex] += 1
        earnings[monthIndex] += Number(packagesById[booking.packageId]?.price || 0)
      })

    return { confirmedByMonth: confirmed, earningsByMonth: earnings }
  }, [earnedBookings, packagesById, year])

  const totalConfirmed = confirmedByMonth.reduce((sum, value) => sum + value, 0)
  const totalEarnings = earningsByMonth.reduce((sum, value) => sum + value, 0)

  const confirmedChartData = MONTH_LABELS.map((label, i) => ({ label, value: confirmedByMonth[i] }))
  const earningsChartData = MONTH_LABELS.map((label, i) => ({ label, value: earningsByMonth[i] }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-1 text-ink-muted">
          Confirmed bookings and earnings update automatically as your bookings change.
        </p>
      </div>

      {status === 'loading' && <p className="text-ink-muted">Loading your overview…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load your overview right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && (
        <>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              className="rounded-card border border-border px-2 py-1 text-sm text-ink-muted transition-colors hover:text-ink"
              aria-label="Previous year"
            >
              &larr;
            </button>
            <span className="font-display text-lg font-bold text-ink">{year}</span>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              disabled={year >= Math.max(...availableYears)}
              className="rounded-card border border-border px-2 py-1 text-sm text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
              aria-label="Next year"
            >
              &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <p className="text-sm text-ink-muted">Confirmed bookings ({year})</p>
              <p className="mt-1 font-sans text-3xl font-semibold text-ink">{totalConfirmed}</p>
            </div>
            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <p className="text-sm text-ink-muted">Earnings ({year})</p>
              <p className="mt-1 font-sans text-3xl font-semibold text-ink">
                {currencyFormatter.format(totalEarnings)}
              </p>
            </div>
          </div>

          {totalConfirmed === 0 && (
            <p className="text-sm text-ink-muted">
              No confirmed bookings yet for {year} — the charts below will fill in as bookings
              are OTP-verified and confirmed.
            </p>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <BarChart
              title={`Confirmed bookings by month — ${year}`}
              data={confirmedChartData}
              color="#c15a3a"
            />
            <BarChart
              title={`Earnings by month — ${year}`}
              data={earningsChartData}
              color="#5c8a71"
              valueFormatter={(value) => currencyFormatter.format(value)}
            />
          </div>
        </>
      )}
    </div>
  )
}
