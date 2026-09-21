import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import { triggerClickBurst } from './ClickBurstLayer'

// Each interactive nav item gets its own click animation (pulse / flicker /
// wiggle / bounce / flash / glow) rather than one effect copy-pasted
// everywhere, so clicking around the header doesn't feel repetitive.
const linkBase = 'inline-block text-sm font-medium transition-colors'

const entertainmentLinkClass = ({ isActive }) =>
  `${linkBase} hover:text-accent active:animate-nav-pulse ${isActive ? 'text-accent' : 'text-ink-muted'}`

const findLinkClass = ({ isActive }) =>
  `${linkBase} hover:text-accent active:animate-nav-pulse ${isActive ? 'text-accent' : 'text-ink-muted'}`

const faqLinkClass = ({ isActive }) =>
  `${linkBase} hover:text-accent active:animate-nav-flicker ${isActive ? 'text-accent' : 'text-ink-muted'}`

const adminLinkClass = ({ isActive }) =>
  `${linkBase} hover:text-accent active:animate-nav-wiggle ${isActive ? 'text-accent' : 'text-ink-muted'}`

const loginLinkClass = ({ isActive }) =>
  `${linkBase} text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline active:animate-nav-flash ${isActive ? 'underline' : ''}`

// Not routes — these just open the floating widgets mounted at the app root
// (see ChatWidget/VoiceAgent's "open-*" event listeners), so plain buttons
// rather than NavLinks.
const aiActionClass = `${linkBase} text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline active:animate-nav-wiggle`

const ctaButtonClass =
  'rounded-card bg-accent-gradient px-3 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover active:animate-nav-bounce sm:px-4'

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
    <header className="border-b border-border">
      <div
        onClick={handleHeaderClick}
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-6 sm:py-5"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-display text-xl font-bold text-ink active:animate-nav-bounce"
        >
          <Logo className="h-8 w-8 shrink-0" />
          ShutterShot
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-x-2 gap-y-2 sm:gap-x-4">
          <button
            type="button"
            className={aiActionClass}
            onClick={() => window.dispatchEvent(new CustomEvent('open-voice-agent'))}
          >
            Speak with AI
          </button>

          <button
            type="button"
            className={aiActionClass}
            onClick={() => window.dispatchEvent(new CustomEvent('open-chat-widget'))}
          >
            Chat with AI
          </button>

          <NavLink to="/entertainment" className={entertainmentLinkClass}>
            Entertainment
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
            <Link
              to={ownAreaFor(user?.role)}
              className="rounded-card bg-accent-gradient px-3 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover active:animate-nav-glow sm:px-4"
            >
              {ownAreaLabel(user?.role)}
            </Link>
          ) : (
            <>
              <NavLink to="/admin/login" className={adminLinkClass}>
                Admin portal
              </NavLink>
              <Link to="/register" className={ctaButtonClass}>
                Join<span className="hidden sm:inline"> as photographer</span>
              </Link>
              <NavLink to="/login" className={loginLinkClass}>
                Log in
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
