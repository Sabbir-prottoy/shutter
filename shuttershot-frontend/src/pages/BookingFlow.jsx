import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AvailabilityCalendar from '../components/AvailabilityCalendar'
import OtpInput from '../components/OtpInput'
import {
  confirmBookingOtp,
  createBooking,
  getPhotographer,
  getPhotographerPackages,
  resendOtp,
} from '../services/api'

const TIME_SLOTS = ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00']

const STEPS = [
  { key: 'details', label: 'Details' },
  { key: 'otp', label: 'Verify' },
  { key: 'confirmation', label: 'Confirmed' },
]

export default function BookingFlow() {
  const { photographerId } = useParams()
  const [searchParams] = useSearchParams()

  const [profile, setProfile] = useState(null)
  const [packages, setPackages] = useState([])
  const [pageStatus, setPageStatus] = useState('loading')

  const [step, setStep] = useState('details')
  const [selectedPackageId, setSelectedPackageId] = useState(searchParams.get('package') || '')
  const [selectedDate, setSelectedDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [booking, setBooking] = useState(null)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState(null)
  const [otpSubmitting, setOtpSubmitting] = useState(false)
  const [resendStatus, setResendStatus] = useState('idle')

  useEffect(() => {
    let cancelled = false
    setPageStatus('loading')

    Promise.all([getPhotographer(photographerId), getPhotographerPackages(photographerId)])
      .then(([profileData, packagesData]) => {
        if (cancelled) return
        setProfile(profileData)
        setPackages(packagesData)
        setPageStatus('ready')
      })
      .catch((error) => {
        if (cancelled) return
        setPageStatus(error?.response?.status === 404 ? 'not-found' : 'error')
      })

    return () => {
      cancelled = true
    }
  }, [photographerId])

  async function handleSubmitDetails(event) {
    event.preventDefault()
    setFormError(null)

    if (!selectedPackageId || !selectedDate || !timeSlot || !clientName || !clientPhone || !clientEmail) {
      setFormError('Please fill in every field before continuing.')
      return
    }

    setSubmitting(true)
    try {
      const result = await createBooking({
        photographerId: Number(photographerId),
        packageId: Number(selectedPackageId),
        clientName,
        clientPhone,
        clientEmail,
        bookingDate: selectedDate,
        timeSlot,
      })
      setBooking(result)
      setStep('otp')
    } catch (error) {
      setFormError(
        error?.response?.data?.message ||
          "We couldn't submit your booking. Please check your details and try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmOtp(event) {
    event.preventDefault()
    setOtpError(null)

    if (otpCode.length !== 6) {
      setOtpError('Enter the 6-digit code we sent you.')
      return
    }

    setOtpSubmitting(true)
    try {
      const result = await confirmBookingOtp(booking.id, otpCode)
      setBooking(result)
      setStep('confirmation')
    } catch (error) {
      setOtpError(error?.response?.data?.message || 'Invalid or expired code. Please try again.')
    } finally {
      setOtpSubmitting(false)
    }
  }

  async function handleResend() {
    setResendStatus('sending')
    try {
      await resendOtp(clientPhone)
      setResendStatus('sent')
    } catch {
      setResendStatus('idle')
    }
  }

  if (pageStatus === 'loading') {
    return (
      <PageShell>
        <p className="text-ink-muted">Loading…</p>
      </PageShell>
    )
  }

  if (pageStatus === 'not-found') {
    return (
      <PageShell>
        <h1 className="font-display text-3xl font-bold text-ink">Photographer not found</h1>
        <p className="mt-3 text-ink-muted">This photographer may have moved or no longer exists.</p>
        <Link
          to="/search"
          className="mt-6 inline-block rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover"
        >
          Find a photographer
        </Link>
      </PageShell>
    )
  }

  if (pageStatus === 'error') {
    return (
      <PageShell>
        <p className="text-ink-muted">
          We couldn't load this page right now. Please check your connection and try again.
        </p>
      </PageShell>
    )
  }

  if (packages.length === 0) {
    return (
      <PageShell>
        <h1 className="font-display text-3xl font-bold text-ink">No packages available</h1>
        <p className="mt-3 text-ink-muted">
          {profile.name} doesn't have any bookable packages yet. Please check back soon.
        </p>
        <Link
          to={`/photographers/${photographerId}`}
          className="mt-6 inline-block rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover"
        >
          Back to profile
        </Link>
      </PageShell>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:px-12">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Book {profile.name}
        </h1>

        <StepIndicator currentStep={step} />

        {step === 'details' && (
          <form onSubmit={handleSubmitDetails} className="mt-8 space-y-8">
            <div>
              <h2 className="font-sans text-lg font-semibold text-ink">Package</h2>
              <div className="mt-3 space-y-3">
                {packages.map((pkg) => (
                  <label
                    key={pkg.id}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-card border p-4 transition-colors ${
                      String(pkg.id) === selectedPackageId
                        ? 'border-accent bg-surface-raised'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-ink">{pkg.title}</p>
                      <p className="text-sm text-ink-muted">
                        {pkg.durationHours}h session &middot; delivery in {pkg.deliveryDays}d
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-lg font-bold text-accent">
                        ${Number(pkg.price).toLocaleString()}
                      </span>
                      <input
                        type="radio"
                        name="package"
                        value={pkg.id}
                        checked={String(pkg.id) === selectedPackageId}
                        onChange={() => setSelectedPackageId(String(pkg.id))}
                        className="h-4 w-4 accent-accent"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-sans text-lg font-semibold text-ink">Date</h2>
              <div className="mt-3 max-w-sm">
                <AvailabilityCalendar
                  photographerId={photographerId}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              </div>
            </div>

            <div>
              <h2 className="font-sans text-lg font-semibold text-ink">Time slot</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeSlot(slot)}
                    className={`rounded-card border px-4 py-2 text-sm transition-colors ${
                      timeSlot === slot
                        ? 'border-accent bg-surface-raised text-ink'
                        : 'border-border bg-surface text-ink-muted hover:text-ink'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-sans text-lg font-semibold text-ink">Your details</h2>
              <div className="mt-3 space-y-3">
                <input
                  type="text"
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
                />
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(event) => setClientPhone(event.target.value)}
                  placeholder="Phone number"
                  className="w-full rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
                />
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(event) => setClientEmail(event.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
                />
              </div>
            </div>

            {formError && <p className="text-sm text-booked">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleConfirmOtp} className="mt-8 space-y-6">
            <p className="text-ink-muted">
              We sent a 6-digit verification code to <span className="text-ink">{clientPhone}</span>.
              Enter it below to confirm your request.
            </p>

            <OtpInput onChange={setOtpCode} />

            {otpError && <p className="text-sm text-booked">{otpError}</p>}

            <button
              type="submit"
              disabled={otpSubmitting}
              className="w-full rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60 sm:w-auto"
            >
              {otpSubmitting ? 'Verifying…' : 'Verify code'}
            </button>

            <div>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendStatus === 'sending'}
                className="text-sm text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
              >
                {resendStatus === 'sent' ? 'Code resent' : resendStatus === 'sending' ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        {step === 'confirmation' && booking && (
          <div className="mt-8 rounded-card bg-surface p-8 shadow-card">
            <h2 className="font-display text-2xl font-bold text-ink">Request sent!</h2>
            <p className="mt-3 text-ink-muted">
              Your booking request has been sent to {profile.name}. They'll confirm your session
              shortly — we'll be in touch at {booking.clientEmail}.
            </p>

            <dl className="mt-6 space-y-2 border-t border-border pt-6 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Date</dt>
                <dd className="text-ink">{booking.bookingDate}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Time</dt>
                <dd className="text-ink">{booking.timeSlot}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Status</dt>
                <dd className="text-ink">Pending confirmation</dd>
              </div>
            </dl>

            <Link
              to={`/photographers/${photographerId}`}
              className="mt-6 inline-block rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover"
            >
              Back to profile
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

function StepIndicator({ currentStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)

  return (
    <div className="mt-6 flex items-center gap-2 text-sm">
      {STEPS.map((s, index) => (
        <div key={s.key} className="flex items-center gap-2">
          <span
            className={
              index <= currentIndex ? 'font-medium text-accent' : 'text-ink-muted'
            }
          >
            {s.label}
          </span>
          {index < STEPS.length - 1 && <span className="text-border">&rarr;</span>}
        </div>
      ))}
    </div>
  )
}

function PageShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 text-center">
        {children}
      </main>
      <Footer />
    </div>
  )
}
