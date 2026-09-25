import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { triggerClickBurst } from '../components/ClickBurstLayer'
import { getPoses } from '../services/api'

// Structured as a list so more "Suggestions" topics can be added later
// without redesigning the page.
const TOPICS = [
  { id: 'categories', label: 'Photoshoot category overview' },
  { id: 'poses', label: 'Photoshoot pose' },
]

// Reference photos are admin-managed (see the "Manage pose" admin panel) and
// fetched live from GET /api/poses — each subsection covers a genre the rest
// of the site's four search categories don't fully capture on their own
// (couple and family shoots are common bookings that don't map neatly to
// "portrait" or "wedding" alone), plus the two the user asked for by name
// (wedding, portrait) and "aesthetic" for stylised individual/editorial shoots.
const POSE_SUBSECTIONS = [
  { slug: 'wedding', label: 'Wedding photoshoot pose' },
  { slug: 'portrait', label: 'Portrait photoshoot pose' },
  { slug: 'aesthetic', label: 'Aesthetic photoshoot pose' },
  { slug: 'couple', label: 'Couple photoshoot pose' },
  { slug: 'family', label: 'Family photoshoot pose' },
]

function WeddingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8" cy="15" r="5" />
      <circle cx="16" cy="15" r="5" />
      <path strokeLinecap="round" d="M12 5V3M9 3h6" />
    </svg>
  )
}

function PortraitIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  )
}

function EventIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20l3-9 5 3 3-8 5 14H4z" />
      <circle cx="18" cy="5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="7" cy="6" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function LandscapeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="17" cy="6" r="2.2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 19l6-8 4 5 2-3 6 6H3z" />
    </svg>
  )
}

// The four categories the rest of the site already searches, filters, and
// tags portfolio photos by (SearchBar.jsx, ImageCategory on the backend) —
// this page explains the same four, not a different list, so "Find
// photographers" always leads to real, matching results.
const CATEGORIES = [
  {
    value: 'wedding',
    title: 'Wedding',
    Icon: WeddingIcon,
    summary: 'Full-day coverage of the ceremony, reception, and the couple.',
    details:
      'Covers everything from getting-ready shots and the ceremony itself to reception candids and posed couple portraits. Many photographers also offer holud and pre-wedding shoots as add-ons.',
    goodFor: ['Wedding day and reception', 'Holud and pre-wedding shoots', 'Family group portraits on the day'],
    lookFor: 'Someone experienced with your specific ceremony traditions, available for the full event length you need, with a clear turnaround time for edited photos.',
  },
  {
    value: 'portrait',
    title: 'Portrait',
    Icon: PortraitIcon,
    summary: 'Individual or small-group sessions, studio or outdoors.',
    details:
      'A focused session built around one or two subjects rather than a large event — professional headshots, family portraits, graduation photos, or maternity and newborn sessions.',
    goodFor: ['Professional headshots', 'Family or couple portraits', 'Graduation, maternity, or newborn shoots'],
    lookFor: 'A portfolio in a style you actually like (studio-lit vs. natural light), and clarity on how many edited photos you get.',
  },
  {
    value: 'event',
    title: 'Event',
    Icon: EventIcon,
    summary: 'Birthdays, corporate events, and other gatherings.',
    details:
      'Documents a gathering as it happens — candid crowd moments, speeches, performances, and group shots — rather than posed individual portraits.',
    goodFor: ['Birthdays and anniversaries', 'Corporate events and conferences', 'Cultural and religious celebrations'],
    lookFor: 'Someone comfortable working unobtrusively in a crowd, with fast turnaround if you need photos shared soon after.',
  },
  {
    value: 'landscape',
    title: 'Landscape',
    Icon: LandscapeIcon,
    summary: 'Travel, nature, architecture, and outdoor scenes.',
    details:
      'Photography of places rather than people — travel and nature shoots, architecture and interiors, or cityscapes, often for personal prints, brand content, or real estate.',
    goodFor: ['Travel and nature photography', 'Architecture and interiors', 'Real estate and location shoots'],
    lookFor: 'A portfolio shot in conditions similar to yours (time of day, season, indoor vs. outdoor), since lighting matters most here.',
  },
]

const sidebarLinkClass = (active) =>
  `w-full rounded-full border px-5 py-2.5 text-left text-sm font-medium shadow-card transition-colors ${
    active
      ? 'border-transparent bg-accent-gradient text-white'
      : 'border-border bg-surface text-ink-muted hover:border-accent hover:text-accent'
  }`

