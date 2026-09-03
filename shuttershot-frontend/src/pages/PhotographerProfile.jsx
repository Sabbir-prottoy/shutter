import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PortfolioGrid from '../components/PortfolioGrid'
import PackageCard from '../components/PackageCard'
import AvailabilityCalendar from '../components/AvailabilityCalendar'
import { getPhotographer, getPhotographerPackages, getPhotographerPortfolio } from '../services/api'

export default function PhotographerProfile() {
  const { id } = useParams()

  const [profile, setProfile] = useState(null)
  const [portfolio, setPortfolio] = useState([])
  const [packages, setPackages] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    Promise.all([getPhotographer(id), getPhotographerPortfolio(id), getPhotographerPackages(id)])
      .then(([profileData, portfolioData, packagesData]) => {
        if (cancelled) return
        setProfile(profileData)
        setPortfolio(portfolioData)
        setPackages(packagesData)
        setStatus('ready')
      })
      .catch((error) => {
        if (cancelled) return
        setStatus(error?.response?.status === 404 ? 'not-found' : 'error')
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (status === 'loading') {
    return (
      <PageShell>
        <p className="text-ink-muted">Loading photographer…</p>
      </PageShell>
    )
  }

  if (status === 'not-found') {
    return (
      <PageShell>
        <h1 className="font-display text-3xl font-bold text-ink">Photographer not found</h1>
        <p className="mt-3 text-ink-muted">
          This photographer may have moved or no longer exists.
        </p>
        <Link
          to="/search"
          className="mt-6 inline-block rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover"
        >
          Find a photographer
        </Link>
      </PageShell>
    )
  }

  if (status === 'error') {
    return (
      <PageShell>
        <p className="text-ink-muted">
          We couldn't load this profile right now. Please check your connection and try again.
        </p>
      </PageShell>
    )
  }

  const { name, bio, profilePhotoUrl, baseLocation, specialties, yearsExperience, ratingAvg, totalReviews, verified } =
    profile

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <section className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
          {profilePhotoUrl && (
            <img
              src={profilePhotoUrl}
              alt={name}
              className="h-32 w-32 shrink-0 rounded-card object-cover shadow-card sm:h-40 sm:w-40"
            />
          )}

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl font-bold text-ink">{name}</h1>
              {verified && (
                <span className="rounded-full bg-free/20 px-2.5 py-1 text-xs font-medium text-free">
                  Verified
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
              {baseLocation && <span>{baseLocation}</span>}
              {yearsExperience != null && (
                <span>{yearsExperience} year{yearsExperience === 1 ? '' : 's'} experience</span>
              )}
              {ratingAvg > 0 ? (
                <span>
                  <span className="font-medium text-ink">{ratingAvg.toFixed(1)}</span> (
                  {totalReviews} review{totalReviews === 1 ? '' : 's'})
                </span>
              ) : (
                <span>No reviews yet</span>
              )}
            </div>

            {specialties.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="rounded-full border border-border px-2.5 py-0.5 text-xs text-ink-muted"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            )}

            {bio && <p className="mt-4 max-w-2xl text-ink-muted">{bio}</p>}

            <Link
              to={`/book/${id}`}
              className="mt-6 inline-block rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover"
            >
              Book session
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full py-4">
        <h2 className="mx-auto max-w-6xl px-6 font-display text-3xl font-bold text-ink sm:px-12">
          Portfolio
        </h2>
        <div className="mt-6">
          <PortfolioGrid images={portfolio} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-12">
        <h2 className="font-display text-3xl font-bold text-ink">Packages</h2>
        {packages.length === 0 ? (
          <p className="mt-6 text-ink-muted">No packages available yet.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-12">
        <h2 className="font-display text-3xl font-bold text-ink">Availability</h2>
        <div className="mt-6 max-w-md">
          <AvailabilityCalendar photographerId={id} />
        </div>
      </section>

      <Footer />
    </div>
  )
}

function PageShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 text-center">
        {children}
      </main>
      <Footer />
    </div>
  )
}
