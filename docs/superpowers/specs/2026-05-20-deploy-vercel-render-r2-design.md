# Deploy Wedding Invitation Platform to Vercel + Render + R2 + Atlas

Status: draft
Date: 2026-05-20
Branch: `feat/floral-watercolor-template`

## Goal

Replace the ngrok tunnel with a permanent, free, public deployment so each client can share their invitation URL without the developer's laptop running. The same setup must support 2–3 concurrent client invitations on free tiers without exceeding any quota.

## Non-goals

- Custom domain. Defaults `*.vercel.app` + `*.onrender.com` are acceptable for v1. Custom domain is documented but out of scope here.
- Production Midtrans (real payments). Keep sandbox keys; flip later when business-ready.
- Multi-region. Single region (Singapore) for the user base in Indonesia.
- CI/CD pipeline beyond the default GitHub → Vercel/Render auto-deploy on push.
- Automated tests in CI. No tests exist yet; `npm run lint` (TypeScript type-check) is the verification gate.

## Prerequisites — accounts and assets the user prepares

All free.

1. **GitHub** — already in use. Push `feat/floral-watercolor-template` to `origin`, or merge to `main` first (recommended).
2. **Vercel** — sign in with GitHub. Two projects from the same repo, different `Root Directory`.
3. **Render** — sign in with GitHub. One Web Service from `server/`.
4. **MongoDB Atlas** — create M0 cluster in **Singapore (ap-southeast-1)**. 512 MB.
5. **Cloudflare** — account + a credit card on file (required by R2 even on free tier, no charge under quota). Create bucket `wedding-uploads`. Generate an API token scoped to that bucket only.
6. **UptimeRobot** — free monitor pinging the Render `/health` URL every 5 minutes, to suppress cold starts.

### Secrets to generate ahead of time

- `JWT_SECRET` production — distinct from local. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- Cloudflare R2 API token — `Object Read & Write` scoped to the `wedding-uploads` bucket only.
- Atlas DB user + password. Network Access set to `0.0.0.0/0` (Render IPs are not static on free tier).
- Midtrans sandbox keys — already in local `.env`, reuse.

### Repo hygiene before pushing

- Push the branch to GitHub (or merge to `main`).
- `.gitignore` additions: `*.png` at repo root, `dega-dita-asets/`, `out/`.
- Remove or move ad-hoc screenshots currently sitting in repo root (`canva-p*.png`, `dashboard*.png`, `clients*.png`, etc.) so they do not end up in deploys.

## Architecture

```
                           ┌───────────────────────────────┐
                           │ Cloudflare R2 (S3-compatible) │
                           │   bucket: wedding-uploads     │
                           └───────────┬───────────────────┘
                                       │ presigned PUT / public GET
                                       │
┌──────────────────────┐               │
│ Browser (admin/guest)│               │
└─────────┬────────────┘               │
          │                            │
          ├──> https://admin.vercel.app   (apps/web)        ┐
          │                                                 │ same-origin
          ├──> https://wed.vercel.app     (apps/invitation) │ /api/*
          │       proxy /api/*  → Render                    ┘
          │
          └──> https://wed-api.onrender.com  (server, Express)
                       │
                       └──> MongoDB Atlas M0 (Singapore, 512 MB)
```

- **2 Vercel projects** from the same monorepo (different `Root Directory` setting).
- **1 Render Web Service** running Express as-is.
- **MongoDB Atlas M0** — 512 MB.
- **Cloudflare R2 bucket** with public read.
- Invitation app uses its Next.js rewrite to keep traffic same-origin; admin app calls the API cross-origin with Bearer JWT (already supported by `CORS` middleware reading `ALLOWED_ORIGINS`).

## Free quota fit (single invitation, ~100 guests, ~500 visits/month)

| Service | Free quota | Estimated usage | Headroom |
| --- | --- | --- | --- |
| Vercel Hobby | 100 GB bandwidth/mo | ~2 GB | 50× |
| Render Web Service | 750 h/mo, 512 MB RAM | 744 h, ~300 MB | tight on RAM, ample on hours |
| Cloudflare R2 | 10 GB, 10M reads, 1M writes/mo, **zero egress** | ~4 MB, ~5K reads | 1000× |
| MongoDB Atlas M0 | 512 MB storage | <1 MB | 500× |

Comfortable for 2–3 concurrent client invitations on the same free stack.

## Code changes

### Server (`server/`)

| File | Change |
| --- | --- |
| `src/lib/r2.ts` *(new)* | `S3Client` against Cloudflare R2 + `uploadBuffer(key, buffer, contentType)` helper |
| `src/routes/uploads.ts` + controller | Switch multer to `memoryStorage`, run sharp resize in-memory, upload buffer to R2, return `{ url }` using the R2 public base URL. If R2 env vars are absent, fall back to disk so local dev keeps working. |
| `src/app.ts` | Remove `app.use('/uploads', express.static(...))` for the production path. Keep it behind an env guard so disk fallback continues to serve in local dev. |
| `package.json` | Add `@aws-sdk/client-s3`. |
| `.env.example` | Document `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`, `ALLOWED_ORIGINS`. |

### Invitation app (`apps/invitation/`)

