# Deploy Wedding Invitation Platform to Vercel + Render + R2 + Atlas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ngrok tunnel with a permanent free public deployment: 2 Next.js apps on Vercel, Express server on Render, MongoDB Atlas, file uploads on Cloudflare R2.

**Architecture:** 2 Vercel projects (admin, invitation) from the same monorepo with different `Root Directory`. 1 Render Web Service runs Express as-is. MongoDB Atlas M0 in Singapore. Cloudflare R2 bucket with public read for uploaded images. The invitation app keeps its same-origin `/api/*` rewrite pointing at Render; the admin app calls the API cross-origin with Bearer JWT + CORS.

**Tech Stack:** Next.js 14, Express 4, Mongoose 8, sharp, multer (memory), `@aws-sdk/client-s3`, MongoDB Atlas, Cloudflare R2, Render, Vercel.

**Verification gate:** This project has no automated test framework. The gate is `npm run lint` (TypeScript type-check) plus a manual smoke-test checklist per task. Do NOT add Jest/Vitest as part of this plan.

---

## File map

| File | Action | Responsibility |
| --- | --- | --- |
| `.gitignore` | modify | Add screenshot patterns + asset folders that should not deploy |
| `server/src/lib/r2.ts` | create | S3-compatible client + `uploadBuffer(key, buffer, contentType)` helper; reads R2 env vars |
| `server/src/routes/uploads.ts` | modify | Use R2 when env vars present; fall back to disk in local dev |
| `server/src/app.ts` | modify | Gate the `/uploads` static handler behind the same env condition as the fallback |
| `server/package.json` | modify | Add `@aws-sdk/client-s3` |
| `server/.env.example` | modify | Document `R2_*` vars |
| `apps/invitation/next.config.js` | modify | Remove the `/uploads` rewrite (R2 URLs are absolute now) |
| `apps/invitation/.env.example` | modify | Document `API_PROXY_TARGET`, `NEXT_PUBLIC_API_URL=/api` |
| `apps/web/.env.example` | modify | Document `NEXT_PUBLIC_API_URL` pointing at Render |
| `apps/invitation/vercel.json` | create | Monorepo install + build for Vercel |
| `apps/web/vercel.json` | create | Same pattern for the admin project |
| `README.md` | modify (final) | Production URL block |

External resources to create (outside the repo):

- MongoDB Atlas M0 cluster (Singapore)
- Cloudflare R2 bucket `wedding-uploads`
- Render Web Service for `server/`
- Vercel projects: admin (root `apps/web`) and invitation (root `apps/invitation`)
- Midtrans sandbox: webhook URL update
- UptimeRobot: monitor on `<render-url>/health`

---

## Task 1: Repo hygiene — ignore ad-hoc screenshots and the canva asset folder

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Inspect current untracked screenshots**

Run from repo root:

```powershell
git status --short | Select-String '^\?\?'
```

Expected: lists `canva-p*.png`, `clients-*.png`, `dashboard*.png`, `login-*.png`, `templates-list.png`, `settings.png`, `verify-cover.png`, `client-detail.png`, `dega-dita-asets/`, possibly `.superpowers/brainstorm/...` and `.design-cache/`.

- [ ] **Step 2: Append the new ignore rules**

Append the following block to `.gitignore` (do not remove existing content):

```gitignore
# Ad-hoc screenshots / design references (not for deploy)
/*.png
/dega-dita-asets/
/.design-cache/
/.superpowers/brainstorm/
```

The leading `/` anchors the pattern to the repo root so the same name inside `apps/invitation/public/assets/` is not affected.

- [ ] **Step 3: Verify the ignores work**

Run:

```powershell
git status --short
```

Expected: the `??` lines for the root-level PNGs and `dega-dita-asets/` disappear; the patched `.gitignore` shows as ` M`.

- [ ] **Step 4: Commit**

```powershell
git add .gitignore
git commit -m "chore: ignore ad-hoc screenshots and asset folders at repo root"
```

---

## Task 2: Add `@aws-sdk/client-s3` to the server workspace

