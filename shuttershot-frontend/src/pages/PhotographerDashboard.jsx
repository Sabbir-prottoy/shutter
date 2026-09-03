import { useAuth } from '../context/AuthContext'
import DashboardPlaceholder from '../components/DashboardPlaceholder'

export default function PhotographerDashboard() {
  const { user } = useAuth()

  return (
    <DashboardPlaceholder
      title={`Welcome back${user?.name ? `, ${user.name}` : ''}`}
      description="Your bookings overview and stats are coming soon."
    />
  )
}
