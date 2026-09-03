import { useRef, useState } from 'react'

const CATEGORIES = ['WEDDING', 'PORTRAIT', 'EVENT', 'LANDSCAPE']

export default function ImageUploader({ onUpload }) {
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [category, setCategory] = useState('WEDDING')
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!file) {
      setError('Please choose an image to upload.')
      return
    }

    setUploading(true)
    try {
      await onUpload(file, category)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't upload that image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-card bg-surface p-6 shadow-card">
      <h2 className="font-sans text-lg font-semibold text-ink">Upload a photo</h2>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files[0] || null)}
          className="flex-1 text-sm text-ink-muted file:mr-3 file:rounded-card file:border-0 file:bg-accent-gradient file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent"
        >
          {CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option.charAt(0) + option.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-3 text-sm text-booked">{error}</p>}

      <button
        type="submit"
        disabled={uploading}
        className="mt-4 rounded-card bg-accent-gradient px-6 py-2.5 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
      >
        {uploading ? 'Uploading…' : 'Upload'}
      </button>
    </form>
  )
}
