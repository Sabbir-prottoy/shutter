// Renders an average rating (a fractional value like 4.3) as partially-filled
// stars rather than as a number — each star is an outline with a filled
// copy clipped to how much of that star the average earns, so a rating like
// 4.3 shows visibly as "four stars and a sliver of a fifth" instead of
// rounding away the difference between 4.1 and 4.9.
const STAR_PATH = 'M12 2.5l2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.8l7.1-.7z'

function Star({ fillPercent, size }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" className="text-border" style={{ width: size, height: size }} fill="currentColor">
        <path d={STAR_PATH} />
      </svg>
      {/* Clipped to the earned percentage of this star, then the star shape
          drawn at its full fixed size inside — clipping the width, rather
          than scaling the svg to a narrower box, is what keeps the visible
          slice looking like a slice of a star instead of a squashed one. */}
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
        <svg viewBox="0 0 24 24" className="text-accent" style={{ width: size, height: size }} fill="currentColor">
          <path d={STAR_PATH} />
        </svg>
      </span>
    </span>
  )
}

export default function StarRating({ value = 0, size = 18, className = '' }) {
  const clamped = Math.max(0, Math.min(5, value || 0))

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${clamped.toFixed(1)} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((index) => {
        const fillPercent = Math.round(Math.max(0, Math.min(1, clamped - index)) * 100)
        return <Star key={index} fillPercent={fillPercent} size={size} />
      })}
    </span>
  )
}
