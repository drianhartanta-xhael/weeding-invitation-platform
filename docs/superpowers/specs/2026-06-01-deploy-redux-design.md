# Deploy Wedding Invitation Platform — Redux (Vercel + Render + Atlas + R2)

Date: 2026-06-01
Branch: `master`
Supersedes: [`2026-05-20-deploy-vercel-render-r2-design.md`](./2026-05-20-deploy-vercel-render-r2-design.md)

## Why a redux

The 2026-05-20 spec remains architecturally correct (2 Vercel projects + 1 Render Web Service +
MongoDB Atlas + Cloudflare R2 + UptimeRobot). The codebase has moved forward two weeks since:
new env vars are required, the canonical seeds changed, the branch is now `master`, the
verification gate command was wrong, and the GitHub remote still does not exist. This document
captures only those deltas plus the now-canonical environment matrix; everything else carries
over.

## Goal & non-goals

Unchanged from the 2026-05-20 spec. Permanent free public deployment to replace the ngrok tunnel,
sufficient for 2–3 concurrent client invitations on free tiers.

## Architecture

Unchanged. Browser → Vercel (admin / invitation) → Render (Express API) → MongoDB Atlas;
uploaded images go to Cloudflare R2 with public read; UptimeRobot pings `/health` every 5 minutes
to keep Render warm. Invitation app uses Next.js `/api/*` rewrite to keep traffic same-origin.

## Delta from 2026-05-20

### D1 — Env var matrix (the one missing variable)

`NEXT_PUBLIC_INVITATION_URL` was introduced after the original spec, for two now-shipped features
that depend on it:

- **Admin (`apps/web`):** `SendWhatsAppQueue` builds `wa.me` links from this URL via
  `invitationUrl(clientSlug, guestSlug)`. Without it, links default to `http://localhost:3001` and
  the in-dialog localhost guard banner fires.
- **Invitation (`apps/invitation`):** the `[slug]/layout.tsx` `metadataBase` resolves the
  relative OG image (`groomPhoto`) to an absolute URL for the WhatsApp link preview card.

Complete production env vars:

**Render Web Service** (`server/`)
```
NODE_ENV=production
PORT=10000
JWT_SECRET=<fresh 32-byte hex>
JWT_EXPIRES_IN=7d
MONGODB_URI=<atlas mongodb+srv URI ending with /wedding-invitation>
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx
MIDTRANS_IS_PRODUCTION=false
ALLOWED_ORIGINS=https://<vercel-admin>.vercel.app,https://<vercel-invitation>.vercel.app
R2_ACCOUNT_ID=<cloudflare>
R2_ACCESS_KEY_ID=<cloudflare>
R2_SECRET_ACCESS_KEY=<cloudflare>
R2_BUCKET=wedding-uploads
R2_PUBLIC_BASE_URL=https://pub-<hash>.r2.dev
```

**Vercel — invitation** (`apps/invitation/`)
```
NEXT_PUBLIC_API_URL=/api
API_PROXY_TARGET=https://<render-host>.onrender.com
NEXT_PUBLIC_INVITATION_URL=https://<vercel-invitation>.vercel.app
```

**Vercel — admin** (`apps/web/`)
```
NEXT_PUBLIC_API_URL=https://<render-host>.onrender.com/api
NEXT_PUBLIC_INVITATION_URL=https://<vercel-invitation>.vercel.app
NEXT_PUBLIC_APP_URL=https://<vercel-admin>.vercel.app
```

`.env.example` files in each workspace must document `NEXT_PUBLIC_INVITATION_URL` (only the web
workspace currently has it; invitation and root do not).

### D2 — Canonical seeds for the first deploy

Run against the Atlas URI, in order:

1. `npx tsx server/src/scripts/seed-floral-plum-template.ts` — registers the `floral-watercolor-plum` template the dega-ditta client references.
2. `npx tsx server/src/scripts/seed-dega-ditta.ts` — upserts the Dega & Ditta client (with the new music videoId `X5UqR-fzGm0`, carousel gallery, and the 15 photos under `apps/invitation/public/assets/dega-ditta/invitation/`) plus 3 placeholder guests.

The original spec's `seed-floral-template.ts` + `seed-nusantara*.ts` + `seed-dega-lauditta.ts`
chain is the older variant. Optional — only if the `/dega-lauditta` slug is needed alongside.

### D3 — Branch & remote

- Source branch: **`master`** (the 2026-05-20 spec assumed `feat/floral-watercolor-template`; it
  has since been merged).
