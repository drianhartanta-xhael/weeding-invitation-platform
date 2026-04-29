# YouTube Music Integration — Design Spec

**Date:** 2026-04-29
**Status:** Approved for implementation planning
**Owner:** drianhartanta@gmail.com

## Goal

Couple/admin paste a YouTube (or YouTube Music) URL on the client detail page, and the corresponding song plays as background music on the public invitation, with metadata (thumbnail + title + artist) shown in a compact "now playing" pill widget.

## Why this approach

- **Cost: free, forever.** No API key, no quota.
  - YouTube IFrame Player API is free with no quota for playback.
  - YouTube oEmbed endpoint (`https://www.youtube.com/oembed`) is free with no auth and no documented quota.
  - YouTube Data API v3 (the search-based alternative) is free but capped at 10k units/day, and a single search costs 100 units — would bottleneck at ~100 admin searches/day across the whole platform.
- **No native YouTube Music API.** YouTube Music has no public playback API. Industry-standard for "YT Music integration" on Indonesian invitation platforms is to embed the YouTube video version (which 99% of YT Music tracks have).
- **Audio-only via hidden video iframe.** A 1×1 px off-screen iframe still counts as video playback, defending against YouTube ToS that prohibits separating audio from video. The visible pill widget shows thumbnail + title, reinforcing the "video metadata is visible" position.
- **Backward compatibility kept.** Existing `client.music.url` (direct MP3 URL) continues to work via a separate legacy render path. No data migration required.

## Non-goals (YAGNI)

- Multi-track playlists.
- Per-guest music personalization.
- Custom audio uploads via dashboard (legacy `url` field stays manual-paste).
- Crossfade, volume slider, progress bar.
- Server-side health check of stored videos.
- In-admin search-based picker (paste URL is sufficient).
- Music as a slot-system section (stays as a global floating widget).

## Architecture overview

```
Admin paste YouTube URL in DetailsTab
  → click "Preview" → POST /api/youtube/preview
      → server extracts videoId (regex)
      → server fetches oEmbed metadata
      → returns { videoId, title, artist, thumbnailUrl }
  → admin sees preview card, clicks Save
  → PATCH /api/clients/:id with music.youtubeUrl
      → server re-validates + re-fetches oEmbed (truth source = server)
      → persists music = { videoId, title, artist, thumbnailUrl, autoplay }

Invitation page render:
  → MusicPlayer component receives music data + shouldPlay (from Cover isOpen state)
  → if videoId present:
      → load YouTube IFrame Player API (once)
      → init hidden 1×1 px off-screen iframe with videoId
      → render visible compact pill widget (thumbnail + title + play/pause)
      → on Cover "Buka Undangan" click → shouldPlay = true → player.playVideo()
  → if only legacy url present:
      → render existing <audio> + button-bulat (unchanged)
  → if neither: render null
```

**Key design decisions:**

| Aspect | Choice | Rationale |
|---|---|---|
| Source | Paste YouTube URL | Free, no API key, no quota |
| Metadata fetch | Server-side oEmbed, cached in DB | One-time enrichment on save; no runtime cost |
| Visible widget | Compact pill (thumbnail 40×40 + title + play/pause) | Premium feel, matches minimalist invitation aesthetic |
| Iframe | Hidden 1×1 px off-screen, YouTube IFrame Player API | Audio-only UX while staying defensible vs ToS |
| Autoplay trigger | `shouldPlay = isOpen` from Cover click | Browser allows autoplay only after user gesture |
| Backward compat | Dual render path — legacy `url` still supported | No migration; old clients keep working |
| Music in slot system? | No — stays as global floating widget | Not in-flow content; current `page.tsx` integration unchanged |

## Data model

### Shared type (`packages/shared/src/types/client.ts`)

