import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import GameHeroArt from '../components/GameHeroArt'
import { triggerClickBurst } from '../components/ClickBurstLayer'
import { GAMES } from '../games'

const sidebarLinkClass = (active) =>
  `w-full rounded-card px-3 py-2 text-left text-sm font-medium transition-colors ${
    active ? 'bg-accent-gradient text-white shadow-card' : 'text-ink-muted hover:bg-surface-raised hover:text-ink'
  }`

export default function Entertainment() {
  const [selectedId, setSelectedId] = useState(null)
  const selected = GAMES.find((game) => game.id === selectedId)
  const location = useLocation()

  // Every navigation event lands here with a fresh location.key — including
  // clicking "Entertainment" in the navbar again while already on this page —
  // so this always brings the page back to its intro instead of leaving
  // whatever game was open still showing.
  useEffect(() => {
    setSelectedId(null)
  }, [location.key])

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:px-12 lg:flex-row">
        <aside className="shrink-0 lg:w-56">
          <h2 className="font-display text-lg font-bold text-ink">Games</h2>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {GAMES.map((game) => (
              <button
                key={game.id}
                type="button"
                onClick={() => setSelectedId(game.id)}
                className={sidebarLinkClass(selectedId === game.id)}
              >
                <span className="block whitespace-nowrap lg:whitespace-normal">Game-{game.id}</span>
                <span
                  className={`block text-xs ${selectedId === game.id ? 'text-white/80' : 'text-ink-muted'}`}
                >
                  {game.title}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          {!selected ? (
            <div>
              <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Entertainment</h1>
              <p className="mt-4 max-w-2xl text-lg text-ink-muted">
                Tired of searching for photographers or going back and forth with bookings? Take a
                break — play a quick game to relax. Pick any title from the left-sidebar to start.
              </p>

              <GameHeroArt className="mt-8 h-auto w-full max-w-2xl animate-float-slow rounded-card border border-border shadow-card" />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3">
                <h1 className="font-display text-2xl font-bold text-ink">
                  Game-{selected.id} — {selected.title}
                </h1>
                <Link
                  to="/"
                  onClick={(event) => triggerClickBurst(event.currentTarget)}
                  className="text-sm text-ink-muted underline transition-colors hover:text-accent"
                >
                  Back to Home
                </Link>
              </div>

              <div className="mt-6 overflow-x-auto rounded-card border border-border bg-surface p-6 shadow-card">
                <selected.Component />
              </div>

              {selected.instructions && (
                <div className="mt-6 rounded-card border border-border bg-surface-raised p-6 sm:p-8">
                  <p className="text-sm font-bold uppercase tracking-wide text-accent">How to play</p>
                  <p className="mt-3 max-w-3xl text-lg leading-relaxed text-ink">{selected.instructions}</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  )
}
