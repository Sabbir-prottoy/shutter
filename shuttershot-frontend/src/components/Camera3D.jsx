import { useRef, useState } from 'react'

const MAX_TILT_DEG = 16

/**
 * A real camera photo (not an illustration) presented as a floating 3D
 * card: a soft glow behind it, the photo itself, and a glossy diagonal
 * sheen in front sit on three depth planes inside one perspective scene.
 * It drifts on its own (camera-drift) when idle, and pauses that to follow
 * the cursor directly on hover — same interaction model as the earlier
 * SVG version, just built around a genuine photograph this time.
 */
export default function Camera3D({ className = '' }) {
  const sceneRef = useRef(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const [hovering, setHovering] = useState(false)

  function handleMouseMove(event) {
    const rect = sceneRef.current.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    setTilt({ rx: py * -MAX_TILT_DEG, ry: px * MAX_TILT_DEG })
  }

  function handleMouseLeave() {
    setHovering(false)
    setTilt({ rx: 0, ry: 0 })
  }

  return (
    <div className={`relative h-52 w-52 sm:h-72 sm:w-72 lg:h-80 lg:w-80 xl:h-[26rem] xl:w-[26rem] ${className}`} style={{ perspective: '1200px' }}>
      {/* Ambient backdrop glow — drifts on its own, independent of cursor tilt */}
      <div
        aria-hidden="true"
        className="absolute inset-4 animate-float-slow rounded-full bg-accent-gradient opacity-30 blur-2xl"
      />

      {/* Soft contact shadow, grounding the card in place */}
      <div
        aria-hidden="true"
        className="absolute bottom-1 left-1/2 h-4 w-2/3 -translate-x-1/2 rounded-full bg-ink/25 blur-md"
      />

      {/* Idle wander — always slowly turning on its own; paused while the
          cursor is driving the tilt directly so the two don't fight. */}
      <div
        className="relative h-full w-full animate-camera-drift [transform-style:preserve-3d]"
        style={{ animationPlayState: hovering ? 'paused' : 'running' }}
      >
        <div
          ref={sceneRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={handleMouseLeave}
          className="relative h-full w-full cursor-pointer [transform-style:preserve-3d]"
          style={{
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${hovering ? 1.06 : 1})`,
            transition: hovering ? 'transform 100ms ease-out' : 'transform 500ms ease-out',
            filter: 'drop-shadow(0 20px 24px rgba(30, 27, 22, 0.25))',
          }}
        >
          {/* Second photo — peeking out behind, offset down-and-right,
              clipping under the front card for a stacked-photos look */}
          <div
            className="absolute inset-2 top-8 left-10 overflow-hidden rounded-2xl border border-border shadow-card"
            style={{ transform: 'translateZ(-18px) rotate(7deg)' }}
          >
            <img
              src="/camera/camera-2.jpg"
              alt="Photographer"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Front photo */}
          <div
            className="absolute inset-2 overflow-hidden rounded-2xl border border-border"
            style={{ transform: 'translateZ(10px) rotate(-3deg)' }}
          >
            <img
              src="/camera/camera.jpg"
              alt="Photographer"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Glossy diagonal sheen — floats forward for a glass-like highlight */}
          <div
            className="absolute inset-2 overflow-hidden rounded-2xl"
            style={{ transform: 'translateZ(28px) rotate(-3deg)' }}
          >
            <div
              className="absolute -inset-full"
              style={{
                background:
                  'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
