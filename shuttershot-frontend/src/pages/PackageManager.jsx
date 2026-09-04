import { useEffect, useState } from 'react'
import PackageCard from '../components/PackageCard'
import { createPackage, deletePackage, getMyPackages, updatePackage } from '../services/api'

const EMPTY_FORM = { title: '', description: '', price: '', durationHours: '', deliveryDays: '' }

export default function PackageManager() {
  const [packages, setPackages] = useState([])
  const [status, setStatus] = useState('loading')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadPackages()
  }, [])

  function loadPackages() {
    setStatus('loading')
    getMyPackages()
      .then((data) => {
        setPackages(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  function openCreateForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  function openEditForm(pkg) {
    setEditingId(pkg.id)
    setForm({
      title: pkg.title,
      description: pkg.description || '',
      price: String(pkg.price),
      durationHours: String(pkg.durationHours),
      deliveryDays: String(pkg.deliveryDays),
    })
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)

    if (!form.title || !form.price || !form.durationHours || !form.deliveryDays) {
      setFormError('Please fill in every required field.')
      return
    }

    const payload = {
      title: form.title,
      description: form.description || undefined,
      price: Number(form.price),
      durationHours: Number(form.durationHours),
      deliveryDays: Number(form.deliveryDays),
    }

    setSubmitting(true)
    try {
      if (editingId) {
        const updated = await updatePackage(editingId, payload)
        setPackages((prev) => prev.map((pkg) => (pkg.id === editingId ? updated : pkg)))
      } else {
        const created = await createPackage(payload)
        setPackages((prev) => [created, ...prev])
      }
      closeForm()
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
          "We couldn't save this package. Please check your details and try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(pkg) {
    if (!window.confirm(`Delete "${pkg.title}"? This cannot be undone.`)) {
      return
    }

    try {
      await deletePackage(pkg.id)
      setPackages((prev) => prev.filter((p) => p.id !== pkg.id))
    } catch {
      window.alert("We couldn't delete that package. Please try again.")
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Package manager</h1>
          <p className="mt-1 text-ink-muted">Create and edit the service packages clients can book.</p>
        </div>
        {!formOpen && (
          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-card bg-accent-gradient px-4 py-2.5 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
          >
            New package
          </button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="rounded-card bg-surface p-6 shadow-card">
          <h2 className="font-sans text-lg font-semibold text-ink">
            {editingId ? 'Edit package' : 'New package'}
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Title"
              className="rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent sm:col-span-2"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
              placeholder="Price ($)"
              className="rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
            />
            <input
              type="number"
              min="1"
              value={form.durationHours}
              onChange={(event) => setForm({ ...form, durationHours: event.target.value })}
              placeholder="Duration (hours)"
              className="rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent"
            />
            <input
              type="number"
              min="0"
              value={form.deliveryDays}
              onChange={(event) => setForm({ ...form, deliveryDays: event.target.value })}
              placeholder="Delivery (days)"
              className="rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent sm:col-span-2"
            />
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Description (optional)"
              rows={3}
              className="rounded-card border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-accent sm:col-span-2"
            />
          </div>

          {formError && <p className="mt-3 text-sm text-booked">{formError}</p>}

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-card bg-accent-gradient px-6 py-2.5 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
            >
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Create package'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="text-sm text-ink-muted underline transition-colors hover:text-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {status === 'loading' && <p className="text-ink-muted">Loading your packages…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load your packages right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && packages.length === 0 && !formOpen && (
        <p className="text-ink-muted">No packages yet — create your first one above.</p>
      )}

      {status === 'ready' && packages.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} onEdit={openEditForm} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
