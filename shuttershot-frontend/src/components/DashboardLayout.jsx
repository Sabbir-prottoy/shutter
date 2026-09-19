import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/portfolio', label: 'Portfolio' },
  { to: '/dashboard/calendar', label: 'Calendar' },
  { to: '/dashboard/packages', label: 'Packages' },
  { to: '/dashboard/bookings', label: 'Bookings' },
]

const desktopLinkClass = ({ isActive }) =>
  `rounded-card px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-surface text-accent shadow-card' : 'text-ink-muted hover:bg-surface-raised hover:text-ink'
  }`

const mobileLinkClass = ({ isActive }) =>
  `whitespace-nowrap text-sm font-medium ${isActive ? 'text-accent' : 'text-ink-muted'}`

export default function DashboardLayout() {
  const { user, logout } = useAuth()

  // No explicit navigate() here: clearing auth state makes ProtectedRoute's
  // own redirect take over immediately, landing on /login — a race against
  // any navigate('/') call here consistently won, so this embraces that
  // rather than fighting it.
  function handleLogout() {
    logout()
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="hidden w-64 shrink-0 border-r border-border p-6 sm:block">
        <Link to="/" className="font-display text-xl font-bold text-ink">
          ShutterShot
        </Link>
        {user?.name && <p className="mt-1 truncate text-sm text-ink-muted">{user.name}</p>}

        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={desktopLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 text-sm text-ink-muted underline transition-colors hover:text-accent"
        >
          Log out
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="border-b border-border p-4 sm:hidden">
          <div className="flex items-center justify-between">
            <Link to="/" className="font-display text-lg font-bold text-ink">
              ShutterShot
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-ink-muted underline transition-colors hover:text-accent"
            >
              Log out
            </button>
          </div>
          <nav className="mt-3 flex gap-4 overflow-x-auto pb-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={mobileLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <main className="p-6 sm:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
