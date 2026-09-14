import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { forgotPasswordRequest } from '../services/api'

export default function ForgotPassword() {
  const [searchParams] = useSearchParams()
  const isAdmin = searchParams.get('portal') === 'admin'
  const loginPath = isAdmin ? '/admin/login' : '/login'

  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await forgotPasswordRequest({ email })
      setSubmitted(true)
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-ink">Reset your password</h1>

        {submitted ? (
          <>
            <p className="mt-4 text-ink-muted">
              If an account exists for <span className="text-ink">{email}</span>, we've sent a link to
              reset the password. Check your inbox — the link expires in 30 minutes.
            </p>
            <p className="mt-6 text-sm text-ink-muted">
              <Link to={loginPath} className="text-accent underline">
                Back to log in
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-ink-muted">
              Enter the email on your account and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="w-full rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
              />

              {error && <p className="text-sm text-booked">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
              >
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className="mt-6 text-sm text-ink-muted">
              <Link to={loginPath} className="text-accent underline">
                Back to log in
              </Link>
            </p>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