```ts
export interface IMusic {
  // YouTube path (new fields)
  videoId?: string;        // 11-char YouTube ID, regex ^[A-Za-z0-9_-]{11}$
  title?: string;          // from oEmbed
  artist?: string;         // from oEmbed author_name
  thumbnailUrl?: string;   // from oEmbed thumbnail_url

  // Legacy path (existing field, kept)
  url?: string;            // direct MP3 URL — fallback render path

  // Common
  autoplay: boolean;
}
```

All fields optional except `autoplay`. A client may have neither path set (no music). The MusicPlayer component picks render path:

- `videoId` present → YouTube widget
- otherwise `url` present → legacy `<audio>` widget
- otherwise → render null

### Mongoose schema (`server/src/models/Client.ts`)

Update embedded `music` sub-schema to add the four new optional string fields (`videoId`, `title`, `artist`, `thumbnailUrl`). No migration needed — new fields default to undefined, existing documents continue to work.

### Validator (`server/src/validators/client.ts`)

Zod schema for music:
- `videoId`: optional string, regex `^[A-Za-z0-9_-]{11}$`
- `title`, `artist`, `thumbnailUrl`: optional strings (server-set, but validator accepts client values for completeness)
- `url`: optional string (legacy)
- `autoplay`: boolean
- `youtubeUrl`: optional string (input-only — controller extracts videoId, never persisted)

## API surface

### New endpoint: `POST /api/youtube/preview` (auth required)

Used by admin form to validate a URL and fetch metadata before form submit.

**Request:**
```json
{ "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
```

**Success (200):**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "artist": "Rick Astley",
  "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
}
```

**Errors (400):**
- `{ "error": "Invalid YouTube URL" }` — videoId could not be extracted.
- `{ "error": "Video tidak tersedia (private/deleted/region-locked)" }` — oEmbed returned 401/404.

### Modified endpoint: `PATCH /api/clients/:id`

When body includes `music.youtubeUrl`:
1. Extract videoId via service.
2. Fetch oEmbed metadata.
3. Persist `music = { videoId, title, artist, thumbnailUrl, autoplay, url: undefined }`.
4. On extract/oEmbed failure → 400 with same error messages as preview endpoint.

When body includes `music.url` only (legacy mode):
1. Persist `music = { url, autoplay, videoId/title/artist/thumbnailUrl: undefined }`.

When body includes neither: clear all music fields (autoplay still respected if explicitly set).

## New service: `server/src/services/youtubeService.ts`

```ts
extractVideoId(input: string): string | null
```
Handles URL variants:
- `https://www.youtube.com/watch?v=<id>`
- `https://youtu.be/<id>`
- `https://music.youtube.com/watch?v=<id>`
- With `&list=`, `&t=10s`, surrounding whitespace, trailing slashes.
- Returns null if no match.

```ts
fetchOEmbed(videoId: string): Promise<{ title: string; author_name: string; thumbnail_url: string }>
```
- GETs `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<id>&format=json`
- Throws on non-2xx (caller surfaces as 400 to admin).
- No retry logic — failure means video is unavailable; admin re-pastes.

## Admin UI changes

**File:** `apps/web/src/app/(dashboard)/clients/[id]/tabs/DetailsTab.tsx`

Replace existing music section (URL textbox + autoplay checkbox) with:

```
┌─ Music ─────────────────────────────────────────┐
│ Mode: ( • ) YouTube  ( ) Audio file (legacy)    │
│                                                 │
│ [YouTube mode]                                  │
│ YouTube URL                                     │
│ [https://www.youtube.com/watch?v=…   ] [Preview]│
│                                                 │
│ (after Preview success — preview card)          │
│ ┌─────┐  Lagu Kita                              │
│ │ 🖼️  │  Andmesh                                │
│ └─────┘  videoId: dQw4w9WgXcQ      [Clear]      │
│                                                 │
│ [Audio file mode]                               │
│ Audio URL [____________]                        │
│                                                 │
│ [✓] Autoplay setelah cover dibuka               │
└─────────────────────────────────────────────────┘
```

**Mode toggle default:**
- Client baru → YouTube.
- Client existing dengan `url` set tapi tidak ada `videoId` → Audio file (legacy).
- Client existing dengan `videoId` set → YouTube.

