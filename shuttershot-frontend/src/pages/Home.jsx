import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SearchBar from '../components/SearchBar'
import PhotographerCard from '../components/PhotographerCard'
import { searchPhotographers } from '../services/api'

export default function Home() {
  const [photographers, setPhotographers] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false

    searchPhotographers()
      .then((data) => {
        if (!cancelled) {
          setPhotographers(data)
          setStatus('ready')
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
            src="https://picsum.photos/seed/shuttershot-hero/1200/1400"
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
