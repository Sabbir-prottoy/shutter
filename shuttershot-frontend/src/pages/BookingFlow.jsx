import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AvailabilityCalendar from '../components/AvailabilityCalendar'
import OtpInput from '../components/OtpInput'
import RatingForm from '../components/RatingForm'
import { triggerClickBurst } from '../components/ClickBurstLayer'
import { useAuth } from '../context/AuthContext'
import {
  confirmBookingOtp,
  createBooking,
  getBooking,
  getMyAccount,
  getPhotographer,
  getPhotographerPackages,
  initiateBookingDeposit,
  setBookingVerificationMethod,
} from '../services/api'

const TIME_SLOTS = ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00']

const STEPS = [
  { key: 'details', label: 'Details' },
  { key: 'verify', label: 'Verify' },
  { key: 'deposit', label: 'Deposit' },
  { key: 'confirmation', label: 'Confirmed' },
]

const VERIFICATION_METHODS = [
  {
    key: 'PHONE_OTP',
    label: 'Phone OTP',
    description: 'Get a 6-digit code by text message to your phone number.',
  },
  {
    key: 'EMAIL_OTP',
    label: 'Email OTP',
    description: 'Get a 6-digit code by email instead.',
  },
  {
    key: 'QR_CODE',
    label: 'QR code',
    description: "Scan a QR code shown on the photographer's screen when you meet in person.",
  },
  {
    key: 'TOTP',
    label: 'Google Authenticator',
    description: 'Scan a QR code with an authenticator app and enter the rotating code it shows.',
  },
]

const VERIFICATION_METHOD_LABELS = Object.fromEntries(VERIFICATION_METHODS.map((m) => [m.key, m.label]))