const poseTabClass = (active) =>
  `rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
    active
      ? 'border-transparent bg-accent-gradient text-white shadow-card'
      : 'border-border bg-surface text-ink-muted hover:border-accent hover:text-accent'
  }`

export default function Suggestions() {
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [selectedPose, setSelectedPose] = useState(POSE_SUBSECTIONS[0].slug)
  const [posesBySlug, setPosesBySlug] = useState({})
  const [posesStatus, setPosesStatus] = useState('loading')
  const location = useLocation()

  // Clicking "Suggestions" in the navbar again while already on this page
  // still gets a fresh location.key, so this always resets to the intro
  // instead of leaving whatever topic was open still showing.
  useEffect(() => {
    setSelectedTopic(null)
  }, [location.key])

  useEffect(() => {
    getPoses()
      .then((data) => {
        setPosesBySlug(data)
        setPosesStatus('ready')
      })
      .catch(() => setPosesStatus('error'))
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 sm:px-12 lg:flex-row">
        <aside className="shrink-0 lg:w-64">
          <h2 className="font-display text-lg font-bold text-ink">Suggestions</h2>
          <nav className="mt-3 flex flex-col gap-2">
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => setSelectedTopic(topic.id)}
                className={sidebarLinkClass(selectedTopic === topic.id)}
              >
                {topic.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          {selectedTopic === null && (
            <div>
              <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Suggestions</h1>
              <p className="mt-4 max-w-2xl text-2xl text-ink-muted">
                Not sure what kind of shoot you need, or which photographer fits it best?{' '}
                <span className="text-blue-600">Pick a topic from the left</span> to get guidance
                before you search or book.
              </p>

              <img
                src="/hero-photographer.jpg"
                alt="A photographer lining up a shot outdoors with a camera on a tripod"
                className="mt-8 h-auto w-full max-w-2xl rounded-card border border-border object-cover shadow-card"
              />
            </div>
          )}

          {selectedTopic === 'poses' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                Photoshoot pose
              </h1>
              <p className="mt-3 max-w-2xl text-ink-muted">
                Real examples to show your photographer, or just to see what's possible before you
                book. Pick a style below.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {POSE_SUBSECTIONS.map((sub) => (
                  <button
                    key={sub.slug}
                    type="button"
                    onClick={() => setSelectedPose(sub.slug)}
                    className={poseTabClass(selectedPose === sub.slug)}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {posesStatus === 'loading' && (
                <p className="mt-6 text-ink-muted">Loading examples…</p>
              )}

              {posesStatus === 'error' && (
                <p className="mt-6 text-ink-muted">
                  We couldn't load examples right now. Please check your connection and try again.
                </p>
              )}

              {posesStatus === 'ready' && (posesBySlug[selectedPose] || []).length === 0 && (
                <p className="mt-6 text-ink-muted">No examples here yet — check back soon.</p>
              )}

              {posesStatus === 'ready' && (posesBySlug[selectedPose] || []).length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {(posesBySlug[selectedPose] || []).map((photo, i) => (
                    <img
                      key={photo.id}
                      src={photo.imageUrl}
                      alt={`${POSE_SUBSECTIONS.find((s) => s.slug === selectedPose).label} example ${i + 1}`}
                      loading="lazy"
                      className="aspect-[3/4] w-full rounded-card border border-border object-cover shadow-card"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTopic === 'categories' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                Photoshoot category overview
              </h1>
              <p className="mt-3 max-w-2xl text-ink-muted">
                ShutterShot photographers are searchable by these four categories. Here's what
                each one actually covers, so you can pick the right one before you search.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {CATEGORIES.map(({ value, title, Icon, summary, details, goodFor, lookFor }) => (
                  <div key={value} className="rounded-card border border-border bg-surface p-6 shadow-card">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                        <Icon />
                      </span>
                      <div>
                        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
                        <p className="text-sm text-ink-muted">{summary}</p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-ink-muted">{details}</p>

                    <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-ink-muted">
                      Good for
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-ink-muted">
                      {goodFor.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-accent">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-4 text-sm text-ink-muted">
                      <span className="font-medium text-ink">What to look for: </span>
                      {lookFor}
                    </p>

                    <Link
                      to={`/search?category=${value}`}
                      onClick={(event) => triggerClickBurst(event.currentTarget)}
                      className="mt-5 inline-block rounded-card bg-accent-gradient px-4 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
                    >
                      Find {title.toLowerCase()} photographers
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  )
}
