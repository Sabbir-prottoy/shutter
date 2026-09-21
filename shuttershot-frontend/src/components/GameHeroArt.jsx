// A hand-built illustration (not a photo) — a floating game controller with
// dice and stars, for the Entertainment page's intro. Kept as inline SVG so
// it's crisp at any size and needs no external image asset.
export default function GameHeroArt({ className = '' }) {
  return (
    <svg
      viewBox="0 0 640 360"
      className={className}
      role="img"
      aria-label="Illustration of a game controller with dice and stars"
    >
      <defs>
        <linearGradient id="gh-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4cf9a" />
          <stop offset="50%" stopColor="#e8a9b0" />
          <stop offset="100%" stopColor="#8fa9e0" />
        </linearGradient>
        <linearGradient id="gh-pad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2620" />
          <stop offset="100%" stopColor="#1e1b16" />
        </linearGradient>
      </defs>

      <rect width="640" height="360" rx="24" fill="url(#gh-bg)" />

      {/* Stars scattered around */}
      {[
        [70, 70, 10], [560, 60, 8], [90, 270, 7], [580, 260, 11],
        [40, 170, 6], [600, 150, 7],
      ].map(([x, y, size], index) => (
        <path
          key={index}
          d={`M${x} ${y - size} L${x + size * 0.3} ${y - size * 0.3} L${x + size} ${y} L${x + size * 0.3} ${y + size * 0.3} L${x} ${y + size} L${x - size * 0.3} ${y + size * 0.3} L${x - size} ${y} L${x - size * 0.3} ${y - size * 0.3} Z`}
          fill="#ffffff"
          className="animate-twinkle"
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center',
            animationDelay: `${index * 0.35}s`,
          }}
        />
      ))}

      {/* Floating die, top right */}
      <g transform="translate(480, 60) rotate(18)">
        <rect width="70" height="70" rx="14" fill="#fcfaf7" stroke="#1e1b16" strokeWidth="3" />
        <circle cx="18" cy="18" r="6" fill="#c15a3a" />
        <circle cx="52" cy="18" r="6" fill="#c15a3a" />
        <circle cx="18" cy="52" r="6" fill="#c15a3a" />
        <circle cx="52" cy="52" r="6" fill="#c15a3a" />
        <circle cx="35" cy="35" r="6" fill="#c15a3a" />
      </g>

      {/* Floating die, bottom left */}
      <g transform="translate(90, 230) rotate(-14)">
        <rect width="56" height="56" rx="12" fill="#fcfaf7" stroke="#1e1b16" strokeWidth="3" />
        <circle cx="16" cy="16" r="5" fill="#6d8fd6" />
        <circle cx="40" cy="40" r="5" fill="#6d8fd6" />
      </g>

      {/* Game controller, centered */}
      <g transform="translate(160, 110)">
        <path
          d="M60 40
             C20 40 0 70 0 105
             C0 145 20 170 48 170
             C66 170 72 150 90 150
             L230 150
             C248 150 254 170 272 170
             C300 170 320 145 320 105
             C320 70 300 40 260 40
             Z"
          fill="url(#gh-pad)"
          stroke="#0f0d0a"
          strokeWidth="3"
        />

        {/* D-pad */}
        <rect x="55" y="82" width="18" height="46" rx="4" fill="#e8e2d9" />
        <rect x="41" y="96" width="46" height="18" rx="4" fill="#e8e2d9" />

        {/* Face buttons */}
        <circle cx="252" cy="80" r="11" fill="#c15a3a" />
        <circle cx="278" cy="106" r="11" fill="#8db5a0" />
        <circle cx="252" cy="132" r="11" fill="#e8b34f" />
        <circle cx="226" cy="106" r="11" fill="#6d8fd6" />

        {/* Thumbsticks */}
        <circle cx="120" cy="115" r="22" fill="#332e26" stroke="#0f0d0a" strokeWidth="2" />
        <circle cx="120" cy="115" r="12" fill="#4a443a" />
        <circle cx="200" cy="115" r="22" fill="#332e26" stroke="#0f0d0a" strokeWidth="2" />
        <circle cx="200" cy="115" r="12" fill="#4a443a" />
      </g>
    </svg>
  )
}
