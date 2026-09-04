# ShutterShot — Full Project Structure

**Photographer's Marketplace — Booking & Portfolio Management Platform**
AOOP Section E, Group 6

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17+, Spring Boot (REST API) |
| Database | PostgreSQL |
| Frontend | React (or Angular) |
| Auth | JWT (photographers/admin) + OTP (guest clients) |
| ORM | Spring Data JPA / Hibernate |
| Build tools | Maven/Gradle (backend), npm/Vite (frontend) |
| Payment (future) | Stripe / SSLCommerz |

---

## 2. User Roles

1. **Photographer** — registers, manages profile, portfolio, packages, calendar, bookings, reads reviews.
2. **Client (Guest)** — browses, books via OTP, no mandatory account.
3. **Admin** — approves reviews, moderates flagged photos, manages users/reports.

---

## 3. Database Schema (Core Entities)

```
User
 ├─ id (PK)
 ├─ role (PHOTOGRAPHER / ADMIN)
 ├─ name
 ├─ email
 ├─ password_hash
 ├─ phone
 ├─ location
 ├─ profile_photo_url
 ├─ bio
 ├─ verified (boolean)
 ├─ created_at

PhotographerProfile
 ├─ id (PK)
 ├─ user_id (FK -> User)
 ├─ specialties (wedding, event, portrait, etc.)
 ├─ base_location
 ├─ years_experience
 ├─ rating_avg
 ├─ total_reviews

PortfolioImage
 ├─ id (PK)
 ├─ photographer_id (FK -> PhotographerProfile)
 ├─ image_url
 ├─ category (portrait/wedding/landscape/event)
 ├─ uploaded_at
 ├─ exif_data (json, nullable)
 ├─ verification_status (PENDING / VERIFIED / FLAGGED)
 ├─ flag_reason (nullable)

Package
 ├─ id (PK)
 ├─ photographer_id (FK)
 ├─ title
 ├─ description
 ├─ price
 ├─ duration_hours
 ├─ delivery_days

Availability
 ├─ id (PK)
 ├─ photographer_id (FK)
 ├─ date
 ├─ status (FREE / BOOKED / BLOCKED)

Booking
 ├─ id (PK)
 ├─ photographer_id (FK)
 ├─ package_id (FK)
 ├─ client_name
 ├─ client_phone
 ├─ client_email
 ├─ booking_date
 ├─ time_slot
 ├─ status (PENDING / CONFIRMED / COMPLETED / CANCELLED)
 ├─ otp_verified (boolean)
 ├─ created_at

Review
 ├─ id (PK)
 ├─ booking_id (FK)
 ├─ photographer_id (FK)
 ├─ client_name
 ├─ rating (1-5)
 ├─ comment
 ├─ status (PENDING / APPROVED / REJECTED)
 ├─ created_at

OtpVerification
 ├─ id (PK)
 ├─ phone/email
 ├─ otp_code
 ├─ expires_at
 ├─ verified (boolean)
```

---

## 4. Backend Folder Structure (Spring Boot)

```
shuttershot-backend/
├── src/main/java/com/shuttershot/
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   └── CorsConfig.java
│   ├── controller/
│   │   ├── AuthController.java
│   │   ├── PhotographerController.java
│   │   ├── PortfolioController.java
│   │   ├── PackageController.java
│   │   ├── AvailabilityController.java
│   │   ├── BookingController.java
│   │   ├── ReviewController.java
│   │   ├── AdminController.java
│   │   └── OtpController.java
│   ├── model/ (entities listed above)
│   ├── repository/ (Spring Data JPA repos per entity)
│   ├── service/
│   │   ├── AuthService.java
│   │   ├── BookingService.java
│   │   ├── AvailabilityService.java
│   │   ├── ImageVerificationService.java   (EXIF + reverse-search hooks)
│   │   ├── OtpService.java
│   │   └── ReviewModerationService.java
│   ├── dto/ (request/response objects)
│   ├── exception/ (custom exception + global handler)
│   └── ShutterShotApplication.java
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/ (Flyway scripts, if used)
└── pom.xml
```

---

## 5. Frontend Folder Structure (React)