**Preview button flow:**
- Click → call `POST /api/youtube/preview` with current URL.
- On success → render preview card (thumbnail 60×60 + title + artist + Clear button).
- On error → inline error message below input.

**Form submission:**
- YouTube mode: form sends `music.youtubeUrl` (raw URL string) + `music.autoplay`.
- Audio mode: form sends `music.url` + `music.autoplay`.
- Server is source of truth — preview is UX only; server re-validates and re-fetches oEmbed on PATCH.

**Clear button** in preview card: resets URL input + clears preview card state.

**Form integration:** follow existing convention in `DetailsTab.tsx` (likely plain `useState`; verify during implementation).

## Invitation page rendering

**Files changed:**
- `apps/invitation/src/components/sections/MusicPlayer.tsx` — full rewrite.
- `apps/invitation/src/app/[slug]/page.tsx` — pass `shouldPlay={isOpen}` to MusicPlayer.

**New MusicPlayer props:**
```ts
interface MusicPlayerProps {
  videoId?: string;
  title?: string;
  artist?: string;
  thumbnailUrl?: string;
  url?: string;        // legacy MP3
  autoplay: boolean;
  shouldPlay: boolean; // controlled — true after Cover "Buka Undangan" click
}
```

**Render path selection:**
```
if (!videoId && !url) → return null
if (videoId)          → <YouTubeWidget />
if (url)              → <LegacyAudioWidget />  (existing implementation)
```

### YouTubeWidget internals

1. **Load YouTube IFrame API once** (module-level singleton): inject `<script src="https://www.youtube.com/iframe_api">` if not already present, await `window.onYouTubeIframeAPIReady`.

2. **Hidden iframe**:
   - Size: 1×1 px.
   - Position: `position: absolute; top: -9999px; left: -9999px;`.
   - Init via `new YT.Player(divRef, { videoId, playerVars: { controls: 0, disablekb: 1, modestbranding: 1, playsinline: 1, loop: 1, playlist: <videoId> } })`.
   - `playlist: <videoId>` is the IFrame API loop trick — required for single-video looping.
   - `events.onReady`: if `shouldPlay && autoplay` → `player.playVideo()`.
   - `events.onStateChange`: sync local `isPlaying` boolean for pill icon.

3. **Effect on `shouldPlay` change**: when transitions false → true and `autoplay` is true, call `player.playVideo()`. (This handles the Cover "Buka Undangan" click case.)

4. **Visible pill widget** (fixed bottom-right, z-50):
   ```tsx
   <button
     onClick={togglePlay}
     className="fixed bottom-6 right-6 flex items-center gap-2 px-3 py-2 rounded-full bg-wedding-accent text-white shadow-lg ..."
   >
     <img src={thumbnailUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
     <span className="truncate max-w-[140px] text-sm">{title}</span>
     {isPlaying ? <PauseIcon /> : <PlayIcon />}
   </button>
   ```
   Uses `bg-wedding-accent` so per-template theming works.

5. **togglePlay**: call `player.playVideo()` / `player.pauseVideo()` via stored player ref.

### LegacyAudioWidget

Existing `<audio src={url} loop>` + circular button at `fixed bottom-6 right-6`. No changes from current `MusicPlayer.tsx`.

### Page integration

In `apps/invitation/src/app/[slug]/page.tsx` line ~210:
```tsx
<MusicPlayer
  videoId={invitation.music.videoId}
  title={invitation.music.title}
  artist={invitation.music.artist}
  thumbnailUrl={invitation.music.thumbnailUrl}
  url={invitation.music.url}
  autoplay={invitation.music.autoplay}
  shouldPlay={isOpen}   // existing Cover state
/>
```

For clients without a Cover section: `isOpen` is initialized true on mount → autoplay attempt fires immediately, browser likely blocks (no user gesture), pill stays tappable. Acceptable edge case.

### SSR/hydration

