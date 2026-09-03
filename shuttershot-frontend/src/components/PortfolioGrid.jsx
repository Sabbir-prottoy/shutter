// Full-bleed masonry, images flush to edges, no borders/cards — per the
// design system's portfolio-page rule (photos stay unboxed, unlike
// dashboard/data cards elsewhere in the app).
export default function PortfolioGrid({ images }) {
  if (images.length === 0) {
    return <p className="text-ink-muted">No portfolio images yet.</p>
  }

  return (
    <div className="columns-2 gap-1 sm:columns-3 lg:columns-4">
      {images.map((image) => (
        <a
          key={image.id}
          href={image.imageUrl}
          target="_blank"
          rel="noreferrer"
          className="mb-1 block break-inside-avoid"
        >
          <img
            src={image.imageUrl}
            alt={image.category ? image.category.toLowerCase() : 'Portfolio photo'}
            className="w-full object-cover"
            loading="lazy"
          />
        </a>
      ))}
    </div>
  )
}
