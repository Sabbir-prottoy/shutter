import { Suspense } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MAIN_ADMIN_EMAIL } from '../constants'
import Footer from './Footer'
import ThemeToggle from './ThemeToggle'
import LogoutButton from './LogoutButton'
import { capsuleLinkClass, mobileCapsuleLinkClass } from './sidebarLinkStyles'

// Overview is a read-only dashboard — kept at the top of the sidebar, but
// still open to any ADMIN/MODERATOR like the other day-to-day tools below it.
const BASE_NAV_ITEMS = [
  { to: '/admin/overview', label: 'Overview' },
  { to: '/admin/reviews', label: 'Review Moderation' },
  { to: '/admin/photos', label: 'Photo Moderation' },
  { to: '/admin/poses', label: 'Manage pose' },
  { to: '/admin/users', label: 'User Management' },
]

// Adding or removing staff accounts, and blue-badge pricing/holders, are
// exclusively the main admin's power — kept out of the sidebar entirely for
// everyone else, including other admins, rather than shown and then rejected.
const MAIN_ADMIN_ONLY_NAV_ITEMS = [
  { to: '/admin/manage-admins', label: 'Manage Admin' },
  { to: '/admin/manage-moderators', label: 'Manage Moderator' },
  { to: '/admin/photographer-history', label: 'Photographers Profile History' },
  { to: '/admin/user-history', label: 'Users Profile History' },
  { to: '/admin/blue-badge', label: 'Blue Badge Management' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const isMainAdmin = user?.email?.toLowerCase() === MAIN_ADMIN_EMAIL
  const navItems = isMainAdmin ? [...BASE_NAV_ITEMS, ...MAIN_ADMIN_ONLY_NAV_ITEMS] : BASE_NAV_ITEMS

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="hidden w-72 shrink-0 border-r border-border p-6 sm:block">
        <Link to="/" className="font-display text-xl font-bold text-ink">
          ShutterShot
        </Link>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-accent">
          {user?.role === 'MODERATOR' ? 'Moderator' : 'Admin'}
        </p>
        {user?.name && <p className="mt-1 truncate text-sm text-ink-muted">{user.name}</p>}

        <nav className="mt-8 flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={capsuleLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <LogoutButton onClick={logout} className="mt-8" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border p-4 sm:hidden">
          <div className="flex items-center justify-between">
            <div>
              <Link to="/" className="font-display text-lg font-bold text-ink">
                ShutterShot
              </Link>
              <p className="text-xs font-medium uppercase tracking-wide text-accent">
                {user?.role === 'MODERATOR' ? 'Moderator' : 'Admin'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <LogoutButton onClick={logout} />
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={mobileCapsuleLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Desktop has no top bar of its own, so this carries the theme
            toggle in the content area's top-right corner. */}
        <div className="hidden justify-end px-10 pt-6 sm:flex">
          <ThemeToggle />
        </div>

        <main className="flex-1 p-6 sm:px-10 sm:pb-10 sm:pt-4">
          <Suspense fallback={<p className="text-ink-muted">Loading…</p>}>
            <Outlet />
          </Suspense>
        </main>

        <Footer />
      </div>
    </div>
  )
}
