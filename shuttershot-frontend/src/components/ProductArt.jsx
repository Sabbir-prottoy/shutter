import { useState } from 'react'
import { CATEGORY_BY_KEY } from '../utils/shop'

// Simple line illustrations, one per icon key the backend allows (ProductIcons.java).
// Used on a product tile whenever the product has no photo of its own.
const ICONS = {
  tripod: (
    <>
      <rect x="23" y="8" width="18" height="10" rx="2.5" />
      <path d="M32 18v20M32 26 15 55M32 26l17 29M32 38v17" />
    </>
  ),
  bag: (
    <>
      <rect x="11" y="22" width="42" height="31" rx="7" />
      <path d="M22 22v-4a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v4M11 35h42" />
      <rect x="28" y="32" width="8" height="7" rx="1.5" />
    </>
  ),
  'memory-card': (
    <>
      <path d="M20 8h18l8 8v36a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" />
      <path d="M24 12v8M29 12v8M34 12v8M22 36h20M22 44h12" />
    </>
  ),
  'card-reader': (
    <>
      <rect x="9" y="22" width="37" height="22" rx="5" />
      <rect x="46" y="28" width="9" height="10" rx="1.5" />
      <path d="M17 29h13M17 36h9" />
    </>
  ),
  battery: (
    <>
      <rect x="10" y="20" width="38" height="26" rx="5" />
      <path d="M48 29h5v8h-5M30 26l-5 8h7l-5 9" />
    </>
  ),
  charger: (
    <>
      <rect x="10" y="34" width="44" height="17" rx="5" />
      <path d="M20 34V22h9v12M35 34V22h9v12M23 22v-7M26 22v-7M38 22v-7M41 22v-7" />
    </>
  ),
  blower: (
    <>
      <ellipse cx="25" cy="39" rx="15" ry="13" />
      <path d="M38 32l13-11M49 17l7 7" />
    </>
  ),
  cloth: (
    <>
      <path d="M10 22l22-9 22 9v21l-22 9-22-9z" />
      <path d="M10 22l22 9 22-9M32 31v21" />
    </>
  ),
  bottle: (
    <>
      <rect x="21" y="27" width="22" height="28" rx="6" />
      <path d="M27 27v-6h10v6M27 21h15l4 4M27 39h10" />
    </>
  ),
  swab: (
    <>
      <path d="M11 53 39 25" />
      <rect x="37" y="9" width="12" height="20" rx="3" transform="rotate(45 43 19)" />
    </>
  ),
  flash: (
    <>
      <rect x="17" y="8" width="30" height="19" rx="3" />
      <path d="M22 27v14h20V27M27 41v10h10V41M27 14h10M27 19h10" />
    </>
  ),
  softbox: (
    <>
      <path d="M13 13h38l-6 29H19z" />
      <path d="M24 13l2 29M32 13v29M40 13l-2 29M21 42v10h22V42" />
    </>
  ),
  'led-panel': (
    <>
      <rect x="9" y="11" width="46" height="31" rx="4" />
      <circle cx="21" cy="26" r="3.5" />
      <circle cx="32" cy="26" r="3.5" />
      <circle cx="43" cy="26" r="3.5" />
      <path d="M32 42v10M21 54h22" />
    </>
  ),
  filter: (
    <>
      <circle cx="32" cy="32" r="21" />
      <circle cx="32" cy="32" r="13" />
      <path d="M23 27a11 11 0 0 1 8-6" />
    </>
  ),
  lens: (
    <>
      <rect x="9" y="19" width="41" height="27" rx="4" />
      <rect x="50" y="26" width="6" height="13" rx="2" />
      <path d="M21 19v27M30 19v27M38 19v27" />
    </>
  ),
  rig: (
    <>
      <rect x="14" y="27" width="28" height="21" rx="3" />
      <path d="M9 22h40M9 53h40M14 22v-9M42 22v-9" />
      <circle cx="54" cy="38" r="4" />
    </>
  ),
  gimbal: (
    <>
      <rect x="26" y="35" width="12" height="21" rx="5" />
      <circle cx="32" cy="23" r="9" />
      <path d="M13 23h10M41 23h10M32 14V8" />
    </>
  ),
  strap: (
    <>
      <path d="M11 41c0-16 9-25 21-25s21 9 21 25" />
      <rect x="6" y="39" width="11" height="15" rx="2" />
      <rect x="47" y="39" width="11" height="15" rx="2" />
    </>
  ),
  drive: (
    <>
      <rect x="9" y="15" width="46" height="34" rx="5" />
      <circle cx="32" cy="32" r="9" />
      <path d="M15 22h4M45 42h4" />
    </>
  ),
  tape: (
    <>
      <circle cx="30" cy="32" r="20" />
      <circle cx="30" cy="32" r="7" />
      <path d="M50 32c0 5 4 8 9 8" />
    </>
  ),
  microphone: (
    <>
      <rect x="24" y="8" width="16" height="27" rx="8" />
      <path d="M17 31a15 15 0 0 0 30 0M32 46v9M24 55h16" />
    </>
  ),
  recorder: (
    <>
      <rect x="19" y="8" width="26" height="48" rx="5" />
      <circle cx="32" cy="23" r="7" />
      <path d="M26 39h12M26 45h12" />
    </>
  ),
  software: (
    <>
      <rect x="8" y="12" width="48" height="40" rx="5" />
      <path d="M8 23h48M18 36l6 5-6 5M30 46h13" />
      <circle cx="15" cy="17.5" r="1.4" />
      <circle cx="21" cy="17.5" r="1.4" />
    </>
  ),
  cloud: (
    <>
      <path d="M19 47a11 11 0 0 1-1-22 15 15 0 0 1 29 4 9 9 0 0 1-2 18z" />
      <path d="M32 33v13M26 38l6-6 6 6" />
    </>
  ),
  'color-swatch': (
    <>
      <rect x="9" y="9" width="21" height="21" rx="3" />
      <rect x="34" y="9" width="21" height="21" rx="3" />
      <rect x="9" y="34" width="21" height="21" rx="3" />
      <rect x="34" y="34" width="21" height="21" rx="3" />
    </>
  ),
  'business-cards': (
    <>
      <rect x="8" y="14" width="40" height="27" rx="3" />
      <rect x="16" y="25" width="40" height="27" rx="3" />
      <path d="M22 35h17M22 42h10" />
    </>
  ),
  headlamp: (
    <>
      <path d="M11 32c0-11 9-18 21-18s21 7 21 18" />
      <rect x="23" y="28" width="18" height="16" rx="4" />
      <circle cx="32" cy="36" r="3.5" />
    </>
  ),
  multitool: (
    <>
      <rect x="23" y="8" width="18" height="30" rx="7" />
      <path d="M28 38v18M36 38v18M28 56h8M32 14v12" />
    </>
  ),
  pouch: (
    <>
      <path d="M15 22h34l4 28a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4z" />
      <path d="M22 22v-5h20v5M19 34h26" />
    </>
  ),
  remote: (
    <>
      <rect x="19" y="8" width="26" height="48" rx="11" />
      <circle cx="32" cy="24" r="6" />
      <circle cx="26" cy="42" r="2.6" />
      <circle cx="38" cy="42" r="2.6" />
    </>
  ),
}

