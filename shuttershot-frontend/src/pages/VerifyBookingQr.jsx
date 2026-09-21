import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { verifyBookingByQr } from '../services/api'

export default function VerifyBookingQr() {
  const { token } = useParams()
  const [status, setStatus] = useState('verifying')
  const [error, setError] = useState(null)

  useEffect(() => {
    verifyBookingByQr(token)
      .then(() => setStatus('verified'))
      .catch((err) => {
        setError(err?.response?.data?.message || 'This verification link is invalid or has expired.')
        setStatus('error')
      })
  }, [token])

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        {status === 'verifying' && <p className="text-ink-muted">Verifying your booking…</p>}

        {status === 'verified' && (
          <div className="rounded-card bg-surface p-8 shadow-card">
            <h1 className="font-display text-2xl font-bold text-ink">Booking verified!</h1>
            <p className="mt-3 text-ink-muted">
              You're all set — you can close this page and continue on your other device.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-card bg-surface p-8 shadow-card">
            <h1 className="font-display text-2xl font-bold text-ink">Couldn't verify booking</h1>
            <p className="mt-3 text-ink-muted">{error}</p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover"
            >
              Back to home
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
