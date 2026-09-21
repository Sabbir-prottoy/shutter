import { useEffect, useState } from 'react'

// Fires a burst centered on the given element (e.g. a button/link) — used by
// Navbar's "Log in" link. A plain function, not a hook, so it can be called
// straight from an onClick handler.
export function triggerClickBurst(element) {
  const rect = element.getBoundingClientRect()
  window.dispatchEvent(
    new CustomEvent('click-burst', {
      detail: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
    }),
  )
}

const SPARK_COLORS = ['#c15a3a', '#e8b34f', '#8db5a0', '#6d8fd6', '#e0729a']
const SPARK_COUNT = 10
const BURST_LIFETIME_MS = 850

let nextBurstId = 0

// Mounted once at the app root (see App.jsx), sibling to <Routes> — not
// inside any single page — so a burst triggered by a navigating link (like
// "Log in") keeps playing even though the page underneath it unmounts.
export default function ClickBurstLayer() {
  const [bursts, setBursts] = useState([])

  useEffect(() => {
    function handleBurst(event) {
      const id = ++nextBurstId
      setBursts((prev) => [...prev, { id, ...event.detail }])
      setTimeout(() => {
        setBursts((prev) => prev.filter((burst) => burst.id !== id))
      }, BURST_LIFETIME_MS)
    }

    window.addEventListener('click-burst', handleBurst)
    return () => window.removeEventListener('click-burst', handleBurst)
  }, [])

  if (bursts.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]" aria-hidden="true">
      {bursts.map((burst) => (
        <div key={burst.id} className="absolute" style={{ left: burst.x, top: burst.y }}>
          <span
            className="absolute h-6 w-6 animate-burst-ring rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(193,90,58,0.6), rgba(193,90,58,0))',
            }}
          />
          {Array.from({ length: SPARK_COUNT }).map((_, index) => {
            const angle = (360 / SPARK_COUNT) * index + (Math.random() * 18 - 9)
            const distance = 44 + Math.random() * 28
            const radians = (angle * Math.PI) / 180

            return (
              <span
                key={index}
                className="absolute h-2.5 w-2.5 animate-burst-spark rounded-full"
                style={{
                  backgroundColor: SPARK_COLORS[index % SPARK_COLORS.length],
                  '--burst-dx': `${Math.cos(radians) * distance}px`,
                  '--burst-dy': `${Math.sin(radians) * distance}px`,
                  animationDelay: `${Math.random() * 50}ms`,
                }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
