import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors hover:text-accent ${isActive ? 'text-accent' : 'text-ink-muted'}`

export default function Navbar() {
  const { isAuthenticated, user } = useAuth()

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-6 sm:py-5">
        <Link to="/" className="font-display text-xl font-bold text-ink">
          ShutterShot
        </Link>

        <nav className="flex items-center gap-3 sm:gap-8">
          <span className="hidden sm:inline">
            <NavLink to="/search" className={navLinkClass}>
              Find a photographer
            </NavLink>
          </span>

          {isAuthenticated ? (
            <Link
              to={user?.role === 'ADMIN' ? '/admin' : '/dashboard'}
              className="rounded-card bg-accent-gradient px-3 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover sm:px-4"
            >
              {user?.role === 'ADMIN' ? 'Admin panel' : 'Dashboard'}
            </Link>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Log in
              </NavLink>
              <Link
                to="/register"
                className="rounded-card bg-accent-gradient px-3 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover sm:px-4"
              >
                Join<span className="hidden sm:inline"> as photographer</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
