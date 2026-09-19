import { useState } from 'react'

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 1 11s4 7 11 7a9.14 9.14 0 0 0 5.39-1.61M2 2l20 20" />
      <path d="M9.53 9.53A3 3 0 0 0 12 15a3 3 0 0 0 2.47-1.3" />
    </svg>
  )
}

// Masked by default — a password is only ever revealed by explicitly
// clicking the eye icon, per instance, rather than shown outright.
export default function PasswordField({ password, fallback = 'Changed by user' }) {
  const [visible, setVisible] = useState(false)

  if (!password) {
    return <span className="italic text-ink-muted">{fallback}</span>
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className="truncate font-mono">{visible ? password : '••••••••••••'}</span>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="shrink-0 text-ink-muted transition-colors hover:text-accent"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </span>
  )
}
