# Deploy — Accounts to create

> Source of truth: `docs/superpowers/specs/2026-06-01-deploy-redux-design.md`
> All accounts are free. Create them roughly in this order.

## 1. GitHub — new repo

- Sign-in to https://github.com (existing account OK).
- **New repo:** name like `wedding-invitation-platform`. **Private** is fine.
- Do NOT initialize with README/.gitignore/license (this repo already has them).
- Copy the repo URL (HTTPS or SSH) — I'll wire it up as `origin` and push `master`.

## 2. Vercel — sign-in via GitHub

- https://vercel.com → **Continue with GitHub** (one click; auto-creates the account).
- **Don't** create projects yet. I do that when deploying.
- Two projects will share this one Vercel account: `wedding-admin` and `wedding-invitation`.
- Note: Vercel Hobby is **non-commercial** in its ToS. For a small wedding-invite scale it's
  practically fine, but be aware. Fallback if it ever becomes an issue: Cloudflare Pages.

## 3. Render — sign-in via GitHub

- https://render.com → **Sign in with GitHub**.
- During GitHub authorization, grant Render access to the repo you just created (you can give
  it access to "Only select repositories" → pick this one).
- One Web Service will live here for the Express API.

## 4. MongoDB Atlas

- https://cloud.mongodb.com → register (email + password) or sign-in via Google.
- Create a free **M0** cluster:
  - Provider: **AWS**
  - Region: **Singapore (ap-southeast-1)**
  - Name: `wedding-prod` (or anything)
- After the cluster boots, two manual settings (in Atlas UI):
  - **Database Access → Add New Database User** — username `wedding-app`, generate a random
    password (save it), role `Read and write to any database`. **Save the password.**
  - **Network Access → Add IP Address** — `0.0.0.0/0` (required: Render egress IPs are
    dynamic on free tier).
- Hand me the connection string from **Database → Connect → Drivers → Node.js** (looks like
  `mongodb+srv://wedding-app:<pwd>@<host>/...`) — I'll patch the database name and use it.

## 5. Cloudflare — R2 bucket

- https://dash.cloudflare.com → register or sign-in (email).
- Cloudflare requires a credit card on file to enable R2 (verification only — **no charge**
  under the free quota of 10 GB / 10M reads / 1M writes per month).
- **Dashboard → R2 → Create bucket** named `wedding-uploads`. Location: automatic.
- **Bucket settings → Public Access → Allow Access** — Cloudflare gives you a
  `https://pub-<hash>.r2.dev` URL. Save it.
- **R2 → Manage R2 API Tokens → Create API Token:**
  - Permissions: **Object Read & Write**
  - Specify bucket: `wedding-uploads`
  - Save: **Account ID**, **Access Key ID**, **Secret Access Key** — I need all three.

## 6. UptimeRobot

- https://uptimerobot.com → register (email).
- Verify email. That's it — I'll create the monitor pointing at the Render `/health`
  endpoint after the API is deployed.

---

## What to hand back to me when accounts are ready

Either paste these in a message or save to `notes/deploy-secrets.local.md` (gitignored —
**do not commit**):

```
# GitHub
GITHUB_REPO_URL=<copy from new repo>

# Atlas
ATLAS_CONN_STRING=<from Atlas Connect → Node.js, password substituted>

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_BASE_URL=https://pub-<hash>.r2.dev
```

I will generate `JWT_SECRET` myself (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
Midtrans sandbox keys are already in your local `server/.env`.

## Costs

All zero. The only escape-hatch I'd recommend if Render free's cold-start latency proves
annoying near the wedding day:
- **Render Starter — $7/mo** (≈ Rp 110k/mo): no hibernation, instant response. Easy upgrade
  later via Render dashboard, no redeploy.
