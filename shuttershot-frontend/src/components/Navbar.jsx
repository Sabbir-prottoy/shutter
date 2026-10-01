import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import Logo from './Logo'
import AiSparkIcon from './AiSparkIcon'
import ThemeToggle from './ThemeToggle'
import { triggerClickBurst } from './ClickBurstLayer'

// Each interactive nav item gets its own click animation (pulse / flicker /
// wiggle / bounce / flash / glow) rather than one effect copy-pasted
// everywhere, so clicking around the header doesn't feel repetitive.
const linkBase = 'inline-block whitespace-nowrap text-sm font-medium transition-colors'

const suggestionsLinkClass = ({ isActive }) =>
  `${linkBase} hover:text-accent active:animate-nav-pulse ${isActive ? 'text-accent' : 'text-ink-muted'}`

// Accent-coloured and a touch bolder than its neighbours: it's the site's main
// action, so it should read at a glance. Underlined while on its own page.
const findLinkClass = ({ isActive }) =>
  `${linkBase} font-semibold text-accent underline-offset-4 hover:underline active:animate-nav-pulse ${isActive ? 'underline' : ''}`

const faqLinkClass = ({ isActive }) =>
  `${linkBase} hover:text-accent active:animate-nav-flicker ${isActive ? 'text-accent' : 'text-ink-muted'}`

const adminLinkClass = ({ isActive }) =>
  `${linkBase} hover:text-accent active:animate-nav-wiggle ${isActive ? 'text-accent' : 'text-ink-muted'}`

const loginLinkClass = ({ isActive }) =>
  `${linkBase} text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline active:animate-nav-flash ${isActive ? 'underline' : ''}`

// The two AI entries are their own pages (/speak and /chat). The floating
// widgets still exist and are opened from their own buttons at the corner.
const aiActionClass = `${linkBase} text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline active:animate-nav-wiggle`

const ctaButtonClass =
  'whitespace-nowrap rounded-card bg-accent-gradient px-3 py-1.5 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover active:animate-nav-bounce'

// The cart icon opens the Accessories Marketplace; the badge counts what is in the cart.
// Already inside the marketplace, it opens the cart in place instead of reloading the
// page, so the shopper keeps their scroll position, filters and loaded products.
function CartLink() {
  const { count, openCart } = useCart()
  const { pathname } = useLocation()
  const label = count > 0 ? `Accessories Marketplace, ${count} in cart` : 'Accessories Marketplace'

  function handleClick(event) {
    if (pathname === '/marketplace') {
      event.preventDefault()
      openCart()
    }
  }

  return (
    <NavLink
      to="/marketplace"
      onClick={handleClick}
      aria-label={label}
      title="Accessories Marketplace"
      className={({ isActive }) =>
        `relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors active:animate-nav-bounce ${
          isActive
            ? 'border-transparent bg-accent-gradient text-white shadow-card'
            : 'border-border bg-surface text-ink-muted hover:border-accent hover:text-accent'
        }`
      }
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2.2l2.2 11h9.4l2-8H6.3" />
        <circle cx="9.5" cy="19.5" r="1.4" />
        <circle cx="16.5" cy="19.5" r="1.4" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-gradient px-1 text-[10px] font-semibold leading-none text-white shadow-card">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </NavLink>
  )
}

function ownAreaFor(role) {
  if (role === 'ADMIN' || role === 'MODERATOR') return '/admin'
  if (role === 'CUSTOMER') return '/account'
  return '/dashboard'
}

function ownAreaLabel(role) {
  if (role === 'ADMIN') return 'Admin panel'
  if (role === 'MODERATOR') return 'Moderator panel'
  if (role === 'CUSTOMER') return 'My account'
  return 'Dashboard'
}

// Delegated at the header level rather than per-link, so the burst applies
// to the logo and every nav item automatically — including any added later
// without needing to remember to wire it up on each new one individually.
function handleHeaderClick(event) {
  const target = event.target.closest('a, button')
  if (target) {
    triggerClickBurst(target)
  }
}

