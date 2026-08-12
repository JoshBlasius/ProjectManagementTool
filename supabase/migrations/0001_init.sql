-- Project Management Tool — initial schema
-- Phase 1 foundation. Row Level Security is intentionally left OFF here;
-- it is added in a later migration as part of Phase 5 (Permissions).

-- ---------------------------------------------------------------------
-- users
-- Mirrors auth.users (1:1). A row is created automatically via trigger
-- whenever someone signs up through Supabase Auth.
-- ---------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

-- Auto-create a public.users row whenever a new auth user signs up.
create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- project_permissions
-- Who can see/edit a given project, and at what level.
-- ---------------------------------------------------------------------
create table public.project_permissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null check (role in ('editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

-- ---------------------------------------------------------------------
-- tasks
-- Self-referencing parent_task_id gives unlimited subtask nesting.
-- ---------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  parent_task_id uuid references public.tasks (id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'blocked', 'done')),
  owner_id uuid references public.users (id) on delete set null,
  start_date date,
  end_date date,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  percent_complete integer not null default 0
    check (percent_complete between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_parent_task_id_idx on public.tasks (parent_task_id);

-- keep updated_at current on every row update
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- dependencies
-- Visual-only in v1: stored and rendered, but never used to
-- recalculate dates.
-- ---------------------------------------------------------------------
create table public.dependencies (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks (id) on delete cascade,
  type text not null default 'finish_to_start'
    check (type in ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  created_at timestamptz not null default now(),
  check (task_id <> depends_on_task_id),
  unique (task_id, depends_on_task_id)
);

-- ---------------------------------------------------------------------
-- flags / flag_options / task_flags
-- A flag is a named category (e.g. "Risk Level"); flag_options are the
-- selectable values under it (e.g. "High", "Medium", "Low"). A flag
-- with project_id = null is global and available to every project.
-- ---------------------------------------------------------------------
create table public.flags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  name text not null,
  color text not null default '#6b7280',
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.flag_options (
  id uuid primary key default gen_random_uuid(),
  flag_id uuid not null references public.flags (id) on delete cascade,
  label text not null,
  color text not null default '#6b7280',
  sort_order integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index flag_options_flag_id_idx on public.flag_options (flag_id);

create table public.task_flags (
  task_id uuid not null references public.tasks (id) on delete cascade,
  flag_option_id uuid not null references public.flag_options (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, flag_option_id)
);
