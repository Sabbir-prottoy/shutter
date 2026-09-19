import { useEffect, useState } from 'react'
import ProfilePhotoUploader from '../components/ProfilePhotoUploader'
import { getMyProfile, updateMyProfile, uploadProfilePhoto } from '../services/api'

export default function ProfileSettings() {
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState('loading')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getMyProfile()
      .then((data) => {
        setProfile(data)
        setPhone(data.phone || '')
        setLocation(data.location || '')
        setEmail(data.email || '')
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  async function handlePhotoUpload(file) {
    const updated = await uploadProfilePhoto(file)
    setProfile(updated)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      const updated = await updateMyProfile(profile.id, { phone, location, email })
      setProfile(updated)
      setPhone(updated.phone || '')
      setLocation(updated.location || '')
      setEmail(updated.email || '')
      setSaved(true)
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't save your changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Profile settings</h1>
        <p className="mt-1 text-ink-muted">Manage your profile photo and contact details.</p>
      </div>

      {status === 'loading' && <p className="text-ink-muted">Loading your profile…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load your profile right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && (
        <>
          <ProfilePhotoUploader
            photoUrl={profile.profilePhotoUrl}
            onUpload={handlePhotoUpload}
            size="h-28 w-28"
          />

          <form onSubmit={handleSubmit} className="space-y-4 rounded-card bg-surface p-6 shadow-card">
            <div>
              <label htmlFor="phone" className="text-sm font-medium text-ink">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone number"
                className="mt-1 w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
              />
            </div>

            <div>
              <label htmlFor="location" className="text-sm font-medium text-ink">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="City, area"
                className="mt-1 w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-ink">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="mt-1 w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
              />
              <p className="mt-1 text-xs text-ink-muted">
                If you change this, use the new address next time you log in.
              </p>
            </div>

            {error && <p className="text-sm text-booked">{error}</p>}
            {saved && <p className="text-sm text-free">Saved.</p>}

            <button
              type="submit"
              disabled={saving}
              className="rounded-card bg-accent-gradient px-6 py-2.5 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
