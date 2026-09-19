import { Link } from 'react-router-dom'

export default function PhotographerCard({ photographer }) {
  const {
    id,
    name,
    profilePhotoUrl,
    baseLocation,
    specialties = [],
    ratingAvg,
    totalReviews,
    verified,
  } = photographer

  const imageSrc = profilePhotoUrl || `https://picsum.photos/seed/shuttershot-${id}/600/450`

  return (
    <Link
      to={`/photographers/${id}`}
      className="group block overflow-hidden rounded-card bg-surface shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-hover"
    >
      <div className="aspect-[4/3] w-full overflow-hidden">
        <img
          src={imageSrc}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-sans text-xl font-semibold text-ink">{name}</h3>
          {verified && (
            <span className="shrink-0 rounded-full bg-free/20 px-2 py-0.5 text-xs font-medium text-free">
              Verified
            </span>
          )}
        </div>

        {baseLocation && <p className="mt-1 text-sm text-ink-muted">{baseLocation}</p>}

        {specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {specialties.slice(0, 3).map((specialty) => (
              <span
                key={specialty}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs text-ink-muted"
              >
                {specialty}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-1 text-sm">
          {ratingAvg > 0 ? (
            <>
              <span className="font-medium text-ink">{ratingAvg.toFixed(1)}</span>
              <span className="text-ink-muted">({totalReviews} review{totalReviews === 1 ? '' : 's'})</span>
            </>
          ) : (
            <span className="text-ink-muted">No reviews yet</span>
          )}
        </div>
      </div>
    </Link>
  )
}
