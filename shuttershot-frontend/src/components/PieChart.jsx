import { useState } from 'react'

const SIZE = 200
const RADIUS = 80
const CENTER = SIZE / 2
const GAP_DEGREES = 2 // thin surface gap between slices, per the mark spec

function polarToCartesian(radius, angleDegrees) {
  const angleRadians = ((angleDegrees - 90) * Math.PI) / 180
  return {
    x: CENTER + radius * Math.cos(angleRadians),
    y: CENTER + radius * Math.sin(angleRadians),
  }
}

function slicePath(startAngle, endAngle) {
  const start = polarToCartesian(RADIUS, endAngle)
  const end = polarToCartesian(RADIUS, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
}

/**
 * A small donut-style pie for a handful of categorical slices — direct
 * labels for each slice, a legend (always present for >= 2 series), a
 * hover tooltip, a center total, and a hidden table twin, matching the
 * conventions BarChart already established in this codebase.
 */
export default function PieChart({ title, data, valueFormatter = (v) => v.toLocaleString() }) {
  const [hoverIndex, setHoverIndex] = useState(null)

  const total = data.reduce((sum, d) => sum + d.value, 0)

  let cumulativeAngle = 0
  const slices = data.map((d, i) => {
    const fraction = total > 0 ? d.value / total : 0
    const angle = fraction * 360
    const startAngle = cumulativeAngle + (i > 0 ? GAP_DEGREES / 2 : 0)
    const endAngle = cumulativeAngle + angle - (i < data.length - 1 ? GAP_DEGREES / 2 : 0)
    cumulativeAngle += angle
    return { ...d, startAngle, endAngle: Math.max(endAngle, startAngle), fraction }
  })

  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h3 className="font-sans text-sm font-semibold text-ink">{title}</h3>

      <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="relative shrink-0">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-40 w-40" role="img" aria-label={title}>
            {total === 0 ? (
              <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="#e8e2d9" />
            ) : (
              slices.map((slice, i) => (
                <path
                  key={slice.label}
                  d={slicePath(slice.startAngle, slice.endAngle)}
                  fill={slice.color}
                  opacity={hoverIndex === null || hoverIndex === i ? 1 : 0.55}
                  style={{ transition: 'opacity 150ms ease' }}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex((current) => (current === i ? null : current))}
                  onFocus={() => setHoverIndex(i)}
                  onBlur={() => setHoverIndex((current) => (current === i ? null : current))}
                  tabIndex={0}
                  className="cursor-pointer outline-none"
                />
              ))
            )}
            <circle cx={CENTER} cy={CENTER} r={RADIUS * 0.6} fill="#fcfcfb" />
            <text x={CENTER} y={CENTER - 4} textAnchor="middle" fontSize="20" fontWeight="700" fill="#1e1b16">
              {total.toLocaleString()}
            </text>
            <text x={CENTER} y={CENTER + 14} textAnchor="middle" fontSize="10" fill="#7a7267">
              total
            </text>
          </svg>

          {hoverIndex !== null && (
            <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full rounded-card border border-border bg-surface px-2.5 py-1.5 text-xs shadow-hover">
              <p className="font-semibold text-ink">{valueFormatter(slices[hoverIndex].value)}</p>
              <p className="text-ink-muted">{slices[hoverIndex].label}</p>
            </div>
          )}
        </div>

        <ul className="flex flex-col gap-1.5 text-sm">
          {slices.map((slice, i) => (
            <li
              key={slice.label}
              className="flex items-center gap-2"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex((current) => (current === i ? null : current))}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              <span className="text-ink">{slice.label}</span>
              <span className="text-ink-muted">
                {valueFormatter(slice.value)}
                {total > 0 && ` (${Math.round(slice.fraction * 100)}%)`}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-ink-muted underline">View as table</summary>
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="text-left text-ink-muted">
              <th className="font-medium">Category</th>
              <th className="font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-t border-border">
                <td className="py-1 text-ink">{d.label}</td>
                <td className="py-1 text-ink">{valueFormatter(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
