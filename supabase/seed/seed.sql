-- Sample data so the app is playable immediately, without needing any
-- real Supabase Auth users yet. owner_id / created_by are left null
-- (the UI renders these as "Unassigned") — once you sign up in the app,
-- you can reassign tasks to yourself from the UI.
--
-- Run this after 0001_init.sql, e.g. via the Supabase SQL editor or:
--   supabase db execute -f supabase/seed/seed.sql

-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------
insert into public.projects (id, name, description) values
  ('11111111-1111-1111-1111-111111111111', 'Website Relaunch', 'Redesign and rebuild the marketing site on the new stack.'),
  ('22222222-2222-2222-2222-222222222222', 'Mobile App v2', 'Second major release of the mobile app, focused on performance.');

-- ---------------------------------------------------------------------
-- flags (global — project_id null) + options
-- ---------------------------------------------------------------------
insert into public.flags (id, project_id, name, color) values
  ('aaaaaaaa-0000-0000-0000-000000000001', null, 'Risk', '#ef4444'),
  ('aaaaaaaa-0000-0000-0000-000000000002', null, 'Team', '#3b82f6');

insert into public.flag_options (id, flag_id, label, color, sort_order) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Low', '#22c55e', 0),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Medium', '#f59e0b', 1),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'High', '#ef4444', 2),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000002', 'Design', '#a855f7', 0),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000002', 'Engineering', '#3b82f6', 1),
  ('bbbbbbbb-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000002', 'QA', '#14b8a6', 2);

-- ---------------------------------------------------------------------
-- tasks — Website Relaunch (with nested subtasks)
-- ---------------------------------------------------------------------
insert into public.tasks (id, project_id, parent_task_id, name, description, status, start_date, end_date, priority, percent_complete) values
  ('c0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', null, 'Discovery & Planning', 'Kickoff, requirements, and stakeholder interviews.', 'done', '2026-06-01', '2026-06-12', 'high', 100),
  ('c0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', null, 'Design', 'Visual design and prototyping.', 'in_progress', '2026-06-15', '2026-07-10', 'high', 60),
  ('c0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000002', 'Wireframes', 'Low-fidelity page layouts.', 'done', '2026-06-15', '2026-06-22', 'medium', 100),
  ('c0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000002', 'Visual Design', 'High-fidelity comps in Figma.', 'in_progress', '2026-06-23', '2026-07-10', 'high', 40),
  ('c0000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000004', 'Homepage Comp', null, 'done', '2026-06-23', '2026-06-27', 'medium', 100),
  ('c0000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000004', 'Product Page Comp', null, 'in_progress', '2026-06-28', '2026-07-10', 'high', 30),
  ('c0000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', null, 'Development', 'Build the site in the new stack.', 'not_started', '2026-07-11', '2026-08-15', 'high', 0),
  ('c0000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000007', 'Component Library', null, 'not_started', '2026-07-11', '2026-07-22', 'medium', 0),
  ('c0000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000007', 'Page Templates', null, 'not_started', '2026-07-23', '2026-08-15', 'medium', 0),
  ('c0000000-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', null, 'Launch', 'QA, content freeze, and go-live.', 'not_started', '2026-08-16', '2026-08-28', 'urgent', 0);

-- ---------------------------------------------------------------------
-- tasks — Mobile App v2
-- ---------------------------------------------------------------------
insert into public.tasks (id, project_id, parent_task_id, name, description, status, start_date, end_date, priority, percent_complete) values
  ('d0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', null, 'Performance Audit', 'Profile startup time and frame drops.', 'in_progress', '2026-06-01', '2026-06-19', 'high', 50),
  ('d0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', null, 'Offline Sync', 'Local-first data layer with background sync.', 'not_started', '2026-06-20', '2026-07-31', 'urgent', 0),
  ('d0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'd0000000-0000-0000-0000-000000000002', 'Local Storage Layer', null, 'not_started', '2026-06-20', '2026-07-04', 'high', 0),
  ('d0000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'd0000000-0000-0000-0000-000000000002', 'Conflict Resolution', null, 'not_started', '2026-07-07', '2026-07-31', 'high', 0),
  ('d0000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', null, 'Beta Release', null, 'not_started', '2026-08-01', '2026-08-14', 'medium', 0);

-- ---------------------------------------------------------------------
-- dependencies (visual only — not used for scheduling math)
-- ---------------------------------------------------------------------
insert into public.dependencies (task_id, depends_on_task_id, type) values
  ('c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'finish_to_start'),
  ('c0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002', 'finish_to_start'),
  ('c0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000007', 'finish_to_start'),
  ('d0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 'finish_to_start'),
  ('d0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'finish_to_start');

-- ---------------------------------------------------------------------
-- task_flags
-- ---------------------------------------------------------------------
insert into public.task_flags (task_id, flag_option_id) values
  ('c0000000-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000004'), -- Design -> Team: Design
  ('c0000000-0000-0000-0000-000000000007', 'bbbbbbbb-0000-0000-0000-000000000005'), -- Development -> Team: Engineering
  ('c0000000-0000-0000-0000-000000000010', 'bbbbbbbb-0000-0000-0000-000000000003'), -- Launch -> Risk: High
  ('c0000000-0000-0000-0000-000000000010', 'bbbbbbbb-0000-0000-0000-000000000006'), -- Launch -> Team: QA
  ('d0000000-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000003'), -- Offline Sync -> Risk: High
  ('d0000000-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000005'), -- Offline Sync -> Team: Engineering
  ('d0000000-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002'); -- Performance Audit -> Risk: Medium
