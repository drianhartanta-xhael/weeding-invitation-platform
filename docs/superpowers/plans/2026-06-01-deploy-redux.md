# Deploy Wedding Invitation Platform — Redux Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ngrok tunnel with a free-tier public deployment: 2 Next.js apps on Vercel, Express on Render, MongoDB Atlas, file uploads on Cloudflare R2.

**Architecture:** 2 Vercel projects (admin + invitation) from the same monorepo with different `Root Directory`; 1 Render Web Service runs Express as-is; MongoDB Atlas M0 in Singapore; Cloudflare R2 bucket with public read for uploaded images. The invitation app keeps its same-origin `/api/*` and `/uploads/*` rewrites pointing at Render — uploads rewrite is harmless under R2 (which emits absolute URLs) and is still needed for local-dev disk fallback.

**Tech Stack:** Next.js 14, Express 4, Mongoose 8, sharp, multer (memory), `@aws-sdk/client-s3`, MongoDB Atlas, Cloudflare R2, Render, Vercel.

**Verification gate:** No automated test framework exists. The gate is **per-workspace `npx tsc --noEmit`** (one each in `server/`, `apps/web/`, `apps/invitation/`). `npm run lint` is vacuous for the Next.js apps (`next lint` with no ESLint installed reports success regardless of TypeScript errors). Do NOT add Jest/Vitest as part of this plan.

**Status note:** Spec at `docs/superpowers/specs/2026-06-01-deploy-redux-design.md`. Source branch is `master`. GitHub remote NOT yet configured at plan-write time — user has now created repo at `https://github.com/drianhartanta-xhael/weeding-invitation-platform`. Account creation checklist for the rest in `notes/deploy-accounts.md`.

---

## File map

| File | Action | Responsibility |
| --- | --- | --- |
| `.gitignore` | modify | Add root screenshots, `dega-dita-asets*/`, `notes/*.local.md` |
| `server/package.json` + `package-lock.json` | modify | Add `@aws-sdk/client-s3` |
| `server/src/lib/r2.ts` | create | S3-compatible client + `uploadBuffer(key, buffer, contentType)` helper |
| `server/src/routes/uploads.ts` | modify | Use R2 when env vars present; disk fallback otherwise |
| `server/src/app.ts` | modify | Gate the `/uploads` static handler behind the same env condition |
| `server/.env.example` | modify | Document `R2_*` vars + `ALLOWED_ORIGINS` |
| `apps/invitation/vercel.json` | create | Monorepo install + build for Vercel |
| `apps/web/vercel.json` | create | Same pattern for admin |
| `README.md` | modify (final) | Production URL block |

External resources (manual):

- GitHub repo `drianhartanta-xhael/weeding-invitation-platform` (already exists; needs `git remote add origin` + push)
- MongoDB Atlas M0 cluster (Singapore)
- Cloudflare R2 bucket `wedding-uploads`
- Render Web Service for `server/`
- Vercel projects: admin (root `apps/web`) and invitation (root `apps/invitation`)
- Midtrans sandbox: webhook URL update
- UptimeRobot monitor on `<render-url>/health`

---

## Task 1: Add GitHub remote and push master

**Files:** none (git-only)

The remote does not exist (`git branch -r` is empty). User created the repo on 2026-06-01.

- [ ] **Step 1: Add the remote**

```bash
cd /d/CV/apps/wedding-invitation-platform
git remote add origin https://github.com/drianhartanta-xhael/weeding-invitation-platform.git
git remote -v
```

Expected: `origin` listed twice (fetch + push) pointing at the GitHub URL.

- [ ] **Step 2: Push master and set upstream**

```bash
git push -u origin master
```

Expected: ~9 commits pushed (from `51099df` docs-merge through `00a70ac` notes). GitHub now shows the repo populated with `master`.

- [ ] **Step 3: Verify on GitHub**

Open the repo URL in a browser. The latest commit must be `00a70ac docs(notes): deploy account creation checklist`. The `docs/superpowers/specs/2026-06-01-deploy-redux-design.md` file must be visible.

(No commit step — this task is push-only.)

---

## Task 2: Repo hygiene — ignore screenshots, design dumps, secrets

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Inspect what is currently untracked at repo root**

```bash
git status --short | grep '^??'
```

Note any root-level `*.png`, `dega-dita-asets*/`, etc. that should not deploy.

- [ ] **Step 2: Append the rules**

Append to the bottom of `.gitignore`:

