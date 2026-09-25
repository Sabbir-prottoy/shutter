import { useEffect, useMemo, useRef, useState } from 'react'
import PillSelect from '../../components/PillSelect'
import ProductArt, { PRODUCT_ICON_KEYS } from '../../components/ProductArt'
import {
  createProduct,
  deleteProduct,
  getAdminProducts,
  removeProductImage,
  updateProduct,
  uploadProductImage,
} from '../../services/api'
import { CATEGORY_BY_KEY, formatBdt, SHOP_CATEGORIES } from '../../utils/shop'

const CATEGORY_OPTIONS = SHOP_CATEGORIES.map((category) => ({ value: category.key, label: category.label }))
const ICON_OPTIONS = PRODUCT_ICON_KEYS.map((key) => ({
  value: key,
  label: key.replace(/-/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase()),
}))

const EMPTY_FORM = {
  name: '',
  description: '',
  category: 'essentials',
  price: '',
  oldPrice: '',
  stock: '',
  iconKey: 'bag',
  digital: false,
  active: true,
}

const inputClass =
  'w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent'

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

function toPayload(form) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category.toUpperCase(),
    price: Number(form.price),
    oldPrice: form.oldPrice === '' ? null : Number(form.oldPrice),
    stock: Number(form.stock),
    iconKey: form.iconKey,
    digital: form.digital,
    active: form.active,
  }
}

function toForm(product) {
  return {
    name: product.name,
    description: product.description || '',
    category: product.category,
    price: String(product.price),
    oldPrice: product.oldPrice ? String(product.oldPrice) : '',
    stock: String(product.stock),
    iconKey: product.iconKey,
    digital: product.digital,
    active: product.active,
  }
}

