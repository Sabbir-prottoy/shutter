import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SearchBar from '../components/SearchBar'
import PhotographerCard from '../components/PhotographerCard'
import PhotoFlipBook, { FLIP_ONLY } from '../components/PhotoFlipBook'
import Camera3D from '../components/Camera3D'
import { getPhotographerPortfolio, searchPhotographersPage } from '../services/api'

// The home page only ever shows a handful of photographers (three avatars, six
// featured cards), so it asks for one small portion instead of the whole list.
// The extra ones are the pool checked for portfolio photos for the showcase.
const HOME_PHOTOGRAPHERS = 20

// Portfolios are requested a few photographers at a time and the search stops
// as soon as there are enough photos, rather than requesting all of them up
// front — the first photographer or two normally already have enough.
const PORTFOLIO_BATCH = 3

// Cap on how many real portfolio photos feed the flip-book showcase — it
// cycles through them forever, so it doesn't need the whole catalog.
const MAX_SHOWCASE_IMAGES = 8

// The showcase is meant to represent the range of work photographers book
// through the site, not just whatever happens to be uploaded on a fresh
// install — so it always includes one shot per category, and real portfolio
// photos (fetched below) are mixed in on top of these once they exist.
const CATEGORY_SHOWCASE_IMAGES = [
  { src: '/showcase/wedding.jpg', category: 'Wedding' },
  { src: '/showcase/portrait.jpg', category: 'Portrait' },
  { src: '/showcase/event.jpg', category: 'Event' },
  { src: '/showcase/landscape.jpg', category: 'Landscape' },
  { src: '/showcase/nature.jpg', category: 'Nature' },
  { src: '/showcase/fashion.jpg', category: 'Fashion' },
  { src: '/showcase/story/wedding-5.jpg', category: 'Wedding' },
  { src: '/showcase/story/wedding-6.jpg', category: 'Wedding' },
  { src: '/showcase/story/portrait-3.jpg', category: 'Portrait' },
  { src: '/showcase/story/portrait-4.jpg', category: 'Portrait' },
  { src: '/showcase/story/landscape-3.jpg', category: 'Night' },
  { src: '/showcase/story/engagement-1.jpg', category: 'Black & White' },
  { src: '/showcase/story/family-1.jpg', category: 'Family' },
  { src: '/showcase/story/architecture-1.jpg', category: 'Architecture' },
  { src: '/showcase/story/macro-1.jpg', category: 'Macro' },
  { src: '/showcase/story/night-1.jpg', category: 'Sunrise' },
  { src: '/showcase/story/product-1.jpg', category: 'Product' },
  { src: '/showcase/story/street-2.jpg', category: 'Celebration' },
  { src: '/showcase/story/drone-1.jpg', category: 'Adventure' },
  { src: '/showcase/story/concert-2.jpg', category: 'Event' },
  { src: '/showcase/story/beach-1.jpg', category: 'Beach' },
]

// A larger, distinct set for the hero's page-flip book — different photos
// than CATEGORY_SHOWCASE_IMAGES below so the two showcases on this page
// never show the same picture, with several wedding shots since that's the
// most common booking on the site.
const HERO_SHOWCASE_IMAGES = [
  { src: '/showcase/hero/wedding-1.jpg', category: 'Wedding' },
  { src: '/showcase/hero/wedding-2.jpg', category: 'Wedding' },
  { src: '/showcase/hero/wedding-3.jpg', category: 'Wedding' },
  { src: '/showcase/hero/wedding-4.jpg', category: 'Wedding' },
  { src: '/showcase/hero/portrait-1.jpg', category: 'Portrait' },
  { src: '/showcase/hero/portrait-2.jpg', category: 'Portrait' },
  { src: '/showcase/hero/event-1.jpg', category: 'Event' },
  { src: '/showcase/hero/landscape-1.jpg', category: 'Landscape' },
  { src: '/showcase/hero/landscape-2.jpg', category: 'Landscape' },
  { src: '/showcase/hero/fashion-1.jpg', category: 'Fashion' },
  { src: '/showcase/hero/newborn-1.jpg', category: 'Fitness' },
  { src: '/showcase/hero/maternity-1.jpg', category: 'Studio' },
  { src: '/showcase/hero/food-1.jpg', category: 'Food' },
  { src: '/showcase/hero/travel-1.jpg', category: 'Travel' },
  { src: '/showcase/hero/corporate-1.jpg', category: 'Corporate' },
  { src: '/showcase/hero/interior-1.jpg', category: 'Interior' },
  { src: '/showcase/hero/pet-1.jpg', category: 'Pet' },
  { src: '/showcase/hero/street-1.jpg', category: 'Cityscape' },
  { src: '/showcase/hero/sports-1.jpg', category: 'Sports' },
]