// The product's photo when it has one; otherwise (or if the photo can't be loaded)
// a soft tinted tile with its illustration. The tint is mixed into the theme's
// surface colour so it reads in light and dark mode.
export default function ProductArt({ product, className = '' }) {
  // Keyed by the photo's address so a changed photo gets a fresh chance to load.
  return <ProductPicture key={product.imageUrl || 'none'} product={product} className={className} />
}

function ProductPicture({ product, className }) {
  const [failed, setFailed] = useState(false)

  if (product.imageUrl && !failed) {
    return (
      <img
        src={product.imageUrl}
        alt={product.name}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`bg-surface-raised object-cover ${className}`}
      />
    )
  }

  const tint = CATEGORY_BY_KEY[product.category]?.tint || '#c15a3a'
  return (
    <div
      role="img"
      aria-label={product.name}
      className={`flex items-center justify-center ${className}`}
      style={{
        color: tint,
        background: `linear-gradient(145deg, color-mix(in srgb, ${tint} 16%, var(--color-surface)), color-mix(in srgb, ${tint} 6%, var(--color-surface)))`,
      }}
    >
      <svg
        viewBox="0 0 64 64"
        className="h-1/2 w-1/2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ICONS[product.iconKey] || ICONS.bag}
      </svg>
    </div>
  )
}

export const PRODUCT_ICON_KEYS = Object.keys(ICONS)
