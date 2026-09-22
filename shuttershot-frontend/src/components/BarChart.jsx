import { useId, useState } from 'react'

const WIDTH = 640
const HEIGHT = 220
const PADDING_LEFT = 44
const PADDING_RIGHT = 8
const PADDING_TOP = 20
const PADDING_BOTTOM = 28
const MAX_BAR_WIDTH = 24
const BAR_RADIUS = 4

const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT
const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM

// Rounds a max value up to a "nice" number (1/2/5 x a power of 10) so axis
// ticks land on clean values instead of whatever the data happens to peak at.
function niceMax(value) {
  if (value <= 0) return 1
  const exponent = Math.floor(Math.log10(value))
  const magnitude = 10 ** exponent
  const fraction = value / magnitude
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return niceFraction * magnitude
}

function roundedTopBarPath(x, yTop, width, yBottom) {
  const r = Math.min(BAR_RADIUS, width / 2, Math.max(yBottom - yTop, 0))
  if (yBottom - yTop <= 0) return ''
  return `
    M ${x} ${yBottom}
    L ${x} ${yTop + r}
    Q ${x} ${yTop} ${x + r} ${yTop}
    L ${x + width - r} ${yTop}
    Q ${x + width} ${yTop} ${x + width} ${yTop + r}
    L ${x + width} ${yBottom}
    Z
  `
}

/**
 * A single-series monthly bar chart: thin bars, rounded tops, hairline
 * gridlines, a hover tooltip per bar, a direct label on the peak bar only,
 * and a hidden table twin for accessibility (screen readers / non-visual
 * consumption) toggled via <details> rather than a chart library.
 */
export default function BarChart({ title, data, color, valueFormatter = (v) => v.toLocaleString() }) {
  const [hoverIndex, setHoverIndex] = useState(null)
  const gradientId = useId()

  const maxValue = niceMax(Math.max(...data.map((d) => d.value), 0))
  const tickCount = 4
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (maxValue / tickCount) * i)

  const slotWidth = plotWidth / data.length
  const barWidth = Math.min(MAX_BAR_WIDTH, slotWidth - 6)
  const peakIndex = data.reduce(
    (best, d, i) => (d.value > data[best].value ? i : best),
    0,
  )
  const hasAnyValue = data.some((d) => d.value > 0)

  function yFor(value) {
    return PADDING_TOP + plotHeight - (value / maxValue) * plotHeight
  }

  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      <h3 className="font-sans text-sm font-semibold text-ink">{title}</h3>

      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full overflow-visible"
          role="img"
          aria-label={title}
        >
          {/* Gridlines + Y-axis ticks */}
          {ticks.map((tick) => {
            const y = yFor(tick)
            return (
              <g key={tick}>
                <line
                  x1={PADDING_LEFT}
                  x2={WIDTH - PADDING_RIGHT}
                  y1={y}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth="1"
                />
                <text x={PADDING_LEFT - 8} y={y + 3} textAnchor="end" fontSize="10" fill="var(--color-ink-muted)">
                  {Math.round(tick).toLocaleString()}
                </text>
              </g>
            )
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const x = PADDING_LEFT + slotWidth * i + (slotWidth - barWidth) / 2
            const yTop = yFor(d.value)
            const yBottom = PADDING_TOP + plotHeight
            const isPeak = i === peakIndex && d.value > 0 && hasAnyValue

            return (
              <g
                key={d.label}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex((current) => (current === i ? null : current))}
                onFocus={() => setHoverIndex(i)}
                onBlur={() => setHoverIndex((current) => (current === i ? null : current))}
                tabIndex={0}
                className="cursor-pointer outline-none"
              >
                {/* Larger, invisible hit target — easier to hover/focus than the bar itself */}
                <rect
                  x={PADDING_LEFT + slotWidth * i}
                  y={PADDING_TOP}
                  width={slotWidth}
                  height={plotHeight}
                  fill="transparent"
                />
                {d.value > 0 && (
                  <path
                    d={roundedTopBarPath(x, yTop, barWidth, yBottom)}
                    fill={color}
                    opacity={hoverIndex === null || hoverIndex === i ? 1 : 0.55}
                    style={{ transition: 'opacity 150ms ease' }}
                  />
                )}

                {isPeak && (
                  <text
                    x={x + barWidth / 2}
                    y={yTop - 6}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="var(--color-ink)"
                  >
                    {valueFormatter(d.value)}
                  </text>
                )}

                <text
                  x={x + barWidth / 2}
                  y={PADDING_TOP + plotHeight + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--color-ink-muted)"
                >
                  {d.label}
                </text>
              </g>
            )
          })}
        </svg>

        {hoverIndex !== null && (
          <div
            className="pointer-events-none absolute rounded-card border border-border bg-surface px-2.5 py-1.5 text-xs shadow-hover"
            style={{
              left: `${((PADDING_LEFT + slotWidth * (hoverIndex + 0.5)) / WIDTH) * 100}%`,
              top: `${(yFor(data[hoverIndex].value) / HEIGHT) * 100}%`,
              transform: 'translate(-50%, -130%)',
            }}
          >
            <p className="font-semibold text-ink">{valueFormatter(data[hoverIndex].value)}</p>
            <p className="text-ink-muted">{data[hoverIndex].label}</p>
          </div>
        )}
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-ink-muted underline">View as table</summary>
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="text-left text-ink-muted">
              <th className="font-medium">Month</th>
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
