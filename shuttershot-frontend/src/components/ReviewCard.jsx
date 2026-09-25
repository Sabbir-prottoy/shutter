function Stars({ rating }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} className="text-accent">
      {'★'.repeat(rating)}
      <span className="text-border">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function ReviewCard({ review }) {
  const { clientName, rating, comment, createdAt, photographerReply, repliedAt } = review

  return (
    <div className="rounded-card bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <span className="font-sans font-semibold text-ink">{clientName}</span>
        <Stars rating={rating} />
      </div>
      {comment && <p className="mt-3 text-ink-muted">{comment}</p>}
      <p className="mt-3 text-xs text-ink-muted">{formatDate(createdAt)}</p>

      {photographerReply && (
        <div className="mt-4 rounded-card border-l-4 border-accent bg-surface-raised px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Reply from the photographer
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-ink">{photographerReply}</p>
          {repliedAt && <p className="mt-2 text-xs text-ink-muted">{formatDate(repliedAt)}</p>}
        </div>
      )}
    </div>
  )
}
