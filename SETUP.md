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