**Files:**
- Modify: `server/package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install the dependency in the server workspace**

Run from repo root:

```powershell
npm install --workspace=server @aws-sdk/client-s3
```

Expected: `server/package.json` gains `@aws-sdk/client-s3` under `dependencies`; `package-lock.json` updates.

- [ ] **Step 2: Verify the dependency resolves**

Run:

```powershell
npm run lint
```

Expected: passes; no resolution errors for `@aws-sdk/client-s3`.

- [ ] **Step 3: Commit**

```powershell
git add server/package.json package-lock.json
git commit -m "chore(server): add @aws-sdk/client-s3 for R2 uploads"
```

---

## Task 3: Create the R2 client helper

**Files:**
- Create: `server/src/lib/r2.ts`

- [ ] **Step 1: Create the file with the full content below**

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// R2 is configured when all five env vars are present. Outside that, the
// uploader falls back to disk (see routes/uploads.ts) so local dev still
// works without R2 credentials.
const accountId = process.env.R2_ACCOUNT_ID || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const bucket = process.env.R2_BUCKET || '';
const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/$/, '');

export const r2Configured =
  !!accountId && !!accessKeyId && !!secretAccessKey && !!bucket && !!publicBaseUrl;

const client = r2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
  : null;

export async function uploadBuffer(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  if (!client) {
    throw new Error('R2 is not configured');
  }
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  return `${publicBaseUrl}/${key}`;
}
```

- [ ] **Step 2: Type-check the new file**

Run:

```powershell
npm run lint
```

Expected: passes.

- [ ] **Step 3: Commit**

```powershell
git add server/src/lib/r2.ts
git commit -m "feat(server): add Cloudflare R2 upload helper"
```

---

## Task 4: Refactor the upload route to use R2 with a disk fallback

**Files:**
- Modify: `server/src/routes/uploads.ts`

The current route writes resized WebP buffers to `server/uploads/` and returns `/uploads/<file>`. We keep that path as the fallback for local dev. When `r2Configured` is true, upload to R2 and return the absolute R2 URL instead.

- [ ] **Step 1: Replace the route body with the R2-aware implementation**

Replace the entire content of `server/src/routes/uploads.ts` with:

```typescript
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';
import { r2Configured, uploadBuffer } from '../lib/r2';

const router = Router();

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

router.post(
  '/',
  authenticate,
  upload.array('images', 20),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ message: 'No files uploaded' });
        return;
      }

      if (!r2Configured) {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
      }

      const urls = await Promise.all(
        files.map(async (file) => {
          const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;

          const webp = await sharp(file.buffer)
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();

          if (r2Configured) {
            return await uploadBuffer(`uploads/${filename}`, webp, 'image/webp');
          }

          const dest = path.join(UPLOAD_DIR, filename);
          await fs.writeFile(dest, webp);
          return `/uploads/${filename}`;
        })
      );

      res.json({ urls });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

- [ ] **Step 2: Type-check**

Run:

```powershell
npm run lint
```

Expected: passes.

- [ ] **Step 3: Smoke-test the disk fallback locally**

With `MONGODB_URI` pointed at local Mongo and R2 env vars **unset**, run `npm run dev:server` and `npm run dev:web` (or both), log in to the admin, and upload a photo on a client. The response URL must start with `/uploads/` and the file must appear in `server/uploads/`. Stop the dev stack when done.

- [ ] **Step 4: Commit**

```powershell
git add server/src/routes/uploads.ts
git commit -m "feat(server): upload to R2 when configured, disk fallback otherwise"
```

---

## Task 5: Gate the `/uploads` static handler

**Files:**
- Modify: `server/src/app.ts`

The static handler is only useful when uploads land on disk. When R2 is configured, the URLs returned are absolute and the static route is dead weight.

- [ ] **Step 1: Apply the change**

In `server/src/app.ts`, replace the block:

```typescript
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

with:

```typescript
import { r2Configured } from './lib/r2';

if (!r2Configured) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}
```

Place the `import { r2Configured }` line near the other imports at the top, not inline.

- [ ] **Step 2: Type-check**

Run:

```powershell
npm run lint
```

Expected: passes.

- [ ] **Step 3: Smoke-test that the static path still serves locally**

Restart `npm run dev:server`. Open `http://localhost:5000/uploads/<one-existing-file>` in a browser. Expected: the image renders. (When R2 is later configured in production, this route will be absent — that is intentional.)

- [ ] **Step 4: Commit**

```powershell
git add server/src/app.ts
git commit -m "refactor(server): skip /uploads static handler when R2 is configured"
```

---

## Task 6: Drop the `/uploads` rewrite from the invitation Next config

