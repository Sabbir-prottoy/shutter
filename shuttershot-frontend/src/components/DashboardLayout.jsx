import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyPortfolio, getMyProfile } from '../services/api'
import Footer from './Footer'
import ThemeToggle from './ThemeToggle'
import LogoutButton from './LogoutButton'
import { capsuleLinkClass, mobileCapsuleLinkClass } from './sidebarLinkStyles'

// How often the sidebar's pending-approval count refreshes on its own —
// frequent enough to notice an admin decision without a manual reload,
// without hammering the API.
const PENDING_POLL_MS = 20000

function categoryLabel(category) {
  return category.charAt(0) + category.slice(1).toLowerCase()
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/portfolio', label: 'Portfolio' },
  { to: '/dashboard/calendar', label: 'Calendar' },
  { to: '/dashboard/packages', label: 'Packages' },
  { to: '/dashboard/bookings', label: 'Bookings' },
  { to: '/dashboard/reviews', label: 'Feedback' },
  { to: '/dashboard/profile', label: 'Profile Settings' },
  { to: '/dashboard/verified-badge', label: 'Verified Badge' },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const [pendingImages, setPendingImages] = useState([])
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null)

  // No explicit navigate() here: clearing auth state makes ProtectedRoute's
  // own redirect take over immediately, landing on /login — a race against
  // any navigate('/') call here consistently won, so this embraces that
  // rather than fighting it.
  function handleLogout() {
    logout()
  }

  useEffect(() => {
    let cancelled = false

    function loadSidebarData() {
      getMyPortfolio()
        .then((data) => {
          if (!cancelled) {
            setPendingImages(data.filter((image) => image.verificationStatus === 'PENDING'))
          }
        })
        .catch(() => {
          // Sidebar widget is a convenience, not core navigation — fail quietly.
        })

      // Also picks up a photo uploaded from the Profile Settings page —
      // that page doesn't share state with this persistent layout, so
      // polling is what keeps the sidebar avatar in sync with it.
      getMyProfile()
        .then((data) => {
          if (!cancelled) {
            setProfilePhotoUrl(data.profilePhotoUrl || null)
          }
        })
        .catch(() => {})
    }

    loadSidebarData()
    const interval = setInterval(loadSidebarData, PENDING_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="hidden w-72 shrink-0 border-r border-border p-6 sm:block">
        <Link to="/" className="font-display text-xl font-bold text-ink">
          ShutterShot
        </Link>

        <Link
          to="/dashboard/profile"
          className="mt-4 flex items-center gap-3 rounded-card p-1 transition-colors hover:bg-surface-raised"
        >
          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border bg-surface-raised">
            {profilePhotoUrl && (
              <img src={profilePhotoUrl} alt="Profile" className="h-full w-full object-cover" />
            )}
          </span>
          {user?.name && <span className="truncate text-sm text-ink-muted">{user.name}</span>}
        </Link>

        <nav className="mt-8 flex flex-col gap-2">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={capsuleLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 rounded-card border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">Pending approval</h2>
            <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
              {pendingImages.length}
            </span>
          </div>

          {pendingImages.length === 0 ? (
            <p className="mt-2 text-xs text-ink-muted">Nothing waiting right now.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {pendingImages.map((image) => (
                <li key={image.id} className="flex items-center gap-2">
                  <img
                    src={image.imageUrl}
                    alt={image.category}
                    className="h-10 w-10 shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-ink">
                      {categoryLabel(image.category)}
                    </p>
                    <p className="text-[11px] text-ink-muted">Waiting for admin review</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <LogoutButton onClick={handleLogout} className="mt-8" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border p-4 sm:hidden">
          <div className="flex items-center justify-between">
            <Link to="/" className="font-display text-lg font-bold text-ink">
              ShutterShot
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <LogoutButton onClick={handleLogout} />
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={mobileCapsuleLinkClass}>
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
