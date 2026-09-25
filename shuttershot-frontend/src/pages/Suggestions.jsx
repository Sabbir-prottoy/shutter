import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { triggerClickBurst } from '../components/ClickBurstLayer'
import { getMusic, getPhotoshootCategories, getPoses } from '../services/api'

// Structured as a list so more "Suggestions" topics can be added later
// without redesigning the page.
const TOPICS = [
  { id: 'categories', label: 'Photoshoot category overview' },
  { id: 'poses', label: 'Photoshoot pose' },
  { id: 'music', label: 'Music suggestions' },
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

// The three wedding-song languages, in display order. Which songs sit under
// each one (and the event music) comes from the admin-managed list.
const WEDDING_LANGUAGES = [
  { id: 'bangla', title: 'Bangla' },
  { id: 'english', title: 'English' },
  { id: 'hindi', title: 'Hindi' },
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

// Each built-in category keeps its own icon, keyed by the ?category= value the
// site's photographer search uses. The text on every card (built-in or added by
// an admin) comes from the database, so admins can edit it.
const CATEGORY_ICONS = {
  wedding: WeddingIcon,
  portrait: PortraitIcon,
  event: EventIcon,
  landscape: LandscapeIcon,
}

// Icon for categories admins add (the four built-in ones each have their own).
function GenericCategoryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l1.5-3h5L16 7" />
      <circle cx="12" cy="13.5" r="3.2" />
    </svg>
  )
}

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

