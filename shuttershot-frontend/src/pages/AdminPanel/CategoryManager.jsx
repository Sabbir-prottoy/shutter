import { useEffect, useRef, useState } from 'react'
import {
  addPhotoshootCategory,
  deletePhotoshootCategory,
  getAdminPhotoshootCategories,
  updatePhotoshootCategory,
} from '../../services/api'

const inputClass =
  'w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent'
const textareaClass =
  'w-full rounded-card border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent'

const EMPTY_FORM = { name: '', summary: '', details: '', goodFor: '', lookFor: '' }

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">
        {label}
        {hint && <span className="font-normal"> - {hint}</span>}
      </span>
      {children}
    </label>
  )
}

export default function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const formRef = useRef(null)

  useEffect(() => {
    getAdminPhotoshootCategories()
      .then((data) => {
        setCategories(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  const editing = categories.find((category) => category.id === editingId) || null

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError(null)
  }

  function startEdit(category) {
    setForm({
      name: category.name,
      summary: category.summary || '',
      details: category.details,
      goodFor: (category.goodFor || []).join('\n'),
      lookFor: category.lookFor || '',
    })
    setEditingId(category.id)
    setError(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim()) {
      setError('Please enter the category name.')
      return
    }
    if (!form.details.trim()) {
      setError('Please write the details for this category.')
      return
    }

    const payload = {
      name: form.name.trim(),
      summary: form.summary.trim(),
      details: form.details.trim(),
      goodFor: form.goodFor
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      lookFor: form.lookFor.trim(),
    }

    setError(null)
    setSaving(true)
    try {
      if (editing) {
        const updated = await updatePhotoshootCategory(editing.id, payload)
        setCategories((prev) => prev.map((category) => (category.id === updated.id ? updated : category)))
      } else {
        const created = await addPhotoshootCategory(payload)
        setCategories((prev) => [...prev, created])
      }
      setForm(EMPTY_FORM)
      setEditingId(null)
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          `We couldn't ${editing ? 'save' : 'add'} that category. Please try again.`,
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(category) {
    if (!window.confirm(`Remove the "${category.name}" category?`)) {
      return
    }

    setError(null)
    setDeletingId(category.id)
    try {
      await deletePhotoshootCategory(category.id)
      setCategories((prev) => prev.filter((entry) => entry.id !== category.id))
      if (editingId === category.id) {
        setForm(EMPTY_FORM)
        setEditingId(null)
      }
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't remove that category. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">Photoshoot category manage</h1>
      <p className="-mt-4 text-ink-muted">
        Add new photoshoot categories and edit any existing one. They appear as cards under
        "Photoshoot category overview" on the public Suggestions page. Wedding, portrait, event, and
        landscape are built in - photographer search depends on them - so their text can be edited
        but they can't be removed.
      </p>

      {status === 'loading' && <p className="text-ink-muted">Loading categories…</p>}

      {status === 'error' && (
        <p className="text-ink-muted">
          We couldn't load the categories right now. Please check your connection and try again.
        </p>
      )}

      {status === 'ready' && (
        <>
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="scroll-mt-6 rounded-card border border-border bg-surface p-5 shadow-card"
          >
            <h2 className="font-display text-lg font-bold text-ink">
              {editing ? `Edit "${editing.name}"` : 'Add a category'}
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Category name">
                <input
                  type="text"
                  value={form.name}
                  onChange={update('name')}
                  maxLength={60}
                  placeholder="e.g. Maternity"
                  className={inputClass}
                />
              </Field>

              <Field label="Short summary" hint="optional, one line">
                <input
                  type="text"
                  value={form.summary}
                  onChange={update('summary')}
                  maxLength={160}
                  placeholder="e.g. Portraits for expecting parents."
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Details">
                <textarea
                  value={form.details}
                  onChange={update('details')}
                  maxLength={2000}
                  rows={4}
                  placeholder="Describe what this kind of shoot covers, so visitors know what to expect."
                  className={textareaClass}
                />
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Good for" hint="optional, one item per line (up to 8)">
                <textarea
                  value={form.goodFor}
                  onChange={update('goodFor')}
                  rows={4}
                  placeholder={'Maternity portraits\nNewborn sessions'}
                  className={textareaClass}
                />
              </Field>

              <Field label="What to look for" hint="optional">
                <textarea
                  value={form.lookFor}
                  onChange={update('lookFor')}
                  maxLength={400}
                  rows={4}
                  placeholder="Advice on choosing a photographer for this kind of shoot."
                  className={textareaClass}
                />
              </Field>
            </div>

            {error && <p className="mt-3 text-sm text-booked">{error}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
              >
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add category'}
              </button>

              {editing && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={resetForm}
                  className="text-sm text-ink-muted underline transition-colors hover:text-accent"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <h2 className="font-display text-lg font-bold text-ink">All categories ({categories.length})</h2>

          <ul className="space-y-3">
            {categories.map((category) => (
              <li
                key={category.id}
                className={`flex items-start justify-between gap-4 rounded-card border bg-surface px-4 py-3 shadow-card ${
                  editingId === category.id ? 'border-accent' : 'border-border'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{category.name}</p>
                    {category.builtIn && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                        Built-in
                      </span>
                    )}
                  </div>
                  {category.summary && <p className="text-sm text-ink-muted">{category.summary}</p>}
                  <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{category.details}</p>
                </div>

                <div className="flex shrink-0 items-center gap-4 text-sm">
                  <button
                    type="button"
                    onClick={() => startEdit(category)}
                    className="text-accent underline transition-opacity hover:opacity-80"
                  >
                    Edit
                  </button>
                  {!category.builtIn && (
                    <button
                      type="button"
                      disabled={deletingId === category.id}
                      onClick={() => handleDelete(category)}
                      className="text-ink-muted underline transition-colors hover:text-booked disabled:opacity-60"
                    >
                      {deletingId === category.id ? 'Removing…' : 'Remove'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
