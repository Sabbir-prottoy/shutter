import { useState } from 'react'

// Photos appear a portion at a time so a big portfolio doesn't make the whole
// profile page wait on dozens of images the visitor may never scroll to.
const PAGE_SIZE = 12

// Full-bleed masonry, images flush to edges, no borders/cards — per the
// design system's portfolio-page rule (photos stay unboxed, unlike
// dashboard/data cards elsewhere in the app).
export default function PortfolioGrid({ images }) {
  const [visible, setVisible] = useState(PAGE_SIZE)

  if (images.length === 0) {
    return <p className="text-ink-muted">No portfolio images yet.</p>
  }

  const remaining = images.length - visible

  return (
    <>
      <div className="columns-2 gap-1 sm:columns-3 lg:columns-4">
        {images.slice(0, visible).map((image) => (
          <a
            key={image.id}
            href={image.imageUrl}
            target="_blank"
            rel="noreferrer"
            className="mb-1 block break-inside-avoid"
          >
            <img
              src={image.imageUrl}
              alt={image.caption || (image.category ? image.category.toLowerCase() : 'Portfolio photo')}
              className="w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </a>
        ))}
      </div>

      {remaining > 0 && (
        <div className="mt-6 flex justify-center px-6">
          <button
            type="button"
            onClick={() => setVisible((count) => count + PAGE_SIZE)}
            className="rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-medium text-ink shadow-card transition-colors hover:border-accent hover:text-accent"
          >
            Show more photos ({remaining} left)
          </button>
        </div>
      )}
    </>
  )
}
