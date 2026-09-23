# ShutterShot — Local Setup

Two pieces to run: the Spring Boot backend (port `8080`) and the React/Vite
frontend (port `5173`). You'll need Docker, JDK 17+, and Node 18+.

## 1. Backend

```bash
cd shuttershot-backend
```

**Start Postgres:**

```bash
docker compose up -d
```

This brings up a `postgres:16-alpine` container with database `shuttershot`,
user/password `postgres`/`postgres`, exposed on host port **5433** (not the
default 5432 — pick a different host port in `docker-compose.yml` if 5433 is
already taken on your machine, and update `DB_URL` to match).

**Configure environment (optional):**

`src/main/resources/application.yml` reads these variables, all with
defaults that already match the `docker-compose.yml` above, so a fresh clone
runs with zero configuration:

| Variable | Default |
|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5433/shuttershot` |
| `DB_USERNAME` | `postgres` |
| `DB_PASSWORD` | `postgres` |
| `JWT_SECRET` | a dev-only placeholder — override for anything beyond local dev |
| `JWT_EXPIRATION_MS` | `86400000` (24h) |
| `UPLOAD_DIR` | `uploads/portfolio` |
| `APP_BASE_URL` | `http://localhost:8080` |
| `APP_FRONTEND_URL` | `http://localhost:5173` — used to build the link inside password-reset emails |
| `MAIL_HOST` | `smtp.gmail.com` |
| `MAIL_PORT` | `587` |
| `MAIL_USERNAME` | *(empty)* — an SMTP account to send from, e.g. a Gmail address |
| `MAIL_PASSWORD` | *(empty)* — for Gmail, a 16-character [App Password](https://myaccount.google.com/apppasswords), not your normal password |
| `MAIL_FROM` | `no-reply@shuttershot.local` |

**Optional third-party integrations** — each of these features degrades
gracefully without its key (the feature just reports it isn't configured
yet), so none of them are required for a fresh clone to run:

| Variable | Default | Used for |
|---|---|---|
| `GEMINI_API_KEY` | *(empty)* | The floating chat widget. Get a key at [aistudio.google.com](https://aistudio.google.com/apikey). |
| `GEMINI_MODEL` | `gemini-3.6-flash` | |
| `GROQ_API_KEY` | *(empty)* | The full-page AI chat and voice assistant (`/chat`, `/speak`). Get a key at [console.groq.com](https://console.groq.com). |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | |
| `GROQ_TRANSCRIPTION_MODEL` | `whisper-large-v3-turbo` | Speech-to-text for the voice assistant. |
| `AIORNOT_API_KEY` | *(empty)* | The admin panel's manual "Deep check with AI" on a portfolio photo. Get a key at [aiornot.com](https://aiornot.com). |
| `DETECTRA_MODEL_PATH` | `models/detectra-v3/model.onnx` | Local ONNX model that automatically screens every portfolio upload for AI-generated imagery — no external call or key needed, just the model file present at this path. |
| `DETECTRA_REJECT_THRESHOLD` | `0.90` | How confident the model must be before an upload is auto-rejected. |
| `DUPLICATE_MAX_DISTANCE` | `6` | How close two photos' perceptual hashes must be to count as the same picture, for catching a photo already published elsewhere on the site. |
| `SSLCOMMERZ_STORE_ID` | *(empty)* | Booking deposits and the blue-badge payment. Sandbox credentials from [developer.sslcommerz.com](https://developer.sslcommerz.com). |
| `SSLCOMMERZ_STORE_PASSWORD` | *(empty)* | |
| `SSLCOMMERZ_SANDBOX` | `true` | Set to `false` with live credentials to switch to the production gateway. |
| `TEXTBELT_API_KEY` | `textbelt` | SMS delivery for phone OTP. The default is a shared free-tier key (1 real SMS/day); get a paid key at [textbelt.com](https://textbelt.com) for real volume. |

**Forgot-password emails:** if `MAIL_USERNAME`/`MAIL_PASSWORD` aren't set (the
default for a fresh clone), sending fails silently and the backend logs the
reset link instead — `grep "reset link" backend.log` (or watch the console)
to get it during local testing. Set real SMTP credentials to get actual
emails.

Spring Boot doesn't load `.env` files itself, so if you need to override any
of these, export them in your shell before running the app, e.g.:

```bash
export JWT_SECRET=some-longer-random-value
```

**Run the app:**

```bash
./mvnw spring-boot:run
```

(`mvnw.cmd` on native Windows shells.) The wrapper handles the Maven install
— no local Maven required, just a JDK 17+ on your `PATH`. First run will pull
dependencies and create the schema (`ddl-auto: update`) against the
Dockerized Postgres.

Verify it booted: `http://localhost:8080/api/photographers` should return
`[]` or existing seed data.

## 2. Frontend

```bash
cd shuttershot-frontend
npm install
npm run dev
```

Vite will serve on `http://localhost:5173` (or the next free port — check
the terminal output) and talks to the backend at `http://localhost:8080/api`
by default. Override with a `VITE_API_BASE_URL` env var (e.g. in a
`.env.local` in `shuttershot-frontend/`) if your backend runs elsewhere.

## 3. Windows + WSL note

If your project directory lives under a WSL path
(`\\wsl.localhost\Ubuntu\...` or similar UNC path) rather than a native
Windows drive, **the Windows-side `npm`/`npx`/`node` binaries cannot
reliably run the Vite dev server from there** — Vite's toolchain (Rolldown)
fails to parse `file://wsl.localhost/...` URLs, and some scaffolding/CLI
tools break on the UNC path in general.

The backend (Maven/Java) is unaffected and runs fine directly from a Windows
shell against a UNC path.

**Fix for the frontend:** run Node natively inside WSL instead of from the
Windows side:

```bash
wsl -d Ubuntu -- bash -lc 'cd /home/<you>/path/to/ShutterShot/shuttershot-frontend && npm install && npm run dev -- --host'
```

Using a WSL-native Node (installed via `nvm` inside the WSL distro, not the
Windows Node install) avoids the UNC-path issues entirely. The `--host` flag
makes the dev server reachable from the Windows-side browser at
`http://localhost:<port>`.

If you're working entirely inside WSL (editor, terminal, and browser all on
the Linux side, or you clone the repo onto the native Linux filesystem
instead of a UNC-mounted path), none of this applies — a plain `npm install`
+ `npm run dev` works normally.
