import { useEffect, useMemo, useState } from 'react'
import ImageUploader from '../components/ImageUploader'
import {
  deletePortfolioImage,
  getMyPortfolio,
  updatePortfolioCaption,
  uploadPortfolioImage,
} from '../services/api'

export default function PortfolioManager() {
  const [images, setImages] = useState([])
  const [status, setStatus] = useState('loading')
  const [deletingId, setDeletingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

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

  async function handleUpload(file, category, caption) {
    const uploaded = await uploadPortfolioImage(file, category, caption)
    setImages((prev) => [uploaded, ...prev])
  }

  async function handleConfirmDelete() {
    const id = confirmDeleteId
    setDeletingId(id)
    try {
      await deletePortfolioImage(id)
      setImages((prev) => prev.filter((image) => image.id !== id))
      setConfirmDeleteId(null)
    } catch {
      window.alert("We couldn't delete that photo. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  function startEditing(image) {
    setMenuOpenId(null)
    setEditingId(image.id)
    setEditValue(image.caption || '')
  }

  function cancelEditing() {
    setEditingId(null)
    setEditValue('')
  }

  async function handleSaveCaption(id) {
    setSavingId(id)
    try {
      const updated = await updatePortfolioCaption(id, editValue)
      setImages((prev) => prev.map((image) => (image.id === id ? updated : image)))
      setEditingId(null)
      setEditValue('')
    } catch {
      window.alert("We couldn't save that. Please try again.")
    } finally {
      setSavingId(null)
    }
  }

  const liveImages = useMemo(
    () => images.filter((image) => image.verificationStatus === 'VERIFIED'),
    [images],
  )

  const confirmDeleteImage = liveImages.find((image) => image.id === confirmDeleteId)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Portfolio manager</h1>
        <p className="mt-1 text-ink-muted">
          New uploads don't go live right away — an admin reviews every photo first to confirm
          it's genuinely your own work, not AI-generated or someone else's picture. Track
          pending uploads in the sidebar; approved photos show up below and on your public
          profile.
        </p>
      </div>

      <ImageUploader onUpload={handleUpload} />

      {status === 'loading' && <p className="text-ink-muted">Loading your portfolio…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load your portfolio right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && liveImages.length === 0 && (
        <p className="text-ink-muted">
          Nothing approved yet — once an admin approves a pending photo, it'll show up here and
          on your public profile.
        </p>
      )}

      {status === 'ready' && liveImages.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {liveImages.map((image) => (
            <div key={image.id} className="rounded-card bg-surface shadow-card">
              <img
                src={image.imageUrl}
                alt={image.caption || image.category}
                className="aspect-[4/3] w-full rounded-t-card object-cover"
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  {editingId === image.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(event) => setEditValue(event.target.value)}
                      placeholder="Name or details (optional)"
                      maxLength={200}
                      autoFocus
                      className="w-full rounded-card border border-border bg-surface px-2 py-1 text-sm text-ink focus:border-accent"
                    />
                  ) : (
                    <span className="text-sm text-ink-muted">
                      {image.caption || <span className="italic text-ink-muted/60">No details</span>}
                    </span>
                  )}
                  <span className="shrink-0 rounded-full bg-free/20 px-2.5 py-0.5 text-xs font-medium text-free">
                    Live
                  </span>
                </div>

                {editingId === image.id ? (
                  <div className="mt-3 flex gap-4 text-sm">
                    <button
                      type="button"
                      onClick={() => handleSaveCaption(image.id)}
                      disabled={savingId === image.id}
                      className="text-accent underline transition-opacity hover:opacity-80 disabled:opacity-60"
                    >
                      {savingId === image.id ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={savingId === image.id}
                      className="text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="relative mt-3 flex justify-start">
                    <button
                      type="button"
                      aria-label="Photo options"
                      onClick={() => setMenuOpenId(menuOpenId === image.id ? null : image.id)}
                      className="flex items-center gap-1 rounded-card px-2 py-1.5 transition-colors hover:bg-surface-raised"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-ink-muted" />
                      <span className="h-1.5 w-1.5 rounded-full bg-ink-muted" />
                      <span className="h-1.5 w-1.5 rounded-full bg-ink-muted" />
                    </button>

                    {menuOpenId === image.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                        <div className="absolute left-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-card border border-border bg-surface shadow-hover">
                          <button
                            type="button"
                            onClick={() => startEditing(image)}
                            className="block w-full px-4 py-2 text-left text-sm text-ink transition-colors hover:bg-surface-raised"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenId(null)
                              setConfirmDeleteId(image.id)
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-booked transition-colors hover:bg-surface-raised"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDeleteImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-card bg-surface p-6 shadow-hover">
            <h3 className="font-display text-lg font-bold text-ink">Delete this photo?</h3>
            <p className="mt-2 text-sm text-ink-muted">
              This approved picture will be permanently removed and you cannot undo this. Are
              you sure you want to delete it?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deletingId === confirmDeleteId}
                className="text-sm text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingId === confirmDeleteId}
                className="rounded-card bg-booked px-4 py-2 text-sm font-medium text-white shadow-card transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {deletingId === confirmDeleteId ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
