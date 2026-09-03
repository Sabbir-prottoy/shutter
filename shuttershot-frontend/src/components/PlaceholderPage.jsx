import Navbar from './Navbar'
import Footer from './Footer'

export default function PlaceholderPage({ title, description }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="rounded-card bg-surface p-10 shadow-card">
          <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
          <p className="mt-3 text-ink-muted">{description || 'This page is coming soon.'}</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
