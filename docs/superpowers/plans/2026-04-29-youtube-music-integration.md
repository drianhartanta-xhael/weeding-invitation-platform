# YouTube Music Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admin to paste a YouTube URL on the client detail page; play it as background music on the public invitation via a hidden YouTube IFrame Player + visible "now playing" pill widget showing thumbnail and title.

**Architecture:** Server extracts YouTube `videoId` from any pasted URL and fetches metadata via the free `oembed` endpoint, then persists to `client.music`. Invitation page loads YouTube IFrame Player API, runs a hidden 1×1 px iframe for playback, and renders a compact pill widget at the bottom-right that plays/pauses the iframe. Existing legacy `music.url` (direct MP3) keeps working through a separate render path.

**Tech Stack:** Express + Mongoose + Zod (server), Next.js 14 + React (web/invitation), `axios` (HTTP), YouTube IFrame Player API (browser), YouTube oEmbed (server fetch). No test framework — verification via type-check + manual curl/UI checks.

**Spec:** `docs/superpowers/specs/2026-04-29-youtube-music-integration-design.md`

**Note on TDD:** This codebase has no automated test runner (per `CLAUDE.md`). Each task uses **type-check + manual runtime verification** as the validation step instead of failing-test → passing-test cycles. Where convenient, lightweight `.test.ts` files are added next to new pure-function modules and run via `npx tsx <path>` (not a framework — just imperative assertions that throw).

**File map:**
- `packages/shared/src/types/client.ts` — extend `IMusic` with new optional fields.
- `server/src/models/Client.ts` — extend `music` sub-schema.
- `server/src/validators/client.ts` — extend music validator + add `youtubeUrl` input field.
- `server/src/services/youtubeService.ts` *(new)* — `extractVideoId`, `fetchOEmbed`.
- `server/src/services/youtubeService.test.ts` *(new)* — imperative test for `extractVideoId`.
- `server/src/controllers/youtubeController.ts` *(new)* — preview endpoint.
- `server/src/routes/youtube.ts` *(new)* — route mount.
- `server/src/routes/index.ts` — register youtube routes.
- `server/src/controllers/clientController.ts` — enrich `music` on `updateClient` (and `createClient`) when `youtubeUrl` provided.
- `apps/web/src/app/(dashboard)/clients/[id]/types.ts` — extend `Client.music` shape.
- `apps/web/src/app/(dashboard)/clients/[id]/tabs/DetailsTab.tsx` — replace music section with mode toggle + Preview button + preview card.
- `apps/invitation/src/components/sections/MusicPlayer.tsx` — full rewrite with dual render paths.
- `apps/invitation/src/app/[slug]/page.tsx` — pass new music fields and `shouldPlay={isOpen}`.

---

## Task 1: Extend shared `IMusic` type

**Files:**
- Modify: `packages/shared/src/types/client.ts:16-19`

- [ ] **Step 1: Replace IMusic interface**

Replace the `IMusic` block at lines 16-19 with:

```ts
export interface IMusic {
  // YouTube path (new)
  videoId?: string;
  title?: string;
  artist?: string;
  thumbnailUrl?: string;
  // Legacy direct-MP3 path
  url?: string;
  // Common
  autoplay: boolean;
}
```

- [ ] **Step 2: Type-check shared package**

Run: `npx tsc --noEmit -p packages/shared`
Expected: PASS (no output / exit 0).

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/client.ts
git commit -m "feat(shared): extend IMusic with YouTube videoId/title/artist/thumbnail fields"
```

---

## Task 2: Extend Mongoose Client schema for music

**Files:**
- Modify: `server/src/models/Client.ts:28-31` (interface) and `server/src/models/Client.ts:115-118` (schema)

- [ ] **Step 1: Update IClientDocument music shape**

Replace lines 28-31 with:

```ts
  music: {
    videoId?: string;
    title?: string;
    artist?: string;
    thumbnailUrl?: string;
    url?: string;
    autoplay: boolean;
  };
