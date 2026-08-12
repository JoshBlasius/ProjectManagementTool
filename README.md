# Project Management Tool

A hierarchical project management app (Projects → Tasks → Subtasks) built to replace
spreadsheet/MS Project workflows for small teams. v1 focuses on a working, playable
prototype — not a full scheduling engine (no auto-scheduling, critical path, or
cascading date recalculation).

**Stack:** React (Vite) + TypeScript, Tailwind CSS, Supabase (Postgres + Auth + RLS).

## Status

Phase 1 and 2 complete: auth, projects list, nested task CRUD, a sortable/filterable
table view with inline editing, and a Gantt view (drag to adjust dates, dependency
lines, no cascading recalculation). Phase 3 (dependency UI) is next.

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
  styles/      Vendored third-party CSS (see below)
supabase/
  migrations/  SQL schema migrations, applied in order
  seed/        Sample data for local development
```

## Gantt library

The project detail page's Gantt tab is built on
[frappe-gantt](https://github.com/frappe/gantt) (MIT). Compared to the alternatives
evaluated:

- **gantt-task-react** — TypeScript-native and React-first, which made it the initial
  favorite, but its last release was mid-2022, its peer dependency caps at React 18,
  and it hasn't kept pace.
- **dhtmlx-gantt** — the most feature-complete of the three, but the npm package is the
  GPLv2 "Community edition"; bundling GPL-licensed code into this app's JS bundle would
  put the whole bundle under GPL obligations unless a commercial license is purchased.
- **frappe-gantt** — MIT, zero dependencies, actively maintained, and its default
  behavior already matches the v1 spec closely: dragging a bar fires `on_date_change`
  without touching other tasks, and dependency arrows render from a simple
  comma-separated `dependencies` field. It ships as plain JS with no bundled TypeScript
  types, so `src/types/frappe-gantt.d.ts` declares the minimal surface this app uses.

One default had to be overridden: frappe-gantt's `move_dependencies` option defaults to
`true`, which cascades a dragged task's date change onto its dependents — exactly the
auto-scheduling behavior this project explicitly excludes from v1. `GanttChart.tsx` sets
`move_dependencies: false`.

frappe-gantt's `package.json` also restricts its `exports` to the package root, so its
`dist/frappe-gantt.css` can't be imported by path through normal module resolution.
`src/styles/frappe-gantt.css` is a vendored copy — re-sync it from
`node_modules/frappe-gantt/dist/frappe-gantt.css` after upgrading the package.

## Table view

The Table tab flattens the task tree into a single sortable/filterable list — clicking
a column header (or applying a filter) shows tasks in that order rather than nested
under their parents. This is a deliberate v1 simplification: preserving hierarchy while
supporting arbitrary sort/filter combinations (e.g. "show only Done subtasks, keep their
parents visible for context") adds real complexity for a first pass. The Tree tab still
shows the full nested hierarchy for browsing.

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
