export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-ink-muted">
        <p>&copy; {new Date().getFullYear()} ShutterShot. Find your photographer.</p>
      </div>
    </footer>
  )
}