```

(Note: in TS interfaces inside an interface declaration, optional fields use `?:`. The above is valid TypeScript.)

- [ ] **Step 2: Update music sub-schema**

Replace lines 115-118 with:

```ts
    music: {
      videoId: { type: String, default: '' },
      title: { type: String, default: '' },
      artist: { type: String, default: '' },
      thumbnailUrl: { type: String, default: '' },
      url: { type: String, default: '' },
      autoplay: { type: Boolean, default: true },
    },
```

- [ ] **Step 3: Type-check server**

Run: `cd server && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add server/src/models/Client.ts
git commit -m "feat(server): add YouTube music fields to Client schema"
```

---

## Task 3: Create youtubeService with extractVideoId

**Files:**
- Create: `server/src/services/youtubeService.ts`

- [ ] **Step 1: Create the file with extractVideoId**

```ts
const VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

const URL_PATTERNS: RegExp[] = [
  /(?:youtube\.com\/watch\?v=|music\.youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/,
  /youtu\.be\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
];

export function extractVideoId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  if (VIDEO_ID_REGEX.test(trimmed)) return trimmed;

  for (const pattern of URL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

export interface OEmbedResult {
  title: string;
  artist: string;
  thumbnailUrl: string;
}

export async function fetchOEmbed(videoId: string): Promise<OEmbedResult> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(
    videoId
  )}&format=json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`oEmbed failed: ${res.status}`);
  }
  const data = (await res.json()) as { title: string; author_name: string; thumbnail_url: string };

  return {
    title: data.title,
    artist: data.author_name,
    thumbnailUrl: data.thumbnail_url,
  };
}
```

- [ ] **Step 2: Type-check server**

Run: `cd server && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add server/src/services/youtubeService.ts
git commit -m "feat(server): add youtubeService with extractVideoId and fetchOEmbed"
```

---

## Task 4: Add imperative test for extractVideoId

**Files:**
- Create: `server/src/services/youtubeService.test.ts`

- [ ] **Step 1: Write the test file**

```ts
import { extractVideoId } from './youtubeService';

