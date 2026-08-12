# Project Management Tool

A hierarchical project management app (Projects → Tasks → Subtasks) built to replace
spreadsheet/MS Project workflows for small teams. v1 focuses on a working, playable
prototype — not a full scheduling engine (no auto-scheduling, critical path, or
cascading date recalculation).

**Stack:** React (Vite) + TypeScript, Tailwind CSS, Supabase (Postgres + Auth + RLS).

## Status

All five v1 phases are complete: auth, projects list, nested task CRUD, a
sortable/filterable table view with inline editing, a Gantt view (drag to adjust dates,
dependency lines, no cascading recalculation), a dependency editor, a custom flags
system (management UI, multi-select tagging, colored pills, filtering), and Row Level
Security with a "Manage access" UI for granting project-level editor/viewer roles.

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
2. `supabase/migrations/0002_rls.sql` — enables Row Level Security and the
   admin/editor/viewer policies described below.
3. `supabase/seed/seed.sql` — optional sample data (a couple of projects with nested
   tasks, dependencies, and flags) so the app has something to show immediately.

**After signing up in the app for the first time**, promote yourself to admin so you can
see and manage everything, including the seed data (which has no owner, so RLS hides it
from everyone except admins by default):

```sql
update public.users set role = 'admin' where email = 'you@example.com';
```

From there, use the in-app "Manage access" panel on any project to grant teammates
editor or viewer access — see [Permissions](#permissions) below for how that works.

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

## Flags

Flags are custom multi-select metadata for reporting later (v1 only captures them —
no reports yet, per spec). A flag with `project_id = null` is global and shows up in
every project's flag picker; a project-scoped flag only shows up in that project.
"Manage flags" on the project page opens flag/option CRUD (create flags, add/archive/
reorder options); the task edit modal has a per-task multi-select picker grouped by
flag. Pills render in the Tree and Table views directly, and in the Table/Gantt views
there's a flag-value filter (OR match: a task matches if it has *any* selected option).

The Gantt view is the one place pills aren't literally drawn on the bar — frappe-gantt
renders bars as plain SVG with no HTML overlay support, so baking colored pills into the
bar itself would mean hand-rolling SVG/foreignObject positioning against a library that
doesn't expose hooks for it. Instead, pills render in the bar's hover/click popup
(`GanttChart.tsx`'s `popup` option), which was the practical trade-off for v1 — flagged
here since "on Gantt bars" in the spec could read as literally on-bar.

One security note: that popup content is injected via `innerHTML` (frappe-gantt's own
API), so task names and flag labels/colors are HTML-escaped before interpolation
(`src/lib/escapeHtml.ts`) — otherwise a task named e.g. `<img src=x onerror=...>` would
be a stored XSS vector.

## Permissions

Two layers, matching the spec:

- **Global role** (`users.role`): `admin` bypasses every project-level check —
  full read/write on all projects, tasks, flags, dependencies, and membership.
  `member` (the default for everyone who signs up) has no access to anything until
  granted it per-project.
- **Project role** (`project_permissions.role`): `editor` can create/edit/delete tasks,
  dependencies, flags, and flag options within that project, and can manage who else has
  access. `viewer` can read everything in that project but every write is rejected —
  both by the UI (edit controls are hidden/disabled — see `useProjectRole.ts`) and,
  more importantly, by the database itself via RLS policies in `0002_rls.sql`, so a
  viewer can't route around the UI by calling the API directly.

Creating a project automatically grants you `editor` on it (`handle_new_project` trigger
in `0002_rls.sql`) — otherwise you'd immediately lose access to a project you just
created. From there, any editor can open **Manage access** on the project page to add
other people and set their role, or change/revoke it. "Invite" here means granting
access to an existing account, not sending an email invitation — creating new accounts
requires Supabase's service-role key, which must never be shipped to a client-side app,
so someone has to sign up on their own first before you can add them.

Flags are the one partial exception to "per-project": a flag with `project_id = null`
is global and readable by every signed-in user (by design — it's meant to be shared
reference data like a company-wide "Risk" taxonomy). Writing to a global flag requires
being an editor on *some* project, not a specific one, since there's no single project
to check against.

I verified the RLS policies directly against a local Postgres instance (stubbing
`auth.users`/`auth.uid()` to match Supabase's model) rather than trusting the SQL by
inspection alone: created a project as an editor, confirmed a granted viewer can read
tasks/flags/dependencies but gets `new row violates row-level security policy` on every
write attempt, confirmed a non-member sees zero rows for anything project-scoped while
still seeing global flags, and confirmed admin bypasses all of it. All four roles
(admin/editor/viewer/outsider) checked out exactly as designed.

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
