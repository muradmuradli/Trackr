# Trackr

A job application tracker. Keep every application in one place, move them through a pipeline, and get a straight answer about how the search is actually going instead of guessing from a spreadsheet.

## What it does

- **Applications table** — searchable, filterable, paginated, with bulk status changes and bulk delete.
- **Kanban board** — drag a job between statuses; optimistic updates so it never feels laggy.
- **Job detail pages** — notes, an auto-recorded status timeline, and document uploads (resumes, offer letters) via signed, expiring URLs rather than public links, since these can contain personal information.
- **Pipeline analytics** — applications over time, a funnel from saved through offer, and a status breakdown, built with an accessible, colorblind-safe palette rather than picked by eye.
- **CSV import/export** — round-trips its own export format and tolerates a hand-edited file.
- **Follow-up reminders** — a daily cron job flags applications that have gone quiet and emails a digest.
- **An AI assistant** — a chat widget grounded in your own pipeline data, streamed from Groq. It can answer questions about your applications and, if asked, update a status or add a note — but only one specific application at a time, and never without you clicking confirm first.
- Email/password and social auth (Google, GitHub), with email verification and password reset that also works for social-only accounts.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **tRPC** + **TanStack Query** for a type-safe API layer, no REST boilerplate
- **Drizzle ORM** over **Neon Postgres**
- **better-auth** for sessions, OAuth, and email flows
- **Tailwind CSS v4** + **shadcn/ui**
- **Cloudinary** for uploads, **Brevo** for transactional email
- **Groq** + the **Vercel AI SDK** for the assistant
- **Vitest** for unit tests

## A few decisions worth knowing about

**tRPC end-to-end, including from the AI route.** Every mutation and query goes through one router (`server/routers/`), so the client, the cron job, and the AI assistant's tool calls all share the exact same validation and ownership checks — nothing gets a second, slightly-different code path. The assistant route calls these procedures directly server-side via `createCaller` instead of going over HTTP to itself.

**Uploads aren't all treated the same way.** Avatars are public Cloudinary uploads. Job documents are not — they use Cloudinary's `authenticated` delivery type with short-lived signed URLs generated per request, because a resume is personal in a way an avatar isn't.

**The AI assistant can't go rogue.** It only ever sees a text snapshot of your own data assembled fresh per request — no database access, no filesystem, nothing else in scope. Its two available actions each touch exactly one application, addressed only by an ID that was already in that snapshot, and neither runs without an explicit, HMAC-signed user approval first. There's deliberately no bulk or delete capability.

**Optimistic updates are real, not just a spinner.** The board and table patch the React Query cache synchronously on drop/edit and reconcile with the server's response after, so drag-and-drop feels instant without lying about what's saved.

## Running it locally

```bash
pnpm install
pnpm dev
```

You'll need a `.env` with:

```
DATABASE_URL=            # Neon Postgres connection string
BETTER_AUTH_SECRET=      # random 32+ char string
GOOGLE_CLIENT_ID= / GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID= / GITHUB_CLIENT_SECRET=
CLOUDINARY_URL=
BREVO_API_KEY=
GROQ_API_KEY=
CRON_SECRET=             # bearer token for the reminder cron route
NEXT_PUBLIC_APP_URL=     # e.g. http://localhost:3000
```

Push the schema to your database (see `db/schema.ts`):

```bash
npx drizzle-kit push
```

Run the test suite:

```bash
pnpm test
```
