import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { registerRequest } from '../services/api'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const result = await registerRequest({
        name,
        email,
        password,
        phone: phone || undefined,
        location: location || undefined,
      })
      login(result)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "We couldn't create your account. Please check your details and try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-ink">Join as a photographer</h1>
        <p className="mt-2 text-ink-muted">Create your profile and start getting booked.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full name"
            className="w-full rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
          />
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
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password (min. 8 characters)"
            className="w-full rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
          />
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone number (optional)"
            className="w-full rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
          />
          <input
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Location (optional)"
            className="w-full rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
          />

          {error && <p className="text-sm text-booked">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent underline">
            Log in
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  )
}
