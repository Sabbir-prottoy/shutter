// Marks the AI features in the header. Deliberately its own shape rather than
// any vendor's mark: a tall asymmetric spark paired with a smaller one, so it
// reads as "AI" without looking like a particular provider's logo. Gradient
// stops match .bg-accent-gradient, the same terracotta as the chat and voice
// buttons.
export default function AiSparkIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="AI features">
      <defs>
        <linearGradient id="ai-spark-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c15a3a" />
          <stop offset="100%" stopColor="#d9825e" />
        </linearGradient>
      </defs>

      {/* Main spark — taller than it is wide, with pinched concave sides. */}
      <path
        fill="url(#ai-spark-gradient)"
        d="M10 2.5c0 5.5 3.6 9.5 8 10.2-4.4.7-8 4.7-8 10.2 0-5.5-3.6-9.5-8-10.2 4.4-.7 8-4.7 8-10.2z"
      />

      {/* Smaller companion spark, offset to the top right. */}
      <path
        fill="url(#ai-spark-gradient)"
        opacity="0.8"
        d="M19 1c0 2.4 1.6 4.2 3.5 4.5-1.9.3-3.5 2.1-3.5 4.5 0-2.4-1.6-4.2-3.5-4.5C17.4 5.2 19 3.4 19 1z"
      />
    </svg>
  )
}