// A dotted list where each name opens its YouTube video in a new tab - the
// song plays on YouTube, never inside ShutterShot. The dot is drawn rather than
// using a list marker, so its size and position are fully controlled.
function MusicList({ items, className = '', emptyText = 'Nothing here yet.' }) {
  if (items.length === 0) {
    return <p className={`text-sm text-ink-muted ${className}`}>{emptyText}</p>
  }

  return (
    <ul className={`space-y-3 ${className}`}>
      {items.map((item) => (
        <li
          key={item.id}
          className="relative break-inside-avoid pl-7 before:absolute before:left-1 before:top-[0.4rem] before:h-3 before:w-3 before:rounded-full before:bg-accent before:content-['']"
        >
          <a
            href={item.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Opens on YouTube in a new tab"
            className="font-medium text-ink transition-colors hover:text-accent hover:underline"
          >
            {item.title}
          </a>
          {item.credit && <span className="block text-xs text-ink-muted">{item.credit}</span>}
        </li>
      ))}
    </ul>
  )
}

export default function Suggestions() {
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [selectedPose, setSelectedPose] = useState(POSE_SUBSECTIONS[0].slug)
  const [posesBySlug, setPosesBySlug] = useState({})
  const [posesStatus, setPosesStatus] = useState('loading')
  const [musicByCategory, setMusicByCategory] = useState({})
  const [musicStatus, setMusicStatus] = useState('loading')
  const [categories, setCategories] = useState([])
  const [categoriesStatus, setCategoriesStatus] = useState('loading')
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

  useEffect(() => {
    getMusic()
      .then((data) => {
        setMusicByCategory(data)
        setMusicStatus('ready')
      })
      .catch(() => setMusicStatus('error'))
  }, [])

  useEffect(() => {
    getPhotoshootCategories()
      .then((data) => {
        setCategories(data)
        setCategoriesStatus('ready')
      })
      .catch(() => setCategoriesStatus('error'))
  }, [])

  // A category with a search value (wedding, portrait, ...) links to search
  // filtered by it; one an admin added has no such filter, so it links to all.
  const categoryCards = categories.map((category) => ({
    key: category.id,
    title: category.name,
    Icon: CATEGORY_ICONS[category.searchValue] || GenericCategoryIcon,
    summary: category.summary,
    details: category.details,
    goodFor: category.goodFor || [],
    lookFor: category.lookFor,
    linkTo: category.searchValue ? `/search?category=${category.searchValue}` : '/search',
    linkLabel: category.searchValue
      ? `Find ${category.name.toLowerCase()} photographers`
      : 'Browse photographers',
  }))

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

          {selectedTopic === 'music' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                Music suggestions
              </h1>
              <p className="mt-3 max-w-2xl text-ink-muted">
                Music decides how a wedding or event film feels. A slow, warm song lets the
                vows and portraits breathe; an upbeat track carries the dance floor and the
                entrance. Pick music that matches the mood you want, and ask your videographer
                to cut the edit to its rhythm.
              </p>
              <p className="mt-3 max-w-2xl text-ink-muted">
                Click any name to open it on YouTube in a new tab, where it will play. Nothing
                plays on ShutterShot itself.
              </p>
              <p className="mt-3 max-w-2xl rounded-card border border-border bg-surface px-4 py-3 text-sm text-ink-muted">
                <span className="font-medium text-ink">Before you publish: </span>
                popular songs are copyrighted, and a film that uses them can be muted or blocked
                when it is posted online. For anything you plan to share publicly, the
                royalty-free background music below is the safer choice.
              </p>

              <section className="mt-10">
                <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
                  Suggestion for Wedding
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                  Songs in Bangla, English, and Hindi, for the ceremony, portraits, and the
                  highlight film.
                </p>

                {musicStatus === 'loading' && <p className="mt-6 text-ink-muted">Loading songs…</p>}

                {musicStatus === 'error' && (
                  <p className="mt-6 text-ink-muted">
                    We couldn't load the music list right now. Please check your connection and
                    try again.
                  </p>
                )}

                {musicStatus === 'ready' && (
                  <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                    {WEDDING_LANGUAGES.map((group) => (
                      <div
                        key={group.id}
                        className="rounded-card border border-border bg-surface p-5 shadow-card"
                      >
                        <span className="inline-block rounded-full bg-accent-gradient px-4 py-1.5 text-sm font-medium text-white shadow-card">
                          {group.title}
                        </span>
                        <MusicList
                          items={musicByCategory[group.id] || []}
                          className="mt-5"
                          emptyText="No songs here yet."
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="mt-12">
                <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
                  Suggestion for event
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                  Instrumental background music for birthdays, corporate events, and other
                  gatherings. These tracks are from royalty-free libraries (Bensound and Kevin
                  MacLeod) and are made to sit quietly under video. Check each track's licence
                  for the credit it asks for.
                </p>

                {musicStatus === 'ready' && (
                  <div className="mt-6 rounded-card border border-border bg-surface p-5 shadow-card">
                    <MusicList
                      items={musicByCategory.event || []}
                      className="columns-1 gap-x-10 sm:columns-2 lg:columns-3"
                      emptyText="No background music here yet."
                    />
                  </div>
                )}
              </section>
            </div>
          )}

          {selectedTopic === 'categories' && (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                Photoshoot category overview
              </h1>
              <p className="mt-3 max-w-2xl text-ink-muted">
                Here's what each kind of shoot actually covers, so you can pick the right one
                before you search or book. Wedding, portrait, event, and landscape are the
                categories photographers can be searched by.
              </p>

              {categoriesStatus === 'loading' && (
                <p className="mt-8 text-ink-muted">Loading categories…</p>
              )}

              {categoriesStatus === 'error' && (
                <p className="mt-8 text-ink-muted">
                  We couldn't load the categories right now. Please check your connection and try
                  again.
                </p>
              )}

              {categoriesStatus === 'ready' && (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {categoryCards.map(({ key, title, Icon, summary, details, goodFor, lookFor, linkTo, linkLabel }) => (
                  <div key={key} className="rounded-card border border-border bg-surface p-6 shadow-card">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                        <Icon />
                      </span>
                      <div>
                        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
                        {summary && <p className="text-sm text-ink-muted">{summary}</p>}
                      </div>
                    </div>

                    <p className="mt-4 whitespace-pre-line text-sm text-ink-muted">{details}</p>

                    {goodFor.length > 0 && (
                      <>
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
                      </>
                    )}

                    {lookFor && (
                      <p className="mt-4 text-sm text-ink-muted">
                        <span className="font-medium text-ink">What to look for: </span>
                        {lookFor}
                      </p>
                    )}

                    <Link
                      to={linkTo}
                      onClick={(event) => triggerClickBurst(event.currentTarget)}
                      className="mt-5 inline-block rounded-card bg-accent-gradient px-4 py-2 text-sm font-medium text-white shadow-card transition-shadow hover:shadow-hover"
                    >
                      {linkLabel}
                    </Link>
                  </div>
                ))}
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