const BOOKING_STATUS_LABELS = {
  PENDING: 'Pending confirmation',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const DEPOSIT_BANNERS = {
  failed: "Payment couldn't be verified, so the deposit wasn't recorded. You haven't been charged by us — please try again.",
  cancelled: 'Checkout was cancelled, so no payment was made.',
}

export default function BookingFlow() {
  const { photographerId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()

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
  const [navError, setNavError] = useState(null)

  const [selectedMethod, setSelectedMethod] = useState('PHONE_OTP')
  const [methodError, setMethodError] = useState(null)
  const [methodSubmitting, setMethodSubmitting] = useState(false)
  const [verificationSetup, setVerificationSetup] = useState(null)

  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState(null)
  const [otpSubmitting, setOtpSubmitting] = useState(false)
  const [resendStatus, setResendStatus] = useState('idle')

  const [depositRedirecting, setDepositRedirecting] = useState(false)
  const [depositError, setDepositError] = useState(null)

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

  useEffect(() => {
    if (user?.role !== 'CUSTOMER') return
    let cancelled = false

    getMyAccount()
      .then((account) => {
        if (cancelled) return
        setClientName((current) => current || account.name || '')
        setClientPhone((current) => current || account.phone || '')
        setClientEmail((current) => current || account.email || '')
      })
      .catch(() => {
        // Prefill is a convenience, not required — booking still works
        // with the fields left blank for the user to fill in themselves.
      })

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    const paymentResult = searchParams.get('payment')
    const bookingId = searchParams.get('bookingId')
    if (!paymentResult || !bookingId) return

    // The SSLCommerz redirect is a full page reload, so all in-memory state
    // (including which booking we were on) is gone — reload it from the server.
    getBooking(bookingId)
      .then((result) => {
        setBooking(result)
        setStep(paymentResult === 'success' ? 'confirmation' : 'deposit')
        if (paymentResult !== 'success') {
          setDepositError(DEPOSIT_BANNERS[paymentResult] || DEPOSIT_BANNERS.failed)
        }
      })
      .catch(() => {
        setDepositError(DEPOSIT_BANNERS.failed)
      })
      .finally(() => {
        const next = new URLSearchParams(searchParams)
        next.delete('payment')
        next.delete('bookingId')
        setSearchParams(next, { replace: true })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // QR verification happens on a different device (the photographer shows the
  // code, the customer scans it with their own phone) — there's no code to type
  // in on this screen, so poll for the moment it flips to verified instead.
  useEffect(() => {
    if (step !== 'verify' || booking?.otpVerified || verificationSetup?.method !== 'QR_CODE' || !booking?.id) return

    const interval = setInterval(() => {
      getBooking(booking.id)
        .then((result) => {
          if (result.otpVerified) {
            setBooking(result)
            setStep('deposit')
          }
        })
        .catch(() => {
          // Transient errors just get retried on the next tick.
        })
    }, 4000)

    return () => clearInterval(interval)
  }, [step, verificationSetup, booking?.id, booking?.otpVerified])

  const reachableSteps = {
    details: true,
    verify: Boolean(booking),
    deposit: Boolean(booking?.otpVerified),
    confirmation: Boolean(booking?.depositPaid),
  }

  // The step tabs are real navigation, not just a progress display — clicking
  // an already-reached one refreshes that booking from the server first, so
  // whatever it shows (verified? deposit paid? current status?) is never stale.
  function goToStep(key) {
    if (!reachableSteps[key] || key === step) return
    setNavError(null)

    if (key === 'details' || !booking) {
      setStep(key)
      return
    }

    getBooking(booking.id)
      .then((fresh) => {
        setBooking(fresh)
        setStep(key)
      })
      .catch(() => {
        setNavError("We couldn't refresh this booking. Please try again.")
      })
  }

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
      setStep('verify')
    } catch (error) {
      setFormError(
        error?.response?.data?.message ||
          "We couldn't submit your booking. Please check your details and try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleContinueMethod() {
    setMethodError(null)
    setMethodSubmitting(true)
    try {
      const setup = await setBookingVerificationMethod(booking.id, selectedMethod)
      setVerificationSetup(setup)
      setOtpCode('')
      setOtpError(null)
      setResendStatus('idle')
    } catch (error) {
      setMethodError(error?.response?.data?.message || "We couldn't set that up. Please try again.")
    } finally {
      setMethodSubmitting(false)
    }
  }

  function handleChangeMethod() {
    setOtpCode('')
    setOtpError(null)
    setMethodError(null)
    setVerificationSetup(null)
  }

  async function handleConfirmCode(event) {
    event.preventDefault()
    setOtpError(null)

    if (otpCode.length !== 6) {
      setOtpError('Enter the 6-digit code.')
      return
    }

    setOtpSubmitting(true)
    try {
      const result = await confirmBookingOtp(booking.id, otpCode)
      setBooking(result)
      setStep('deposit')
    } catch (error) {
      setOtpError(error?.response?.data?.message || 'Invalid or expired code. Please try again.')
    } finally {
      setOtpSubmitting(false)
    }
  }

  async function handleResendCode() {
    if (!verificationSetup) return
    setResendStatus('sending')
    try {
      const setup = await setBookingVerificationMethod(booking.id, verificationSetup.method)
      setVerificationSetup(setup)
      setResendStatus('sent')
    } catch {
      setResendStatus('idle')
    }
  }

  async function handlePayDeposit() {
    setDepositError(null)
    setDepositRedirecting(true)
    try {
      const { gatewayUrl } = await initiateBookingDeposit(booking.id)
      window.location.href = gatewayUrl
    } catch (error) {
      setDepositError(error?.response?.data?.message || "We couldn't start checkout. Please try again.")
      setDepositRedirecting(false)
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
          onClick={(event) => triggerClickBurst(event.currentTarget)}
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

        <StepIndicator currentStep={step} reachable={reachableSteps} onNavigate={goToStep} />
        {navError && <p className="mt-3 text-sm text-booked">{navError}</p>}

        {step === 'details' && !booking && (
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
                        ৳{Number(pkg.price).toLocaleString()}
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
              onClick={(event) => triggerClickBurst(event.currentTarget)}
              className="w-full rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'details' && booking && (
          <div className="mt-8 rounded-card bg-surface p-8 shadow-card">
            <h2 className="font-display text-2xl font-bold text-ink">Your request</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Already submitted — these details can't be changed, but here's what was sent.
            </p>

            <dl className="mt-6 space-y-2 border-t border-border pt-6 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Package</dt>
                <dd className="text-ink">{booking.packageTitle}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Date</dt>
                <dd className="text-ink">
                  {booking.bookingDate} &middot; {booking.timeSlot}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Name</dt>
                <dd className="text-ink">{booking.clientName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Phone</dt>
                <dd className="text-ink">{booking.clientPhone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Email</dt>
                <dd className="text-ink">{booking.clientEmail}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={(event) => {
                triggerClickBurst(event.currentTarget)
                goToStep('verify')
              }}
              className="mt-6 rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover"
            >
              Continue
            </button>
          </div>
        )}

        {step === 'verify' && booking && (
          <div className="mt-8 space-y-6">
            {booking.otpVerified ? (
              <div className="rounded-card border border-free/30 bg-free/10 p-6">
                <p className="font-display text-lg font-bold text-ink">Verified</p>
                <p className="mt-2 text-sm text-ink-muted">
                  This booking was verified via{' '}
                  {VERIFICATION_METHOD_LABELS[booking.verificationMethod] || 'your chosen method'}.
                </p>
              </div>
            ) : !verificationSetup ? (
              <>
                <p className="text-ink-muted">Choose how you'd like to verify this booking.</p>

                <div className="space-y-3">
                  {VERIFICATION_METHODS.map((method) => (
                    <label
                      key={method.key}
                      className={`flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors ${
                        selectedMethod === method.key
                          ? 'border-accent bg-surface-raised'
                          : 'border-border bg-surface'
                      }`}
                    >
                      <input
                        type="radio"
                        name="verification-method"
                        value={method.key}
                        checked={selectedMethod === method.key}
                        onChange={() => setSelectedMethod(method.key)}
                        className="mt-1 h-4 w-4 accent-accent"
                      />
                      <div>
                        <p className="font-medium text-ink">{method.label}</p>
                        <p className="text-sm text-ink-muted">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {methodError && <p className="text-sm text-booked">{methodError}</p>}

                <button
                  type="button"
                  onClick={(event) => {
                    triggerClickBurst(event.currentTarget)
                    handleContinueMethod()
                  }}
                  disabled={methodSubmitting}
                  className="w-full rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60 sm:w-auto"
                >
                  {methodSubmitting ? 'Setting up…' : 'Continue'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleChangeMethod}
                  className="text-sm text-ink-muted underline transition-colors hover:text-accent"
                >
                  &larr; Choose a different verification method
                </button>

                {(verificationSetup.method === 'PHONE_OTP' || verificationSetup.method === 'EMAIL_OTP') && (
                  <form onSubmit={handleConfirmCode} className="space-y-6">
                    <p className="text-ink-muted">{verificationSetup.instructions}</p>

                    {verificationSetup.devOtpCode && (
                      <div className="rounded-card border border-accent/30 bg-accent/10 px-4 py-3">
                        <p className="text-sm text-ink-muted">
                          Real delivery isn't guaranteed for this demo, so here's your code directly:
                        </p>
                        <p className="mt-1 font-display text-2xl font-bold tracking-widest text-accent">
                          {verificationSetup.devOtpCode}
                        </p>
                      </div>
                    )}

                    <OtpInput onChange={setOtpCode} />

                    {otpError && <p className="text-sm text-booked">{otpError}</p>}

                    <button
                      type="submit"
                      disabled={otpSubmitting}
                      onClick={(event) => triggerClickBurst(event.currentTarget)}
                      className="w-full rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60 sm:w-auto"
                    >
                      {otpSubmitting ? 'Verifying…' : 'Verify code'}
                    </button>

                    <div>
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendStatus === 'sending'}
                        className="text-sm text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
                      >
                        {resendStatus === 'sent' ? 'Code resent' : resendStatus === 'sending' ? 'Sending…' : 'Resend code'}
                      </button>
                    </div>
                  </form>
                )}

                {verificationSetup.method === 'TOTP' && (
                  <form onSubmit={handleConfirmCode} className="space-y-6">
                    <p className="text-ink-muted">{verificationSetup.instructions}</p>

                    {verificationSetup.totpQrDataUri && (
                      <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface p-6">
                        <img src={verificationSetup.totpQrDataUri} alt="Authenticator enrollment QR code" className="h-48 w-48" />
                        <p className="text-xs text-ink-muted">Can't scan? Enter this key manually:</p>
                        <p className="rounded bg-surface-raised px-3 py-1.5 font-mono text-sm tracking-wider text-ink">
                          {verificationSetup.totpSecret}
                        </p>
                      </div>
                    )}

                    <OtpInput onChange={setOtpCode} />

                    {otpError && <p className="text-sm text-booked">{otpError}</p>}

                    <button
                      type="submit"
                      disabled={otpSubmitting}
                      onClick={(event) => triggerClickBurst(event.currentTarget)}
                      className="w-full rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60 sm:w-auto"
                    >
                      {otpSubmitting ? 'Verifying…' : 'Verify code'}
                    </button>
                  </form>
                )}

                {verificationSetup.method === 'QR_CODE' && (
                  <div className="rounded-card border border-border bg-surface p-6">
                    <p className="text-ink-muted">{verificationSetup.instructions}</p>
                    <p className="mt-4 text-sm text-ink-muted">Waiting for the scan to complete…</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 'deposit' && booking && (
          <div className="mt-8 rounded-card bg-surface p-8 shadow-card">
            {booking.depositPaid ? (
              <>
                <h2 className="font-display text-2xl font-bold text-ink">Deposit paid</h2>
                <p className="mt-3 text-ink-muted">
                  You've already paid the ৳{Number(booking.depositAmount).toLocaleString()} deposit for this
                  booking.
                </p>
                <button
                  type="button"
                  onClick={(event) => {
                    triggerClickBurst(event.currentTarget)
                    goToStep('confirmation')
                  }}
                  className="mt-6 rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover"
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl font-bold text-ink">Pay your deposit</h2>
                <p className="mt-3 text-ink-muted">
                  To confirm your request, pay a 10% deposit now. The rest is settled directly with{' '}
                  {profile.name}.
                </p>

                <div className="mt-6 flex items-center justify-between rounded-card border border-border bg-surface-raised px-4 py-3">
                  <span className="text-sm text-ink-muted">Deposit due (10%)</span>
                  <span className="font-display text-xl font-bold text-ink">
                    ৳{Number(booking.depositAmount).toLocaleString()}
                  </span>
                </div>

                {depositError && <p className="mt-3 text-sm text-booked">{depositError}</p>}

                <button
                  type="button"
                  onClick={(event) => {
                    triggerClickBurst(event.currentTarget)
                    handlePayDeposit()
                  }}
                  disabled={depositRedirecting}
                  className="mt-6 w-full rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60 sm:w-auto"
                >
                  {depositRedirecting ? 'Redirecting to payment…' : `Pay ৳${Number(booking.depositAmount).toLocaleString()} deposit`}
                </button>
                <p className="mt-2 text-xs text-ink-muted">
                  You'll be taken to SSLCommerz's secure checkout to complete payment in BDT.
                </p>
              </>
            )}
          </div>
        )}

        {step === 'confirmation' && booking && (
          <div className="mt-8 rounded-card bg-surface p-8 shadow-card">
            <h2 className="font-display text-2xl font-bold text-ink">
              {booking.status === 'CONFIRMED'
                ? "You're booked!"
                : booking.status === 'COMPLETED'
                  ? 'Session completed'
                  : booking.status === 'CANCELLED'
                    ? 'Booking cancelled'
                    : 'Request sent!'}
            </h2>
            <p className="mt-3 text-ink-muted">
              {booking.status === 'PENDING'
                ? `Your booking request has been sent to ${profile.name}. They'll confirm your session shortly — we'll be in touch at ${booking.clientEmail}.`
                : booking.status === 'CONFIRMED'
                  ? `${profile.name} has confirmed this session.`
                  : booking.status === 'COMPLETED'
                    ? `Your session with ${profile.name} is complete.`
                    : `This booking with ${profile.name} was cancelled.`}
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
                <dt className="text-ink-muted">Deposit paid</dt>
                <dd className="text-ink">৳{Number(booking.depositAmount).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Status</dt>
                <dd className="text-ink">{BOOKING_STATUS_LABELS[booking.status] || booking.status}</dd>
              </div>
            </dl>

            {booking.status === 'COMPLETED' && (
              <div className="mt-6 border-t border-border pt-6">
                {booking.reviewed ? (
                  <p className="text-sm text-ink-muted">
                    <span className="font-medium text-ink">Thanks for your feedback!</span> Your
                    rating has been sent to {profile.name} for approval — it'll appear on their
                    profile once they approve it.
                  </p>
                ) : (
                  <RatingForm
                    bookingId={booking.id}
                    photographerName={profile.name}
                    onSubmitted={() => setBooking((prev) => ({ ...prev, reviewed: true }))}
                  />
                )}
              </div>
            )}

            <Link
              to={`/photographers/${photographerId}`}
              onClick={(event) => triggerClickBurst(event.currentTarget)}
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

function StepIndicator({ currentStep, reachable, onNavigate }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)

  return (
    <div className="mt-6 flex items-center gap-2 text-sm">
      {STEPS.map((s, index) => {
        const isReachable = reachable[s.key]
        const isCurrent = index === currentIndex
        return (
          <div key={s.key} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate(s.key)}
              disabled={!isReachable}
              className={
                isCurrent
                  ? 'font-medium text-accent'
                  : isReachable
                    ? 'text-ink underline decoration-dotted underline-offset-4 transition-colors hover:text-accent'
                    : 'cursor-not-allowed text-ink-muted'
              }
            >
              {s.label}
            </button>
            {index < STEPS.length - 1 && <span className="text-border">&rarr;</span>}
          </div>
        )
      })}
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
