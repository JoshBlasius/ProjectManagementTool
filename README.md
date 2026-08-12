# Project Management Tool

A hierarchical project management app (Projects → Tasks → Subtasks) built to replace
spreadsheet/MS Project workflows for small teams. v1 focuses on a working, playable
prototype — not a full scheduling engine (no auto-scheduling, critical path, or
cascading date recalculation).

**Stack:** React (Vite) + TypeScript, Tailwind CSS, Supabase (Postgres + Auth + RLS).

## Status

Phase 1 in progress: project scaffold, Supabase schema, and Supabase client are in
place. UI (auth screen, projects list, task CRUD) is next.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then in the SQL editor run,
in order:

1. `supabase/migrations/0001_init.sql` — creates all tables (users, projects,
   project_permissions, tasks, dependencies, flags, flag_options, task_flags).
2. `supabase/seed/seed.sql` — optional sample data (a couple of projects with nested
   tasks, dependencies, and flags) so the app has something to show immediately.

Row Level Security is **not** enabled by the initial migration — it's added in a later
migration as part of Phase 5 (Permissions). Until then, treat the anon key as
effectively full-access to this schema.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project's
API settings.

### 4. Run the dev server

```bash
npm run dev
```

## Project structure

```
src/
  lib/         Supabase client and other shared utilities
  types/       TypeScript types (hand-written to match the DB schema for now)
  pages/       Route-level components
  components/  Reusable UI components
  hooks/       Custom React hooks
supabase/
  migrations/  SQL schema migrations, applied in order
  seed/        Sample data for local development
```

## Data model

- **users** — mirrors `auth.users`; global `role` is `admin` or `member`.
- **projects** — top-level container.
- **project_permissions** — per-project access; `role` is `editor` or `viewer`.
- **tasks** — self-referencing via `parent_task_id` for unlimited-depth subtasks.
- **dependencies** — predecessor/successor links between tasks. Stored with a `type`
  but purely visual in v1 (no scheduling math).
- **flags** / **flag_options** — custom multi-select tagging. A flag with
  `project_id = null` is global and available to all projects.
- **task_flags** — join table attaching flag options to tasks.

## Out of scope for v1

Critical path / auto-scheduling, resource leveling, multi-project dashboards, MS
Project import/export, real-time collaborative editing, reporting views, and
notifications/comments/attachments.
