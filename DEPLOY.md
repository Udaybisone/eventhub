# Deploying EventHub (free tier)

Three free services: **Neon** (Postgres) → **Render** (backend) → **Vercel** (frontend),
then two **GitHub secrets** so the cron goes live. ~20 minutes. All config lives in the
repo (`backend/Dockerfile`, `render.yaml`, `frontend/vercel.json`).

---

## 1. Database — Neon (free, no card)

1. Sign up at https://neon.tech → **New Project** (pick a region near you, e.g. Singapore).
2. Open the project's **Connection string**. It looks like:
   `postgresql://alice:npg_xxx@ep-cool-name.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
3. Split it into the three values Render will need:
   - `DATABASE_URL` → `jdbc:postgresql://ep-cool-name.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
     (prefix `jdbc:`, drop the `user:pass@`, keep `?sslmode=require`)
   - `DATABASE_USER` → `alice`
   - `DATABASE_PASSWORD` → `npg_xxx`

Flyway will create all tables automatically on first boot.

## 2. Backend — Render (free Docker web service)

1. Sign up at https://render.com → **New → Blueprint** → connect this GitHub repo.
   Render reads `render.yaml` and proposes the `eventhub-backend` service.
2. Before/after creating, set the `sync: false` env vars in the dashboard:
   - `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD` → from step 1
   - `APP_CORS_ALLOWED_ORIGINS` → leave as `http://localhost:5173` for now (update in step 4)
   - `APP_FRONTEND_BASE_URL` → same placeholder for now
   - (optional) `APP_ADMIN_EMAIL`, `APP_RESEND_API_KEY`
   - `APP_JWT_SECRET` and `APP_INTERNAL_SECRET` are auto-generated — leave them.
3. Deploy. First build takes a few minutes (it compiles the jar in Docker).
4. When live, note the URL, e.g. `https://eventhub-backend.onrender.com`.
   Verify: open `https://<your-url>/healthz` → `{"status":"ok"}`.
5. Copy the generated **`APP_INTERNAL_SECRET`** value (Render → service → Environment) —
   you'll need it for the GitHub secret in step 5.

> Free tier sleeps after ~15 min idle; the first request after sleep takes ~30–60s.
> The cron's wake-ping handles this.

## 3. Frontend — Vercel

1. Sign up at https://vercel.com → **Add New → Project** → import this repo.
2. Set **Root Directory = `frontend`** (Vercel auto-detects Vite + `vercel.json`).
3. Add an environment variable:
   - `VITE_API_BASE_URL` = your Render URL (e.g. `https://eventhub-backend.onrender.com`)
4. Deploy. Note the URL, e.g. `https://eventhub.vercel.app`.

## 4. Connect CORS

Back in **Render → Environment**, set both to your Vercel URL and redeploy:
- `APP_CORS_ALLOWED_ORIGINS` = `https://eventhub.vercel.app`
- `APP_FRONTEND_BASE_URL` = `https://eventhub.vercel.app`

## 5. Turn on the cron (GitHub secrets)

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:
- `API_BASE_URL` = your Render URL
- `INTERNAL_SECRET` = the `APP_INTERNAL_SECRET` value from step 2.5

The `Ingest events` and `Send reminders` workflows now run on schedule (until the
secret exists they skip and stay green).

## 6. Seed data + make yourself admin

- Seed now: GitHub → **Actions → Ingest events → Run workflow** (or `curl -X POST
  https://<render-url>/internal/ingest -H "X-Internal-Secret: <secret>"`).
- Admin: register your account on the site, set `APP_ADMIN_EMAIL` in Render to that
  email, redeploy, then log in again — the Admin tab appears.

## Notes / gotchas

- **Email**: without `APP_RESEND_API_KEY`, reminder emails are logged, not sent. Add a
  free Resend key + a verified sender to send for real.
- **Neon** may auto-suspend an idle DB; the first query wakes it (adds latency once).
- **GitHub** disables scheduled workflows after 60 days of repo inactivity — push or
  re-enable to resume.
