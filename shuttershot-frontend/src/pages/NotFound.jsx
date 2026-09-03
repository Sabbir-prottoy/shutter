import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-6xl font-bold text-accent">404</p>
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">Page not found</h1>
        <p className="mt-3 text-ink-muted">
          The page you're looking for doesn't exist, or may have moved.
        </p>
        <Link
          to="/"
          className="mt-8 rounded-card bg-accent-gradient px-6 py-3 font-medium text-white shadow-card transition-shadow hover:shadow-hover"
        >
          Back to home
        </Link>
      </main>
      <Footer />
    </div>
  )
}
