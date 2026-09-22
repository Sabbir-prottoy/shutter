import { useEffect, useState } from 'react'

const CYCLE_INTERVAL_MS = 3200
const TRANSITION_MS = 850

// Five distinct transition styles, cycled round-robin so consecutive slide
// changes never repeat the same motion back to back. Each entry describes
// the outgoing (front) layer's rest -> active transform/opacity and the
// incoming (back) layer's start -> rest transform/opacity; both animate at
// once. "flip" is the odd one out — its back layer never moves, it just
// sits static underneath while the front layer turns away like a page.
const EFFECTS = [
  {
    name: 'flip',
    threeD: true,
    outRest: 'rotateY(0deg)',
    outActive: 'rotateY(-165deg)',
    inStart: 'none',
    inRest: 'none',
  },
  {
    name: 'slide',
    outRest: 'translateX(0%)',
    outActive: 'translateX(-108%)',
    inStart: 'translateX(108%)',
    inRest: 'translateX(0%)',
  },
  {
    name: 'fade-zoom',
    outRest: 'scale(1)',
    outActive: 'scale(1.1)',
    outActiveOpacity: 0,
    inStart: 'scale(0.92)',
    inStartOpacity: 0,
    inRest: 'scale(1)',
  },
  {
    name: 'slide-up',
    outRest: 'translateY(0%)',
    outActive: 'translateY(-12%)',
    outActiveOpacity: 0,
    inStart: 'translateY(12%)',
    inStartOpacity: 0,
    inRest: 'translateY(0%)',
  },
  {
    name: 'rotate-fade',
    outRest: 'rotate(0deg) scale(1)',
    outActive: 'rotate(-7deg) scale(0.94)',
    outActiveOpacity: 0,
    inStart: 'rotate(7deg) scale(0.94)',
    inStartOpacity: 0,
    inRest: 'rotate(0deg) scale(1)',
  },
]

// Exported so a caller can lock the show to a single effect, e.g.
// <PhotoFlipBook effects={FLIP_ONLY} /> for a "just page-turns" instance.
export const FLIP_ONLY = [EFFECTS[0]]

/**
 * A slideshow, not a static picture: two stacked layers ping-pong through
 * the image list forever. By default each transition picks the next effect
 * off a five-style rotation (page flip, slide, fade+zoom, slide-up,
 * rotate+fade); pass a shorter `effects` list (e.g. FLIP_ONLY) to restrict
 * it to just one of those styles instead.
 */
export default function PhotoFlipBook({ images, effects = EFFECTS }) {
  const [order, setOrder] = useState([0, 1 % Math.max(images.length, 1)])
  const [effectIndex, setEffectIndex] = useState(0)
  const [active, setActive] = useState(false)

  useEffect(() => {
    setOrder([0, 1 % Math.max(images.length, 1)])
  }, [images])

  useEffect(() => {
    if (images.length < 2) return undefined

    const interval = setInterval(() => {
      setActive(true)
      const settle = setTimeout(() => {
        setOrder(([, next]) => [next, (next + 1) % images.length])
        setEffectIndex((index) => (index + 1) % effects.length)
        setActive(false)
      }, TRANSITION_MS)
      return () => clearTimeout(settle)
    }, CYCLE_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [images.length, effects.length])

  if (images.length === 0) {
    return null
  }

  const [frontIndex, backIndex] = order
  const effect = effects[effectIndex % effects.length]

  const frontStyle = active
    ? {
        transform: effect.outActive,
        opacity: effect.outActiveOpacity ?? 1,
        transition: `transform ${TRANSITION_MS}ms cubic-bezier(0.45, 0.05, 0.55, 0.95), opacity ${TRANSITION_MS}ms ease`,
      }
    : { transform: effect.outRest, opacity: 1, transition: 'none' }

  const backStyle = active
    ? {
        transform: effect.inRest,
        opacity: effect.inRestOpacity ?? 1,
        transition: `transform ${TRANSITION_MS}ms cubic-bezier(0.45, 0.05, 0.55, 0.95), opacity ${TRANSITION_MS}ms ease`,
      }
    : { transform: effect.inStart, opacity: effect.inStartOpacity ?? 1, transition: 'none' }

  const front = images[frontIndex]
  const back = images[backIndex]

  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-sm [perspective:1800px]">
      {/* Resting stack peeking out behind, for a "book" thickness feel */}
      <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-card border border-border bg-surface-raised" />
      <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-card border border-border bg-surface-raised" />

      {/* Back layer — the next photo, animating into place (or static, for flip) */}
      <div className="absolute inset-0" style={backStyle}>
        <img
          src={back.src}
          alt=""
          className="absolute inset-0 h-full w-full rounded-card border border-border object-cover shadow-card"
        />
      </div>

      {/* Front layer — the current photo, animating away each cycle */}
      <div
        className="absolute inset-0 [backface-visibility:hidden] [transform-style:preserve-3d]"
        style={{ ...frontStyle, transformOrigin: effect.threeD ? '0% 50%' : '50% 50%' }}
      >
        <img
          src={front.src}
          alt=""
          className="absolute inset-0 h-full w-full rounded-card border border-border object-cover shadow-hover [backface-visibility:hidden]"
        />
        {front.category && (
          <span className="absolute bottom-3 left-3 rounded-full bg-scrim/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {front.category}
          </span>
        )}
      </div>
    </div>
  )
}
