import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { loginRequest } from '../services/api'
import { triggerClickBurst } from '../components/ClickBurstLayer'

export default function AdminLogin() {
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
      if (result.role !== 'ADMIN' && result.role !== 'MODERATOR') {
        setError('This portal is for admin and moderator accounts only.')
        return
      }
      login(result)
      navigate(location.state?.from?.pathname || '/admin', { replace: true })
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
        <h1 className="font-display text-3xl font-bold text-ink">Admin portal</h1>
        <p className="mt-2 text-ink-muted">Sign in with your admin credentials to manage the platform.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Admin email address"
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

          <p className="text-right text-sm">
            <Link to="/forgot-password?portal=admin" className="text-accent underline">
              Forgot password?
            </Link>
          </p>

          {error && <p className="text-sm text-booked">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            onClick={(event) => triggerClickBurst(event.currentTarget)}
            className="w-full rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-muted">
          Not an admin?{' '}
          <Link to="/login" className="text-accent underline">
            Log in as a photographer
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  )
}
