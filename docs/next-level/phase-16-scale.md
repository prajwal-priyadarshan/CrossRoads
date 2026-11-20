# Phase 16 — Scale

| | |
|---|---|
| **Goal** | Run Crossroads for several Amrita campuses, and later other colleges, from one deployment |
| **Prerequisite** | Phase 15 gate met **and the user explicitly asks to start this phase**. The pilot results should justify it |
| **Gate** | Defined with the user when the phase starts. Tag `phase-16` |

> Same codebase conventions as Phase 13. Every task here is a larger design change: before coding each one, write a short plan (schema changes, migration steps, risks, how to roll back) and get the user's approval.

---

## 16.1 Shared state for more than one API instance

**Problem.** Three things live in one process's memory: the AI cache (`lib/cache.ts`), the SSE chat hub (`services/chatHub.ts`) and the rate-limit store (`middleware/rateLimits.ts`). With two instances, chat events and limits split and every restart empties the cache. (14.4's "already recorded today" set is per-process too, but duplicates are harmless there.)

**Do.** Behind a `REDIS_URL` (optional; keep today's in-memory behaviour when unset): move the cache to Redis with TTLs, fan out chat events with Redis pub/sub, and use a Redis store for `express-rate-limit`. Background jobs (15.1) already coordinate through Postgres and need no change. **Decision:** which Redis provider (Upstash has a free tier).

## 16.2 File uploads

**Do.** Avatars first, then optional proof attachments for interview experiences (offer letters are personal data: placement-staff-only visibility, deletion with the account, listed in the data notice). Use S3-compatible storage (Cloudflare R2 or similar) with presigned uploads, size and type limits in `constants.ts`, image resizing, and stripped EXIF data. **Decision:** storage provider.

## 16.3 Institution tenancy

**Do.** Add an `Institution` model (name, email domains, offices, departments, safeguarding contact, academic calendar) and an `institutionId` on users and on institution-scoped content (posts, companies, experiences, clubs, events, opportunities). Move today's single-college settings (`ALLOWED_EMAIL_DOMAINS`, `ACADEMIC_YEAR_START_MONTH`, `SAFEGUARDING_CONTACT_EMAIL`, `PLACEMENT_OFFICE_NAME`, the shared `DEPARTMENTS` list) into the model, with the current values as the seed for the first institution. Every query is scoped by the viewer's institution, including the raw search SQL; write tests that prove one institution cannot read another's data. **Decision:** whether alumni can belong to several campuses, and whether companies are shared across institutions.

## 16.4 Shareable mentor credential

**Do.** A public, read-only page per opted-in mentor (`/mentors/<handle>`): role, years active, areas helped, answer and mentorship counts, impact number (15.2), verified by the institution. No private data, revocable by the user at any time (the page then returns 404). Designed to be linked from LinkedIn's Volunteering section; add Open Graph tags so the link previews well.

## 16.5 Semantic search, only if justified

**Do first.** Read the `SearchMiss` log that 14.4 has been collecting during the pilot and show the user the zero-result rate and the most common missed queries. Only if many natural-language queries miss, add `pgvector` embeddings (still Postgres, no separate vector DB) as a second retrieval path merged with the existing full-text + trigram results. Check first that the Neon plan in use supports `pgvector` and that the embedding provider has a free tier.
