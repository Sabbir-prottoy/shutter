import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { loginRequest } from '../services/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const result = await loginRequest({ email, password })
      login(result)
      const defaultPath = result.role === 'ADMIN' ? '/admin' : '/dashboard'
      navigate(location.state?.from?.pathname || defaultPath, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-ink">Log in</h1>
        <p className="mt-2 text-ink-muted">Welcome back — manage your bookings and portfolio.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            className="w-full rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
          />

          {error && <p className="text-sm text-booked">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-muted">
          New to ShutterShot?{' '}
          <Link to="/register" className="text-accent underline">
            Join as a photographer
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  )
}