**Files:**
- Modify: `apps/invitation/next.config.js`

The R2 URLs we now emit are absolute, so the invitation app no longer needs a same-origin `/uploads/*` proxy. Keep the `/api/*` rewrite — that one is still needed because the admin and invitation apps share the same Express API.

- [ ] **Step 1: Replace `next.config.js`**

Set the file content to:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@wedding/shared'],
  output: 'standalone',
  async rewrites() {
    const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:5000';
    return [
      { source: '/api/:path*', destination: `${apiTarget}/api/:path*` },
    ];
  },
};

module.exports = nextConfig;
```

- [ ] **Step 2: Verify locally**

Run `npm run dev:invitation` and `npm run dev:server`. Open `http://localhost:3001/dega-lauditta`. Expected: page loads, gallery shows the photos from `apps/invitation/public/assets/dega-lauditta/...` (those are Next.js public assets, not affected by the rewrite).

- [ ] **Step 3: Commit**

```powershell
git add apps/invitation/next.config.js
git commit -m "refactor(invitation): drop /uploads rewrite; R2 URLs are absolute"
```

---

## Task 7: Add `vercel.json` for both Next.js apps

**Files:**
- Create: `apps/invitation/vercel.json`
- Create: `apps/web/vercel.json`

Vercel's monorepo detection installs from the workspace root only when told to. Without these files the install can fail because workspace symlinks (`@wedding/shared`) won't resolve.

- [ ] **Step 1: Create `apps/invitation/vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "cd ../.. && npm install",
  "buildCommand": "cd ../.. && npm run build:invitation",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

- [ ] **Step 2: Create `apps/web/vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "cd ../.. && npm install",
  "buildCommand": "cd ../.. && npm run build:web",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

- [ ] **Step 3: Verify the build commands run locally**

Run from repo root:

```powershell
npm run build:web
npm run build:invitation
```

Expected: both builds succeed. (Both apps already have `output: 'standalone'` or default `.next` output; Vercel handles standalone automatically.)

- [ ] **Step 4: Commit**

```powershell
git add apps/web/vercel.json apps/invitation/vercel.json
git commit -m "build: add vercel.json for monorepo install + filtered builds"
```

---

## Task 8: Document new env vars in `.env.example` files

**Files:**
- Modify: `server/.env.example`
- Modify: `apps/invitation/.env.example`
- Modify: `apps/web/.env.example`
- Modify: `.env.example`

- [ ] **Step 1: Update `server/.env.example`**

Replace the file content with:

```dotenv
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

MONGODB_URI=mongodb://localhost:27017/wedding-invitation

MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx
MIDTRANS_IS_PRODUCTION=false

NEXT_PUBLIC_APP_URL=http://localhost:3000

# Comma-separated; in production set to the Vercel admin + invitation URLs.
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Cloudflare R2 (production only). Leaving any of these blank falls back
# to local disk in server/uploads/.
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=wedding-uploads
R2_PUBLIC_BASE_URL=
```

- [ ] **Step 2: Update `apps/invitation/.env.example`**

Replace the file content with:

```dotenv
# Local dev: leave NEXT_PUBLIC_API_URL = /api and the rewrite below targets localhost.
# Production: set NEXT_PUBLIC_API_URL = /api and API_PROXY_TARGET to the Render URL.
NEXT_PUBLIC_API_URL=/api
API_PROXY_TARGET=http://localhost:5000
```

- [ ] **Step 3: Update `apps/web/.env.example`**

Replace the file content with:

