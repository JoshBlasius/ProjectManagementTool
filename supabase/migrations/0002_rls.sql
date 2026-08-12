-- Phase 5: Row Level Security.
--
-- Model: a global `users.role` of 'admin' bypasses all project-level checks.
-- Everyone else's access to a project's data is governed by their row (if
-- any) in `project_permissions` — 'viewer' can read, 'editor' can read and
-- write. All policies are scoped `to authenticated` since every page in the
-- app already sits behind Supabase Auth.

-- ---------------------------------------------------------------------
-- Helper functions (security definer so they bypass RLS on the tables
-- they inspect — otherwise a policy that queries project_permissions
-- from within another table's policy can recurse into project_permissions'
-- own RLS and deadlock/deny incorrectly).
-- ---------------------------------------------------------------------
create function public.is_admin(uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.users where id = uid and role = 'admin')
$$;

create function public.has_project_role(uid uuid, pid uuid, roles text[])
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.project_permissions
    where project_id = pid and user_id = uid and role = any(roles)
  )
$$;

create function public.is_any_project_editor(uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.project_permissions where user_id = uid and role = 'editor'
  )
$$;

create function public.task_project_id(tid uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select project_id from public.tasks where id = tid
$$;

create function public.flag_project_id(fid uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select project_id from public.flags where id = fid
$$;

-- ---------------------------------------------------------------------
-- Auto-grant the creator of a project 'editor' access to it. Without
-- this, a non-admin who creates a project would immediately fail the
-- SELECT policy on their own new row.
-- ---------------------------------------------------------------------
create function public.handle_new_project()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.project_permissions (project_id, user_id, role)
    values (new.id, new.created_by, 'editor')
    on conflict (project_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();

-- ---------------------------------------------------------------------
-- users
-- Any signed-in user can look up any other user (owner pickers, the
-- access-management "add member" list). Writes are limited to your own
-- profile row.
-- ---------------------------------------------------------------------
alter table public.users enable row level security;

create policy "users_select_all" on public.users
  for select to authenticated using (true);

create policy "users_update_own" on public.users
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------
alter table public.projects enable row level security;

create policy "projects_select_member" on public.projects
  for select to authenticated using (
    public.is_admin(auth.uid())
    or exists (
      select 1 from public.project_permissions
      where project_id = projects.id and user_id = auth.uid()
    )
  );

create policy "projects_insert_self" on public.projects
  for insert to authenticated with check (created_by = auth.uid());

create policy "projects_update_editor" on public.projects
  for update to authenticated using (
    public.is_admin(auth.uid()) or public.has_project_role(auth.uid(), id, array['editor'])
  );

create policy "projects_delete_editor" on public.projects
  for delete to authenticated using (
    public.is_admin(auth.uid()) or public.has_project_role(auth.uid(), id, array['editor'])
  );

-- ---------------------------------------------------------------------
-- project_permissions
-- ---------------------------------------------------------------------
alter table public.project_permissions enable row level security;

create policy "project_permissions_select" on public.project_permissions
  for select to authenticated using (
    user_id = auth.uid()
    or public.is_admin(auth.uid())
    or public.has_project_role(auth.uid(), project_id, array['editor'])
  );

create policy "project_permissions_insert_editor" on public.project_permissions
  for insert to authenticated with check (
    public.is_admin(auth.uid()) or public.has_project_role(auth.uid(), project_id, array['editor'])
  );

create policy "project_permissions_update_editor" on public.project_permissions
  for update to authenticated using (
    public.is_admin(auth.uid()) or public.has_project_role(auth.uid(), project_id, array['editor'])
  );

create policy "project_permissions_delete_editor" on public.project_permissions
  for delete to authenticated using (
    public.is_admin(auth.uid()) or public.has_project_role(auth.uid(), project_id, array['editor'])
  );

-- ---------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------
alter table public.tasks enable row level security;

create policy "tasks_select_member" on public.tasks
  for select to authenticated using (
    public.is_admin(auth.uid()) or public.has_project_role(auth.uid(), project_id, array['editor', 'viewer'])
  );

create policy "tasks_insert_editor" on public.tasks
  for insert to authenticated with check (
    public.is_admin(auth.uid()) or public.has_project_role(auth.uid(), project_id, array['editor'])
  );

create policy "tasks_update_editor" on public.tasks
  for update to authenticated using (
    public.is_admin(auth.uid()) or public.has_project_role(auth.uid(), project_id, array['editor'])
  );

create policy "tasks_delete_editor" on public.tasks
  for delete to authenticated using (
    public.is_admin(auth.uid()) or public.has_project_role(auth.uid(), project_id, array['editor'])
  );

-- ---------------------------------------------------------------------
-- dependencies (governed by the project of `task_id`)
-- ---------------------------------------------------------------------
alter table public.dependencies enable row level security;

create policy "dependencies_select_member" on public.dependencies
  for select to authenticated using (
    public.is_admin(auth.uid())
    or public.has_project_role(auth.uid(), public.task_project_id(task_id), array['editor', 'viewer'])
  );

create policy "dependencies_insert_editor" on public.dependencies
  for insert to authenticated with check (
    public.is_admin(auth.uid())
    or public.has_project_role(auth.uid(), public.task_project_id(task_id), array['editor'])
  );

create policy "dependencies_delete_editor" on public.dependencies
  for delete to authenticated using (
    public.is_admin(auth.uid())
    or public.has_project_role(auth.uid(), public.task_project_id(task_id), array['editor'])
  );

-- ---------------------------------------------------------------------
-- flags (project_id null = global, visible to everyone signed in;
-- writable by any project editor, or an admin)
-- ---------------------------------------------------------------------
alter table public.flags enable row level security;

create policy "flags_select" on public.flags
  for select to authenticated using (
    project_id is null
    or public.is_admin(auth.uid())
    or public.has_project_role(auth.uid(), project_id, array['editor', 'viewer'])
  );

create policy "flags_insert_editor" on public.flags
  for insert to authenticated with check (
    public.is_admin(auth.uid())
    or (project_id is null and public.is_any_project_editor(auth.uid()))
    or (project_id is not null and public.has_project_role(auth.uid(), project_id, array['editor']))
  );

create policy "flags_update_editor" on public.flags
  for update to authenticated using (
    public.is_admin(auth.uid())
    or (project_id is null and public.is_any_project_editor(auth.uid()))
    or (project_id is not null and public.has_project_role(auth.uid(), project_id, array['editor']))
  );

create policy "flags_delete_editor" on public.flags
  for delete to authenticated using (
    public.is_admin(auth.uid())
    or (project_id is null and public.is_any_project_editor(auth.uid()))
    or (project_id is not null and public.has_project_role(auth.uid(), project_id, array['editor']))
  );

-- ---------------------------------------------------------------------
-- flag_options (governed by the parent flag's project)
-- ---------------------------------------------------------------------
alter table public.flag_options enable row level security;

create policy "flag_options_select" on public.flag_options
  for select to authenticated using (
    public.flag_project_id(flag_id) is null
    or public.is_admin(auth.uid())
    or public.has_project_role(auth.uid(), public.flag_project_id(flag_id), array['editor', 'viewer'])
  );

create policy "flag_options_insert_editor" on public.flag_options
  for insert to authenticated with check (
    public.is_admin(auth.uid())
    or (public.flag_project_id(flag_id) is null and public.is_any_project_editor(auth.uid()))
    or public.has_project_role(auth.uid(), public.flag_project_id(flag_id), array['editor'])
  );

create policy "flag_options_update_editor" on public.flag_options
  for update to authenticated using (
    public.is_admin(auth.uid())
    or (public.flag_project_id(flag_id) is null and public.is_any_project_editor(auth.uid()))
    or public.has_project_role(auth.uid(), public.flag_project_id(flag_id), array['editor'])
  );

create policy "flag_options_delete_editor" on public.flag_options
  for delete to authenticated using (
    public.is_admin(auth.uid())
    or (public.flag_project_id(flag_id) is null and public.is_any_project_editor(auth.uid()))
    or public.has_project_role(auth.uid(), public.flag_project_id(flag_id), array['editor'])
  );

-- ---------------------------------------------------------------------
-- task_flags (governed by the project of `task_id`)
-- ---------------------------------------------------------------------
alter table public.task_flags enable row level security;

create policy "task_flags_select" on public.task_flags
  for select to authenticated using (
    public.is_admin(auth.uid())
    or public.has_project_role(auth.uid(), public.task_project_id(task_id), array['editor', 'viewer'])
  );

create policy "task_flags_insert_editor" on public.task_flags
  for insert to authenticated with check (
    public.is_admin(auth.uid())
    or public.has_project_role(auth.uid(), public.task_project_id(task_id), array['editor'])
  );

create policy "task_flags_delete_editor" on public.task_flags
  for delete to authenticated using (
    public.is_admin(auth.uid())
    or public.has_project_role(auth.uid(), public.task_project_id(task_id), array['editor'])
  );