```gitignore
# Ad-hoc screenshots / design references (not for deploy)
/*.png
/dega-dita-asets/
/dega-dita-asets2/
/.design-cache/
/.superpowers/brainstorm/

# Local secrets adjacent to notes
notes/*.local.md
```

The leading `/` anchors each pattern to the repo root so identical names inside `apps/invitation/public/assets/...` are not affected.

- [ ] **Step 3: Verify**

```bash
git status --short
```

Expected: any `??` lines for root-level PNGs and `dega-dita-asets2/` disappear; `.gitignore` shows as ` M`.

- [ ] **Step 4: Commit + push**

```bash
git add .gitignore
git commit -m "chore: ignore ad-hoc screenshots, asset dumps, local secrets"
git push
```

---

## Task 3: Add `@aws-sdk/client-s3` to the server workspace

**Files:**
- Modify: `server/package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install**

```bash
cd /d/CV/apps/wedding-invitation-platform
npm install --workspace=server @aws-sdk/client-s3
```

Expected: `server/package.json` gains `@aws-sdk/client-s3` under `dependencies`; `package-lock.json` updates.

- [ ] **Step 2: Type-check**

```bash
cd server && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Commit + push**

```bash
git add server/package.json package-lock.json
git commit -m "chore(server): add @aws-sdk/client-s3 for R2 uploads"
git push
```

---

## Task 4: Create the R2 client helper

**Files:**
- Create: `server/src/lib/r2.ts`

- [ ] **Step 1: Create the file**

Full content:

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

- [ ] **Step 2: Type-check**

```bash
cd server && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Commit + push**

```bash
git add server/src/lib/r2.ts
git commit -m "feat(server): add Cloudflare R2 upload helper"
git push
```

---

## Task 5: Refactor the upload route — R2 with disk fallback

**Files:**
- Modify: `server/src/routes/uploads.ts`

Current behaviour: writes the resized WebP buffer to `server/uploads/` and returns `/uploads/<file>`. Keep that as the fallback for local dev; when `r2Configured` is true, upload to R2 and return the absolute R2 URL instead.

- [ ] **Step 1: Replace file content**

Full new content of `server/src/routes/uploads.ts`:

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

```bash
cd server && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Manual smoke (disk fallback)**

With R2 env vars NOT set, run `npm run dev` from repo root, log in to the admin (`http://localhost:3000`), upload a photo on any client. Returned URL must start with `/uploads/`; file must appear in `server/uploads/`.

- [ ] **Step 4: Commit + push**

```bash
git add server/src/routes/uploads.ts
git commit -m "feat(server): upload to R2 when configured, disk fallback otherwise"
git push
```

---

## Task 6: Gate the `/uploads` static handler in `app.ts`

**Files:**
- Modify: `server/src/app.ts`

When R2 is configured, the URLs returned are absolute and the static handler is dead weight.

- [ ] **Step 1: Read `server/src/app.ts` and find the line**

```typescript
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

- [ ] **Step 2: Add the import near the other imports at the top**

```typescript
import { r2Configured } from './lib/r2';
```

- [ ] **Step 3: Replace the static-handler line**

```typescript
if (!r2Configured) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}
```

- [ ] **Step 4: Type-check**

```bash
cd server && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 5: Smoke (local)**

Restart `npm run dev:server`. Open `http://localhost:5000/uploads/<any-existing-file>` → image renders. In production with R2 set, this route will be absent — that is intentional.

- [ ] **Step 6: Commit + push**

```bash
git add server/src/app.ts
git commit -m "refactor(server): skip /uploads static handler when R2 is configured"
git push
```

---

## Task 7: Add `vercel.json` for both Next.js apps

**Files:**
- Create: `apps/invitation/vercel.json`
- Create: `apps/web/vercel.json`

Vercel's monorepo detection needs both files for the workspace symlink (`@wedding/shared`) to resolve.

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

- [ ] **Step 3: Verify builds locally**

```bash
cd /d/CV/apps/wedding-invitation-platform
npm run build:web
npm run build:invitation
```

Expected: both builds succeed.

- [ ] **Step 4: Commit + push**

```bash
git add apps/web/vercel.json apps/invitation/vercel.json
git commit -m "build: add vercel.json for monorepo install + filtered builds"
git push
```

---

## Task 8: Document R2 + production env vars in `server/.env.example`

**Files:**
- Modify: `server/.env.example`

The web and invitation `.env.example` files already document `NEXT_PUBLIC_INVITATION_URL`. Only the server example needs the R2 + ALLOWED_ORIGINS additions.

- [ ] **Step 1: Read the current file**

