import DeleteAccountSection from '../components/DeleteAccountSection'

export default function DeleteAccountRequest() {
  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Delete account</h1>
        <p className="mt-1 text-ink-muted">Request to permanently delete your photographer account.</p>
      </div>

      <DeleteAccountSection />
    </div>
  )
}