```dotenv
# Admin calls the API cross-origin. Set to the Render URL in production.
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

- [ ] **Step 4: Update root `.env.example`**

Open the file. After the existing `NEXT_PUBLIC_API_URL=` line, append the R2 + ALLOWED_ORIGINS block exactly as in Step 1 (without `PORT` and the other duplicates — only the R2 block + `ALLOWED_ORIGINS`).

- [ ] **Step 5: Commit**

```powershell
git add server/.env.example apps/invitation/.env.example apps/web/.env.example .env.example
git commit -m "docs: document R2 + production env vars in .env.example files"
```

---

## Task 9: Merge `feat/floral-watercolor-template` to `main` and push

**Decision (locked in spec):** deploy from `main`. All code tasks (1–8) land on the feature branch first, then merge.

- [ ] **Step 1: Confirm working tree is clean**

```powershell
git status
```

Expected: no uncommitted changes (other than `.claude/settings.local.json` and similar local-only files which can stay).

- [ ] **Step 2: Verify the remote is set**

```powershell
git remote -v
```

Expected: `origin` points at a GitHub URL. If not, set it with `git remote add origin <github-url>` first.

- [ ] **Step 3: Push the feature branch**

```powershell
git push -u origin feat/floral-watercolor-template
```

- [ ] **Step 4: Switch to main and merge**

```powershell
git checkout main
git pull --ff-only origin main
git merge --no-ff feat/floral-watercolor-template -m "feat: floral watercolor template + Vercel/Render/R2 deploy prep"
```

If the merge conflicts (main has diverged), resolve normally before continuing. If main has nothing on it locally, the `pull` may say "Already up to date" — that's fine.

- [ ] **Step 5: Push main**

```powershell
git push origin main
```

Expected: GitHub now has the merge commit. Vercel and Render will deploy from this branch.

---

## Task 10: Provision MongoDB Atlas M0 (manual)

External, ~5 minutes.

- [ ] **Step 1: Create the cluster**

In Atlas (https://cloud.mongodb.com): create a free **M0** cluster, region **AWS / Singapore (ap-southeast-1)**, name `wedding-prod`.

- [ ] **Step 2: Database user**

Database Access → Add New User → username `wedding-app`, generated password, role `Read and write to any database`. Save the password securely.

- [ ] **Step 3: Network access**

Network Access → Add IP → `0.0.0.0/0` (required because Render's egress IPs are not static on the free tier).

- [ ] **Step 4: Get the connection string**

Database → Connect → Drivers → Node.js → copy the `mongodb+srv://...` URI. Replace `<password>` with the user password and append `/wedding-invitation` for the database name (before the `?`).

Final shape:

```
mongodb+srv://wedding-app:<password>@<cluster>.mongodb.net/wedding-invitation?retryWrites=true&w=majority
```

Save this as `ATLAS_URI`.

---

## Task 11: Seed Atlas from local

- [ ] **Step 1: Run the template seed against Atlas**

```powershell
$env:MONGODB_URI = "<ATLAS_URI from Task 10>"
npx tsx server/src/scripts/seed-floral-template.ts
npx tsx server/src/scripts/seed-nusantara.ts
```

Expected console output: `Template "Floral Watercolor" upserted` and the 6 Nusantara templates.

- [ ] **Step 2: Run the client seed**

```powershell
npx tsx server/src/scripts/seed-dega-lauditta.ts
```

Expected: `Client "Dega & Lauditta" upserted` + 3 guests upserted.

- [ ] **Step 3: Verify in Atlas**

Atlas Data Browser → `wedding-invitation` database. Expected collections: `templates` (7 docs), `clients` (1 doc), `guests` (3 docs), `users` (1 doc).

- [ ] **Step 4: Clear the env var**

```powershell
Remove-Item Env:MONGODB_URI
```

---

## Task 12: Provision Cloudflare R2 (manual)

External, ~5 minutes.

- [ ] **Step 1: Enable R2 on the Cloudflare account**

Dashboard → R2 → enable. A credit card is required even on the free tier (no charges under quota).

- [ ] **Step 2: Create the bucket**

Bucket name: `wedding-uploads`. Location: leave automatic.

- [ ] **Step 3: Public access**

In the bucket settings → Settings → Public Access → enable **Allow Access**. Cloudflare will assign a `pub-<hash>.r2.dev` URL. Copy this as `R2_PUBLIC_BASE_URL` (no trailing slash).

- [ ] **Step 4: API token**

R2 → Manage R2 API Tokens → Create API Token. Permissions: **Object Read & Write**. Specify Bucket: `wedding-uploads`. Save the resulting **Account ID**, **Access Key ID**, and **Secret Access Key**.

- [ ] **Step 5: Verify**

In PowerShell (still locally), set the four R2 env vars in `server/.env.local` and restart `npm run dev:server`. Upload a photo via the admin UI. Expected: the returned URL starts with `R2_PUBLIC_BASE_URL` and opening it in a browser shows the image. Remove the R2 env vars from local `.env.local` after this test if you want to go back to disk dev.

---

## Task 13: Deploy server to Render (manual)

External, ~10 minutes.

- [ ] **Step 1: Create the Web Service**

