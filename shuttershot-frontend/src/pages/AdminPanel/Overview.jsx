import { useEffect, useState } from 'react'
import BarChart from '../../components/BarChart'
import PieChart from '../../components/PieChart'
import { getAdminOverview } from '../../services/api'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'BDT',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('en-US')

const STATUS_LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

function toChartData(monthlyValues) {
  return monthlyValues.map((v) => ({ label: v.label, value: Number(v.value) }))
}

export default function Overview() {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    getAdminOverview()
      .then((result) => {
        setData(result)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  if (status === 'loading') {
    return <p className="text-ink-muted">Loading overview…</p>
  }

  if (status === 'error' || !data) {
    return (
      <p className="text-ink-muted">
        We couldn't load the overview right now. Please check your connection and try again.
      </p>
    )
  }

  const badgeAdoptionData = [
    { label: 'Has blue badge', value: data.activeBlueBadges, color: '#c15a3a' },
    { label: 'No blue badge', value: Math.max(data.totalPhotographers - data.activeBlueBadges, 0), color: '#6d8fd6' },
  ]

  const topEarnersData = data.topEarners.map((e) => ({ label: e.name, value: Number(e.totalEarned) }))

  const bookingStatusData = Object.entries(data.bookingStatusBreakdown).map(([status_, value]) => ({
    label: STATUS_LABELS[status_] || status_,
    value,
  }))

  const stats = [
    { label: 'Photographers', value: numberFormatter.format(data.totalPhotographers) },
    { label: 'Users', value: numberFormatter.format(data.totalCustomers) },
    { label: 'Active blue badges', value: numberFormatter.format(data.activeBlueBadges) },
    { label: 'Blue badge revenue', value: currencyFormatter.format(data.totalBadgeRevenue) },
    { label: 'Total booking value', value: currencyFormatter.format(data.totalBookingValue) },
    { label: 'Total bookings', value: numberFormatter.format(data.totalBookings) },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Overview</h1>
        <p className="mt-1 text-ink-muted">
          A live snapshot of the platform — updates automatically as photographers, users, bookings,
          and blue badges change.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-card border border-border bg-surface p-4 shadow-card">
            <p className="text-xs text-ink-muted">{stat.label}</p>
            <p className="mt-1 font-display text-xl font-semibold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BarChart
          title="Photographer signups — last 12 months"
          data={toChartData(data.photographerSignups)}
          color="#c15a3a"
        />
        <BarChart
          title="User signups — last 12 months"
          data={toChartData(data.customerSignups)}
          color="#8db5a0"
        />
        <BarChart
          title="Blue badge revenue — last 12 months"
          data={toChartData(data.badgeRevenueByMonth)}
          color="#e8b34f"
          valueFormatter={(v) => currencyFormatter.format(v)}
        />
        {topEarnersData.length > 0 && (
          <BarChart
            title="Top earning photographers"
            data={topEarnersData}
            color="#c15a3a"
            valueFormatter={(v) => currencyFormatter.format(v)}
          />
        )}
        <BarChart title="Bookings by status" data={bookingStatusData} color="#6d8fd6" />
        <PieChart title="Blue badge adoption" data={badgeAdoptionData} />
      </div>
    </div>
  )
}
