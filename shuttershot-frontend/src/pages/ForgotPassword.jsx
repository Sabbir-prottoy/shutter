import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import OtpInput from '../components/OtpInput'
import { forgotPasswordRequest, resetPasswordRequest, verifyResetOtp } from '../services/api'

export default function ForgotPassword() {
  const [searchParams] = useSearchParams()
  const isAdmin = searchParams.get('portal') === 'admin'
  const loginPath = isAdmin ? '/admin/login' : '/login'

  const [step, setStep] = useState('email')

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState(null)
  const [emailSubmitting, setEmailSubmitting] = useState(false)

  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState(null)
  const [otpSubmitting, setOtpSubmitting] = useState(false)
  const [resendStatus, setResendStatus] = useState('idle')

  const [resetToken, setResetToken] = useState(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState(null)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  async function handleSubmitEmail(event) {
    event.preventDefault()
    setEmailError(null)
    setEmailSubmitting(true)
    try {
      await forgotPasswordRequest({ email })
      setStep('otp')
    } catch (err) {
      setEmailError(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setEmailSubmitting(false)
    }
  }

  async function handleResend() {
    setResendStatus('sending')
    try {
      await forgotPasswordRequest({ email })
      setResendStatus('sent')
    } catch {
      setResendStatus('idle')
    }
  }

  async function handleSubmitOtp(event) {
    event.preventDefault()
    setOtpError(null)

    if (otpCode.length !== 6) {
      setOtpError('Enter the 6-digit code we emailed you.')
      return
    }

    setOtpSubmitting(true)
    try {
      const { resetToken: token } = await verifyResetOtp({ email, otpCode })
      setResetToken(token)
      setStep('password')
    } catch (err) {
      setOtpError(err?.response?.data?.message || 'Invalid or expired code. Please try again.')
    } finally {
      setOtpSubmitting(false)
    }
  }

  async function handleSubmitPassword(event) {
    event.preventDefault()
    setPasswordError(null)

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setPasswordSubmitting(true)
    try {
      await resetPasswordRequest({ token: resetToken, newPassword: password })
      setStep('done')
    } catch (err) {
      setPasswordError(err?.response?.data?.message || 'This reset session is invalid or has expired.')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-ink">Reset your password</h1>

        {step === 'email' && (
          <>
            <p className="mt-2 text-ink-muted">
              Enter the email on your account and we'll email you a verification code.
            </p>

            <form onSubmit={handleSubmitEmail} className="mt-8 space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="w-full rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
              />

              {emailError && <p className="text-sm text-booked">{emailError}</p>}

              <button
                type="submit"
                disabled={emailSubmitting}
                className="w-full rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
              >
                {emailSubmitting ? 'Sending…' : 'Send code'}
              </button>
            </form>

            <p className="mt-6 text-sm text-ink-muted">
              <Link to={loginPath} className="text-accent underline">
                Back to log in
              </Link>
            </p>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="mt-4 text-ink-muted">
              If an account exists for <span className="text-ink">{email}</span>, we've emailed a 6-digit
              code. Enter it below — it expires in 5 minutes.
            </p>

            <form onSubmit={handleSubmitOtp} className="mt-8 space-y-6">
              <OtpInput onChange={setOtpCode} />

              {otpError && <p className="text-sm text-booked">{otpError}</p>}

              <button
                type="submit"
                disabled={otpSubmitting}
                className="w-full rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
              >
                {otpSubmitting ? 'Verifying…' : 'Verify code'}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendStatus === 'sending'}
                className="text-sm text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
              >
                {resendStatus === 'sent' ? 'Code resent' : resendStatus === 'sending' ? 'Sending…' : 'Resend code'}
              </button>
            </form>

            <p className="mt-6 text-sm text-ink-muted">
              <Link to={loginPath} className="text-accent underline">
                Back to log in
              </Link>
            </p>
          </>
        )}

        {step === 'password' && (
          <>
            <p className="mt-2 text-ink-muted">Choose a new password for your account.</p>

            <form onSubmit={handleSubmitPassword} className="mt-8 space-y-4">
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

              {passwordError && <p className="text-sm text-booked">{passwordError}</p>}

              <button
                type="submit"
                disabled={passwordSubmitting}
                className="w-full rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
              >
                {passwordSubmitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </>
        )}

        {step === 'done' && (
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
        )}
      </main>

      <Footer />
    </div>
  )
}