Render dashboard → New → Web Service → Connect the GitHub repo. Pick branch `main`.

- [ ] **Step 2: Service settings**

| Setting | Value |
| --- | --- |
| Name | `wedding-invitation-api` |
| Region | Singapore |
| Branch | `main` |
| Root Directory | *(leave blank — monorepo root)* |
| Runtime | Node |
| Build Command | `npm install && npm run build:server` |
| Start Command | `node server/dist/index.js` |
| Plan | Free |
| Health Check Path | `/health` |

- [ ] **Step 3: Environment variables**

Add the following (use the values from Tasks 10 + 12, and a fresh `JWT_SECRET` produced by `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`):

```
NODE_ENV=production
PORT=10000
JWT_SECRET=<fresh-secret>
JWT_EXPIRES_IN=7d
MONGODB_URI=<ATLAS_URI>
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx
MIDTRANS_IS_PRODUCTION=false
ALLOWED_ORIGINS=https://placeholder.local
R2_ACCOUNT_ID=<from-cloudflare>
R2_ACCESS_KEY_ID=<from-cloudflare>
R2_SECRET_ACCESS_KEY=<from-cloudflare>
R2_BUCKET=wedding-uploads
R2_PUBLIC_BASE_URL=<r2-public-url>
```

`ALLOWED_ORIGINS` is a placeholder for now; Task 16 updates it once the Vercel URLs exist.

- [ ] **Step 4: Deploy and verify**

Trigger the first deploy. Wait for build + start (5–10 minutes on free tier).

```powershell
curl https://wedding-invitation-api.onrender.com/health
curl https://wedding-invitation-api.onrender.com/api/templates
```

Expected: `/health` returns `{"status":"ok",...}`; `/api/templates` returns the 7-template array.

Save the URL (`RENDER_URL`) for the next tasks.

---

## Task 14: Deploy invitation to Vercel (manual)

External, ~5 minutes.

- [ ] **Step 1: Create the project**

Vercel dashboard → Add New → Project → import the same GitHub repo.

- [ ] **Step 2: Project settings**

| Setting | Value |
| --- | --- |
| Project name | `wedding-invitation` |
| Framework Preset | Next.js |
| Root Directory | `apps/invitation` |
| Install / Build Commands | leave Vercel to use `apps/invitation/vercel.json` |

- [ ] **Step 3: Environment variables**

```
NEXT_PUBLIC_API_URL=/api
API_PROXY_TARGET=<RENDER_URL>
```

(no trailing slash on `API_PROXY_TARGET`)

- [ ] **Step 4: Deploy and verify**

Trigger deploy. After it goes Ready, open `https://<vercel-invitation>.vercel.app/dega-lauditta` on a phone or browser.

Expected: Cover envelope shows, click opens the invitation, sections render (Couple → Gallery grid → Location → Events → Dress Code → RSVP → Wishes), music player plays.

Save `INVITATION_URL`.

---

## Task 15: Deploy admin to Vercel (manual)

External, ~5 minutes.

- [ ] **Step 1: Create the project**

Vercel dashboard → Add New → Project → import the same GitHub repo (again).

- [ ] **Step 2: Project settings**

| Setting | Value |
| --- | --- |
| Project name | `wedding-admin` |
| Framework Preset | Next.js |
| Root Directory | `apps/web` |

- [ ] **Step 3: Environment variables**

```
NEXT_PUBLIC_API_URL=<RENDER_URL>/api
```

- [ ] **Step 4: Deploy and verify**

Trigger deploy. After Ready, open `https://<vercel-admin>.vercel.app/login`. Log in with `admin@wedding.dev` / `password123`. Navigate to the Dega & Lauditta client; verify list renders. Upload a fresh photo on a test client; the returned URL must live on the R2 public base URL, and the image must open in the browser.

Save `ADMIN_URL`.

---

## Task 16: Lock down CORS to the two production URLs

- [ ] **Step 1: Update `ALLOWED_ORIGINS` on Render**

In Render → Environment → edit `ALLOWED_ORIGINS`:

```
https://<vercel-admin>.vercel.app,https://<vercel-invitation>.vercel.app
```

Save. Render redeploys automatically (~2 minutes on free tier).

- [ ] **Step 2: Verify CORS**