// The items shared by the full desktop pill (lg and up) and the mobile
// dropdown panel (below lg) — kept in one place so the two surfaces can
// never drift apart. `onNavigate` closes the mobile panel after a tap;
// it's a no-op on the desktop pill.
function NavItems({ isAuthenticated, user, onNavigate }) {
  return (
    <>
      {/* A button rather than a bare svg so the header's click-burst
          delegation (which matches `a, button`) picks it up. */}
      <button
        type="button"
        aria-label="AI features"
        title="AI features"
        className="inline-flex shrink-0 items-center rounded-full transition-transform hover:scale-110 active:animate-nav-pulse"
      >
        <AiSparkIcon className="h-[18px] w-[18px]" />
      </button>

      {/* Opens the full spoken-chat page rather than the floating
          widget, which is still reachable from its own button. */}
      <NavLink to="/speak" className={aiActionClass} onClick={onNavigate}>
        Speak with AI
      </NavLink>

      {/* Opens the full chat page rather than the floating widget — the
          widget is still reachable from its own button. */}
      <NavLink to="/chat" className={aiActionClass} onClick={onNavigate}>
        Chat with AI
      </NavLink>

      <NavLink to="/suggestions" className={suggestionsLinkClass} onClick={onNavigate}>
        Suggestions
      </NavLink>

      <NavLink to="/search" className={findLinkClass} onClick={onNavigate}>
        Find a photographer
      </NavLink>

      <NavLink to="/faq" className={faqLinkClass} onClick={onNavigate}>
        FAQs
      </NavLink>

      {isAuthenticated ? (
        <>
          <CartLink />
          <Link
            to={ownAreaFor(user?.role)}
            onClick={onNavigate}
            className="rounded-card bg-accent-gradient px-3 py-1.5 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover active:animate-nav-glow"
          >
            {ownAreaLabel(user?.role)}
          </Link>
        </>
      ) : (
        <>
          <NavLink to="/admin/login" className={adminLinkClass} onClick={onNavigate}>
            Admin portal
          </NavLink>
          <Link to="/register" onClick={onNavigate} className={ctaButtonClass}>
            Join as photographer
          </Link>
          <CartLink />
          <NavLink to="/login" className={loginLinkClass} onClick={onNavigate}>
            Log in
          </NavLink>
        </>
      )}
    </>
  )
}

export default function Navbar() {
  const { isAuthenticated, user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header onClick={handleHeaderClick} className="sticky top-0 z-40 px-4 pt-4 sm:px-[30px]">
      {/* Brand, cart, menu toggle and theme toggle stay on one line at every
          width. The full link list only ever renders inline from `lg` up,
          where it genuinely has room; below that it lives in the dropdown
          panel opened by the toggle, instead of wrapping into a ragged
          multi-line mess inside the pill. */}
      <div className="flex items-center justify-between gap-x-3">
        <Link
          to="/"
          className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap font-display text-3xl font-bold text-ink active:animate-nav-bounce"
        >
          <Logo className="h-12 w-12 shrink-0" />
          ShutterShot
        </Link>

        {/* Slim and compact so it stays on one line as far down as possible;
            below that it wraps cleanly rather than overlapping, down to
            900px — below that the dropdown menu takes over instead. */}
        <nav className="hidden min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-2 rounded-full border border-border bg-surface/90 px-4 py-3 shadow-hover backdrop-blur min-[900px]:flex">
          <NavItems isAuthenticated={isAuthenticated} user={user} />
        </nav>

        <div className="flex shrink-0 items-center gap-2 min-[900px]:hidden">
          <CartLink />
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink-muted transition-colors hover:border-accent hover:text-accent"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>

        <ThemeToggle className="h-11 w-11 bg-surface/90 shadow-card backdrop-blur" />
      </div>

      {menuOpen && (
        <>
          {/* Click-outside-to-close, same pattern used for the portfolio
              manager's card menu. */}
          <div className="fixed inset-0 z-40 min-[900px]:hidden" onClick={() => setMenuOpen(false)} />
          <div className="relative z-50 mt-3 flex flex-col items-start gap-3 rounded-card border border-border bg-surface/95 p-5 shadow-hover backdrop-blur min-[900px]:hidden">
            <NavItems isAuthenticated={isAuthenticated} user={user} onNavigate={() => setMenuOpen(false)} />
          </div>
        </>
      )}
    </header>
  )
}
