# Built — Global Construction, Architecture & Interior Design News

Near-real-time news aggregator for construction, architecture, and interior
design, with a dedicated India tab and a 1–10 virality score on every item.

## How it works

- **Ingestion worker** (`src/workers/ingest.ts`) polls RSS/Atom feeds from
  the vetted source list (`prisma/sources.ts`) every `INGEST_INTERVAL_MINUTES`
  minutes, dedupes against existing stories, pulls hero image/video (from the
  feed itself, falling back to the article's OpenGraph tags), and writes new
  rows as `PENDING`.
- **Enrichment worker** (`src/workers/enrich.ts`) polls for `PENDING` rows
  every `ENRICH_INTERVAL_SECONDS` seconds, calls Claude to categorize/
  summarize/score each item (falling back to a deterministic keyword-based
  scorer if `ANTHROPIC_API_KEY` isn't set or the call fails), and marks them
  `ENRICHED`.
- Both run continuously inside `scripts/worker.ts` (`npm run worker`) — a
  single long-running Node process. This is intentionally a **separate
  process from the web app** so ingestion latency never depends on web
  traffic.
- **Next.js app** (`src/app`) serves the feed via `/api/articles` and reads
  ingestion health via `/api/health`. The frontend polls every 30s and
  prepends genuinely new items without a full reload.

## Relevance filter (off-topic content)

Design/architecture outlets (Dezeen, Designboom, Wallpaper*) also cover
automotive, fashion, and beauty content, and Indian business outlets carry
general market/economy news that mentions "construction" only in passing.
Both leaked into the feed before this filter existed. Every article now gets
an `excluded`/`excludedReason` verdict (`src/lib/ingestion/relevance.ts` +
the `relevant`/`exclude_reason` fields in the LLM tool schema), and
`/api/articles` never returns `excluded: true` rows.

- **Primary path**: the LLM decides relevance using actual context — it can
  tell a Rolex watch story apart from a Snøhetta-designed coffee bar even
  though both might sit under a magazine's "travel" URL section.
- **Safety net**: a small set of unambiguous URL path segments
  (`/fashion-beauty/`, `/beauty/`, `/entertaining/`, `/food-drink/`) force-
  exclude regardless of the LLM verdict — cheap and reliable for outlets that
  sort content into clean topic verticals. Verticals that turned out to mix
  in real design coverage (`/travel/`, `/transportation/`,
  `/watches-jewellery/`) were deliberately left out of this list after an
  early pass wrongly excluded a Snøhetta cafe and an Estúdio Campana airport
  lounge — see the comment in `relevance.ts` for the full story.
- **Rule-based fallback** (`checkExclusion` in the same file): keyword lists
  for vehicles, fashion/beauty, and generic financial news (only flagged when
  NOT paired with a construction/real-estate anchor term, so "Fed raises
  rates but construction has a bigger problem" correctly survives). Used
  when no `ANTHROPIC_API_KEY` is set, same fallback pattern as scoring.
- **`scripts/cleanup-relevance.ts`**: retroactively applies the rule-based
  check to already-ingested articles without re-spending LLM calls on the
  whole backlog. Safe to re-run any time the keyword lists change.

## Subscription paywall

"Top Stories" (virality score ≥ `TOP_STORY_THRESHOLD` in
[`src/components/tabs.ts`](src/components/tabs.ts), currently 8) are free to
read for everyone. Every other article has its `summary` withheld
**server-side** (see `src/app/api/articles/route.ts`) unless the request
carries a valid session cookie for an account with access — a client-side
blur alone wouldn't actually withhold anything, so the redaction happens
before the JSON response is built, not after.

- **Auth**: passwordless magic links. POST `/api/auth/request-link` with an
  email → creates/finds a `Subscriber` row and a `MagicLinkToken`, then
  emails a sign-in link via Resend if `RESEND_API_KEY` is set. **Without a
  key, the link is returned directly in the API response instead of being
  emailed** (`devLink`) — same fallback pattern as the enrichment worker's
  rule-based scorer when no Anthropic key is set. The `AuthModal` component
  shows that link directly when present, so sign-in works today without any
  email provider configured.
- **Access model**: a brand-new email becomes a `PENDING` subscriber and
  gets full access immediately — there's no real payment collection yet
  (see "What's intentionally not in v1" below). `ACTIVE` is for accounts a
  future Stripe webhook (or you, manually) flips after real payment.
  `isFreeAccess: true` is a permanent comp, independent of `status`.
- **The owner's free account**: `scripts/seed-owner.ts` upserts
  `buildmatepodcast@gmail.com` as `status: ACTIVE, isFreeAccess: true`. Run
  it once against any new database (`npx tsx scripts/seed-owner.ts`) —
  already done against the Supabase database this app currently points at.
- **Wiring real Stripe billing later**: add a Stripe Checkout session on the
  "Subscribe now" button, and a webhook route that sets
  `Subscriber.status = 'ACTIVE'` + `stripeCustomerId` on `checkout.session.completed`
  (and `'CANCELED'` on subscription-deleted). Nothing else needs to change —
  the gating logic already keys off `status`/`isFreeAccess`, not payment
  details.

## Source vetting (why the list looks like this)

The brief's candidate source list was tested for real, not assumed. Every
domain in `prisma/sources.ts` returned a valid RSS/Atom feed as of
2026-09-17. The ones that didn't (ENR, Building Design+Construction,
Architectural Record, Reuters/AP public RSS, PIB, Realty+) are listed at the
bottom of that file with the reason they failed, so a future pass can retry
them or add a scraper instead of an RSS pull.

**Building materials** (added 2026-09-21): For Construction Pros, Glass
Magazine, Wood Central, Green Building Advisor, Kitchen & Bath Business,
Hardware Retailing, Floor Covering News, and JLC Online — same vetting
standard, same file, with the ones that didn't pan out (Global Cement, World
Cement, CompositesWorld, Materials Today, Kitchen & Bath Design News, Paint &
Coatings Industry, and others) documented right below the working list.

`BUILDING_MATERIALS` is a deliberately broad category — structural materials,
steel, concrete, glass/facades, doors/windows/partitions, kitchens,
wardrobes, architectural hardware, stone/marble/aggregates, advanced
composites (GFRP/CFRP), construction equipment/tools/safety gear, tiles,
bathware/sanitaryware, bricks/blocks, wood, flooring/carpets/upholstery,
paints/waterproofing, pools/saunas, plus R&D breakthroughs and business news
about companies in this space (full list documented in the tool-schema
description in `src/lib/ingestion/llmEnrich.ts`). It wins over
`NEW_TECHNOLOGIES` whenever the story's real subject is a physical
product/material rather than a project, company strategy, or software/AI
method in the abstract.

Social media ingestion (X/Instagram) was deliberately left out of v1 — see
the brief's "credibility filter" requirement — because getting reliable API
access at any real polling frequency now costs real money (X API) or
requires business-account verification (Instagram). The data model already
has `originType`/`originHandle` fields ready for it; adding it later is a
new ingestion source, not a schema change.

## Virality scoring

Documented in code at [`src/lib/virality.ts`](src/lib/virality.ts):
`final = clamp(llmBaseScore + crossSourceBoost(+1) + recencyBoost(+1), 1, 10)`.
The LLM (or the rule-based fallback in
[`src/lib/ingestion/ruleBasedEnrichment.ts`](src/lib/ingestion/ruleBasedEnrichment.ts))
supplies the qualitative base score from source authority + shock/novelty
keywords; the two boosts are deterministic and re-derived from real data
already on the row (how many outlets have run the story, how fresh it is) —
nothing here is invented.

## Local development

1. **Install deps**: `npm install`
2. **Start Postgres**: `docker compose up -d` (uses `docker-compose.yml`,
   local-only credentials). If you don't want Docker, point `DATABASE_URL`
   in `.env` at any Postgres instance instead (e.g. a free Neon/Supabase
   project) — the app doesn't care where Postgres runs.
3. **Copy env**: `cp .env.example .env` and fill in `ANTHROPIC_API_KEY`
   (enrichment silently falls back to the rule-based scorer without it, so
   this isn't strictly required to see the app running).
4. **Apply the schema**: `npx prisma migrate deploy` (applies the checked-in
   migration in `prisma/migrations/`).
5. **Run one ingestion + enrichment pass manually** to populate real data
   without waiting for the scheduler:
   ```bash
   npm run ingest:once
   npm run enrich:once
   ```
6. **Run the app**: `npm run dev` → http://localhost:3000
7. **Run the worker continuously** (separate terminal, needed for the site
   to keep updating on its own): `npm run worker`

## Deployment (Railway + the existing Supabase database)

The brief calls for a host that supports both the always-on site and a
recurring background job cleanly — Railway does this as two services from
one repo. The database is **already provisioned and populated**: this repo's
`prisma/migrations/` were applied against a Supabase Postgres project
(`aebcphdezfqqezkxcttc`) during development, and it already has real
ingested/enriched articles in it. Production should point at that same
database (via its connection-pooler URL) rather than spinning up a second,
empty one on Railway.

Target domain: **news.indiasno1constructionpodcast.com**.

### One-time setup

1. Push this repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo**, pick this repo.
3. On the service Railway creates from the repo (this becomes the **web**
   service), set these variables:
   - `DATABASE_URL` — the Supabase **session pooler** URI (IPv4-reachable;
     the direct `db.<ref>.supabase.co` host is IPv6-only and Railway's
     network path to it isn't guaranteed either, so always use the pooler
     host `aws-0-<region>.pooler.supabase.com:5432`). Percent-encode any
     special character in the password (`$` → `%24`, etc.) — Postgres URI
     parsers decode it back correctly, and this avoids a mismatch with
     tools that do shell-style `$VAR` expansion on `.env` values.
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_SITE_URL=https://news.indiasno1constructionpodcast.com`
   - `SESSION_SECRET` — generate a **new** one for production, don't reuse
     the local-dev value in `.env.example`'s comment
   - `RESEND_API_KEY` / `RESEND_FROM_EMAIL` (optional — without these,
     magic-link sign-in still works, see "Subscription paywall" above, but
     visitors have to be handed their link manually rather than emailed)
   - `ALERT_WEBHOOK_URL` (optional), `ALERT_STALL_THRESHOLD_MINUTES`
   - Start command is already set via `railway.json`
     (`npx prisma migrate deploy && npm start`) — safe to run against the
     existing database; it only applies migrations not yet recorded there.
4. **Add a second service** in the same Railway project, pointing at the
   same GitHub repo:
   - Same `DATABASE_URL`, `ANTHROPIC_API_KEY`, plus `INGEST_INTERVAL_MINUTES`
     (default 10), `ENRICH_INTERVAL_SECONDS` (default 30),
     `ALERT_WEBHOOK_URL`, `ALERT_STALL_THRESHOLD_MINUTES`.
   - Override its **Start Command** to `npm run worker` (Settings → Deploy →
     Start Command).
   - This service has **no public networking** — it's a background worker,
     not a web server. Don't expose a domain on it.
   - **Only this Railway deploy, or your local machine, should run
     `npm run worker` / `npm run ingest:once` against this database at any
     given time** — two workers racing against the same enrichment queue
     isn't harmful (rows are claimed atomically) but wastes Anthropic API
     calls. Stop your local worker before Railway's takes over.
5. **Custom domain**: on the web service → Settings → Networking → Custom
   Domain → enter `news.indiasno1constructionpodcast.com`. Railway gives you
   a CNAME target (something like `<service>.up.railway.app`). At whatever
   registrar/DNS provider manages `indiasno1constructionpodcast.com`, add:
   ```
   Type:  CNAME
   Name:  news
   Value: <the target Railway shows you>
   ```
   Propagation is usually minutes, occasionally longer. Railway auto-issues
   the TLS certificate once the CNAME resolves — no separate cert step.

### Monitoring ingestion health

- `GET /api/health` returns `{ healthy, lastIngestionRun, minutesSinceLastRun, pendingEnrichment }`.
  Point any uptime checker (UptimeRobot, Better Uptime, a Railway cron
  hitting it, etc.) at this endpoint on a few-minute interval and alert on
  `healthy: false`.
- The worker itself self-alerts: if `ALERT_WEBHOOK_URL` is set (any
  Slack-compatible incoming webhook works), it posts there when a source
  fails 5 consecutive polls, when enrichment has permanently failed on 20+
  articles, or when no ingestion cycle has finished within
  `ALERT_STALL_THRESHOLD_MINUTES` (checked every 5 minutes).
- Every article stores `ingestionLatencyMs` (time from the source's
  published timestamp to when it was captured) — query
  `SELECT avg("ingestionLatencyMs") FROM "Article" WHERE "ingestedAt" > now() - interval '1 day'`
  in Supabase's SQL editor to track whether the pipeline is actually getting
  faster over time, per the brief's ask to log this.

## Environment variables

See [`.env.example`](.env.example) for the full list with defaults.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `ANTHROPIC_API_KEY` | Recommended | Powers real summarization/categorization/scoring; falls back to a rule-based scorer if unset |
| `INGEST_INTERVAL_MINUTES` | No (default 10) | RSS polling cadence |
| `ENRICH_INTERVAL_SECONDS` | No (default 30) | Enrichment queue polling cadence |
| `ALERT_WEBHOOK_URL` | No | Slack/Discord-compatible webhook for stall/failure alerts |
| `ALERT_STALL_THRESHOLD_MINUTES` | No (default 30) | How long ingestion can go quiet before alerting |
| `NEXT_PUBLIC_SITE_URL` | No | Used for absolute-link contexts |
| `SESSION_SECRET` | **Yes** | Signs the login session cookie. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` — use a different value in production than local dev |
| `RESEND_API_KEY` | No | Sends magic-link sign-in emails. Without it, the link is returned directly in the API response instead (see "Subscription paywall" above) |
| `RESEND_FROM_EMAIL` | No | From-address for magic-link emails; only used if `RESEND_API_KEY` is set |

## What's intentionally not in v1

- Social media ingestion (X/Instagram) — see "Source vetting" above.
- Semantic/embedding-based duplicate clustering — v1 dedupes on a
  normalized-title hash, which catches identical/syndicated headlines but
  not two outlets covering the same event with different wording. Documented
  as a limitation in `src/lib/ingestion/dedupe.ts`.
- Re-scoring of virality after publish (the recency boost naturally decays
  as `publishedAt` ages, but the LLM base score is only computed once).
- **Real payment collection.** The paywall gating (Top Stories free,
  everything else needs an active session) and passwordless login are real
  and enforced server-side. What's not wired up is Stripe itself — every
  new email currently becomes a `PENDING` subscriber with immediate access
  rather than being charged. See "Subscription paywall" above for the exact
  seam to attach Stripe Checkout + a webhook to when you're ready to pick a
  price.
