import { useEffect, useRef, useState } from 'react'
import { deletePoseImage, getAdminPoses, uploadPoseImage } from '../../services/api'

// Kept in sync with the public Suggestions page's POSE_SUBSECTIONS list and
// the backend's PoseSubsection enum — the slug is what both sides key by.
const SUBSECTIONS = [
  { slug: 'wedding', value: 'WEDDING', label: 'Wedding photoshoot pose' },
  { slug: 'portrait', value: 'PORTRAIT', label: 'Portrait photoshoot pose' },
  { slug: 'aesthetic', value: 'AESTHETIC', label: 'Aesthetic photoshoot pose' },
  { slug: 'couple', value: 'COUPLE', label: 'Couple photoshoot pose' },
  { slug: 'family', value: 'FAMILY', label: 'Family photoshoot pose' },
]

export default function PoseManager() {
  const [posesBySlug, setPosesBySlug] = useState({})
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [activeSlug, setActiveSlug] = useState(SUBSECTIONS[0].slug)
  const [deletingId, setDeletingId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setStatus('loading')
    getAdminPoses()
      .then((data) => {
        setPosesBySlug(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  const active = SUBSECTIONS.find((s) => s.slug === activeSlug)
  const activePhotos = posesBySlug[activeSlug] || []

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)
    try {
      const created = await uploadPoseImage(file, active.value)
      setPosesBySlug((prev) => ({
        ...prev,
        [activeSlug]: [...(prev[activeSlug] || []), created],
      }))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't upload that picture. Please try again.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this picture from the pose section?')) {
      return
    }

    setError(null)
    setDeletingId(id)
    try {
      await deletePoseImage(id)
      setPosesBySlug((prev) => ({
        ...prev,
        [activeSlug]: (prev[activeSlug] || []).filter((photo) => photo.id !== id),
      }))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't remove that picture. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">Manage pose</h1>
      <p className="-mt-4 text-ink-muted">
        Add or remove pictures shown under "Photoshoot pose" on the public Suggestions page.
        Changes here take effect immediately.
      </p>

      {error && <p className="text-sm text-booked">{error}</p>}

      {status === 'loading' && <p className="text-ink-muted">Loading pose pictures…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load pose pictures right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && (
        <>
          <div className="flex flex-wrap gap-2">
            {SUBSECTIONS.map((sub) => (
              <button
                key={sub.slug}
                type="button"
                onClick={() => setActiveSlug(sub.slug)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeSlug === sub.slug
                    ? 'bg-ink text-surface'
                    : 'bg-surface-raised text-ink-muted hover:text-accent'
                }`}
              >
                {sub.label} ({(posesBySlug[sub.slug] || []).length})
              </button>
            ))}
          </div>

          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-card bg-accent-gradient px-4 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover">
              {uploading ? 'Uploading…' : `Add picture to ${active.label.toLowerCase()}`}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={handleUpload}
              />
            </label>
          </div>

          {activePhotos.length === 0 && (
            <p className="text-ink-muted">No pictures in this subsection yet.</p>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {activePhotos.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-card bg-surface shadow-card">
                <img
                  src={photo.imageUrl}
                  alt={active.label}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover"
                />
                <div className="p-2">
                  <button
                    type="button"
                    disabled={deletingId === photo.id}
                    onClick={() => handleDelete(photo.id)}
                    className="w-full text-sm text-ink-muted underline transition-colors hover:text-booked disabled:opacity-60"
                  >
                    {deletingId === photo.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
