import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SearchBar from '../components/SearchBar'
import PhotographerCard from '../components/PhotographerCard'
import PhotoFlipBook, { FLIP_ONLY } from '../components/PhotoFlipBook'
import Camera3D from '../components/Camera3D'
import { getPhotographerPortfolio, searchPhotographers } from '../services/api'

// How many featured photographers to check for a portfolio photo before
// giving up and using the fallback. Fetched in parallel, so this can be
// generous without turning into a slow waterfall on page load.
const MAX_PHOTOGRAPHERS_TO_CHECK = 20

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

export default function Home() {
  const [photographers, setPhotographers] = useState([])
  const [status, setStatus] = useState('loading')
  const [showcaseImages, setShowcaseImages] = useState([])

  useEffect(() => {
    let cancelled = false

    searchPhotographers()
      .then(async (data) => {
        if (cancelled) return
        setPhotographers(data)
        setStatus('ready')

        const candidates = data.slice(0, MAX_PHOTOGRAPHERS_TO_CHECK)
        const results = await Promise.allSettled(
          candidates.map((photographer) => getPhotographerPortfolio(photographer.id)),
        )
        if (cancelled) return

        const allImages = results
          .filter((result) => result.status === 'fulfilled')
          .flatMap((result) => result.value)
          .map((photo) => photo.imageUrl)

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
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-canvas">
      <Navbar />

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16 sm:px-12">
        <div className="w-full">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-4">
            <h1 className="font-display text-4xl font-black leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
              Find your
              <br />
              photographer.
            </h1>
            <Camera3D className="mt-6 hidden shrink-0 sm:block" />
          </div>

          <div className="mt-5 flex items-center gap-3">
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

          <SearchBar className="mt-8 max-w-lg" />

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
        <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">How it works</h2>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group rounded-card border border-border bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-hover"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-gradient font-display text-lg font-bold text-white transition-transform duration-300 group-hover:scale-110">
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
        <div className="flex flex-col items-start gap-6 rounded-card bg-accent-gradient px-8 py-12 text-white shadow-hover sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Are you a photographer?</h2>
            <p className="mt-2 max-w-md text-white/90">
              List your packages, manage your calendar, and get discovered by clients near
              you.
            </p>
          </div>
          <Link
            to="/register"
            className="shrink-0 rounded-card bg-white px-6 py-3 font-medium text-ink shadow-card transition-transform duration-200 hover:-translate-y-0.5 active:animate-nav-bounce"
          >
            Join as photographer
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