`MusicPlayer.tsx` keeps `'use client'` directive (already present). YouTube IFrame API requires `window` — never runs server-side. No SSR-rendered audio means no hydration mismatch.

## Edge cases & error handling

| Case | Behaviour |
|---|---|
| Video deleted/private/region-locked at save time | oEmbed throws → controller returns 400 → admin sees inline error, can re-paste. |
| Video becomes unavailable post-save | Iframe `onError` fires → pill stays visible but inert. Page does not crash. |
| YouTube IFrame API script fails to load (network/firewall) | Player ref never initialized → pill renders with disabled state. No crash. |
| Slow network during page load | Iframe loads async → pill renders immediately, becomes functional on `onReady`. |
| Client has both `videoId` and `url` set | YouTube path wins. (Should not happen in practice — controller clears the other field on save.) |
| No music configured at all | MusicPlayer returns null. Page renders normally without widget. |
| Mobile autoplay restrictions | Triggered post-Cover-click, which is a user gesture → allowed by all major browsers. |

## Testing strategy

No automated test framework configured (per CLAUDE.md). Manual checklist:

**Server:**
- `extractVideoId` against URL variants (youtube.com/watch, youtu.be, music.youtube.com, with `&list=`, with timestamp, with whitespace).
- `POST /api/youtube/preview` happy path → returns valid metadata.
- `POST /api/youtube/preview` errors: invalid URL, private video, deleted video → all 400 with appropriate messages.
- `PATCH /api/clients/:id` with `music.youtubeUrl` → DB persists enriched fields.
- `PATCH /api/clients/:id` with legacy `music.url` only → DB persists url, no videoId.

**Admin web:**
- Mode toggle YouTube ↔ Audio file preserves field state.
- Preview success → thumbnail + title rendered; error → inline message.
- Save → reload → data persists, preview re-renders.
- Existing legacy client opens in Audio mode by default.

**Invitation page:**
- Client with `videoId`: pill widget visible at bottom-right with thumbnail + title truncated.
- Cover "Buka Undangan" click → music starts within 1-2s.
- Tap pill → pause; tap again → resume.
- Legacy `music.url` only: existing button-bulat behaviour unchanged.
- No music configured: nothing rendered.
- Mobile Safari + Chrome on Android: autoplay gated correctly (post-click only).

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| YouTube ToS enforcement against audio-only embed | Low | Iframe still loads as video (1×1 px on-screen, not `display:none`); pill shows video metadata. If enforced, pivot to admin-uploaded MP3. |
| oEmbed endpoint deprecation or rate limit | Low | No documented limit; metadata cached in DB after first fetch. Fallback: manual title input. |
| Video unavailable post-save | Medium | Iframe error event → pill inert. Future: scheduled health check (out of scope). |
| Autoplay blocked when no Cover section | Low | Documented edge case; pill remains tappable. |
| Hydration mismatch | Low | `'use client'` keeps everything CSR. |
| YouTube IFrame API script load failure | Low | Pill renders disabled; no crash. |

## File-touch summary

**New files:**
- `server/src/services/youtubeService.ts`
- `server/src/routes/youtube.ts` (or extend existing route file)
- `server/src/controllers/youtube.ts` (preview endpoint)

**Modified files:**
- `packages/shared/src/types/client.ts` — extend `IMusic`.
- `server/src/models/Client.ts` — extend music sub-schema.
- `server/src/validators/client.ts` — extend music validator + accept `youtubeUrl` input.
- `server/src/controllers/clients.ts` — enrich music on PATCH.
- `server/src/app.ts` — mount new youtube route.
- `apps/web/src/app/(dashboard)/clients/[id]/tabs/DetailsTab.tsx` — replace music section UI.
- `apps/web/src/lib/api.ts` (if API helpers centralized) — add preview helper.
- `apps/invitation/src/components/sections/MusicPlayer.tsx` — full rewrite with dual render paths.
- `apps/invitation/src/app/[slug]/page.tsx` — pass `shouldPlay={isOpen}` and new music fields.
