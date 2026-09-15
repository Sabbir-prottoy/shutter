import { useRef, useState } from 'react'

/**
 * A circular avatar that doubles as its own upload control — hovering
 * reveals a "+" overlay, clicking (anywhere on the circle) opens the file
 * picker, and the new photo uploads immediately on selection. Starts empty
 * (just the bare circle) until a photo exists.
 */
export default function ProfilePhotoUploader({ photoUrl, onUpload, size = 'h-24 w-24' }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  async function handleFileChange(event) {
    const file = event.target.files[0]
    if (!file) return

    setError(null)
    setUploading(true)
    try {
      await onUpload(file)
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't upload that photo. Please try again.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        aria-label={photoUrl ? 'Change profile photo' : 'Upload profile photo'}
        className={`group relative ${size} shrink-0 overflow-hidden rounded-full border border-border bg-surface-raised disabled:opacity-70`}
      >
        {photoUrl && (
          <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
        )}

        <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-2xl font-light text-white opacity-0 transition-all duration-200 group-hover:bg-ink/50 group-hover:opacity-100">
          {uploading ? '…' : '+'}
        </span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="mt-2 text-xs text-booked">{error}</p>}
    </div>
  )
}
