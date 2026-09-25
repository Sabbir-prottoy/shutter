# ShutterShot

A photographer-booking marketplace for Bangladesh. Clients browse verified
local photographers by district and style, check real availability, book a
session, and pay a deposit online. Photographers manage their own portfolio,
packages, calendar, and bookings, and reply to the feedback clients leave.

## Tech stack

**Backend** — Java 17, Spring Boot 3.3.4, Spring Security (JWT auth), Spring
Data JPA, PostgreSQL.

**Frontend** — React 19, Vite, Tailwind CSS v4, React Router.

## Features

### For clients

- Search photographers by district, style, and rating; browse portfolios,
  packages, and a live availability calendar
- Book a session, verified by phone OTP, email OTP, a QR code scanned in
  person, or a Google Authenticator (TOTP) code
- Pay the booking deposit online (SSLCommerz)
- Rate a completed session with a star rating and comment — the rating is
  published on the photographer's public profile immediately
- Ask questions about photographers, pricing, and availability through a
  full-page AI chat or a spoken voice assistant, or a floating chat widget
  from anywhere on the site
- An Entertainment page with 17 small games for a wait between bookings

### For photographers

- Manage a portfolio, packages, availability calendar, and incoming bookings
  from a dedicated dashboard
- Every portfolio upload is automatically screened before it goes live: a
  local AI-detection model checks whether the image is AI-generated, and a
  perceptual-hash check catches photos already published elsewhere on the
  site — either rejects the upload immediately, with the reason shown to the
  photographer, but every photo (published or not) stays reviewable from the
  dashboard
- Reply publicly to the feedback clients leave, from a dedicated Feedback
  section — ratings publish on their own and count toward the public average
  immediately; photographers can reply but cannot remove them
- An optional paid "Verified" blue badge

### For admins and moderators

- Approve photographer accounts and moderate portfolio photos, and remove
  abusive reviews (the only way a published review comes down)
- Manage staff accounts (restricted to the main admin)
- Remove accounts and browse a removal history log
- A dashboard with booking and revenue charts
- Light and dark theme, matched across the whole site

## Project layout

```
shuttershot-backend/    Spring Boot REST API
shuttershot-frontend/   React single-page app
```

## Getting started

See [SETUP.md](SETUP.md) for local setup — starting Postgres, configuring
environment variables, and running the backend and frontend.
