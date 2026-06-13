# EventHub

Discover hackathons, coding contests, meetups, and tech events in one place.

EventHub aggregates technical events from free public APIs (Codeforces, kontests.net,
clist.by, confs.tech), normalizes them into a unified model, and presents a searchable,
filterable, bookmarkable feed with email reminders.

## Architecture

```
GitHub Actions cron ──► /internal/ingest, /internal/notify (shared-secret)
cron-job.org        ──► /healthz (keep-warm)

React + Tailwind (Vercel) ──REST──► Spring Boot 3 API (Render) ──JDBC──► Postgres (Neon)
                                         └── email via Resend/Brevo
```

Scheduled work runs on **external cron**, not in-app `@Scheduled`, because Render's
free web tier sleeps after ~15 min idle (a sleeping JVM runs no cron). See the
engineering plan for the full design review.

## Tech stack

- **Backend:** Java 21, Spring Boot 3, Spring Data JPA, Flyway, Postgres full-text search
- **Frontend:** React, Vite, Tailwind CSS v4
- **DB:** PostgreSQL (Neon free tier in prod; local Postgres / docker-compose in dev)
- **Hosting:** Render (backend), Vercel (frontend), free tiers throughout

## Local development

### 1. Database

Either use the bundled docker-compose:

```bash
docker compose up -d db
```

…or point at any local Postgres by creating a database/role:

```sql
CREATE ROLE eventhub LOGIN PASSWORD 'eventhub';
CREATE DATABASE eventhub OWNER eventhub;
```

### 2. Backend

```bash
cd backend
mvn spring-boot:run        # requires Java 21
# verify: curl http://localhost:8080/healthz  -> {"status":"ok"}
```

Config via env vars (defaults target the local Postgres above):
`DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`, `PORT`, `APP_CORS_ALLOWED_ORIGINS`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local   # set VITE_API_BASE_URL
npm install
npm run dev                  # http://localhost:5173
```

## API

Public:
- `GET /api/events` — browse/search; filters: `q` (full-text), `category`, `online`, `from`/`to`, `tags`, `upcomingOnly`, `page`, `size`
- `GET /api/events/{id}` — event detail
- `GET /healthz` — liveness / keep-warm

Auth (`/api/auth`): `register`, `login`, `refresh` (rotating), `logout`, `password-reset/request`, `password-reset/confirm`

Authenticated:
- `GET/PUT/DELETE /api/bookmarks[/{eventId}]` — save / list / remove bookmarks

Admin (ROLE_ADMIN):
- `GET/PUT/DELETE /api/admin/events[/{id}]`, `GET /api/admin/ingestion-jobs`

Internal (shared-secret `X-Internal-Secret`, called by cron):
- `POST /internal/ingest`, `POST /internal/notify`

## Testing

Integration tests run against a **real Postgres** with the actual Flyway migrations
and Postgres full-text search (not H2), so behaviour matches production.

```bash
# one-time: create the test database
createdb eventhub_test  # or: CREATE DATABASE eventhub_test OWNER eventhub;
cd backend && mvn verify
```

Override `TEST_DATABASE_URL` / `TEST_DATABASE_USER` / `TEST_DATABASE_PASSWORD` to point
at another Postgres (CI uses a Postgres service container — see `.github/workflows/ci.yml`).

> Note: Testcontainers was the original plan, but the local Docker Desktop daemon
> rejected the bundled docker-java client (HTTP 400 on the API probe). Pointing tests
> at a real Postgres keeps the same fidelity without that incompatibility.

## Configuration (env vars)

`DATABASE_URL/USER/PASSWORD`, `PORT`, `APP_CORS_ALLOWED_ORIGINS`, `APP_FRONTEND_BASE_URL`,
`APP_JWT_SECRET` (≥32 chars), `APP_JWT_ACCESS_TTL`, `APP_JWT_REFRESH_TTL`,
`APP_RESEND_API_KEY` (optional — logs emails if unset), `APP_EMAIL_FROM`,
`APP_INTERNAL_SECRET` (guards `/internal/*`), `APP_ADMIN_EMAIL` (promotes that user to admin).

## Roadmap

- **Phase 0** ✅ Scaffold (backend, frontend, DB migrations, CI)
- **Phase 1** ✅ Ingestion + read-only browse
- **Phase 2** ✅ Search, filters + monthly calendar (backend + frontend)
- **Phase 3** ✅ Auth + bookmarks + notifications (backend + frontend auth pages, bookmarks)
- **Phase 4** ✅ Internal triggers (backend) — GitHub Actions cron YAML still to add
- **Phase 5** ✅ Admin API + dashboard (backend + frontend)
- **Backend test suite** ✅ 21 tests green against real Postgres
- **Frontend** ✅ Browse/search/filter, calendar, login/register/reset, bookmarks, saved, admin
- **Remaining:** deploy config (Render/Vercel/Neon); GitHub Actions cron workflows; frontend tests
