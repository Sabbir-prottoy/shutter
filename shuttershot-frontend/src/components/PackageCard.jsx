import { Link } from 'react-router-dom'

export default function PackageCard({ pkg, onEdit, onDelete }) {
  const { photographerId, title, description, price, durationHours, deliveryDays } = pkg
  const isManaged = Boolean(onEdit || onDelete)

  return (
    <div className="flex flex-col rounded-card bg-surface p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-hover">
      <h3 className="font-sans text-xl font-semibold text-ink">{title}</h3>

      <p className="mt-2 font-display text-3xl font-bold text-accent">
        ${Number(price).toLocaleString()}
      </p>

      <dl className="mt-3 space-y-1 text-sm text-ink-muted">
        <div className="flex gap-1.5">
          <dt>Duration:</dt>
          <dd>{durationHours} hour{durationHours === 1 ? '' : 's'}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Delivery:</dt>
          <dd>{deliveryDays} day{deliveryDays === 1 ? '' : 's'}</dd>
        </div>
      </dl>

      {description && <p className="mt-4 flex-1 text-sm text-ink-muted">{description}</p>}

      {isManaged ? (
        <div className="mt-6 flex gap-4 text-sm">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(pkg)}
              className="text-ink-muted underline transition-colors hover:text-accent"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(pkg)}
              className="text-ink-muted underline transition-colors hover:text-accent"
            >
              Delete
            </button>
          )}
        </div>
      ) : (
        <Link
          to={`/book/${photographerId}?package=${pkg.id}`}
          className="mt-6 rounded-card bg-accent-gradient px-4 py-2.5 text-center text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
        >
          Book session
        </Link>
      )}
    </div>
  )
}
