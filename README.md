# FixMyBusiness

An AI business consultant for small business owners. You describe what's
going wrong in a normal workday; it diagnoses the real bottlenecks and
assembles a workspace — from a fixed set of reusable modules — to fix them.

This is a V1 MVP: real diagnostic logic and a real generated workspace,
but no third-party integrations, no autonomous agents, and no arbitrary
code generation. Everything that isn't built yet has an explicit,
typed extension point instead of a half-finished implementation.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment
variables are required — the app runs entirely on local/demo state.

## The flow

Landing → Business Diagnostic (business type → workday description →
3–5 adaptive follow-up questions) → Business Health Report → Generated
Workspace.

## Architecture

```
app/                 Routes (App Router). API routes under app/api/ai/*
                      proxy to the AI provider so provider keys never
                      reach the client.
components/ui/       shadcn-style primitives (Radix + Tailwind + CVA).
components/          Shared composed components (logo, theme toggle, ...).
features/            Flow-specific UI: landing, diagnostic wizard, report.
modules/              The 10 workspace modules (dashboard, tasks, calendar,
                      customers, notes, reminders, documents, checklist,
                      reports, settings) plus the registry that maps a
                      moduleId to its component.
lib/ai/              The AI Business Consultant, as a swappable interface:
                        - simulated/  deterministic, keyword-driven engine
                          (default, zero config)
                        - openai/     real LLM-backed implementation, used
                          automatically when OPENAI_API_KEY is set
                      lib/ai/index.ts is the only place that picks one.
lib/modules/         Module registry + the recommendation logic that maps
                      diagnosed bottlenecks to a module set.
lib/workers/         The 5 "AI worker" cards (simulated for V1) + their
                      recommendation logic.
lib/store/           Zustand stores (localStorage-persisted) that hold
                      diagnostic progress and workspace data for the MVP.
lib/validation/      Zod schemas shared by API routes and (for the OpenAI
                      provider) response validation.
services/integrations/  Typed interface + registry for future integrations
                      (WhatsApp, SMS, Voice, Stripe, Google Calendar,
                      QuickBooks, Slack, Microsoft 365). Each one currently
                      resolves to a ComingSoonIntegrationClient that fails
                      loudly instead of pretending to connect.
prisma/schema.prisma  The intended production data model. Not wired up to
                      the UI yet — see "Future backend" below.
types/               Shared domain types.
```

## Why local state instead of a database for V1

The diagnostic and workspace flows run entirely on Zustand stores
persisted to `localStorage` (`lib/store/`). This keeps the MVP fully
functional with zero setup — no database to provision, no seed script to
run — while `prisma/schema.prisma` and `lib/prisma.ts` define the real
schema and a ready-to-use client singleton for when a backend is wired up.
`services/integrations/` and the `AIProvider` interface follow the same
pattern: a working default plus a typed seam for the real implementation.

## Future backend

To move persistence server-side: provision Postgres, set `DATABASE_URL`,
run `npx prisma migrate dev`, and add API routes that read/write through
`lib/prisma.ts` instead of the Zustand stores. The store action shapes in
`lib/store/workspace-store.ts` map closely to the Prisma models, so this
is mostly plumbing, not a redesign.

## AI provider

Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, default
`gpt-4o-mini`) to switch the consultant from the deterministic simulated
engine to a real OpenAI-backed one — see `.env.example`. Both
implementations satisfy the same `AIProvider` interface
(`lib/ai/types.ts`), so nothing else in the app needs to change.

## Tech stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · Radix UI ·
Framer Motion · Zustand · React Hook Form · Zod · Recharts · Prisma ·
OpenAI SDK
