import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { resetPasswordRequest } from '../services/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await resetPasswordRequest({ token, newPassword: password })
      setDone(true)
    } catch (err) {
      setError(err?.response?.data?.message || 'This reset link is invalid or has expired.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-ink">Choose a new password</h1>

        {!token ? (
          <p className="mt-4 text-booked">
            This link is missing its reset token. Please use the link from your email, or{' '}
            <Link to="/forgot-password" className="text-accent underline">
              request a new one
            </Link>
            .
          </p>
        ) : done ? (
          <>
            <p className="mt-4 text-ink-muted">Your password has been updated.</p>
            <p className="mt-6 flex gap-4 text-sm">
              <Link to="/login" className="text-accent underline">
                Log in as photographer
              </Link>
              <Link to="/admin/login" className="text-accent underline">
                Admin portal
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-ink-muted">Enter a new password for your account.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="New password"
                className="w-full rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
              />
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
              />

              {error && <p className="text-sm text-booked">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
              >
                {submitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