```
shuttershot-frontend/
├── src/
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── SearchResults.jsx
│   │   ├── PhotographerProfile.jsx       (public, client-facing)
│   │   ├── BookingFlow.jsx               (date/slot select -> OTP -> confirm)
│   │   ├── PhotographerDashboard.jsx     (login-only)
│   │   ├── PortfolioManager.jsx
│   │   ├── CalendarManager.jsx
│   │   ├── PackageManager.jsx
│   │   ├── BookingRequests.jsx
│   │   ├── AdminPanel.jsx
│   │   │   ├── ReviewModeration.jsx
│   │   │   └── PhotoModeration.jsx
│   │   ├── Login.jsx / Register.jsx
│   │   └── NotFound.jsx
│   ├── components/
│   │   ├── Navbar.jsx / Footer.jsx
│   │   ├── PortfolioGrid.jsx
│   │   ├── AvailabilityCalendar.jsx
│   │   ├── ReviewCard.jsx
│   │   ├── PackageCard.jsx
│   │   ├── OtpInput.jsx
│   │   └── ImageUploader.jsx
│   ├── services/ (api.js — axios/fetch wrappers per resource)
│   ├── context/ (AuthContext, BookingContext)
│   ├── hooks/
│   ├── styles/
│   └── App.jsx
└── package.json
```

---

## 6. Core API Endpoints

```
Auth
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/otp/send
  POST   /api/otp/verify

Photographer (public)
  GET    /api/photographers?location=&category=
  GET    /api/photographers/{id}
  GET    /api/photographers/{id}/portfolio
  GET    /api/photographers/{id}/packages
  GET    /api/photographers/{id}/availability

Photographer (private, dashboard)
  PUT    /api/photographers/{id}
  POST   /api/portfolio                    (upload image -> triggers verification)
  DELETE /api/portfolio/{id}
  POST   /api/packages
  PUT    /api/packages/{id}
  DELETE /api/packages/{id}
  PUT    /api/availability/{date}          (block/unblock a date)

Booking
  POST   /api/bookings                     (creates booking, status=PENDING)
  POST   /api/bookings/{id}/confirm-otp
  GET    /api/bookings?photographerId=
  PUT    /api/bookings/{id}/status

Review
  POST   /api/reviews                      (status=PENDING by default)
  GET    /api/reviews?photographerId=       (only APPROVED shown publicly)

Admin
  GET    /api/admin/reviews/pending
  PUT    /api/admin/reviews/{id}/approve
  PUT    /api/admin/reviews/{id}/reject
  GET    /api/admin/photos/flagged
  PUT    /api/admin/photos/{id}/verify
  PUT    /api/admin/photos/{id}/reject
```

---

## 7. Frontend Screens / Pages (User Flow)

**Client side:**
1. Home — search bar (location/category) + featured photographers
2. Search Results — filterable list/grid of photographers
3. Photographer Profile — portfolio, packages, reviews, live calendar
4. Booking Flow — pick date/slot → enter details → OTP verify → confirmation
5. Booking Confirmation page

**Photographer side:**
6. Login / Register
7. Dashboard (overview: upcoming bookings, stats)
8. Portfolio Manager (upload/delete images, see verification status)
9. Package Manager (CRUD packages)
10. Calendar Manager (block/unblock dates, view bookings)
11. Booking Requests (accept/reject/complete)
12. Reviews (view own reviews)

**Admin side:**
13. Admin Login
14. Review Moderation Queue
15. Photo Moderation Queue (flagged uploads — EXIF missing / reverse-search hit)
16. User Management (verify/ban photographers)

---

## 8. Core Feature Checklist (MVP)

- [ ] Photographer registration/login (JWT)
- [ ] Portfolio upload with category tagging
- [ ] Image verification pipeline (EXIF check minimum; reverse-image-search as stretch goal)
- [ ] Package CRUD
- [ ] Interactive calendar (photographer sets availability)
- [ ] Public search by location/category
- [ ] Live calendar view on public profile (green/red)
- [ ] Guest booking flow with OTP (no password)
- [ ] Booking status management (pending/confirmed/completed/cancelled)
- [ ] Review submission + admin approval before publish
- [ ] Admin panel (review + photo moderation)

## 9. Stretch / Future Scope

- [ ] Payment gateway integration
- [ ] "Verified" premium badge / subscription tier
- [ ] Featured/sponsored listings
- [ ] AI-generated image detection API integration
- [ ] Email/SMS notifications for booking status changes
- [ ] Photographer analytics dashboard

---

## 10. Suggested Build Order (for Claude Code sessions)

1. Set up backend project (Spring Boot, PostgreSQL connection, base entities)
2. Auth (register/login for photographer, JWT)
3. Photographer profile + portfolio CRUD + image upload
4. Package CRUD
5. Availability + Calendar API
6. Public search/browse endpoints
7. Booking flow + OTP service
8. Review system (submit + admin approval)
9. Admin panel endpoints
10. Frontend: public pages first (home, search, profile, booking)
11. Frontend: photographer dashboard
12. Frontend: admin panel
13. Polish: EXIF verification hook, empty/error states, responsive UI
