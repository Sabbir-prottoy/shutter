import { useEffect, useState } from 'react'
import ImageUploader from '../components/ImageUploader'
import { deletePortfolioImage, getMyPortfolio, uploadPortfolioImage } from '../services/api'

const STATUS_STYLES = {
  VERIFIED: 'bg-free/20 text-free',
  FLAGGED: 'bg-booked/20 text-booked',
  PENDING: 'bg-border text-ink-muted',
}

export default function PortfolioManager() {
  const [images, setImages] = useState([])
  const [status, setStatus] = useState('loading')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    loadImages()
  }, [])

  function loadImages() {
    setStatus('loading')
    getMyPortfolio()
      .then((data) => {
        setImages(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  async function handleUpload(file, category) {
    const uploaded = await uploadPortfolioImage(file, category)
    setImages((prev) => [uploaded, ...prev])
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this photo? This cannot be undone.')) {
      return
    }

    setDeletingId(id)
    try {
      await deletePortfolioImage(id)
      setImages((prev) => prev.filter((image) => image.id !== id))
    } catch {
      window.alert("We couldn't delete that photo. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Portfolio manager</h1>
        <p className="mt-1 text-ink-muted">
          Uploads are automatically checked for camera metadata. Anything flagged is hidden
          from your public profile until an admin reviews it.
        </p>
      </div>

      <ImageUploader onUpload={handleUpload} />

      {status === 'loading' && <p className="text-ink-muted">Loading your portfolio…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load your portfolio right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && images.length === 0 && (
        <p className="text-ink-muted">No images yet — upload your first photo above.</p>
      )}

      {status === 'ready' && images.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-card bg-surface shadow-card">
              <img
                src={image.imageUrl}
                alt={image.category}
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-ink-muted">
                    {image.category.charAt(0) + image.category.slice(1).toLowerCase()}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[image.verificationStatus] || STATUS_STYLES.PENDING
                    }`}
                  >
                    {image.verificationStatus}
                  </span>
                </div>

                {image.verificationStatus === 'FLAGGED' && image.flagReason && (
                  <p className="mt-2 text-sm text-booked">{image.flagReason}</p>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(image.id)}
                  disabled={deletingId === image.id}
                  className="mt-3 text-sm text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
                >
                  {deletingId === image.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
