import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/admin/reviews', label: 'Review Moderation' },
  { to: '/admin/photos', label: 'Photo Moderation' },
  { to: '/admin/users', label: 'User Management' },
]

const desktopLinkClass = ({ isActive }) =>
  `rounded-card px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-surface text-accent shadow-card' : 'text-ink-muted hover:bg-surface-raised hover:text-ink'
  }`

const mobileLinkClass = ({ isActive }) =>
  `whitespace-nowrap text-sm font-medium ${isActive ? 'text-accent' : 'text-ink-muted'}`

export default function AdminLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="hidden w-64 shrink-0 border-r border-border p-6 sm:block">
        <Link to="/" className="font-display text-xl font-bold text-ink">
          ShutterShot
        </Link>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-accent">Admin</p>
        {user?.name && <p className="mt-1 truncate text-sm text-ink-muted">{user.name}</p>}

        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={desktopLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="mt-8 text-sm text-ink-muted underline transition-colors hover:text-accent"
        >
          Log out
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="border-b border-border p-4 sm:hidden">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/" className="font-display text-lg font-bold text-ink">
                ShutterShot
              </Link>
              <p className="text-xs font-medium uppercase tracking-wide text-accent">Admin</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-ink-muted underline transition-colors hover:text-accent"
            >
              Log out
            </button>
          </div>
          <nav className="mt-3 flex gap-4 overflow-x-auto pb-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={mobileLinkClass}>
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
