# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build
npm run lint     # ESLint
npx tsc --noEmit # type-check without emitting
```

No test suite exists.

## Required env vars (`.env.local`)

```
GEMINI_API_KEY=...
GROQ_API_KEY=...
AI_PROVIDER=gemini          # "gemini" → use Gemini primary; anything else → Groq only
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Redis is optional in dev — if not set, `src/lib/redis.ts` exports `null` and the app uses a global in-memory `Map` fallback (`global.__devStore`) in `roastStore.ts`. Rate limiting is skipped entirely when Redis is absent.

## Architecture

**Stack:** Next.js 16 App Router · React 19 · Tailwind v4 · Zod v4 · `@google/generative-ai` · Groq SDK · Upstash Redis · `@vercel/analytics`

**AI integration** lives in `src/lib/gemini.ts`. Supports two providers controlled by `AI_PROVIDER` env var:
- `gemini` → calls `gemini-2.5-flash-lite` via `@google/generative-ai`. On any error (e.g. 503), falls back to Groq automatically.
- anything else → calls `meta-llama/llama-4-scout-17b-16e-instruct` via Groq SDK directly.

Both paths log request metadata and raw response. Retries once on invalid JSON or schema validation failure. Throws `NotLinkedInError` when model returns `{"error":"not_a_linkedin_profile"}`. Strips markdown code fences before JSON.parse (Gemini wraps JSON).

**Request flow:**
1. `UploadForm` (client component) compresses image to 1024px, converts to base64, saves image+mimeType to `sessionStorage` (`pendingRoastImage`, `pendingRoastMimeType`), POSTs to `/api/roast`
2. `POST /api/roast` — rate-limits by IP (5/day sliding window via Upstash), validates with `RoastRequestSchema` (image max 8MB base64), calls `roastProfile()`, saves to Redis with `saveRoast()`, returns `roastId` + roast data + `X-RateLimit-Remaining` header
3. Client redirects to `/result/[id]` — SSR page, reads from Redis via `getRoast(id)`

**Prompt system** (`src/lib/prompts.ts`): four levels — `mild`, `medium`, `heavy`, `dhoni`. Each level is a standalone system prompt string. `SYSTEM_PROMPTS[level]` is the entry point. If a `profileName` was provided, it's prepended to the prompt in `gemini.ts` before the level prompt.

**Data shape** — `GeminiResponseSchema` in `schemas.ts` is the single source of truth:
- `profileName` — string
- `roastScore` — int 0–100
- `category` — enum (14 values)
- `roastPoints` — exactly 5 strings
- `bannerRoast` — string (separate field for photo/banner roast)
- `verdict` — string (closing punchline)
- `cringePatterns` — exactly 3 objects with `icon`/`title`/`description`

**Result page layout** (`/result/[id]`):
1. `HeroCard` — full width, dark bg, score + category + level
2. 2-col grid: `RoastPanel` (5 flame bullets) | `CringePanel` (3 cringe patterns)
3. Verdict card — full width, dark bg (`bg-hero`), large centered verdict text
4. `ShareBar` — Download Result + Share on LinkedIn buttons
5. `TryHarsherMode` — client component, reads image from sessionStorage, re-roasts at next level (mild→medium→heavy→dhoni), hidden on dhoni
6. Roast another button + `ReportButton`

**Leaderboard** — Redis sorted set (`zadd "leaderboard"` keyed by roast score). Trimmed to top 100 after each save (`zremrangebyrank`). Roasts expire after 7 days. `/leaderboard` page reads top 10. Names masked as "First L." in display layer (`LeaderboardClient.tsx`).

**Redis key schema** — `normalizeName()` in `roastStore.ts` lowercases, strips non-alphanumeric, spaces→underscores, caps at 80 chars, falls back to `"unknown"`.

| Key | Type | TTL | Purpose |
|---|---|---|---|
| `roast:{uuid}` | String | 30d | Legacy format — expires naturally |
| `roast:{norm}:{uuid}` | String | 30d | Roast data (new format) |
| `roast_id:{uuid}` | String | 30d | Reverse index: uuid → norm (needed by `getRoast` since URL only has uuid) |
| `name_roasts:{norm}` | Set | none | Forward index: norm → all uuids (needed by delete API) |
| `leaderboard` | ZSet | none | Score-ranked roastIds |
| `reports` | Set | none | Reported roastIds |

Lookup pattern: `delete by name → name_roasts:{norm} → IDs` / `fetch by ID → roast_id:{id} → norm → roast:{norm}:{id}`

Rate limit identifiers: name present → `{norm}|{ip}` (image) / `pdf:{norm}|{ip}` (PDF); name absent → bare `{ip}` / `pdf:{ip}`. Upstash internally keys these as `@upstash/ratelimit:{identifier}:*`.

**Admin delete API** — `DELETE /api/admin/delete?name={name}` with `Authorization: Bearer {ADMIN_SECRET}`. Deletes all roast keys, leaderboard entries, reports, and rate limit keys for a name. Requires `ADMIN_SECRET` env var.

**OG images** — `/api/og` route generates dynamic Open Graph cards. Uses Satori via `next/og`. All `<div>` elements must have explicit `display: "flex"` (Satori requirement). No `fontStyle: "italic"` without loading italic font variant.

**Styling** — Tailwind v4 with custom theme tokens in `globals.css`. Brand orange: `bg-brand` = `#F97316`, hover: `#EA6C0A`. Hero dark: `bg-hero` = `#1A1208`. Background cream: `#F5F0E8`.

**SEO** — `layout.tsx` has full metadata (title template, OG, Twitter, JSON-LD WebApplication schema). `robots.ts` and `sitemap.ts` exist. Vercel Analytics added via `<Analytics />` in layout.