const cases: Array<{ input: string; expected: string | null }> = [
  { input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  { input: 'https://youtu.be/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  { input: 'https://music.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  { input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=ABC', expected: 'dQw4w9WgXcQ' },
  { input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s', expected: 'dQw4w9WgXcQ' },
  { input: '  https://youtu.be/dQw4w9WgXcQ  ', expected: 'dQw4w9WgXcQ' },
  { input: 'https://www.youtube.com/embed/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  { input: 'dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
  { input: 'not-a-url', expected: null },
  { input: '', expected: null },
  { input: 'https://example.com/foo', expected: null },
];

let failed = 0;
for (const c of cases) {
  const actual = extractVideoId(c.input);
  if (actual !== c.expected) {
    console.error(`FAIL: input=${JSON.stringify(c.input)} expected=${c.expected} actual=${actual}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`${failed}/${cases.length} cases failed`);
  process.exit(1);
}
console.log(`${cases.length}/${cases.length} cases passed`);
```

- [ ] **Step 2: Run the test**

Run: `cd server && npx tsx src/services/youtubeService.test.ts`
Expected: `11/11 cases passed` and exit 0.

- [ ] **Step 3: Commit**

```bash
git add server/src/services/youtubeService.test.ts
git commit -m "test(server): add cases for extractVideoId URL variants"
```

---

## Task 5: Create youtubeController.preview

**Files:**
- Create: `server/src/controllers/youtubeController.ts`

- [ ] **Step 1: Write the controller**

```ts
import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { extractVideoId, fetchOEmbed } from '../services/youtubeService';

const previewSchema = z.object({
  url: z.string().min(1, 'url is required'),
});

export const previewYoutube = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { url } = previewSchema.parse(req.body);
    const videoId = extractVideoId(url);
    if (!videoId) {
      res.status(400).json({ message: 'Invalid YouTube URL' });
      return;
    }
    try {
      const meta = await fetchOEmbed(videoId);
      res.json({
        videoId,
        title: meta.title,
        artist: meta.artist,
        thumbnailUrl: meta.thumbnailUrl,
      });
    } catch {
      res
        .status(400)
        .json({ message: 'Video tidak tersedia (private/deleted/region-locked)' });
    }
  } catch (error) {
    next(error);
  }
};
```

- [ ] **Step 2: Type-check server**

Run: `cd server && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/youtubeController.ts
git commit -m "feat(server): add youtubeController preview endpoint"
```

---

## Task 6: Mount youtube route

**Files:**
- Create: `server/src/routes/youtube.ts`
- Modify: `server/src/routes/index.ts`

- [ ] **Step 1: Create the route file**

```ts
import { Router } from 'express';
import { previewYoutube } from '../controllers/youtubeController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/preview', authenticate, previewYoutube);

export default router;
```

- [ ] **Step 2: Register in routes index**

In `server/src/routes/index.ts`, add an import and mount line. The file should end up as:

```ts
import { Router } from 'express';
import authRoutes from './auth';
import clientRoutes from './clients';
import guestRoutes from './guests';
import wishRoutes from './wishes';
import giftRoutes from './gifts';
import invitationRoutes from './invitations';
import templateRoutes from './templates';
import uploadRoutes from './uploads';
import youtubeRoutes from './youtube';

const router = Router();

router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/guests', guestRoutes);
router.use('/wishes', wishRoutes);
router.use('/gifts', giftRoutes);
router.use('/invitations', invitationRoutes);
router.use('/templates', templateRoutes);
router.use('/uploads', uploadRoutes);
router.use('/youtube', youtubeRoutes);

export default router;
```

- [ ] **Step 3: Type-check server**

Run: `cd server && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Manual smoke test the endpoint**

Start the server in another terminal: `npm run dev:server`

Get a JWT token (use the seeded admin or login):

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@wedding.dev","password":"password123"}' \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).token))')
```

Test happy path:

```bash
curl -s -X POST http://localhost:5000/api/youtube/preview \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

Expected: JSON with `videoId`, `title`, `artist`, `thumbnailUrl`.

Test invalid URL:

```bash
curl -s -X POST http://localhost:5000/api/youtube/preview \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"url":"not-a-url"}'
```

Expected: 400 `{ "message": "Invalid YouTube URL" }`.

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/youtube.ts server/src/routes/index.ts
git commit -m "feat(server): mount /api/youtube/preview route"
```

---

## Task 7: Extend Zod validators for music

**Files:**
- Modify: `server/src/validators/client.ts:35-40`

- [ ] **Step 1: Replace music validator block**

Replace lines 35-40 with:

```ts
  music: z
    .object({
      videoId: z
        .string()
        .regex(/^[A-Za-z0-9_-]{11}$/, 'Invalid videoId')
        .optional(),
      title: z.string().optional(),
      artist: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      url: z.string().optional(),
      autoplay: z.boolean().optional(),
      youtubeUrl: z.string().optional(), // input-only — controller extracts videoId, never persisted
    })
    .optional(),
```

- [ ] **Step 2: Type-check server**

Run: `cd server && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add server/src/validators/client.ts
git commit -m "feat(server): extend music validator with YouTube fields and youtubeUrl input"
```

---

## Task 8: Enrich music in createClient/updateClient

**Files:**
- Modify: `server/src/controllers/clientController.ts` — `updateClient` (lines 146-166) and `createClient` (lines 117-144).

- [ ] **Step 1: Add a music-enrichment helper near the top of the file**

After the imports, before `getClients`, insert:

```ts
import { extractVideoId, fetchOEmbed } from '../services/youtubeService';

interface MusicInput {
  videoId?: string;
  title?: string;
  artist?: string;
  thumbnailUrl?: string;
  url?: string;
  autoplay?: boolean;
  youtubeUrl?: string;
}

async function enrichMusic(music: MusicInput | undefined): Promise<MusicInput | undefined> {
  if (!music) return music;

  const { youtubeUrl, ...rest } = music;

  if (youtubeUrl !== undefined) {
    const trimmed = (youtubeUrl || '').trim();
    if (trimmed === '') {
      // Empty youtubeUrl means "clear YouTube fields"
      return {
        ...rest,
        videoId: '',
        title: '',
        artist: '',
        thumbnailUrl: '',
      };
    }
    const videoId = extractVideoId(trimmed);
    if (!videoId) {
      const err: Error & { status?: number } = new Error('Invalid YouTube URL');
      err.status = 400;
      throw err;
    }
    try {
      const meta = await fetchOEmbed(videoId);
      return {
        ...rest,
        videoId,
        title: meta.title,
        artist: meta.artist,
        thumbnailUrl: meta.thumbnailUrl,
        url: '', // clear legacy when switching to YouTube
      };
    } catch {
      const err: Error & { status?: number } = new Error(
        'Video tidak tersedia (private/deleted/region-locked)'
      );
      err.status = 400;
      throw err;
    }
  }

  // No youtubeUrl provided — pass through as-is.
  // If admin sent music.url (legacy mode), clear YouTube-specific fields.
  if (rest.url !== undefined && rest.url !== '') {
    return {
      ...rest,
      videoId: '',
      title: '',
      artist: '',
      thumbnailUrl: '',
    };
  }

  return rest;
}
```

- [ ] **Step 2: Use it in updateClient**

Replace the `updateClient` function body (lines 146-166) with:

```ts
export const updateClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = updateClientSchema.parse(req.body);
    const enrichedMusic = await enrichMusic(data.music);
    const payload = { ...data, music: enrichedMusic };
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      payload,
      { new: true }
    );
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }
    res.json({ message: 'Client updated', client });
  } catch (error) {
    next(error);
  }
};
```

- [ ] **Step 3: Use it in createClient**

In the `createClient` function (lines 117-144), after `const data = createClientSchema.parse(req.body);` and before `let sections = data.sections || [];`, add:

```ts
    const enrichedMusic = await enrichMusic(data.music);
```

Then change the `Client.create({ ... })` call to spread `enrichedMusic`:

```ts
    const client = await Client.create({
      ...data,
      music: enrichedMusic,
      sections,
      userId: req.user?._id,
    });
```

- [ ] **Step 4: Update errorHandler tolerance for thrown 400s**

Open `server/src/middleware/errorHandler.ts` and confirm it surfaces errors with `.status` set. If it does not, add this clause near the top of the handler (above the Zod check):

```ts
if (err && typeof err === 'object' && 'status' in err && typeof (err as { status?: number }).status === 'number') {
  const status = (err as { status: number }).status;
  res.status(status).json({ message: (err as Error).message });
  return;
}
```

(If the middleware already handles `err.status`, skip this — re-read the file before editing.)

- [ ] **Step 5: Type-check server**

Run: `cd server && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Manual smoke test PATCH with youtubeUrl**

With server running and `$TOKEN` set (see Task 6):

```bash
# Find a client id (use any existing one):
CID=$(curl -s http://localhost:5000/api/clients -H "Authorization: Bearer $TOKEN" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).clients[0]._id))')

# Patch with a YouTube URL:
curl -s -X PUT "http://localhost:5000/api/clients/$CID" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"music":{"youtubeUrl":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","autoplay":true}}'
```

Expected: 200 with `client.music.videoId === "dQw4w9WgXcQ"` and populated `title`, `artist`, `thumbnailUrl`.

Test invalid URL rejection:

```bash
curl -s -X PUT "http://localhost:5000/api/clients/$CID" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"music":{"youtubeUrl":"not-a-url","autoplay":true}}'
```

Expected: 400 with `message: "Invalid YouTube URL"`.

Test legacy mode preservation:

```bash
curl -s -X PUT "http://localhost:5000/api/clients/$CID" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"music":{"url":"https://example.com/song.mp3","autoplay":true}}'
```

Expected: 200 with `client.music.url === "https://example.com/song.mp3"` and YouTube fields cleared.

- [ ] **Step 7: Commit**

```bash
git add server/src/controllers/clientController.ts server/src/middleware/errorHandler.ts
git commit -m "feat(server): enrich client.music with YouTube oEmbed metadata on save"
```

---

## Task 9: Update web `Client.music` type

**Files:**
- Modify: `apps/web/src/app/(dashboard)/clients/[id]/types.ts:39`

- [ ] **Step 1: Replace music shape**

Change line 39 from:

```ts
  music: { url: string; autoplay: boolean };
```

to:

```ts
  music: {
    videoId?: string;
    title?: string;
    artist?: string;
    thumbnailUrl?: string;
    url?: string;
    autoplay: boolean;
  };
```

- [ ] **Step 2: Type-check web app**

Run: `cd apps/web && npx tsc --noEmit`
Expected: PASS (or only existing pre-existing errors — note any new ones to fix in DetailsTab task).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/clients/\[id\]/types.ts
git commit -m "feat(web): extend Client.music type with YouTube fields"
```

---

## Task 10: Rewrite DetailsTab music section UI

**Files:**
- Modify: `apps/web/src/app/(dashboard)/clients/[id]/tabs/DetailsTab.tsx`

- [ ] **Step 1: Update form initial state**

Replace line 28:

```ts
    music: { url: client.music?.url || '', autoplay: client.music?.autoplay || false },
```

with:

```ts
    music: {
      videoId: client.music?.videoId || '',
      title: client.music?.title || '',
      artist: client.music?.artist || '',
      thumbnailUrl: client.music?.thumbnailUrl || '',
      url: client.music?.url || '',
      autoplay: client.music?.autoplay || false,
    },
```

- [ ] **Step 2: Add new state for music UI**

After the existing `useState` calls in the component (around lines 24-39), add:

```ts
  const [musicMode, setMusicMode] = useState<'youtube' | 'audio'>(
    client.music?.videoId ? 'youtube' : client.music?.url ? 'audio' : 'youtube'
  );
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
```

- [ ] **Step 3: Add the preview handler**

Below the `useEffect` (after line 46), add:

```ts
  const handlePreview = async () => {
    setPreviewError('');
    setPreviewLoading(true);
    try {
      const { data } = await api.post('/youtube/preview', { url: youtubeUrlInput });
      setForm((f) => ({
        ...f,
        music: {
          ...f.music,
          videoId: data.videoId,
          title: data.title,
          artist: data.artist,
          thumbnailUrl: data.thumbnailUrl,
        },
      }));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Preview failed';
      setPreviewError(msg);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClearYoutube = () => {
    setForm((f) => ({
      ...f,
      music: { ...f.music, videoId: '', title: '', artist: '', thumbnailUrl: '' },
    }));
    setYoutubeUrlInput('');
    setPreviewError('');
  };
```

- [ ] **Step 4: Replace the Music card body**

Replace the entire `{/* Music */}` Card block (lines 86-112) with:

```tsx
      {/* Music */}
      <Card>
        <CardHeader>
          <CardTitle>Background Music</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <Label className="text-sm font-medium">Mode:</Label>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="music-mode"
                value="youtube"
                checked={musicMode === 'youtube'}
                onChange={() => setMusicMode('youtube')}
              />
              YouTube
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="music-mode"
                value="audio"
                checked={musicMode === 'audio'}
                onChange={() => setMusicMode('audio')}
              />
              Audio file (legacy)
            </label>
          </div>

          {musicMode === 'youtube' && (
            <div className="space-y-3">
              {form.music.videoId ? (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  {form.music.thumbnailUrl && (
                    <img
                      src={form.music.thumbnailUrl}
                      alt=""
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{form.music.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{form.music.artist}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      videoId: {form.music.videoId}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleClearYoutube}>
                    Clear
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>YouTube URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={youtubeUrlInput}
                      onChange={(e) => setYoutubeUrlInput(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <Button
                      variant="outline"
                      onClick={handlePreview}
                      disabled={previewLoading || !youtubeUrlInput.trim()}
                    >
                      {previewLoading ? 'Loading...' : 'Preview'}
                    </Button>
                  </div>
                  {previewError && (
                    <p className="text-xs text-destructive">{previewError}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {musicMode === 'audio' && (
            <div className="space-y-1.5">
              <Label>Audio URL (MP3)</Label>
              <Input
                value={form.music.url}
                onChange={(e) =>
                  setForm({ ...form, music: { ...form.music, url: e.target.value } })
                }
                placeholder="https://..."
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Switch
              checked={form.music.autoplay}
              onCheckedChange={(checked) =>
                setForm({ ...form, music: { ...form.music, autoplay: checked } })
              }
            />
            <Label>Autoplay setelah cover dibuka</Label>
          </div>
        </CardContent>
      </Card>
```

- [ ] **Step 5: Update the save payload**

Find the Save button onClick (line 213, `onClick={() => saveClient({ ...form, bankAccounts, ... })}`). Replace with:

```tsx
          <Button disabled={saving}
            onClick={() => {
              const musicPayload =
                musicMode === 'youtube'
                  ? form.music.videoId
                    ? {
                        videoId: form.music.videoId,
                        title: form.music.title,
                        artist: form.music.artist,
                        thumbnailUrl: form.music.thumbnailUrl,
                        url: '',
                        autoplay: form.music.autoplay,
                      }
                    : {
                        videoId: '',
                        title: '',
                        artist: '',
                        thumbnailUrl: '',
                        url: '',
                        autoplay: form.music.autoplay,
                      }
                  : {
                      videoId: '',
                      title: '',
                      artist: '',
                      thumbnailUrl: '',
                      url: form.music.url,
                      autoplay: form.music.autoplay,
                    };
              saveClient({
                slug: form.slug,
                eventDate: form.eventDate,
                status: form.status,
                music: musicPayload,
                bankAccounts,
                templateId: selectedTemplateId || undefined,
              });
            }}>
            {saving ? 'Saving...' : 'Save Details'}
          </Button>
```

- [ ] **Step 6: Type-check web app**

Run: `cd apps/web && npx tsc --noEmit`
Expected: PASS (or no new errors).

- [ ] **Step 7: Manual UI test**

Start the web app: `npm run dev:web`. With server running too, open `http://localhost:3000`, log in, open a client detail page, go to Details tab.

Verify:
- Music section shows mode toggle defaulted to "YouTube" for client without music.
- Pasting a real YouTube URL and clicking Preview shows thumbnail + title + artist.
- Clicking Save → reload → preview card persists.
- Pasting an invalid URL → inline error message appears.
- Switching to "Audio file (legacy)" mode shows the URL field; saving an MP3 URL persists.
- Toggling back to YouTube mode after saving Audio still works (form state preserved).

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/clients/\[id\]/tabs/DetailsTab.tsx
git commit -m "feat(web): YouTube URL preview and mode toggle in client Music section"
```

---

## Task 11: Rewrite MusicPlayer with YouTube + legacy paths

**Files:**
- Modify (full rewrite): `apps/invitation/src/components/sections/MusicPlayer.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface MusicPlayerProps {
  videoId?: string;
  title?: string;
  artist?: string;
  thumbnailUrl?: string;
  url?: string;
  autoplay: boolean;
  shouldPlay: boolean;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
}

let apiLoadPromise: Promise<void> | null = null;
function loadYouTubeAPI(): Promise<void> {
  if (apiLoadPromise) return apiLoadPromise;
  apiLoadPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady();
      resolve();
    };
    document.head.appendChild(tag);
  });
  return apiLoadPromise;
}

function YouTubeWidget({
  videoId,
  title,
  thumbnailUrl,
  autoplay,
  shouldPlay,
}: {
  videoId: string;
  title?: string;
  thumbnailUrl?: string;
  autoplay: boolean;
  shouldPlay: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadYouTubeAPI().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          playsinline: 1,
          loop: 1,
          playlist: videoId,
        },
        events: {
          onReady: () => {
            setIsReady(true);
          },
          onStateChange: (e) => {
            if (!window.YT) return;
            if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
            else if (
              e.data === window.YT.PlayerState.PAUSED ||
              e.data === window.YT.PlayerState.ENDED
            )
              setIsPlaying(false);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    if (shouldPlay && autoplay) {
      try {
        playerRef.current.playVideo();
      } catch {
        // browser may block — pill remains tappable
      }
    }
  }, [isReady, shouldPlay, autoplay]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: -9999,
          left: -9999,
          width: 1,
          height: 1,
          overflow: 'hidden',
        }}
      >
        <div ref={containerRef} />
      </div>
      <button
        onClick={togglePlay}
        disabled={!isReady}
        className="fixed bottom-6 right-6 flex items-center gap-2 pl-1 pr-3 py-1 rounded-full shadow-lg z-50 bg-wedding-accent text-white hover:opacity-90 transition-opacity disabled:opacity-60"
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover border-2 border-white/40"
          />
        ) : (
          <span className="w-10 h-10 rounded-full bg-white/20" />
        )}
        {title && (
          <span className="truncate max-w-[140px] text-xs font-medium">{title}</span>
        )}
        {isPlaying ? (
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </>
  );
}

function LegacyAudioWidget({
  url,
  autoplay,
  shouldPlay,
}: {
  url: string;
  autoplay: boolean;
  shouldPlay: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (shouldPlay && autoplay && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  }, [shouldPlay, autoplay]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      <audio ref={audioRef} src={url} loop />
      <button
        onClick={togglePlay}
        className="fixed bottom-6 right-6 w-12 h-12 bg-wedding-accent text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:opacity-90 transition-opacity"
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </>
  );
}

export default function MusicPlayer({
  videoId,
  title,
  thumbnailUrl,
  url,
  autoplay,
  shouldPlay,
}: MusicPlayerProps) {
  if (videoId) {
    return (
      <YouTubeWidget
        videoId={videoId}
        title={title}
        thumbnailUrl={thumbnailUrl}
        autoplay={autoplay}
        shouldPlay={shouldPlay}
      />
    );
  }
  if (url) {
    return <LegacyAudioWidget url={url} autoplay={autoplay} shouldPlay={shouldPlay} />;
  }
  return null;
}
```

- [ ] **Step 2: Type-check invitation app**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: PASS (a "MusicPlayer is missing 'shouldPlay' prop" error in `[slug]/page.tsx` is expected — fixed in Task 12).

- [ ] **Step 3: Commit**

```bash
git add apps/invitation/src/components/sections/MusicPlayer.tsx
git commit -m "feat(invitation): rewrite MusicPlayer with YouTube IFrame + legacy paths"
```

---

## Task 12: Wire new MusicPlayer props in `[slug]/page.tsx`

**Files:**
- Modify: `apps/invitation/src/app/[slug]/page.tsx:72` (InvitationData type) and `:210` (MusicPlayer JSX).

- [ ] **Step 1: Extend InvitationData music type**

Replace line 72:

```ts
  music: { url: string; autoplay: boolean };
```

with:

```ts
  music: {
    videoId?: string;
    title?: string;
    artist?: string;
    thumbnailUrl?: string;
    url?: string;
    autoplay: boolean;
  };
```

- [ ] **Step 2: Update MusicPlayer JSX**

Replace line 210:

```tsx
      <MusicPlayer url={invitation.music.url} autoplay={invitation.music.autoplay} />
```

with:

```tsx
      <MusicPlayer
        videoId={invitation.music.videoId}
        title={invitation.music.title}
        artist={invitation.music.artist}
        thumbnailUrl={invitation.music.thumbnailUrl}
        url={invitation.music.url}
        autoplay={invitation.music.autoplay}
        shouldPlay={isOpen}
      />
```

- [ ] **Step 3: Type-check invitation app**

Run: `cd apps/invitation && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Manual end-to-end test**

Start everything: `npm run dev` (web on 3000, invitation on 3001, server on 5000). Make sure MongoDB is up (`docker-compose up -d` if needed).

Test client (using a seeded slug or one you created):

1. In admin (http://localhost:3000): paste `https://www.youtube.com/watch?v=dQw4w9WgXcQ`, click Preview, click Save Details. Confirm autoplay is on.
2. Open the invitation URL `http://localhost:3001/<slug>` in a fresh tab.
3. Cover should appear; pill widget should NOT auto-start audio yet (browser autoplay block).
4. Click "Buka Undangan" on Cover.
5. Music should start within 1-2 seconds. Pill at bottom-right shows thumbnail + title.
6. Tap pill → music pauses, icon switches to play.
7. Tap pill again → music resumes.
8. Refresh page. Click "Buka Undangan" again — autoplay should fire correctly each time.

Test legacy MP3 path (optional but recommended):

1. In admin, switch to "Audio file (legacy)" mode, paste a working MP3 URL (e.g., a short test MP3 from your storage), Save.
2. Reload invitation page → click Cover open → existing button-bulat appears, MP3 plays.

Test no-music client:

1. Clear both fields in admin (toggle to YouTube mode and click Clear, then make sure URL is empty), Save.
2. Reload invitation → no widget at bottom-right, page renders normally.

- [ ] **Step 5: Commit**

```bash
git add apps/invitation/src/app/\[slug\]/page.tsx
git commit -m "feat(invitation): pass new music props and shouldPlay from Cover state"
```

---

## Task 13: Lint pass + final verification

**Files:** all touched.

- [ ] **Step 1: Run repo-wide lint**

Run: `npm run lint`
Expected: PASS (or only pre-existing warnings unrelated to this work).

- [ ] **Step 2: Build everything**

Run: `npm run build`
Expected: All three apps build successfully.

- [ ] **Step 3: Final manual smoke test**

Re-run the end-to-end test from Task 12 Step 4 against production builds (`npm run start` for invitation app after build) to confirm autoplay still works in non-dev mode.

- [ ] **Step 4: Commit any lint fixes**

If there were any lint fixes needed:

```bash
git add -A
git commit -m "chore: fix lint issues introduced by music feature"
```

If nothing to commit, skip this step.

---

## Self-review summary

**Spec coverage:**
- Data model (videoId/title/artist/thumbnailUrl + autoplay, optional url) → Tasks 1, 2, 9, 12.
- `POST /api/youtube/preview` endpoint with auth → Tasks 5, 6.
- `extractVideoId` + `fetchOEmbed` service → Tasks 3, 4.
- Server-side enrichment on `PATCH/POST /api/clients` → Task 8.
- Validator extension with `youtubeUrl` input field → Task 7.
- Admin UI with mode toggle, Preview button, preview card, Clear → Task 10.
- Hidden 1×1 px iframe with YouTube IFrame Player API → Task 11.
- Compact pill widget with thumbnail + title + play/pause → Task 11.
- Backward compat: legacy `<audio>` widget kept → Task 11 (`LegacyAudioWidget`).
- `shouldPlay = isOpen` from Cover → Task 12.
- Edge cases: video unavailable, IFrame API load failure, autoplay block, no music → handled in MusicPlayer (Task 11) and controller error path (Task 8).

**Type consistency:** `IMusic` shape consistent across `packages/shared` (Task 1), Mongoose interface and schema (Task 2), validator (Task 7), web Client type (Task 9), DetailsTab form state (Task 10), invitation `InvitationData` (Task 12), and `MusicPlayerProps` (Task 11).
