import { useEffect, useState } from 'react'
import { approvePhoto, checkPhotoForAi, getPendingPhotos, rejectPhoto } from '../../services/api'

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

export default function PhotoModeration() {
  const [photos, setPhotos] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [processingId, setProcessingId] = useState(null)
  const [checkingId, setCheckingId] = useState(null)

  useEffect(() => {
    loadPhotos()
  }, [])

  function loadPhotos() {
    setStatus('loading')
    getPendingPhotos()
      .then((data) => {
        setPhotos(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  async function handleApprove(id) {
    setError(null)
    setProcessingId(id)
    try {
      await approvePhoto(id)
      setPhotos((prev) => prev.filter((photo) => photo.id !== id))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't approve that photo. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(id) {
    if (!window.confirm('Reject and permanently delete this photo? This cannot be undone.')) {
      return
    }

    setError(null)
    setProcessingId(id)
    try {
      await rejectPhoto(id)
      setPhotos((prev) => prev.filter((photo) => photo.id !== id))
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
      const updated = await checkPhotoForAi(id)
      setPhotos((prev) => prev.map((photo) => (photo.id === id ? updated : photo)))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't run the AI check on that photo. Please try again.")
    } finally {
      setCheckingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">Photo moderation</h1>
        {status === 'ready' && (
          <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-sm font-medium text-accent">
            {photos.length} pending
          </span>
        )}
      </div>
      <p className="-mt-4 text-ink-muted">
        Every new upload waits here before it can appear on a photographer's public profile.
        Approve photos that are genuinely the photographer's own work; reject anything that
        looks AI-generated, stolen, or otherwise not theirs. Use "Check for AI" to run a photo
        through AI or Not if you're unsure.
      </p>

      {error && <p className="text-sm text-booked">{error}</p>}

      {status === 'loading' && <p className="text-ink-muted">Loading pending photos…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load pending photos right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && photos.length === 0 && (
        <p className="text-ink-muted">No photos waiting for review.</p>
      )}

      {status === 'ready' && photos.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-card bg-surface shadow-card">
              <img
                src={photo.imageUrl}
                alt={photo.category}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-ink-muted">
                    {photo.category.charAt(0) + photo.category.slice(1).toLowerCase()}
                  </span>
                  <span className="text-xs text-ink-muted">Photographer #{photo.photographerId}</span>
                </div>

                {photo.flagReason && (
                  <p className="mt-2 text-sm text-ink-muted">
                    <span className="font-medium text-ink">Note:</span> {photo.flagReason}
                  </p>
                )}

                {photo.aiCheckVerdict && (
                  <div
                    className={`mt-3 rounded-card border px-3 py-2 text-sm ${
                      VERDICT_STYLES[photo.aiCheckVerdict] || VERDICT_STYLES.unknown
                    }`}
                  >
                    <p className="font-medium">
                      {VERDICT_LABELS[photo.aiCheckVerdict] || photo.aiCheckVerdict}
                      {photo.aiCheckConfidence != null && ` (${Math.round(photo.aiCheckConfidence * 100)}%)`}
                    </p>
                    {photo.aiCheckGenerator && (
                      <p className="mt-0.5">Generator detected: {photo.aiCheckGenerator}</p>
                    )}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <button
                    type="button"
                    disabled={processingId === photo.id}
                    onClick={() => handleApprove(photo.id)}
                    className="text-accent underline transition-opacity hover:opacity-80 disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={processingId === photo.id}
                    onClick={() => handleReject(photo.id)}
                    className="text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={checkingId === photo.id}
                    onClick={() => handleCheckAi(photo.id)}
                    className="text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
                  >
                    {checkingId === photo.id
                      ? 'Checking…'
                      : photo.aiCheckVerdict
                        ? 'Re-check for AI'
                        : 'Check for AI'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
