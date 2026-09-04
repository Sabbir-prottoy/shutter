# ShutterShot — Frontend Design System (Light Theme)

Warm, airy, gradient-light interface for the photography marketplace. Photos remain the true stars — the light theme adds polish and approachability without competing with them.

---

## 1. Color

| Token | Value | Use |
|---|---|---|
| `canvas` | `linear-gradient(145deg, #FBF7F0 0%, #F5EEE6 100%)` | Page background — warm, inviting, faint gradient |
| `surface` | `#FFFFFF` with `box-shadow: 0 4px 20px rgba(0,0,0,0.04)` | Cards, panels, dashboard sections |
| `surface-raised` | `#FCFAF7` | Hover states, modals, popovers |
| `text-primary` | `#1E1B16` | Headlines, primary text |
| `text-muted` | `#7A7267` | Secondary text, captions, metadata |
| `accent` | `#C15A3A` | Primary CTA, links, active states — deep muted terracotta |
| `accent-gradient` | `linear-gradient(135deg, #C15A3A, #D9825E)` | Buttons, highlights |
| `status-free` | `#8DB5A0` | Calendar "free" dates |
| `status-booked` | `#C47A6E` | Calendar "booked" dates |
| `border` | `#E8E2D9` | Hairline dividers |

Rules:
- Cards/surfaces: rounded corners (8px), soft shadow per tokens above.
- Gradients used sparingly — background, accent buttons, hover states only.
- No pure whites — everything leans warm.
- **Not every surface gets identical shadow+radius treatment.** Portfolio images stay borderless/full-bleed with no card wrapper — only dashboard/admin data cards get the shadow+radius treatment. This keeps photos from being visually boxed in like generic SaaS content.

---

## 2. Typography

| Role | Typeface | Notes |
|---|---|---|
| Display / headlines | **Fraunces** (variable serif) | 700–900 weight for hero and section titles |
| Body / UI / forms | **Work Sans** | 400/500 weight, clean and legible |

- Body text: `#1E1B16` on white for max contrast (4.5:1 minimum).
- No all-caps or tracked-out labels.

```
Hero headline    : 4.5rem / 900 (Fraunces)
Section headline : 2.25rem / 700 (Fraunces)
Card title       : 1.25rem / 600 (Work Sans)
Body             : 1rem / 400 (Work Sans)
Caption / meta   : 0.875rem / 400, text-muted
```

---

## 3. Layout Principles

- **Portfolio pages:** full-bleed masonry, images flush to edges, no borders/cards.
- **Hero (Home):** asymmetric split — photo one side, headline + search the other, gradient backdrop continues behind both.
- **Dashboard:** left sidebar + content area; cards use `surface` (shadow + rounded corners) — feel like physical cards on a desk.
- **Calendar:** grid cells with subtle 4px border-radius, soft accent glow on hover.

```
┌─────────────────────────────┬───────────────────────┐
│ (gradient background)        │  ShutterShot          │
│      [ full-bleed photo ]    │  Find your             │
│                               │  photographer.         │
│                               │  [ search bar ]        │
└─────────────────────────────┴───────────────────────┘
```

---

## 4. Motion

- On hover: cards lift slightly (`translateY(-2px)`), shadow deepens.
- On date selection: quiet color-fade on the cell + small checkmark icon. No bounce.
- Respect `prefers-reduced-motion` everywhere.
- Keep the hero-load reveal minimal and quick (short opacity fade, no dramatic scale) — this is the one place we're deliberately toning down the original spec, since a big scale-in on every page load is one of the more common "AI-generated" motion tells. One clean fade is enough.

---

## 5. Voice / Copy

- Buttons: "Book session," "Save changes" — action-oriented.
- Empty states: warm and guiding — "No sessions booked yet — ready to plan your shoot?"
- Errors: clear and calm — "We couldn't save your changes. Please check your connection and try again."

---

## 6. Implementation Notes (React / Tailwind)

```css
:root {
  --canvas: linear-gradient(145deg, #FBF7F0, #F5EEE6);
  --surface: #FFFFFF;
  --surface-raised: #FCFAF7;
  --text-primary: #1E1B16;
  --text-muted: #7A7267;
  --accent: #C15A3A;
  --accent-gradient: linear-gradient(135deg, #C15A3A, #D9825E);
  --border: #E8E2D9;
  --shadow-card: 0 4px 20px rgba(0,0,0,0.04);
  --shadow-hover: 0 8px 30px rgba(0,0,0,0.08);
  --radius-card: 8px;
}
```

- Import Fraunces and Work Sans from Google Fonts.
- Extend Tailwind theme with the tokens above rather than using default Tailwind gray/blue/orange palette.
- Mobile-first: portfolio and calendar both collapse to a single column.
- Visible keyboard focus states in the accent color.
