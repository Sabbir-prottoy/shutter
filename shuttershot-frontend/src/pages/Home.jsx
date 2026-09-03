import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SearchBar from '../components/SearchBar'
import PhotographerCard from '../components/PhotographerCard'
import { getPhotographerPortfolio, searchPhotographers } from '../services/api'

// Local fallback for when no verified portfolio photos exist yet (e.g. a
// fresh install). A real public-domain photographer-in-action shot, not a
// themed placeholder — see hero-photographer.jpg's source in the repo notes.
const FALLBACK_HERO_IMAGE = '/hero-photographer.jpg'

// How many featured photographers to check for a portfolio photo before
// giving up and using the fallback. Fetched in parallel, so this can be
// generous without turning into a slow waterfall on page load.
const MAX_PHOTOGRAPHERS_TO_CHECK = 20

export default function Home() {
  const [photographers, setPhotographers] = useState([])
  const [status, setStatus] = useState('loading')
  const [heroImage, setHeroImage] = useState(FALLBACK_HERO_IMAGE)

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

        const firstWithPhoto = results.find(
          (result) => result.status === 'fulfilled' && result.value.length > 0,
        )
        if (firstWithPhoto) {
          setHeroImage(firstWithPhoto.value[0].imageUrl)
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
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <section className="grid flex-1 lg:grid-cols-[1.1fr_1fr]">
        <div className="hidden lg:block">
          <img
            src={heroImage}
            alt=""
            className="h-full max-h-[640px] w-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
          <h1 className="font-display text-5xl font-black leading-[1.05] text-ink sm:text-6xl lg:text-[4.5rem]">
            Find your
            <br />
            photographer.
          </h1>
          <p className="mt-6 max-w-md text-lg text-ink-muted">
            Browse verified local photographers, check live availability, and book your
            session — no account required.
          </p>

          <SearchBar className="mt-8 max-w-lg" />
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

      <Footer />
    </div>
  )
}