| File | Change |
| --- | --- |
| `next.config.js` | Already reads `API_PROXY_TARGET`. Set to Render URL on Vercel. |
| Rewrite for `/uploads/:path*` | Remove from the production rewrite list. R2 public URLs are absolute; only the legacy disk path needed the rewrite. |
| `.env.example` | Document `API_PROXY_TARGET` and `NEXT_PUBLIC_API_URL=/api`. |
| `vercel.json` *(new)* | `installCommand: cd ../.. && npm install`, `buildCommand: cd ../.. && npm run build:invitation`. |

### Admin app (`apps/web/`)

| File | Change |
| --- | --- |
| (no code change) | Set `NEXT_PUBLIC_API_URL=https://wed-api.onrender.com/api` on Vercel. |
| `vercel.json` *(new)* | Same monorepo install/build pattern as the invitation app. |

### Repo root

| File | Change |
| --- | --- |
| `.gitignore` | Add the ad-hoc screenshots + `dega-dita-asets/` + `out/`. |
| `docker-compose.yml` | Untouched; still used for local dev. |

Estimated change: ~6 files modified, 3 files added, ~150 LOC.

## Migration sequence

Each step is reversible by simply not advancing to the next. Local dev continues to work throughout.

| # | Step | Verification | Reversible? |
| --- | --- | --- | --- |
| 1 | Provision Atlas M0, R2 bucket + token. No code changes. | Connect to Atlas from local; `aws s3 ls` against R2 endpoint. | Drop cluster/bucket — zero cost. |
| 2 | Land the R2 storage code with disk fallback. | Local dev still uses disk when R2 env absent; toggling R2 env makes uploads land in the bucket. | Env flag flip. |
| 3 | Seed Atlas from local (`MONGODB_URI=<atlas-uri>` + run `seed-floral-template.ts` then `seed-dega-lauditta.ts`). | Inspect documents in the Atlas data browser. | Drop cluster. |
| 4 | Deploy server to Render (build `npm run build:server`, start `node server/dist/index.js`). Add env vars. | `curl /health` → 200; `curl /api/templates` → JSON array. | Pause service. |
| 5 | Deploy invitation to Vercel. Set `API_PROXY_TARGET=<render-url>`. | Open `<vercel-url>/dega-lauditta` on phone; sections + R2 photos render. | Pause project. |
| 6 | Deploy admin to Vercel. Set `NEXT_PUBLIC_API_URL=<render-url>/api`. | Log in; create a test client; upload a photo and verify the URL lives on R2. | Pause project. |
| 7 | Set `ALLOWED_ORIGINS` on Render to the two Vercel URLs, redeploy. | No CORS errors in browser console. | Edit env, redeploy. |
| 8 | Update Midtrans dashboard webhook URL to `<render-url>/api/gifts/notification`. | Trigger a sandbox transaction; gift status flips correctly. | Revert to previous URL. |
| 9 | UptimeRobot monitor on `<render-url>/health` every 5 minutes. | Dashboard reports "up" for 24h. | n/a |
| 10 | Decommission ngrok; update README with the production URLs. | — | n/a |

## Risk register

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Atlas refuses connections from Render | High | Set Network Access to `0.0.0.0/0` on Atlas. |
| Cold start 30s on first visit after idle | Certain | UptimeRobot 5-minute keepalive. |
| Vercel monorepo install fails | Medium | `vercel.json` runs install from repo root. |
| R2 token misconfigured | Low | Disk fallback in step 2 lets us see the error early without losing data locally. |
| Render 512 MB RAM exhausted | Low | Sharp + Node baseline ~250 MB; monitor 24h. Upgrade to Starter ($7/mo) is the escape hatch. |
| Legacy photos in `server/uploads/` (2 files) | Low | Orphan after migration. Re-upload via admin UI if still needed. |
| Midtrans webhook still pointing to ngrok | Medium | Step 8 makes this explicit. |
| CORS regex too narrow (Vercel preview deploys) | Medium | Allow exact production URLs; preview deploys hit the API only when explicitly tested. |

## Success criteria

- Invitation `https://<vercel-app>/dega-lauditta` loads on a fresh phone (no laptop running), shows Cover → 8 sections → music player, no console errors.
- `?to=wayan-sudana` renders the personalized greeting.
- Admin login works at `https://<vercel-admin>/login`; creating a client + uploading a photo persists the photo URL on R2 and renders in the invitation.
- `npm run lint` passes on the branch.
- 7-day uptime on Render observed via UptimeRobot.
- Free tier usage stays below 20% of any quota at 1 active invitation (sanity check).

## Decisions

- **Branch for first deploy:** merge `feat/floral-watercolor-template` to `main` first, then deploy from `main`.
- **Custom domain:** deferred. Use `*.vercel.app` + `*.onrender.com` for v1; attach a domain later without redeploy by updating DNS only.
- **Vercel preview deploy CORS:** `ALLOWED_ORIGINS` on Render contains only the two production Vercel URLs. Preview deploys cannot fetch the API; acceptable because there is no PR-review workflow on this project today.

## Out of scope (next specs)

- WhatsApp contact import + bulk send (separate brainstorm).
- Per-PR Vercel preview CORS allowlist automation.
- Custom domain + email-from-domain.
- Production Midtrans cutover.
