import { Link, NavLink } from 'react-router-dom'

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors hover:text-accent ${isActive ? 'text-accent' : 'text-ink-muted'}`

export default function Navbar() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="font-display text-xl font-bold text-ink">
          ShutterShot
        </Link>

        <nav className="flex items-center gap-8">
          <NavLink to="/search" className={navLinkClass}>
            Find a photographer
          </NavLink>
          <NavLink to="/login" className={navLinkClass}>
            Log in
          </NavLink>
          <Link
            to="/register"
            className="rounded-card bg-accent-gradient px-4 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
          >
            Join as photographer
          </Link>
        </nav>
      </div>
    </header>
  )
}