From a logged-in admin browser session, open DevTools → Network → trigger any API call. Expected: response has `Access-Control-Allow-Origin` matching the admin URL, no CORS errors. Repeat on the invitation URL with a fetch of `/api/invitations/dega-lauditta`.

---

## Task 17: Update Midtrans sandbox webhook

- [ ] **Step 1: Update the URL**

Log into the Midtrans **sandbox** dashboard → Settings → Configuration → Payment Notification URL. Set:

```
<RENDER_URL>/api/gifts/notification
```

- [ ] **Step 2: Verify**

Create a sandbox gift transaction (you can do this from the public invitation page). Use the Midtrans simulator at `https://simulator.sandbox.midtrans.com/` to flip the status. Expected: the gift's status in the admin moves from `pending` to `success`.

---

## Task 18: Add UptimeRobot keepalive

- [ ] **Step 1: Create the monitor**

UptimeRobot → Add New Monitor:

| Setting | Value |
| --- | --- |
| Type | HTTP(s) |
| Friendly Name | `wedding-api health` |
| URL | `<RENDER_URL>/health` |
| Monitoring Interval | 5 minutes |

- [ ] **Step 2: Verify it works**

After ~10 minutes, the monitor should show **Up**. Check the Render dashboard: requests are arriving at `/health` every 5 minutes. The service should now stay warm continuously.

---

## Task 19: End-to-end production smoke test

- [ ] **Step 1: Public invitation flow**

Open `https://<vercel-invitation>.vercel.app/dega-lauditta` on a fresh mobile browser session (private tab on a phone is ideal).

Verify in order:
- Cover envelope visible with "Sentuh untuk membuka undangan"
- Tap → Hero section with photo, names, date
- Couple section centered on mobile
- Gallery shows grid layout
- Location map iframe renders
- Events list
- Dress Code with the two silhouettes
- Music player playing/has the play button
- No console errors

- [ ] **Step 2: Guest-personalized flow**

Open `<INVITATION_URL>/dega-lauditta?to=wayan-sudana`. Expected: "Kepada Yth. Bapak & Ibu Wayan Sudana" appears in the Hero greeting block.

- [ ] **Step 3: RSVP submission**

On the personalized page, scroll to RSVP, submit `hadir`. Expected: success toast, then in the admin (`<ADMIN_URL>`) the guest's RSVP status updates to `hadir`.

- [ ] **Step 4: Wish submission**

Submit a wish on the invitation. Expected: appears immediately if auto-approve is on, otherwise visible in the admin moderation queue.

- [ ] **Step 5: Final lint**

```powershell
npm run lint
```

Expected: passes on `main`.

---

## Task 20: Update README with production URLs

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add the production block**

Near the top of `README.md`, before any existing "Getting Started" section, add:

```markdown
## Production URLs

- Admin: https://<vercel-admin>.vercel.app
- Invitation (example): https://<vercel-invitation>.vercel.app/dega-lauditta
- API: https://<wedding-invitation-api>.onrender.com

Health: <api-url>/health (kept warm by UptimeRobot every 5 minutes).
```

Use the real URLs from Tasks 13–15.

- [ ] **Step 2: Commit**

```powershell
git add README.md
git commit -m "docs(readme): production URL block"
git push origin main
```

---

## Self-review notes (not a task)

Coverage cross-check against the spec:

- Prerequisites — Tasks 1, 9 (repo hygiene + push); Tasks 10, 12, 13, 14, 15, 18 (account provisioning).
- Architecture — Tasks 13–15 (Render + 2 Vercel) and Task 6 (rewrites).
- Code changes — Tasks 2, 3, 4, 5, 6, 7, 8 (all server + invitation + web file edits in the spec's "Code changes" table).
- Migration sequence — Tasks 10–19 mirror the spec's 10-step sequence (provision → seed → deploy → CORS → webhook → uptime → smoke → README).
- Risks — Atlas IP allow (Task 10 step 3), cold start (Task 18), Vercel monorepo install (Task 7 `vercel.json`), R2 misconfig (Task 4 fallback + Task 12 step 5 local test), CORS narrowness (Task 16 explicit URLs), Midtrans webhook (Task 17 explicit).
- Decisions — `main` branch (Task 9), no custom domain (no task — intentionally deferred), production-only CORS (Task 16).
- Success criteria — Task 19 covers Cover, sections, guest greeting, RSVP, lint. The 7-day uptime check is a passive UptimeRobot observation, not an executable step.
