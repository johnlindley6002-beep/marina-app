-- Dock tasks for the staff on the pontoons, and a display name for each staff
-- member so a task can show who it is assigned to.

alter table public.staff_members
  add column display_name text not null default '';

-- A staff member sets their own display name. Done through a function so the
-- general update policy on staff_members stays admin only (a staff member
-- must never be able to change their own role).
create function public.set_my_display_name(new_name text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.staff_members
  set display_name = left(trim(new_name), 80)
  where user_id = (select auth.uid());
$$;

revoke all on function public.set_my_display_name(text) from public, anon;
grant execute on function public.set_my_display_name(text) to authenticated;

create function public.staff_member_in_marina(target_member uuid, target_marina text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_member is null or exists (
    select 1 from public.staff_members s where s.id = target_member and s.marina_id = target_marina
  );
$$;

revoke all on function public.staff_member_in_marina(uuid, text) from public, anon;
grant execute on function public.staff_member_in_marina(uuid, text) to authenticated;

create table public.dock_tasks (
  id uuid primary key default gen_random_uuid(),
  marina_id text not null references public.marinas (id) on delete cascade,
  berth_id uuid references public.berths (id) on delete set null,
  description text not null check (length(trim(description)) > 0),
  due_at timestamptz not null,
  assigned_to uuid references public.staff_members (id) on delete set null,
  status text not null default 'to_do' check (status in ('to_do', 'done')),
  done_at timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index dock_tasks_marina_due_idx on public.dock_tasks (marina_id, due_at);

revoke all on public.dock_tasks from anon, authenticated;
grant select, insert, update, delete on public.dock_tasks to authenticated;
alter table public.dock_tasks enable row level security;

create policy "Staff read tasks" on public.dock_tasks
  for select to authenticated using (public.is_staff_of(marina_id));
create policy "Staff add tasks" on public.dock_tasks
  for insert to authenticated
  with check (
    public.is_staff_of(marina_id)
    and public.berth_in_marina(berth_id, marina_id)
    and public.staff_member_in_marina(assigned_to, marina_id)
  );
create policy "Staff update tasks" on public.dock_tasks
  for update to authenticated
  using (public.is_staff_of(marina_id))
  with check (
    public.is_staff_of(marina_id)
    and public.berth_in_marina(berth_id, marina_id)
    and public.staff_member_in_marina(assigned_to, marina_id)
  );
create policy "Staff remove tasks" on public.dock_tasks
  for delete to authenticated using (public.is_staff_of(marina_id));