const steps = [
  {
    title: 'Search',
    body: 'Browse verified local photographers by style and location, and see real availability up front.',
  },
  {
    title: 'Book',
    body: 'Pick a package and an open date, then confirm your spot with a quick phone verification.',
  },
  {
    title: 'Shoot',
    body: 'Meet your photographer on the day, and leave a review once your session is complete.',
  },
]

// One accent color per step badge (peach / green / lavender), matching the
// reference layout's three distinct circle colors rather than one repeated hue.
const STEP_BADGE_STYLES = ['bg-accent/15 text-accent', 'bg-free/15 text-free', 'bg-[#ece7fb] text-[#8874c9]']

export default function Home() {
  const [photographers, setPhotographers] = useState([])
  const [totalPhotographers, setTotalPhotographers] = useState(0)
  const [status, setStatus] = useState('loading')
  const [showcaseImages, setShowcaseImages] = useState([])

  useEffect(() => {
    let cancelled = false

    searchPhotographersPage({ page: 0, size: HOME_PHOTOGRAPHERS })
      .then(async (data) => {
        if (cancelled) return
        setPhotographers(data.items)
        setTotalPhotographers(data.total)
        setStatus('ready')

        const allImages = []
        for (let i = 0; i < data.items.length && allImages.length < MAX_SHOWCASE_IMAGES; i += PORTFOLIO_BATCH) {
          const batch = data.items.slice(i, i + PORTFOLIO_BATCH)
          const results = await Promise.allSettled(
            batch.map((photographer) => getPhotographerPortfolio(photographer.id)),
          )
          if (cancelled) return

          results
            .filter((result) => result.status === 'fulfilled')
            .flatMap((result) => result.value)
            .forEach((photo) => allImages.push(photo.imageUrl))
        }

        if (allImages.length > 0) {
          setShowcaseImages(
            allImages.slice(0, MAX_SHOWCASE_IMAGES).map((src) => ({ src, category: null })),
          )
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-canvas">
      <Navbar />

      {status === 'ready' && photographers.length > 0 && (
        <div className="mx-auto mt-6 w-full max-w-6xl px-6 sm:px-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-free/15 py-1.5 pl-1.5 pr-3">
            <div className="flex -space-x-2">
              {photographers.slice(0, 3).map((photographer, index) => (
                <span
                  key={photographer.id}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface text-[10px] font-semibold text-white"
                  style={{ backgroundColor: ['#c15a3a', '#e8b34f', '#6d8fd6'][index] }}
                >
                  {photographer.name?.charAt(0) || '?'}
                </span>
              ))}
            </div>
            <span className="text-sm font-medium text-free">
              {totalPhotographers}+ photographers joined
            </span>
          </div>
        </div>
      )}

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-16 pt-10 sm:px-12">
        <div className="w-full">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-4xl font-black leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
                Find your
                <br />
                photographer..
              </h1>

              <div className="mt-16 flex items-center gap-3">
                <span
                  className="h-1.5 w-20 rounded-full bg-[length:200%_100%] animate-gradient-flow"
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, #c15a3a, #e8b34f, #8db5a0, #6d8fd6, #e0729a, #c15a3a)',
                  }}
                />
                <div className="flex items-center gap-1.5">
                  {['#c15a3a', '#e8b34f', '#8db5a0', '#6d8fd6', '#e0729a'].map((color, index) => (
                    <span
                      key={color}
                      className="h-2.5 w-2.5 rounded-full animate-dot-bounce"
                      style={{ backgroundColor: color, animationDelay: `${index * 0.12}s` }}
                    />
                  ))}
                </div>
              </div>

              <p className="mt-4 max-w-md text-lg text-ink-muted">
                Browse verified local photographers, check live availability, and book your
                session — no account required.
              </p>

              {status === 'ready' && (
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-muted">
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-accent" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                      </svg>
                    </span>
                    Verified profiles
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-accent" fill="currentColor">
                        <path d="M12 2.5l2.9 6.4 6.9.7-5.2 4.8 1.5 6.9L12 17.9l-6.1 3.4 1.5-6.9-5.2-4.8 6.9-.7z" />
                      </svg>
                    </span>
                    {/* Fixed placeholder — no photographer has a real review yet to average. */}
                    4.9 avg rating
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
                      </svg>
                    </span>
                    Free to browse
                  </span>
                </div>
              )}

              <SearchBar className="mt-8 w-full max-w-5xl" />
            </div>

            <Camera3D className="mt-6 hidden shrink-0 sm:block" />
          </div>

          <div className="mt-12 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div className="max-w-lg">
              <PhotoFlipBook images={HERO_SHOWCASE_IMAGES} effects={FLIP_ONLY} />
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                Every style, ready to book.
              </h2>
              <p className="mt-4 max-w-md text-ink-muted">
                Weddings to wildlife, portraits to product shoots — whatever look you're
                after, a verified ShutterShot photographer already shoots it.
              </p>
              <p className="mt-4 max-w-md text-ink-muted">
                Search by style, check who's free this week, and lock in your session in
                minutes — no back-and-forth emails required.
              </p>
              <p className="mt-4 max-w-md text-ink-muted">
                Every photographer's profile shows exactly what they specialize in, so
                you know what you're booking before you commit.
              </p>
              <Link
                to="/search"
                className="mt-6 inline-block rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover active:animate-nav-bounce"
              >
                Explore styles
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Process</p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-[1.1] text-ink sm:text-5xl">
              Three steps,
              <br />
              one <span className="italic text-accent">session.</span>
            </h2>
          </div>
          <p className="max-w-sm text-ink-muted sm:text-right">
            Browse verified photographers, book a package, and confirm your spot — no
            back-and-forth messages.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group rounded-card border border-border bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-hover"
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full font-display text-lg font-bold transition-transform duration-300 group-hover:scale-110 ${STEP_BADGE_STYLES[index]}`}
              >
                {index + 1}
              </span>
              <h3 className="mt-4 font-display text-xl font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-ink-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden py-20">
        <div
          aria-hidden="true"
          className="absolute -left-24 top-10 h-72 w-72 animate-float-slow rounded-full bg-accent/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -right-16 bottom-0 h-80 w-80 animate-float-slower rounded-full bg-free/25 blur-3xl"
        />

        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 sm:px-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
              Every session tells a story.
            </h2>
            <p className="mt-4 max-w-md text-ink-muted">
              Real work from real ShutterShot photographers — one frame turning into the
              next, the way a portfolio should feel.
            </p>
            <p className="mt-4 max-w-md text-ink-muted">
              Weddings, portraits, events, landscapes, family sessions, and more — every
              style of shoot booked through ShutterShot shows up here, straight from the
              photographers who shot it.
            </p>
            <p className="mt-4 max-w-md text-ink-muted">
              Every photographer on the platform is verified before their work appears,
              so what you see in this rotation is exactly the quality you'll get when you
              book.
            </p>
            <Link
              to="/search"
              className="mt-8 inline-block rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover active:animate-nav-bounce"
            >
              Browse photographers
            </Link>
          </div>

          <PhotoFlipBook images={[...CATEGORY_SHOWCASE_IMAGES, ...showcaseImages]} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-12">
        <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Featured photographers
        </h2>

        {status === 'loading' && (
          <p className="mt-8 text-ink-muted">Loading photographers…</p>
        )}

        {status === 'error' && (
          <p className="mt-8 text-ink-muted">
            We couldn't load photographers right now. Please check your connection and try
            again.
          </p>
        )}

        {status === 'ready' && photographers.length === 0 && (
          <p className="mt-8 text-ink-muted">
            No photographers yet — check back soon.
          </p>
        )}

        {status === 'ready' && photographers.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {photographers.slice(0, 6).map((photographer) => (
              <PhotographerCard key={photographer.id} photographer={photographer} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20 sm:px-12">
        <div className="flex flex-col items-center gap-10 rounded-card bg-accent/15 px-8 py-12 sm:px-12 lg:flex-row lg:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              For photographers
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-[1.05] text-ink sm:text-5xl">
              Turn your lens into a <span className="italic text-accent">living.</span>
            </h2>
            <p className="mt-4 max-w-md text-ink-muted">
              List your packages, manage your calendar, and get discovered by clients near
              you.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-card bg-ink px-6 py-3 font-medium text-surface shadow-card transition-transform duration-200 hover:-translate-y-0.5 active:animate-nav-bounce"
              >
                Join as photographer
                <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link
                to="/faq"
                className="rounded-card border border-ink/20 px-6 py-3 font-medium text-ink transition-colors hover:bg-surface"
              >
                Learn more
              </Link>
            </div>
          </div>

          <div className="w-full max-w-sm shrink-0 rounded-card bg-surface p-4 shadow-card">
            <img
              src="/camera/camera-2.jpg"
              alt="A camera, ready for a shoot"
              className="h-auto w-full rounded-card object-cover"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