```bash
cat server/.env.example
```

- [ ] **Step 2: Append the R2 block**

Append to the bottom (do not remove existing content):

```dotenv

# Cloudflare R2 (production only). Leave any blank and the server falls
# back to writing uploads under server/uploads/ on local disk.
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=wedding-uploads
R2_PUBLIC_BASE_URL=
```

(If `ALLOWED_ORIGINS` is not yet documented, also confirm it exists with a comma-separated value: `ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001`.)

- [ ] **Step 3: Commit + push**

```bash
git add server/.env.example
git commit -m "docs(server): document R2 + ALLOWED_ORIGINS in .env.example"
git push
```

---

## Task 9: Provision MongoDB Atlas M0 (manual, external)

External, ~5 minutes. Account creation steps in `notes/deploy-accounts.md` §4.

- [ ] **Step 1: Create cluster**

In Atlas (https://cloud.mongodb.com): free **M0** cluster, **AWS / Singapore (ap-southeast-1)**, name `wedding-prod`.

- [ ] **Step 2: Database user**

Database Access → Add New User → `wedding-app`, generated password, role `Read and write to any database`. Save the password.

- [ ] **Step 3: Network access**

Network Access → Add IP → `0.0.0.0/0` (Render's egress IPs are not static on free tier).

- [ ] **Step 4: Get connection string**

Database → Connect → Drivers → Node.js → copy the URI. Replace `<password>` with the user password and insert the database name `wedding-invitation` before the `?`. Save as `ATLAS_URI`:

```
mongodb+srv://wedding-app:<password>@<cluster>.mongodb.net/wedding-invitation?retryWrites=true&w=majority
```

(No commit — external state only.)

---

## Task 10: Seed Atlas — canonical seeds for dega-ditta

External, ~3 minutes.

- [ ] **Step 1: Run the template seed against Atlas**

```bash
cd /d/CV/apps/wedding-invitation-platform
MONGODB_URI="<ATLAS_URI from Task 9>" npx tsx server/src/scripts/seed-floral-plum-template.ts
```

Expected: `Template "Floral Watercolor — Plum" upserted`.

- [ ] **Step 2: Run the dega-ditta client seed**

```bash
MONGODB_URI="<ATLAS_URI>" npx tsx server/src/scripts/seed-dega-ditta.ts
```

Expected: `Client "Dega & Ditta" upserted (<id>)` + `3 guests upserted`.

- [ ] **Step 3: Verify in Atlas**

Atlas Data Browser → `wedding-invitation` database. Expected collections:
- `templates` (1 doc: floral-watercolor-plum)
- `clients` (1 doc: dega-ditta)
- `guests` (3 docs: wayan-sudana, komang-ayu, ahmad-rizki)
- `users` (1 doc: admin@wedding.dev)

(No commit — seeds run against external DB.)

---

## Task 11: Provision Cloudflare R2 (manual, external)

External, ~5 minutes. Account steps in `notes/deploy-accounts.md` §5.

- [ ] **Step 1: Enable R2 on the account**

Dashboard → R2 → enable (credit card required for verification — no charge under quota).

- [ ] **Step 2: Create bucket**

Name: `wedding-uploads`. Location: automatic.

- [ ] **Step 3: Public access**

Bucket → Settings → Public Access → **Allow Access**. Cloudflare assigns a `https://pub-<hash>.r2.dev` URL. Save as `R2_PUBLIC_BASE_URL` (no trailing slash).

- [ ] **Step 4: API token**

R2 → Manage R2 API Tokens → Create API Token:
- Permissions: **Object Read & Write**
- Specify Bucket: `wedding-uploads`
- Save: **Account ID**, **Access Key ID**, **Secret Access Key**.

- [ ] **Step 5: Verify (optional, local)**

Temporarily set the four R2 vars in `server/.env.local`, restart `npm run dev:server`, upload a photo via admin UI. Returned URL must start with `R2_PUBLIC_BASE_URL` and open as an image. Remove vars from `.env.local` after to go back to disk dev.

(No commit.)

---

## Task 12: Deploy server to Render (manual, external)

External, ~10 minutes.

- [ ] **Step 1: Create the Web Service**

Render dashboard → New → Web Service → Connect GitHub repo → pick `master`.

- [ ] **Step 2: Service settings**

| Setting | Value |
| --- | --- |
| Name | `wedding-invitation-api` |
| Region | Singapore |
| Branch | `master` |
| Root Directory | *(leave blank — monorepo root)* |
| Runtime | Node |
| Build Command | `npm install && npm run build:server` |
| Start Command | `node server/dist/index.js` |
| Plan | Free |
| Health Check Path | `/health` |

- [ ] **Step 3: Environment variables**

Generate JWT_SECRET first:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set on Render:
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
R2_ACCOUNT_ID=<from-Task-11>
R2_ACCESS_KEY_ID=<from-Task-11>
R2_SECRET_ACCESS_KEY=<from-Task-11>
R2_BUCKET=wedding-uploads
R2_PUBLIC_BASE_URL=<from-Task-11>
```

`ALLOWED_ORIGINS` is a placeholder; Task 15 sets the real Vercel URLs.

- [ ] **Step 4: Deploy + verify**

Trigger first deploy. Wait 5–10 min on free tier.

```bash
curl https://wedding-invitation-api.onrender.com/health
curl https://wedding-invitation-api.onrender.com/api/templates
```

Expected: `/health` → `{"status":"ok",...}`; `/api/templates` → array including the floral-watercolor-plum template.

Save the URL as `RENDER_URL`.

---

## Task 13: Deploy invitation to Vercel (manual, external)

External, ~5 minutes.

- [ ] **Step 1: Create project**

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
NEXT_PUBLIC_INVITATION_URL=https://<vercel-invitation-project>.vercel.app
```

`NEXT_PUBLIC_INVITATION_URL` should be the URL Vercel will assign to THIS project — Vercel previews it before deploy. Set it to the production domain (e.g. `https://wedding-invitation.vercel.app`). This drives the `metadataBase` for WhatsApp link previews.

- [ ] **Step 4: Deploy + verify**

Trigger deploy. After Ready, open on a phone:

```
https://<vercel-invitation>.vercel.app/dega-ditta
https://<vercel-invitation>.vercel.app/dega-ditta?to=wayan-sudana
```

Expected: cover envelope, click opens invitation, sections render (Couple → Gallery grid → Location → Rundown → Dress Code → RSVP → Gift → Wishes), music plays after open, no console errors.

Save the URL as `INVITATION_URL`.

---

## Task 14: Deploy admin to Vercel (manual, external)

External, ~5 minutes.

- [ ] **Step 1: Create project**

Vercel dashboard → Add New → Project → import the same GitHub repo again.

- [ ] **Step 2: Project settings**

| Setting | Value |
| --- | --- |
| Project name | `wedding-admin` |
| Framework Preset | Next.js |
| Root Directory | `apps/web` |

- [ ] **Step 3: Environment variables**

```
NEXT_PUBLIC_API_URL=<RENDER_URL>/api
NEXT_PUBLIC_INVITATION_URL=<INVITATION_URL>
NEXT_PUBLIC_APP_URL=https://<vercel-admin-project>.vercel.app
```

`NEXT_PUBLIC_INVITATION_URL` is essential — the WhatsApp send queue builds `wa.me` links from this. If it points at localhost or is missing, the queue's localhost banner will fire and links will be dead.

- [ ] **Step 4: Deploy + verify**

After Ready, open `https://<vercel-admin>.vercel.app/login`. Log in with `admin@wedding.dev` / `password123`. Navigate to the Dega & Ditta client; verify the guest list shows 3 guests. Open the Send WhatsApp dialog — the localhost banner should NOT appear (links use the prod invitation URL).

Save as `ADMIN_URL`.

---

## Task 15: Lock CORS to production URLs

- [ ] **Step 1: Update `ALLOWED_ORIGINS` on Render**

Render → Environment → edit `ALLOWED_ORIGINS`:

```
https://<vercel-admin>.vercel.app,https://<vercel-invitation>.vercel.app
```

Save. Render redeploys automatically (~2 min).

- [ ] **Step 2: Verify**

From a logged-in admin browser session, DevTools → Network → trigger any API call (e.g. opening the client list). Expected: response has `Access-Control-Allow-Origin` matching the admin URL, no CORS errors. On the invitation URL, the `/api/*` rewrite makes calls same-origin so CORS is moot — but a fresh fetch should still succeed.

---

## Task 16: Update Midtrans sandbox webhook

- [ ] **Step 1: Update the URL**

Midtrans **sandbox** dashboard → Settings → Configuration → Payment Notification URL:

```
<RENDER_URL>/api/gifts/notification
```

- [ ] **Step 2: Verify**

Create a sandbox gift on the public invitation. Use the Midtrans simulator at `https://simulator.sandbox.midtrans.com/` to flip the status. Gift's status in the admin should move from `pending` to `success`.

---

## Task 17: UptimeRobot keepalive

- [ ] **Step 1: Create monitor**

UptimeRobot → Add New Monitor:

| Setting | Value |
| --- | --- |
| Type | HTTP(s) |
| Friendly Name | `wedding-api health` |
| URL | `<RENDER_URL>/health` |
| Monitoring Interval | 5 minutes |

- [ ] **Step 2: Verify**

After ~10 minutes the monitor shows **Up**. Render dashboard shows requests arriving at `/health` every 5 minutes — service stays warm continuously.

---

## Task 18: End-to-end production smoke test

- [ ] **Step 1: Public invitation flow**

Open `<INVITATION_URL>/dega-ditta` on a **fresh phone** (private tab). Verify in order:
- Cover envelope visible with the dark backdrop (no spinner — the loading state was removed)
- Tap → music starts, Hero section appears
- Couple section centered on mobile
- Gallery shows **grid** layout with 9 photos
- Location map iframe renders
- Rundown events
- Dress Code with two silhouettes
- RSVP form, Wishes form, Gift bank info
- No console errors

- [ ] **Step 2: Personalized flow**

Open `<INVITATION_URL>/dega-ditta?to=wayan-sudana`. Expected: invitation name "Mr. & Mrs. Wayan Sudana" appears in the cover/hero greeting.

- [ ] **Step 3: WhatsApp link preview**

Paste `<INVITATION_URL>/dega-ditta` into a WhatsApp chat (don't send). Expected: the preview card renders **with the couple photo**, title `Dega & Ditta Wedding Invitation`. Confirms `metadataBase` + `NEXT_PUBLIC_INVITATION_URL` are wired correctly.

- [ ] **Step 4: RSVP submission**

On the personalized page, submit RSVP `attending`. Expected: success toast; in admin, the guest's RSVP status flips to `attending`.

- [ ] **Step 5: Wish submission**

Submit a wish on the invitation. Expected: appears in the public Wishes list (and in admin if moderation queue exists).

- [ ] **Step 6: Admin upload → R2**

In admin, upload a fresh photo for any client. Inspect the response URL or the saved value in the client document. Expected: URL starts with `https://pub-<hash>.r2.dev/uploads/...` and opens as an image.

- [ ] **Step 7: Final type-check**

```bash
cd /d/CV/apps/wedding-invitation-platform
(cd server && npx tsc --noEmit) && \
(cd apps/web && npx tsc --noEmit) && \
(cd apps/invitation && npx tsc --noEmit) && \
echo "all green"
```

Expected: `all green`.

---

## Task 19: Update README with production URLs

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a Production URLs block near the top**

```markdown
## Production URLs

- Admin: <ADMIN_URL>
- Invitation (example): <INVITATION_URL>/dega-ditta
- API: <RENDER_URL>

Health: <RENDER_URL>/health (kept warm by UptimeRobot every 5 minutes).
```

Replace `<ADMIN_URL>`, `<INVITATION_URL>`, `<RENDER_URL>` with the real URLs.

- [ ] **Step 2: Commit + push**

```bash
git add README.md
git commit -m "docs(readme): production URL block"
git push
```

---

## Self-review notes

**Spec coverage:**
- D1 (NEXT_PUBLIC_INVITATION_URL on both Vercel projects) → Tasks 13 step 3, 14 step 3 (+ task-14 verification specifically checks the localhost banner does NOT fire).
- D2 (canonical seeds) → Task 10 explicitly runs `seed-floral-plum-template` + `seed-dega-ditta`.
- D3 (master branch) → Task 1 pushes `master`; Task 12 step 1 selects `master` on Render.
- D4 (per-workspace tsc) → every code task's verification step is `cd <ws> && npx tsc --noEmit`; Task 18 step 7 runs all three.
- D5 (no GitHub remote yet) → Task 1 adds the remote pointing at the URL the user created.

**Placeholders:** None. All code blocks are complete; all external-task fields name what to copy (ATLAS_URI, RENDER_URL, INVITATION_URL, ADMIN_URL).

**Type consistency:** `r2Configured` is exported from `server/src/lib/r2.ts` (Task 4) and imported by both `routes/uploads.ts` (Task 5) and `app.ts` (Task 6). `uploadBuffer(key, body, contentType)` signature matches between definition (Task 4) and the call site in Task 5. Env-var names match across `.env.example` (Task 8), Atlas conn-string composition (Task 9), R2 token capture (Task 11), and Render env (Task 12).

**Deviation acknowledged:** Verification gate is type-check + manual smoke, not unit tests — repo has no test runner.