- **No remote exists yet.** `git branch -r` is empty. The user must create a new GitHub repository
  and add it as `origin` before pushing. Vercel and Render both require GitHub OAuth import.

### D4 — Verification gate

`npm run lint` is **vacuous** for the Next.js apps: their `lint` script is `next lint`, ESLint is
not installed, and turbo reports the task successful regardless of TypeScript errors. The reliable
per-workspace gate is:

```
cd server         && npx tsc --noEmit
cd apps/web       && npx tsc --noEmit
cd apps/invitation && npx tsc --noEmit
```

All three must exit 0. No automated test framework exists; manual smoke-test checklist per task
remains the operational gate beyond type-check.

### D5 — Repo hygiene

The `.gitignore` rules from the original spec still apply (root-level screenshots,
`dega-dita-asets/`, `dega-dita-asets2/`, `.design-cache/`, `.superpowers/brainstorm/`).
The working tree currently shows `dega-dita-asets2/` as untracked, which must remain untracked
after the new `.gitignore` lands.

## Accounts required (free unless noted)

| # | Service | Purpose | Notes |
| --- | --- | --- | --- |
| 1 | GitHub | Source repository, OAuth for Vercel/Render | New repo needed; remote not yet configured |
| 2 | Vercel (Hobby) | 2 Next.js apps (admin + invitation) | Sign-in via GitHub. ToS gray area for commercial use — acceptable for small wedding-invite scale, flagged for awareness |
| 3 | Render (Free) | Express API Web Service | Sign-in via GitHub. 750 hr/mo, 512 MB RAM, 15-min idle hibernation mitigated by UptimeRobot |
| 4 | MongoDB Atlas | M0 cluster (Singapore ap-southeast-1) | 512 MB |
| 5 | Cloudflare | R2 bucket `wedding-uploads` + API token | Credit card required for verification, no charge under 10 GB / quota |
| 6 | UptimeRobot | 5-min HTTP monitor on Render `/health` | Free tier sufficient |

## Free quota fit

Unchanged from the 2026-05-20 spec; the redux does not change the resource footprint:
Vercel ~2 GB/mo of 100 GB; Render 744 h of 750 h with keepalive; R2 ~5 MB of 10 GB; Atlas <1 MB
of 512 MB.

## Migration sequence

Carries over from the 2026-05-20 plan (Tasks 1 → 20) with the deltas above folded in. The
writing-plans pass will produce the canonical task list.

High-level: repo hygiene → install `@aws-sdk/client-s3` → R2 client + R2-aware upload route →
`vercel.json` for both apps → update `.env.example` files (now including `NEXT_PUBLIC_INVITATION_URL`)
→ commit to master → push to new GitHub remote → provision Atlas → seed Atlas (the **new**
seed list above) → provision R2 → deploy Render → deploy invitation Vercel → deploy admin
Vercel → lock CORS → Midtrans webhook → UptimeRobot → smoke test → README.

## Risk register

Inherits the 2026-05-20 register. The notable additions for the redux:

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| `NEXT_PUBLIC_INVITATION_URL` forgotten on Vercel → WA links default to localhost, OG preview broken | Medium | Explicit env-matrix in section D1; the admin dialog's existing localhost banner is a runtime canary |
| Deploying old seed names → template/client mismatch (dega-ditta references `floral-watercolor-plum`) | Medium | Pinned seed list in section D2 |
| Vercel Hobby commercial-use enforcement | Low | Accept the gray area for small scale; Cloudflare Pages is the fallback option (separate spec if ever needed) |
| Render cold start during a wedding-day flap | Low | UptimeRobot 5-min keepalive; paid Starter ($7/mo) is the documented escape hatch |

## Success criteria

Unchanged from the 2026-05-20 spec, plus:
- `NEXT_PUBLIC_INVITATION_URL` in admin verified by absence of the localhost banner in the
  WhatsApp send dialog.
- OG link preview on WhatsApp shows the dega-ditta couple photo (sanity-checks the
  `metadataBase` resolution and the prod `NEXT_PUBLIC_INVITATION_URL`).
- All three per-workspace `tsc --noEmit` runs exit 0 on `master` before deploy.

## Out of scope (next specs)

- Custom domain + DNS.
- Production Midtrans cutover (real keys).
- Cloudflare Pages migration if Vercel ToS becomes a blocker.
- CI/CD beyond Vercel/Render auto-deploy on push.
