function Stars({ rating }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} className="text-accent">
      {'★'.repeat(rating)}
      <span className="text-border">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

export default function ReviewCard({ review }) {
  const { clientName, rating, comment, createdAt } = review

  const date = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="rounded-card bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <span className="font-sans font-semibold text-ink">{clientName}</span>
        <Stars rating={rating} />
      </div>
      {comment && <p className="mt-3 text-ink-muted">{comment}</p>}
      <p className="mt-3 text-xs text-ink-muted">{date}</p>
    </div>
  )
}
