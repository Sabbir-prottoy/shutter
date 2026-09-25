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
const linkBase = 'inline-block whitespace-nowrap text-base font-medium transition-colors'

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
  'whitespace-nowrap rounded-card bg-accent-gradient px-3 py-1.5 text-base font-medium text-white shadow-card transition-shadow hover:shadow-hover active:animate-nav-bounce'

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

export default function Navbar() {
  const { isAuthenticated, user } = useAuth()

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-[30px]">
      {/* Brand and theme toggle sit outside the pill, at the two ends of the
          row. Laid out with flexbox rather than pinned to the corners, so the
          pill can never grow into either of them at any width. The toggle's
          centre lands 52px from the right edge, lining it up with the chat
          and voice buttons in the bottom-right corner. */}
      <div
        onClick={handleHeaderClick}
        className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2"
      >
        <Link
          to="/"
          className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap font-display text-3xl font-bold text-ink active:animate-nav-bounce"
        >
          <Logo className="h-12 w-12 shrink-0" />
          ShutterShot
        </Link>

        {/* Deliberately not forced to a single line: each label already has
            whitespace-nowrap so nothing breaks mid-phrase, and letting the row
            wrap when it genuinely runs out of width fails far better than
            nowrap, which would push the links outside the capsule. */}
        <nav className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1.5 rounded-full border border-border bg-surface/90 px-4 py-2.5 shadow-hover backdrop-blur sm:gap-x-2.5">
            {/* A button rather than a bare svg so the header's click-burst
                delegation (which matches `a, button`) picks it up. */}
            <button
              type="button"
              aria-label="AI features"
              title="AI features"
              className="inline-flex shrink-0 items-center rounded-full transition-transform hover:scale-110 active:animate-nav-pulse"
            >
              <AiSparkIcon className="h-5 w-5" />
            </button>

            {/* Opens the full spoken-chat page rather than the floating
                widget, which is still reachable from its own button. */}
            <NavLink to="/speak" className={aiActionClass}>
              Speak with AI
            </NavLink>

            {/* Opens the full chat page rather than the floating widget — the
                widget is still reachable from its own button. */}
            <NavLink to="/chat" className={aiActionClass}>
              Chat with AI
            </NavLink>

            <NavLink to="/suggestions" className={suggestionsLinkClass}>
              Suggestions
            </NavLink>

            <span className="hidden sm:inline">
              <NavLink to="/search" className={findLinkClass}>
                Find a photographer
              </NavLink>
            </span>

            <NavLink to="/faq" className={faqLinkClass}>
              FAQs
            </NavLink>

            {isAuthenticated ? (
              <>
              <CartLink />
              <Link
                to={ownAreaFor(user?.role)}
                className="rounded-card bg-accent-gradient px-3 py-1.5 text-base font-medium text-white shadow-card transition-shadow hover:shadow-hover active:animate-nav-glow"
              >
                {ownAreaLabel(user?.role)}
              </Link>
              </>
            ) : (
              <>
                <NavLink to="/admin/login" className={adminLinkClass}>
                  Admin portal
                </NavLink>
                <Link to="/register" className={ctaButtonClass}>
                  Join<span className="hidden sm:inline"> as photographer</span>
                </Link>
                <CartLink />
                <NavLink to="/login" className={loginLinkClass}>
                  Log in
                </NavLink>
              </>
            )}
        </nav>

        <ThemeToggle className="h-11 w-11 bg-surface/90 shadow-card backdrop-blur" />
      </div>
    </header>
  )
}
