// A small "− 2 +" control in a capsule. `max` disables the plus button.
export default function QuantityStepper({ value, onChange, max, min = 0, label = 'Quantity', size = 'md' }) {
  const button =
    size === 'sm'
      ? 'h-7 w-7 text-base'
      : 'h-9 w-9 text-lg'

  return (
    <div
      className="inline-flex items-center rounded-full border border-border bg-surface shadow-card"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={`pill-focus flex items-center justify-center rounded-full text-ink transition-colors hover:text-accent disabled:opacity-40 ${button}`}
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-medium text-ink" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={`pill-focus flex items-center justify-center rounded-full text-ink transition-colors hover:text-accent disabled:opacity-40 ${button}`}
      >
        +
      </button>
    </div>
  )
}