export default function ProductManager() {
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterText, setFilterText] = useState('')
  const formRef = useRef(null)

  useEffect(() => {
    getAdminProducts()
      .then((data) => {
        setProducts(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  const visible = useMemo(() => {
    const needle = filterText.trim().toLowerCase()
    return products.filter(
      (product) =>
        (!filterCategory || product.category === filterCategory) &&
        (!needle || product.name.toLowerCase().includes(needle)),
    )
  }, [products, filterCategory, filterText])

  const editing = products.find((product) => product.id === editingId) || null

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  function openNew() {
    setForm({ ...EMPTY_FORM, category: filterCategory || EMPTY_FORM.category })
    setEditingId(null)
    setError(null)
    setFormOpen(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  function startEdit(product) {
    setForm(toForm(product))
    setEditingId(product.id)
    setError(null)
    setFormOpen(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  function replace(updated) {
    setProducts((prev) => prev.map((product) => (product.id === updated.id ? updated : product)))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim()) return setError('Please enter the product name.')
    if (!(Number(form.price) >= 1)) return setError('Please enter a price of at least 1 BDT.')
    if (form.stock === '' || Number(form.stock) < 0) return setError('Please enter the stock (0 or more).')

    setError(null)
    setSaving(true)
    try {
      if (editing) {
        replace(await updateProduct(editing.id, toPayload(form)))
      } else {
        const created = await createProduct(toPayload(form))
        setProducts((prev) => [...prev, created])
      }
      closeForm()
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't save that product. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(product) {
    setError(null)
    setBusyId(product.id)
    try {
      replace(await updateProduct(product.id, toPayload({ ...toForm(product), active: !product.active })))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't change that product. Please try again.")
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Remove "${product.name}" from the marketplace? Past orders keep their details.`)) return
    setError(null)
    setBusyId(product.id)
    try {
      await deleteProduct(product.id)
      setProducts((prev) => prev.filter((entry) => entry.id !== product.id))
      if (editingId === product.id) closeForm()
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't remove that product. Please try again.")
    } finally {
      setBusyId(null)
    }
  }

  async function handleImage(product, event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    setBusyId(product.id)
    try {
      replace(await uploadProductImage(product.id, file))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't upload that photo. Please try again.")
    } finally {
      setBusyId(null)
    }
  }

  async function handleRemoveImage(product) {
    setError(null)
    setBusyId(product.id)
    try {
      replace(await removeProductImage(product.id))
    } catch (err) {
      setError(err?.response?.data?.message || "We couldn't remove that photo. Please try again.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">Manage Products</h1>
        <button
          type="button"
          onClick={openNew}
          className="rounded-full bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
        >
          Add a product
        </button>
      </div>
      <p className="-mt-4 text-ink-muted">
        Everything for sale in the Accessories Marketplace. Prices are in BDT. Changes show in the
        shop immediately. A product without a photo shows a drawn illustration instead.
      </p>

      {status === 'loading' && <p className="text-ink-muted">Loading products…</p>}
      {status === 'error' && (
        <p className="text-ink-muted">We couldn't load the products right now. Please check your connection and try again.</p>
      )}

      {status === 'ready' && (
        <>
          {formOpen && (
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="scroll-mt-6 rounded-card border border-border bg-surface p-5 shadow-card"
            >
              <h2 className="font-display text-lg font-bold text-ink">
                {editing ? `Edit "${editing.name}"` : 'Add a product'}
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Product name">
                  <input type="text" value={form.name} onChange={update('name')} maxLength={150} className={inputClass} />
                </Field>

                <Field label="Shelf">
                  <div className="rounded-full border border-border bg-surface">
                    <PillSelect
                      value={form.category}
                      onChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
                      options={CATEGORY_OPTIONS}
                      ariaLabel="Shelf"
                    />
                  </div>
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <Field label="Price (BDT)">
                  <input type="number" min="1" value={form.price} onChange={update('price')} className={inputClass} />
                </Field>
                <Field label="Old price" hint="optional">
                  <input type="number" min="1" value={form.oldPrice} onChange={update('oldPrice')} placeholder="for a discount" className={inputClass} />
                </Field>
                <Field label="Stock">
                  <input type="number" min="0" value={form.stock} onChange={update('stock')} className={inputClass} />
                </Field>
                <Field label="Illustration">
                  <div className="rounded-full border border-border bg-surface">
                    <PillSelect
                      value={form.iconKey}
                      onChange={(value) => setForm((prev) => ({ ...prev, iconKey: value }))}
                      options={ICON_OPTIONS}
                      ariaLabel="Illustration"
                    />
                  </div>
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Description" hint="optional, up to 500 characters">
                  <textarea
                    value={form.description}
                    onChange={update('description')}
                    maxLength={500}
                    rows={3}
                    className="w-full rounded-card border border-border bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
                  />
                </Field>
              </div>

              <div className="mt-4 flex flex-wrap gap-6 text-sm text-ink">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.digital}
                    onChange={(event) => setForm((prev) => ({ ...prev, digital: event.target.checked }))}
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
                  Digital item (delivered by email, no delivery fee)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
                  Show in the shop
                </label>
              </div>

              {error && <p className="mt-3 text-sm text-booked">{error}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-accent-gradient px-5 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover disabled:opacity-60"
                >
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeForm}
                  className="text-sm text-ink-muted underline transition-colors hover:text-accent"
                >
                  Cancel
                </button>
              </div>
              {editing && (
                <p className="mt-3 text-xs text-ink-muted">Add or change the photo from the product's row below.</p>
              )}
            </form>
          )}

          {!formOpen && error && <p className="text-sm text-booked">{error}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="w-56 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
            />
            {[{ key: '', label: `All (${products.length})` }, ...SHOP_CATEGORIES.map((category) => ({
              key: category.key,
              label: `${category.label} (${products.filter((product) => product.category === category.key).length})`,
            }))].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterCategory(tab.key)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  filterCategory === tab.key
                    ? 'border-transparent bg-accent-gradient text-white shadow-card'
                    : 'border-border bg-surface text-ink-muted hover:border-accent hover:text-accent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {visible.length === 0 && <p className="text-ink-muted">No products match.</p>}

          <ul className="space-y-3">
            {visible.map((product) => (
              <li
                key={product.id}
                className={`flex flex-wrap items-center gap-4 rounded-card border bg-surface p-3 shadow-card ${
                  editingId === product.id ? 'border-accent' : 'border-border'
                } ${product.active ? '' : 'opacity-70'}`}
              >
                <ProductArt product={product} className="h-16 w-16 shrink-0 rounded-card border border-border" />

                <div className="min-w-0 flex-1 basis-56">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{product.name}</p>
                    {!product.active && (
                      <span className="rounded-full bg-border px-2 py-0.5 text-xs font-medium text-ink-muted">Hidden</span>
                    )}
                    {product.digital && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">Digital</span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted">{CATEGORY_BY_KEY[product.category]?.label}</p>
                </div>

                <div className="text-right">
                  <p className="font-medium text-ink">
                    {formatBdt(product.price)}
                    {product.oldPrice && (
                      <span className="ml-2 text-xs font-normal text-ink-muted line-through">{formatBdt(product.oldPrice)}</span>
                    )}
                  </p>
                  <p className={`text-xs ${product.stock === 0 ? 'font-medium text-booked' : product.stock <= 5 ? 'font-medium text-booked' : 'text-ink-muted'}`}>
                    {product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <button type="button" onClick={() => startEdit(product)} className="text-accent underline transition-opacity hover:opacity-80">
                    Edit
                  </button>
                  <label className="cursor-pointer text-ink-muted underline transition-colors hover:text-accent">
                    {busyId === product.id ? 'Working…' : product.imageUrl ? 'Change photo' : 'Add photo'}
                    <input type="file" accept="image/*" className="hidden" disabled={busyId === product.id} onChange={(event) => handleImage(product, event)} />
                  </label>
                  {product.imageUrl && (
                    <button type="button" disabled={busyId === product.id} onClick={() => handleRemoveImage(product)} className="text-ink-muted underline transition-colors hover:text-booked disabled:opacity-60">
                      Remove photo
                    </button>
                  )}
                  <button type="button" disabled={busyId === product.id} onClick={() => toggleActive(product)} className="text-ink-muted underline transition-colors hover:text-accent disabled:opacity-60">
                    {product.active ? 'Hide' : 'Show'}
                  </button>
                  <button type="button" disabled={busyId === product.id} onClick={() => handleDelete(product)} className="text-ink-muted underline transition-colors hover:text-booked disabled:opacity-60">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
