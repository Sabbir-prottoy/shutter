// The one "Log out" control used across the site, drawn as a small capsule.
export default function LogoutButton({ onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pill-focus inline-flex shrink-0 items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-ink shadow-card transition-colors hover:border-accent hover:bg-accent/20 hover:text-accent ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
      </svg>
      Log out
    </button>
  )
}
