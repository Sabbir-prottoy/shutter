import { Link } from 'react-router-dom'

const LINK_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Browse photographers', to: '/search' },
      { label: 'Suggestions', to: '/suggestions' },
      { label: 'For photographers', to: '/register' },
      { label: 'Join as a customer', to: '/register/user' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQs', to: '/faq' },
      { label: 'Log in', to: '/login' },
      { label: 'Admin portal', to: '/admin/login' },
    ],
  },
]

// Placeholder hrefs — this project has no real social accounts yet. Swap
// each "#" for the real profile URL once one exists.
const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: '#',
    icon: (
      <path d="M14 9h2V6h-2c-1.66 0-3 1.34-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14V9.5c0-.28.22-.5.5-.5H14z" />
    ),
  },
  {
    label: 'Instagram',
    href: '#',
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="3.3" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16.2" cy="7.8" r="0.9" />
      </>
    ),
  },
  {
    label: 'X (Twitter)',
    href: '#',
    icon: <path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
  },
  {
    label: 'YouTube',
    href: '#',
    icon: (
      <>
        <rect x="3.5" y="6" width="17" height="12" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10.5 9.5l5 2.5-5 2.5z" />
      </>
    ),
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-xl font-bold text-ink">ShutterShot</p>
            <p className="mt-2 max-w-xs text-sm text-ink-muted">
              Bangladesh's marketplace for verified photographers — browse by district and
              style, check live availability, and book in minutes.
            </p>
          </div>

          {LINK_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
                {column.title}
              </p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-ink-muted transition-colors hover:text-accent">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Social</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  title={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink-muted transition-colors hover:border-accent hover:text-accent"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    {social.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-ink-muted">
          <p>&copy; Build by ShutterShot Team and Build with Love❤️. September 2026</p>
        </div>
      </div>
    </footer>
  )
}
