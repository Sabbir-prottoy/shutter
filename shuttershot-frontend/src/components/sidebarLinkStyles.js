// Capsule-shaped navigation links, matching the sidebar on the Suggestions
// page. Shared by the admin and photographer dashboards so the two stay identical.
export const capsuleLinkClass = ({ isActive }) =>
  `block w-full rounded-full border px-4 py-2.5 text-left text-sm font-medium shadow-card transition-colors ${
    isActive
      ? 'border-transparent bg-accent-gradient text-white'
      : 'border-border bg-surface text-ink-muted hover:border-accent hover:bg-accent/10 hover:text-accent'
  }`

// The phone layout scrolls its links sideways, so each capsule must never wrap.
export const mobileCapsuleLinkClass = ({ isActive }) =>
  `shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? 'border-transparent bg-accent-gradient text-white shadow-card'
      : 'border-border bg-surface text-ink-muted hover:border-accent hover:text-accent'
  }`
