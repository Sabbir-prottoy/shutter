export default function DashboardPlaceholder({ title, description }) {
  return (
    <div className="rounded-card bg-surface p-8 shadow-card">
      <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
      <p className="mt-2 text-ink-muted">{description || 'This page is coming soon.'}</p>
    </div>
  )
}
