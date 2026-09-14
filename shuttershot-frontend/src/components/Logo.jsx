export default function Logo({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="shuttershot-logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c15a3a" />
          <stop offset="100%" stopColor="#d9825e" />
        </linearGradient>
      </defs>

      {/* Viewfinder bump */}
      <rect x="11" y="5" width="10" height="6" rx="2" fill="url(#shuttershot-logo-gradient)" />
      {/* Camera body */}
      <rect x="2" y="10" width="28" height="18" rx="4" fill="url(#shuttershot-logo-gradient)" />
      {/* Shutter-release button */}
      <rect x="24" y="14" width="4" height="3" rx="1" fill="#fbf7f0" opacity="0.9" />

      {/* Lens */}
      <circle cx="16" cy="19" r="7.5" fill="#1e1b16" />
      <circle cx="16" cy="19" r="5.5" fill="url(#shuttershot-logo-gradient)" />
      <circle cx="16" cy="19" r="2.6" fill="#1e1b16" />
      <circle cx="14" cy="17" r="1" fill="#ffffff" opacity="0.75" />
    </svg>
  )
}
