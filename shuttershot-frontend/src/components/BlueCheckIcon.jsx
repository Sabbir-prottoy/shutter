// The familiar scalloped "verified" badge (Twitter/Instagram/Facebook style)
// — used wherever a blue-badge photographer's name is shown.
export default function BlueCheckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-label="Verified" role="img">
      <path
        d="M12 2l2.4 1.6 2.8-.5 1.3 2.5 2.5 1.3-.5 2.8L22 12l-1.6 2.4.5 2.8-2.5 1.3-1.3 2.5-2.8-.5L12 22l-2.4-1.6-2.8.5-1.3-2.5-2.5-1.3.5-2.8L2 12l1.6-2.4-.5-2.8 2.5-1.3 1.3-2.5 2.8.5L12 2z"
        fill="#1d9bf0"
      />
      <path
        d="M8.5 12.5l2.2 2.2 4.8-4.8"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
