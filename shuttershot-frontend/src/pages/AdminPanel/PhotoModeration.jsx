import { useEffect, useMemo, useState } from 'react'
import { approvePhoto, checkPhotoForAi, getModerationPhotos, rejectPhoto } from '../../services/api'

const VERDICT_STYLES = {
  ai: 'border-booked/30 bg-booked/10 text-booked',
  human: 'border-free/30 bg-free/10 text-free',
  unknown: 'border-border bg-surface-raised text-ink-muted',
}

const VERDICT_LABELS = {
  ai: 'Likely AI-generated',
  human: 'Looks human-made',
  unknown: 'Inconclusive',
}

const STATUS_BADGES = {
  VERIFIED: { label: 'Published', className: 'bg-free/15 text-free' },
  FLAGGED: { label: 'Rejected', className: 'bg-booked/15 text-booked' },
  PENDING: { label: 'Needs review', className: 'bg-accent/15 text-accent' },
}

const TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'VERIFIED', label: 'Published' },
  { key: 'FLAGGED', label: 'Rejected' },
  { key: 'PENDING', label: 'Needs review' },
]

const PAGE_SIZE = 30

export default function PhotoModeration() {
  const [photos, setPhotos] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [processingId, setProcessingId] = useState(null)
  const [checkingId, setCheckingId] = useState(null)
  const [tab, setTab] = useState('ALL')
  const [visible, setVisible] = useState(PAGE_SIZE)

  useEffect(() => {
    setStatus('loading')
    getModerationPhotos()
      .then((data) => {
        setPhotos(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  const counts = useMemo(() => {
    const tally = { ALL: photos.length, VERIFIED: 0, FLAGGED: 0, PENDING: 0 }
    photos.forEach((photo) => {
      tally[photo.verificationStatus] = (tally[photo.verificationStatus] || 0) + 1
    })
    return tally
  }, [photos])

  const filtered = useMemo(
    () => (tab === 'ALL' ? photos : photos.filter((photo) => photo.verificationStatus === tab)),
    [photos, tab],
  )

  function replacePhoto(updated) {
    setPhotos((prev) => prev.map((photo) => (photo.id === updated.id ? updated : photo)))
  }

  async function handleApprove(id) {
    setError(null)
    setProcessingId(id)
    try {
      replacePhoto(await approvePhoto(id))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't approve that photo. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(id) {
    if (!window.confirm('Take this photo off the photographer\'s public profile?')) {
      return
    }

    setError(null)
    setProcessingId(id)
    try {
      replacePhoto(await rejectPhoto(id))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't reject that photo. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  async function handleCheckAi(id) {
    setError(null)
    setCheckingId(id)
    try {
      replacePhoto(await checkPhotoForAi(id))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't run the AI check on that photo. Please try again.")
    } finally {
      setCheckingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">Photo moderation</h1>
      <p className="-mt-4 text-ink-muted">
        Every upload is screened automatically by Detectra v3 before it appears anywhere:
        photos it reads as AI-generated are rejected on the spot, the rest go live immediately.
        Nothing leaves this panel either way, so you can run a Deep Check with AI and overturn
        any call — including un-publishing a photo that is already on a profile.
      </p>

      {error && <p className="text-sm text-booked">{error}</p>}

      {status === 'loading' && <p className="text-ink-muted">Loading photos…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load photos right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && (
        <>
          <div className="flex flex-wrap gap-2">
            {TABS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setTab(option.key)
                  setVisible(PAGE_SIZE)
                }}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === option.key
                    ? 'bg-ink text-surface'
                    : 'bg-surface-raised text-ink-muted hover:text-accent'
                }`}
              >
                {option.label} ({counts[option.key] || 0})
              </button>
            ))}
          </div>

          {filtered.length === 0 && <p className="text-ink-muted">Nothing here right now.</p>}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, visible).map((photo) => {
              const badge = STATUS_BADGES[photo.verificationStatus] || STATUS_BADGES.PENDING
              return (
                <div key={photo.id} className="overflow-hidden rounded-card bg-surface shadow-card">
                  <img
                    src={photo.imageUrl}
                    alt={photo.category}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-xs text-ink-muted">
                        Photographer #{photo.photographerId}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-ink-muted">
                      {photo.category.charAt(0) + photo.category.slice(1).toLowerCase()}
                    </p>

                    {photo.detectraVerdict && (
                      <div
                        className={`mt-3 rounded-card border px-3 py-2 text-sm ${
                          VERDICT_STYLES[photo.detectraVerdict] || VERDICT_STYLES.unknown
                        }`}
                      >
                        <p className="font-medium">
                          Detectra v3: {VERDICT_LABELS[photo.detectraVerdict] || photo.detectraVerdict}
                        </p>
                        {photo.detectraConfidence != null && (
                          <p className="mt-0.5">
                            {Math.round(photo.detectraConfidence * 100)}% likely AI-generated
                          </p>
                        )}
                      </div>
                    )}

                    {photo.flagReason && (
                      <p className="mt-2 text-sm text-ink-muted">
                        <span className="font-medium text-ink">Note:</span> {photo.flagReason}
                      </p>
                    )}

                    {photo.rejectionReason && (
                      <p className="mt-2 text-sm text-ink-muted">
                        <span className="font-medium text-ink">Photographer sees:</span>{' '}
                        {photo.rejectionReason}
                      </p>
                    )}

                    {photo.aiCheckVerdict && (
                      <div
                        className={`mt-3 rounded-card border px-3 py-2 text-sm ${
                          VERDICT_STYLES[photo.aiCheckVerdict] || VERDICT_STYLES.unknown
                        }`}
                      >
                        <p className="font-medium">
                          Deep check: {VERDICT_LABELS[photo.aiCheckVerdict] || photo.aiCheckVerdict}
                          {photo.aiCheckConfidence != null &&
                            ` (${Math.round(photo.aiCheckConfidence * 100)}%)`}
                        </p>
                        {photo.aiCheckGenerator && (
                          <p className="mt-0.5">Generator detected: {photo.aiCheckGenerator}</p>
                        )}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      {photo.verificationStatus !== 'VERIFIED' && (
                        <button
                          type="button"
                          disabled={processingId === photo.id}
                          onClick={() => handleApprove(photo.id)}
                          className="text-accent underline transition-opacity hover:opacity-80 disabled:opacity-60"
                        >
                          Publish
                        </button>
                      )}
                      {photo.verificationStatus !== 'FLAGGED' && (
                        <button
                          type="button"
                          disabled={processingId === photo.id}
                          onClick={() => handleReject(photo.id)}
                          className="text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={checkingId === photo.id}
                        onClick={() => handleCheckAi(photo.id)}
                        className="text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
                      >
                        {checkingId === photo.id
                          ? 'Checking…'
                          : photo.aiCheckVerdict
                            ? 'Deep Check with AI again'
                            : 'Deep Check with AI'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length > visible && (
            <button
              type="button"
              onClick={() => setVisible((prev) => prev + PAGE_SIZE)}
              className="rounded-card border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Show more ({filtered.length - visible} left)
            </button>
          )}
        </>
      )}
    </div>
  )
}
